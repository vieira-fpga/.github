// Regenerates the core listings in profile/README.md from the live state of
// the vieira-fpga org: newest-pushed core becomes the hero section, the rest
// fill a 3-column grid (newest to oldest, capped at 9). Run by the
// update-readme workflow; needs GITHUB_TOKEN. Run locally with
// `GITHUB_TOKEN=$(gh auth token) node scripts/update-readme.mjs`.

import { readFile, writeFile } from "node:fs/promises";

const ORG = "vieira-fpga";
const CORE_PREFIX = "openFPGA-";
const README = new URL("../profile/README.md", import.meta.url);
const START = "<!-- cores:start -->";
const END = "<!-- cores:end -->";

// Repo names don't carry punctuation, so display names live here.
// Anything not listed falls back to the repo name minus the prefix.
const DISPLAY_NAMES = { RallyX: "Rally-X", VirtualBoy: "Virtual Boy" };

/** @param {string} query @returns {Promise<any>} the `data` payload */
async function graphql(query) {
	const res = await fetch("https://api.github.com/graphql", {
		method: "POST",
		headers: {
			accept: "application/vnd.github+json",
			authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
		},
		body: JSON.stringify({ query }),
	});
	if (!res.ok) throw new Error(`GraphQL -> ${res.status}`);
	const { data, errors } = await res.json();
	if (errors) throw new Error(errors.map((e) => e.message).join("; "));
	return data;
}

/** @param {string} text */
function escapeHtml(text) {
	return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

/** `openGraphImageUrl` is the repo's social preview: the image uploaded under
 * Settings > Social preview, or GitHub's generated card when there isn't one.
 * @returns {Promise<Array<{name: string, url: string, description: string, version: string | null, banner: string}>>} newest-pushed first */
async function fetchCores() {
	const data = await graphql(`{
		organization(login: "${ORG}") {
			repositories(first: 100, orderBy: {field: PUSHED_AT, direction: DESC}) {
				nodes {
					name
					url
					description
					openGraphImageUrl
					latestRelease { tagName }
				}
			}
		}
	}`);
	return data.organization.repositories.nodes
		.filter((repo) => repo.name.startsWith(CORE_PREFIX))
		.map((repo) => {
			const short = repo.name.slice(CORE_PREFIX.length);
			return {
				name: DISPLAY_NAMES[short] ?? short,
				url: repo.url,
				description: repo.description ?? "",
				version: repo.latestRelease?.tagName ?? null,
				banner: repo.openGraphImageUrl,
			};
		});
}

/** @param {Awaited<ReturnType<typeof fetchCores>>[number]} core */
function heroSection(core) {
	return `## Latest updated core

<table>
<tr>
<td width="50%" valign="middle">

### [${core.name}](${core.url})

${core.description}

</td>
<td width="50%" valign="top">
<a href="${core.url}"><img src="${core.banner}" alt="${escapeHtml(core.name)}"></a>
</td>
</tr>
</table>`;
}

/** @param {Awaited<ReturnType<typeof fetchCores>>} cores */
function gridSection(cores) {
	if (cores.length === 0) return "";
	const cells = cores.slice(0, 9).map(
		(core) => `<td align="center" width="33%" valign="top">
<a href="${core.url}"><img src="${core.banner}" alt="${escapeHtml(core.name)}"></a>
<br><b><a href="${core.url}">${escapeHtml(core.name)}</a></b>
<br>${escapeHtml(core.description)}
<br>${core.version ?? "In development"}
</td>`,
	);
	// Pad the last row out to 3 columns so the grid keeps its shape.
	while (cells.length % 3 !== 0) cells.push('<td width="33%"></td>');
	const rows = [];
	for (let i = 0; i < cells.length; i += 3) {
		rows.push(`<tr>\n${cells.slice(i, i + 3).join("\n")}\n</tr>`);
	}
	return `\n\n## Cores\n\n<table>\n${rows.join("\n")}\n</table>`;
}

const cores = await fetchCores();
if (cores.length === 0) throw new Error(`no ${CORE_PREFIX}* repos found in ${ORG}`);

const readme = await readFile(README, "utf8");
if (!readme.includes(START) || !readme.includes(END)) {
	throw new Error(`README is missing the ${START} / ${END} markers`);
}
const generated = `${START}\n${heroSection(cores[0])}${gridSection(cores.slice(1))}\n${END}`;
const updated =
	readme.slice(0, readme.indexOf(START)) + generated + readme.slice(readme.indexOf(END) + END.length);

if (updated === readme) {
	console.log("README already up to date");
} else {
	await writeFile(README, updated);
	console.log(`README regenerated with ${cores.length} core(s)`);
}

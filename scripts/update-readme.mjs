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

/** @param {string} path @returns {Promise<any>} resolves null on 404 */
async function api(path) {
	const res = await fetch(`https://api.github.com${path}`, {
		headers: {
			accept: "application/vnd.github+json",
			authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
		},
	});
	if (res.status === 404) return null;
	if (!res.ok) throw new Error(`GET ${path} -> ${res.status}`);
	return res.json();
}

/** @param {string} text */
function escapeHtml(text) {
	return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

/** Banner from the core repo's .github/assets, falling back to GitHub's
 * generated opengraph card. "social" names win over "banner" names: the
 * social images are the 2:1 art the README wants, while e.g. RallyX's
 * analogue-banner.png is the small 521x165 Pocket platform art. */
async function bannerUrl(repo) {
	const assets = (await api(`/repos/${repo.full_name}/contents/.github/assets`)) ?? [];
	const pngs = assets.filter((a) => a.name.endsWith(".png"));
	const banner =
		pngs.find((a) => a.name.includes("social")) ??
		pngs.find((a) => a.name.includes("banner")) ??
		pngs[0];
	return banner
		? `https://raw.githubusercontent.com/${repo.full_name}/${repo.default_branch}/${banner.path}`
		: `https://opengraph.githubassets.com/1/${repo.full_name}`;
}

/** @returns {Promise<Array<{name: string, url: string, description: string, version: string | null, banner: string}>>} newest-pushed first */
async function fetchCores() {
	const repos = await api(`/orgs/${ORG}/repos?per_page=100`);
	const cores = repos
		.filter((r) => r.name.startsWith(CORE_PREFIX))
		.sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at));
	return Promise.all(
		cores.map(async (repo) => ({
			name: DISPLAY_NAMES[repo.name.slice(CORE_PREFIX.length)] ?? repo.name.slice(CORE_PREFIX.length),
			url: repo.html_url,
			description: repo.description ?? "",
			version: (await api(`/repos/${repo.full_name}/releases/latest`))?.tag_name ?? null,
			banner: await bannerUrl(repo),
		})),
	);
}

/** @param {Awaited<ReturnType<typeof fetchCores>>[number]} core */
function heroSection(core) {
	return `## Latest updated core

<table>
<tr>
<td width="50%" valign="top">

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

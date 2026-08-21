<h1 align="center">
  <img src="../.github/assets/icon.png" width="64">
  <br>
  Vieira FPGA
</h1>

Vieira FPGA is my home for FPGA core development. I build hardware recreations of classic consoles and arcade machines for the Analogue Pocket's [openFPGA](https://www.analogue.co/developer) platform, with frontier AI models doing most of the Verilog implementation.

Each core is built from primary sources: hardware manuals, development manuals, and whatever documentation of the original internals survives. I give the models that context, make sure they cover the documented behaviour, and verify their work with test ROMs, hardware tests, and screenshots. I also keep the code readable enough to maintain by hand and continue testing and updating cores after release.

## Core libraries

Apart from [Rally-X](https://github.com/vieira-fpga/openFPGA-RallyX), which I submitted to `openFPGA-library` and now consider a mistake, I will not submit my cores to `openFPGA-library` or similar libraries. I am aware of the general consensus that cores made with AI are "slop," and I respect that. This policy will remain in place until there is a standard way for publishers to declare that AI was used to make a core.

<!-- cores:start -->
## Latest updated core

<table>
<tr>
<td width="50%" valign="middle">

### [Loopy](https://github.com/vieira-fpga/openFPGA-Loopy)

♫ 𝘪𝘮 𝘫𝘶𝘴𝘵 𝘢 𝘨𝘪𝘳𝘭 ♫

</td>
<td width="50%" valign="top">
<a href="https://github.com/vieira-fpga/openFPGA-Loopy"><img src="https://repository-images.githubusercontent.com/1336491535/d63cb238-4e9a-4c98-9a38-9bbacee6fdfb" alt="Loopy"></a>
</td>
</tr>
</table>

## Cores

<table>
<tr>
<td align="center" width="33%" valign="top">
<a href="https://github.com/vieira-fpga/openFPGA-VirtualBoy"><img src="https://repository-images.githubusercontent.com/1328244612/1b333e1d-8c69-49a7-a4df-28bbe2595375" alt="Virtual Boy"></a>
<br><b><a href="https://github.com/vieira-fpga/openFPGA-VirtualBoy">Virtual Boy</a></b>
<br>A Nintendo Virtual Boy core for the Analogue Pocket.
<br>In development
</td>
<td align="center" width="33%" valign="top">
<a href="https://github.com/vieira-fpga/openFPGA-RallyX"><img src="https://repository-images.githubusercontent.com/1311307855/963b6019-9e01-40bd-8e44-b55a783d8c84" alt="Rally-X"></a>
<br><b><a href="https://github.com/vieira-fpga/openFPGA-RallyX">Rally-X</a></b>
<br>An Analogue Pocket core that plays Namco's Rally-X &amp; New Rally-X.
<br>v1.5.4
</td>
<td width="33%"></td>
</tr>
</table>
<!-- cores:end -->

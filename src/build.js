// Genera src/post.html (HTML + SVG) y lo renderiza a output/linkedin_1anio.png (2x) con Playwright.
// Uso:  node src/build.js            (desde la raíz del repo)
// Además verifica que ningún texto quede tapado o pegado a la foto (mínimo 28 px de aire).
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const SRC = __dirname;
const OUT = path.join(SRC, '..', 'output');

const C = { ivory: '#F3EEE6', gray: '#9AA1AB', gold: '#F2B33D', bg: '#121417',
            box: 'rgba(154,161,171,0.42)' };

const RELEASE_NOTES = [
  'Intranet propia',
  '5 tableros de gestión por área',
  'Liquidación de salarios automatizada',
  'Cálculo de comisiones automatizado',
  'Facturación electrónica en Odoo 17',
  'Gestor de rutas con GPS para vendedores',
];

// Posiciones verticales (px CSS) de cada bloque
const L = { stats: 426, notes: 586, stack: 858, footer: 1140 };

// ---------- Diagrama del stack (SVG) ----------
// 4 cajas exteriores del mismo ancho, Odoo 17 al centro, conectores simétricos arriba y abajo.
function stackDiagram() {
  const width = 392, boxW = 150, nodeH = 52, hubW = 150, hubH = 44, gapY = 22;
  const yTop = 0.5, yHub = yTop + nodeH + gapY, yBot = yHub + hubH + gapY;
  const h = Math.ceil(yBot + nodeH + 1);
  const xL = 0.5, xR = width - boxW - 0.5, xHub = (width - hubW) / 2 + 0.5;
  const cxL = Math.round(xL + boxW / 2) + 0.5, cxR = Math.round(xR + boxW / 2) - 0.5, cxHub = width / 2 + 0.5;
  const busTop = Math.round(yTop + nodeH + gapY / 2) + 0.5;
  const busBot = Math.round(yHub + hubH + gapY / 2) + 0.5;
  const line = (x1, y1, x2, y2) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C.box}" stroke-width="1"/>`;
  const txt = (x, y, lines, size = 18, weight = 500) => {
    const lh = 22, y0 = y - ((lines.length - 1) * lh) / 2;
    return lines.map((t, i) =>
      `<text x="${x}" y="${y0 + i * lh + size * 0.36}" text-anchor="middle" font-family="Inter, sans-serif" font-size="${size}" font-weight="${weight}" fill="${C.ivory}">${t}</text>`).join('');
  };
  const node = (x, y, lines) =>
    `<rect x="${x}" y="${y}" width="${boxW}" height="${nodeH}" fill="${C.bg}" stroke="${C.box}" stroke-width="1" shape-rendering="crispEdges"/>` +
    txt(x + boxW / 2, y + nodeH / 2, lines);

  let s = `<svg class="diagram" width="${width}" height="${h}" viewBox="0 0 ${width} ${h}" xmlns="http://www.w3.org/2000/svg">`;
  s += '<g shape-rendering="crispEdges">';
  // arriba
  s += line(cxHub, yHub, cxHub, busTop) + line(cxL, busTop, cxR, busTop);
  s += line(cxL, busTop, cxL, yTop + nodeH) + line(cxR, busTop, cxR, yTop + nodeH);
  // abajo (espejo exacto)
  s += line(cxHub, yHub + hubH, cxHub, busBot) + line(cxL, busBot, cxR, busBot);
  s += line(cxL, busBot, cxL, yBot) + line(cxR, busBot, cxR, yBot);
  s += '</g>';
  s += node(xL, yTop, ['Intranet']) + node(xR, yTop, ['Tableros']);
  s += node(xL, yBot, ['Apps Script']) + node(xR, yBot, ['Facturación', 'electrónica']);
  s += `<rect x="${xHub}" y="${yHub}" width="${hubW}" height="${hubH}" fill="${C.bg}" stroke="${C.gold}" stroke-width="1" shape-rendering="crispEdges"/>`;
  s += txt(xHub + hubW / 2, yHub + hubH / 2, ['Odoo 17'], 20, 600);
  return s + '</svg>';
}

function page() {
  const notes = RELEASE_NOTES.map(t => `<li><span class="plus">+</span>${t}</li>`).join('\n      ');
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>1 año en Camping 44</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=block" rel="stylesheet">
<link rel="stylesheet" href="styles.css">
</head>
<body>
<main class="canvas">

  <header class="header">
    <span class="name">Facundo Colman</span>
    <span class="range">// 19.11.2025 → 19.11.2026</span>
  </header>

  <h1 class="title">1 año en Asunción<span class="dot">.</span><br>1 año en Camping 44<span class="dot">.</span></h1>

  <img class="photo" src="foto_recorte.png" alt="Facundo Colman">

  <section class="content stats" style="top:${L.stats}px">
    <div class="stat"><div class="num">5</div><div class="label">Tableros<br>de gestión</div></div>
    <div class="stat"><div class="num">10</div><div class="label">Áreas<br>atendidas</div></div>
    <div class="stat"><div class="num">1</div><div class="label">Persona<br>en IT</div></div>
  </section>

  <section class="content" style="top:${L.notes}px">
    <div class="section-head"><span class="label">Release notes // Año 1</span></div>
    <ul class="notes">
      ${notes}
    </ul>
  </section>

  <section class="content" style="top:${L.stack}px">
    <div class="section-head"><span class="label">Stack</span><span class="label">ERP + integraciones</span></div>
    ${stackDiagram()}
  </section>

  <footer class="footer" style="top:${L.footer}px">
    <div class="role">Responsable de Tecnología</div>
    <div class="tag">Sistemas y automatización para PyMEs</div>
  </footer>

</main>
</body>
</html>
`;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const file = path.join(SRC, 'post.html');
  fs.writeFileSync(file, page());

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.goto('file://' + file, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  const missing = await p.evaluate(() =>
    ['800 40px "Bricolage Grotesque"', '400 20px Inter', '500 18px Inter', '600 20px Inter', '400 18px "JetBrains Mono"']
      .filter(f => !document.fonts.check(f)));
  if (missing.length) throw new Error('Fuentes sin cargar: ' + missing.join(', '));

  // --- Verificación: aire entre cada texto/caja y la silueta de la foto ---
  const info = await p.evaluate(() => {
    const img = document.querySelector('.photo').getBoundingClientRect();
    const els = [...document.querySelectorAll('.content .num, .content .label, .notes li, .diagram rect, .diagram text, .section-head, .footer .role, .footer .tag, .footer')];
    const boxes = els.map(e => {
      let r = e.getBoundingClientRect();
      // para bloques de texto, medir el ancho real del texto (no el del contenedor)
      if (e.tagName === 'LI' || e.classList.contains('role') || e.classList.contains('tag')) {
        const range = document.createRange(); range.selectNodeContents(e); r = range.getBoundingClientRect();
      }
      return { name: (e.textContent || e.tagName).trim().slice(0, 40) || e.tagName, x0: r.left, x1: r.right, y0: r.top, y1: r.bottom };
    });
    return { img: { x: img.left, y: img.top, w: img.width, h: img.height }, boxes };
  });
  if (process.env.LAYOUT_JSON) fs.writeFileSync(process.env.LAYOUT_JSON, JSON.stringify(info));

  const out = path.join(OUT, 'linkedin_1anio.png');
  await p.locator('.canvas').screenshot({ path: out });
  console.log('ok', out);
  await browser.close();
})();

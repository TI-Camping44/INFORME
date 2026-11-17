// Genera post_a.html y post_b.html (HTML + SVG) y los renderiza a PNG 2x con Playwright.
// Uso:  node src/build.js            (desde la raíz del repo)
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const SRC = __dirname;
const OUT = path.join(SRC, '..', 'output');

const C = { ivory: '#F3EEE6', gray: '#9AA1AB', gold: '#F2B33D', bg: '#121417',
            rule: 'rgba(154,161,171,0.20)', box: 'rgba(154,161,171,0.42)' };

const MONTHS = [['ABR', 9], ['MAY', 8], ['JUN', 6], ['JUL', 16],
                ['AGO', 28], ['SEP', 11], ['OCT', 20], ['NOV', 23]];

// ---------- Gráfico de barras (SVG) ----------
function barChart({ width = 432, barH = 110, barW = 30 }) {
  const n = MONTHS.length;
  const gap = (width - n * barW) / (n - 1);
  const max = Math.max(...MONTHS.map(m => m[1]));
  const top = 30;                    // espacio para los valores
  const base = top + barH;           // línea base
  const h = base + 34;               // + meses
  let s = `<svg width="${width}" height="${h}" viewBox="0 0 ${width} ${h}" xmlns="http://www.w3.org/2000/svg">`;
  MONTHS.forEach(([m, v], i) => {
    const x = Math.round(i * (barW + gap));
    const bh = Math.round((v / max) * barH);
    const cx = x + barW / 2;
    s += `<rect x="${x}" y="${base - bh}" width="${barW}" height="${bh}" fill="${C.gold}"/>`;
    s += `<text x="${cx}" y="${base - bh - 9}" text-anchor="middle" font-size="18" fill="${C.ivory}">${v}</text>`;
    s += `<text x="${cx}" y="${base + 27}" text-anchor="middle" font-size="18" fill="${C.gray}">${m}</text>`;
  });
  s += `<line x1="0" y1="${base + 0.5}" x2="${width}" y2="${base + 0.5}" stroke="${C.box}" stroke-width="1"/>`;
  return s + '</svg>';
}

// ---------- Diagrama del stack (SVG) ----------
function stackDiagram({ width = 432 }) {
  const nodeH = 44, hubH = 54, gapY = 30;
  const rowTop = 0.5, hubY = rowTop + nodeH + gapY, rowBot = hubY + hubH + gapY;
  const h = Math.ceil(rowBot + nodeH + 1);
  const nodes = [
    { t: 'Intranet',                w: 150, x: 0.5,                 y: rowTop },
    { t: 'Tableros',                w: 150, x: width - 150 - 0.5,   y: rowTop },
    { t: 'Apps Script',             w: 150, x: 0.5,                 y: rowBot },
    { t: 'Facturación electrónica', w: 254, x: width - 254 - 0.5,   y: rowBot },
  ];
  const hubW = 150, hubX = Math.round((width - hubW) / 2) + 0.5, hubCx = hubX + hubW / 2;
  const cx = n => Math.round(n.x + n.w / 2) + 0.5;
  const line = (x1, y1, x2, y2) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C.box}" stroke-width="1"/>`;

  let s = `<svg width="${width}" height="${h}" viewBox="0 0 ${width} ${h}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">`;
  // conectores ortogonales: hub → bus → nodos
  const busTop = Math.round(rowTop + nodeH + gapY / 2) + 0.5;
  const busBot = Math.round(hubY + hubH + gapY / 2) + 0.5;
  s += line(hubCx, hubY, hubCx, busTop);
  s += line(cx(nodes[0]), busTop, cx(nodes[1]), busTop);
  s += line(cx(nodes[0]), busTop, cx(nodes[0]), rowTop + nodeH);
  s += line(cx(nodes[1]), busTop, cx(nodes[1]), rowTop + nodeH);
  s += line(hubCx, hubY + hubH, hubCx, busBot);
  s += line(cx(nodes[2]), busBot, cx(nodes[3]), busBot);
  s += line(cx(nodes[2]), busBot, cx(nodes[2]), rowBot);
  s += line(cx(nodes[3]), busBot, cx(nodes[3]), rowBot);
  // nodos
  for (const n of nodes) {
    s += `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${nodeH}" fill="${C.bg}" stroke="${C.box}" stroke-width="1"/>`;
    s += `<text x="${n.x + n.w / 2}" y="${n.y + nodeH / 2 + 6.5}" text-anchor="middle" style="font-family:Inter,sans-serif" font-size="18" font-weight="500" fill="${C.ivory}" shape-rendering="auto">${n.t}</text>`;
  }
  // hub: Odoo 17 (único elemento con borde dorado)
  s += `<rect x="${hubX}" y="${hubY}" width="${hubW}" height="${hubH}" fill="${C.bg}" stroke="${C.gold}" stroke-width="1"/>`;
  s += `<text x="${hubCx}" y="${hubY + hubH / 2 + 7.5}" text-anchor="middle" style="font-family:Inter,sans-serif" font-size="21" font-weight="600" fill="${C.ivory}">Odoo 17</text>`;
  return s + '</svg>';
}

// ---------- Página ----------
function page(variant) {
  const A = variant === 'A';
  const L = A
    ? { stats: 408, chart: 574, barH: 104, diagram: 836, footer: 1146 }
    : { stats: 444, chart: 668, barH: 210, footer: 1146 };

  const diagram = A ? `
  <section class="content" style="top:${L.diagram}px">
    <div class="section-head"><span class="label">Stack</span><span class="label">ERP + integraciones</span></div>
    ${stackDiagram({})}
  </section>` : '';

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>1 año en Camping 44 — variante ${variant}</title>
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
    <div class="stat"><div class="num">121</div><div class="label">Tickets<br>gestionados</div></div>
    <div class="stat"><div class="num">10</div><div class="label">Áreas<br>atendidas</div></div>
    <div class="stat"><div class="num">1</div><div class="label">Persona<br>en IT</div></div>
  </section>

  <section class="content" style="top:${L.chart}px">
    <div class="section-head"><span class="label">Tickets por mes</span><span class="label">2026</span></div>
    ${barChart({ barH: L.barH })}
  </section>
${diagram}
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
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 2 });
  for (const v of ['A', 'B']) {
    const file = path.join(SRC, `post_${v.toLowerCase()}.html`);
    fs.writeFileSync(file, page(v));
    const p = await ctx.newPage();
    await p.goto('file://' + file, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    const missing = await p.evaluate(() =>
      ['800 40px "Bricolage Grotesque"', '400 20px Inter', '600 20px Inter', '400 18px "JetBrains Mono"']
        .filter(f => !document.fonts.check(f)));
    if (missing.length) throw new Error('Fuentes sin cargar: ' + missing.join(', '));
    const out = path.join(OUT, `linkedin_1anio_variante_${v}.png`);
    await p.locator('.canvas').screenshot({ path: out });
    console.log('ok', out);
    await p.close();
  }
  await browser.close();
})();

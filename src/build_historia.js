// Genera src/historia.html y la renderiza a output/historia-ig.png (1080×1920, 2x).
// Reutiliza los datos y el mapa de build.js (no modifica la versión de LinkedIn).
// Uso:  node src/build_historia.js      (LAYOUT_JSON=<archivo> exporta cajas para verificar)
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { GROUPS, tech, paraguayMap } = require('./build.js');

const SRC = __dirname;
const OUT = path.join(SRC, '..', 'output');

// Zonas seguras de Instagram: 0–250 y 1640–1920 quedan solo con fondo.
const SAFE = { top: 250, bottom: 1640 };

// Posiciones (px CSS)
const L = {
  header: 250, title: 334, stats: 560, groups: 694,
  itemLH: 34, groupGap: 20, techGap: 8, groupWidth: 600,
  footer: 1600,
};
// Foto: más grande que en LinkedIn (553 px). Plano de pecho: el borde inferior corta por los brazos,
// por encima de las manos y lejos de los codos.
const PHOTO = { width: 615, left: 462, top: 1378 };
const MAPPOS = { x: 458, y: 1410, k: 20 };

function page() {
  const groups = GROUPS.map(([title, stack, items], i) => `
    <div class="group" style="${i ? `margin-top:${L.groupGap}px;` : ''}width:${L.groupWidth}px">
      <div class="section-head"><span class="label">${title}</span></div>
      <ul class="notes">
        ${items.map(t => `<li style="line-height:${L.itemLH}px"><span class="plus">+</span>${t.replace(/^\*/, '')}</li>`).join('\n        ')}
      </ul>
      <div style="margin-top:${L.techGap}px">${tech(stack)}</div>
    </div>`).join('');

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>1 año en Camping 44 — historia</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=block" rel="stylesheet">
<link rel="stylesheet" href="historia.css">
</head>
<body>
<main class="canvas">

  <header class="header" style="top:${L.header}px">
    <span class="name">Facundo Colman</span>
    <span class="range">// 19.11.2025 → 19.11.2026</span>
  </header>

  <h1 class="title" style="top:${L.title}px">1 año en Asunción<span class="dot">.</span><br>1 año en Camping 44<span class="dot">.</span></h1>

  <section class="content stats" style="top:${L.stats}px">
    <div class="stat"><div class="num"><span class="dot">+</span>15</div><div class="label">Automatizaciones</div></div>
    <div class="stat"><div class="num">5</div><div class="label">Tableros</div></div>
    <div class="stat"><div class="num">10</div><div class="label">Áreas</div></div>
    <div class="stat"><div class="num">1</div><div class="label">Persona en IT</div></div>
  </section>

  <section class="content groups" style="top:${L.groups}px">${groups}
  </section>

  <img class="photo" src="foto_recorte.png" alt="Facundo Colman"
       style="left:${PHOTO.left}px;top:${PHOTO.top}px;width:${PHOTO.width}px">

  ${paraguayMap(MAPPOS)}

  <footer class="footer" style="top:${L.footer}px">
    <div class="role">Responsable de Tecnología</div>
  </footer>

</main>
</body>
</html>
`;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const file = path.join(SRC, 'historia.html');
  fs.writeFileSync(file, page());

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.goto('file://' + file, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  const missing = await p.evaluate(() =>
    ['800 40px "Bricolage Grotesque"', '400 26px Inter', '600 26px Inter', '400 18px "JetBrains Mono"']
      .filter(f => !document.fonts.check(f)));
  if (missing.length) throw new Error('Fuentes sin cargar: ' + missing.join(', '));

  if (process.env.LAYOUT_JSON) {
    const info = await p.evaluate(() => {
      const img = document.querySelector('.photo').getBoundingClientRect();
      const box = (e, name) => {
        let r = e.getBoundingClientRect();
        if (e.matches('li, .tech, .role')) { const g = document.createRange(); g.selectNodeContents(e); r = g.getBoundingClientRect(); }
        return { name: name || (e.textContent || e.tagName).trim().replace(/\s+/g, ' ').slice(0, 40), x0: r.left, x1: r.right, y0: r.top, y1: r.bottom };
      };
      const boxes = [...document.querySelectorAll('.header, .title, .stat .num, .stat .label, .section-head, .notes li, .tech, .footer .role')].map(e => box(e));
      const map = [...document.querySelectorAll('.map path, .map circle, .map text')].map(e => box(e, 'mapa:' + (e.textContent || e.tagName)));
      return { img: { x: img.left, y: img.top, w: img.width, h: img.height }, boxes, map };
    });
    fs.writeFileSync(process.env.LAYOUT_JSON, JSON.stringify({ ...info, safe: { top: 250, bottom: 1640 } }));
  }

  const out = path.join(OUT, 'historia-ig.png');
  await p.locator('.canvas').screenshot({ path: out });
  console.log('ok', out);
  await browser.close();
})();

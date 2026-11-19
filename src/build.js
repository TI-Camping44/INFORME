// Genera src/post.html (HTML + SVG) y lo renderiza a output/linkedin_1anio.png (2x) con Playwright.
// Uso:  node src/build.js            (desde la raíz del repo)
// Con LAYOUT_JSON=<archivo> exporta las cajas de cada texto para verificar el aire con la foto.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const SRC = __dirname;
const OUT = path.join(SRC, '..', 'output');

const C = { ivory: '#F3EEE6', gray: '#9AA1AB', gold: '#F2B33D', bg: '#121417',
            box: 'rgba(154,161,171,0.42)' };

// Tres frases generales: se leen de un vistazo en el feed (el detalle va en el texto del post)
const STATEMENTS = [
  ['Desarrollos', 'Herramientas a medida'],
  ['Automatizaciones', 'Lo que era manual'],
  ['Integraciones', 'Odoo con todo lo demás'],
];

// Posiciones verticales (px CSS) de cada bloque
const L = { stats: 418, statements: 612, footer: 1128 };

function page() {
  const statements = STATEMENTS.map(([verb, text]) => `
    <div class="statement">
      <div class="label">${verb}</div>
      <div class="phrase">${text}<span class="dot">.</span></div>
    </div>`).join('');
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
    <div class="stat"><div class="num"><span class="dot">+</span>15</div><div class="label">Automatizaciones</div></div>
    <div class="stat"><div class="num">5</div><div class="label">Tableros</div></div>
    <div class="stat"><div class="num">10</div><div class="label">Áreas</div></div>
    <div class="stat"><div class="num">1</div><div class="label">Persona<br>en IT</div></div>
  </section>

  <section class="content statements" style="top:${L.statements}px">${statements}
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
    ['800 40px "Bricolage Grotesque"', '400 20px Inter', '600 20px Inter', '400 18px "JetBrains Mono"']
      .filter(f => !document.fonts.check(f)));
  if (missing.length) throw new Error('Fuentes sin cargar: ' + missing.join(', '));

  // --- Verificación: aire entre cada texto/caja y la silueta de la foto ---
  const info = await p.evaluate(() => {
    const img = document.querySelector('.photo').getBoundingClientRect();
    const els = [...document.querySelectorAll('.content .num, .content .label, .phrase, .statement, .footer .role, .footer .tag, .footer')];
    const boxes = els.map(e => {
      let r = e.getBoundingClientRect();
      // para bloques de texto, medir el ancho real del texto (no el del contenedor)
      if (e.classList.contains('phrase') || e.classList.contains('role') || e.classList.contains('tag')) {
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

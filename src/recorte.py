"""Recorta el fondo de ../foto.jpg y genera src/foto_recorte.png.
Uso (desde la raíz del repo):  python3 src/recorte.py
Requiere: pip install "rembg[cpu]"  (incluye pymatting)
"""
import numpy as np
from PIL import Image
from rembg import remove, new_session
from pymatting import estimate_foreground_ml

src_img = Image.open('foto.jpg').convert('RGB')
# 1) Recorte con el modelo de retrato de rembg (mejor en pelo y brazos)
cut = remove(src_img, session=new_session('birefnet-portrait'))
a = np.asarray(cut.split()[-1]).astype(np.float64) / 255

# 2) Refinado: limpiar alfa residual y endurecer apenas el borde
a[a < 0.04] = 0
a = np.clip((a - 0.02) / 0.96, 0, 1)

# 3) Descontaminar el color de los bordes (quita el tinte de la madera del fondo)
rgb = np.asarray(src_img).astype(np.float64) / 255
fg = estimate_foreground_ml(rgb, a)

im = Image.fromarray((np.dstack([np.clip(fg, 0, 1), a]) * 255).round().astype(np.uint8), 'RGBA')
x0, y0, x1, _ = im.getbbox()
im.crop((x0, y0, x1, im.height)).save('src/foto_recorte.png', optimize=True)
print('ok src/foto_recorte.png')

# AJE × Free · Inventario

Portal para AJE en **https://aje.holafree.com** (GitHub Pages + Google Apps Script).

- `index.html` – inicio con 2 accesos: Equipo AJE (solo ve) y Back Office Free (edita).
- `inventario.html` – inventario: tarjetas con foto, filtros por categoría/marca, KPIs, historial de movimientos, descarga CSV.
  Free puede sumar/restar stock, registrar ingresos/salidas/conteos con motivo, editar datos, subir fotos, agregar o retirar artículos y editar el aviso.
- `config.js` – `API_URL` del Apps Script (vacío = modo demo, usuario `free` o `aje`, clave `demo`).
- `apps-script/Code.gs` – backend. Crea su propio Sheet ("AJE × Free · Inventario": Items, Movimientos, Usuarios, Config) y carpeta de fotos en Drive.
- `img/uniformes/` – fotos de uniformes sacadas del Excel de stock (noviembre).

## Backend
1. Nuevo proyecto en script.google.com, pegar `Code.gs`, correr `setup()` (crea Sheet, usuarios `free` y `aje` con clave aleatoria, carpeta de fotos).
2. Implementar → App web · Ejecutar como: yo · Acceso: cualquiera. Copiar la URL `/exec` en `config.js`.
3. `verAccesos()` muestra usuarios y claves. Las claves se cambian en la hoja Usuarios (cambiarla cierra las sesiones abiertas de ese usuario).
4. Para actualizar el código: Implementar → Gestionar implementaciones → editar → nueva versión (mantiene la URL).

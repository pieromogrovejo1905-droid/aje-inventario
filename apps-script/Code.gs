/**
 * AJE × Free · Inventario · Backend (Google Apps Script)
 *
 * Guarda el stock en un Google Sheet que crea solo y las fotos en una carpeta de Drive.
 * Equipo Free (rol "free") puede editar; AJE (rol "cliente") solo ve.
 *
 * Instalación: pegar este archivo en un proyecto de Apps Script, correr setup() una vez,
 * luego Implementar → Nueva implementación → App web (ejecutar como: yo, acceso: cualquiera).
 * verAccesos() muestra los usuarios y contraseñas en el registro.
 */

const TZ = 'America/Lima';
const P = PropertiesService.getScriptProperties();

const ESQUEMA = {
  Items: ['id', 'categoria', 'nombre', 'marca', 'detalle', 'cantidad', 'stock_anterior', 'unidad', 'nota', 'foto',
    'activo', 'actualizado_en', 'actualizado_por'],
  Movimientos: ['id', 'fecha', 'hora', 'usuario', 'item_id', 'item', 'antes', 'despues', 'cambio', 'motivo'],
  Usuarios: ['usuario', 'clave', 'rol', 'nombre', 'activo'],
  Config: ['clave', 'valor'],
};

// Stock inicial: "Free Marketing - Stock Activos - AJE ACTUALIZADO Noviembre.xlsx"
// [categoria, nombre, marca, detalle, cantidad, stock_anterior, unidad, nota, foto]
const SEMILLA = [
  ['Bebidas', 'Cielo 600 ml Limón', 'Cielo', '600 ml', 0],
  ['Bebidas', 'Cielo 600 ml Naranja', 'Cielo', '600 ml', 0],
  ['Bebidas', 'Cielo 600 ml Maracuyá', 'Cielo', '600 ml', 0],
  ['Bebidas', 'Cielo 600 ml Manzana', 'Cielo', '600 ml', 0],
  ['Bebidas', 'Agua alcalina 350 ml', 'Cielo', '350 ml', 74],
  ['Bebidas', 'Volt lata original', 'Volt', 'Lata', 24],
  ['Bebidas', 'Volt botella original', 'Volt', 'Botella', 24],
  ['Bebidas', 'Sirana Ginger Ale', 'Sirana', '', 16],
  ['Bebidas', 'Sirana Agua Tónica', 'Sirana', '', 32],
  ['Bebidas', 'Hey Fit lata Cola Negra', 'Hey Fit', 'Lata', 0],
  ['Bebidas', 'Hey Fit lata Piña Colada', 'Hey Fit', 'Lata', 72],
  ['Bebidas', 'Hey Fit lata Hierba Luisa', 'Hey Fit', 'Lata', 0],
  ['Bebidas', 'Hey Fit lata Toronja CC', 'Hey Fit', 'Lata', 60],
  ['Bebidas', 'Hey Fit botella Cola Negra', 'Hey Fit', 'Botella', 0],
  ['Bebidas', 'Hey Fit botella Piña Colada', 'Hey Fit', 'Botella', 120],
  ['Bebidas', 'Hey Fit botella Hierba Luisa', 'Hey Fit', 'Botella', 0],
  ['Bebidas', 'Hey Fit botella Toronja CC', 'Hey Fit', 'Botella', 120],
  ['Bebidas', 'Dilyte azul', 'Dilyte', '', 0],
  ['Bebidas', 'Dilyte rosado', 'Dilyte', '', 0],
  ['Bebidas', 'Big Cola lata', 'Big Cola', 'Lata', 12],
  ['Bebidas', 'Oro lata', 'Oro', 'Lata', 6],
  ['Bebidas', 'Kolita', 'Kolita', '', 24, '', 'unid.', 'Vencidas'],
  ['Licores', 'Tequila José Cuervo', 'José Cuervo', '', 6],
  ['Licores', 'Bacardí', 'Bacardí', '', 1],
  ['Material POP', 'Lanyards Hey Fit amarillo', 'Hey Fit', '', 0],
  ['Material POP', 'Lanyards Hey Fit negros', 'Hey Fit', '', 132],
  ['Material POP', 'Lanyards Hey Fit verde', 'Hey Fit', '', 19],
  ['Material POP', 'Lanyards Volt', 'Volt', '', 222],
  ['Material POP', 'Table tents Hey Fit', 'Hey Fit', '', 108],
  ['Material POP', 'Table tents Cielo', 'Cielo', '', 42],
  ['Material POP', 'Jalavistas Hey Fit Toronja', 'Hey Fit', '', 49],
  ['Material POP', 'Piso de barra', 'AJE', '', 22],
  ['Material POP', 'Versacooler Hey Fit', 'Hey Fit', '', 2],
  ['Material POP', 'Versacooler Dilyte', 'Dilyte', '', 1],
  ['Material POP', 'Caja de toallas Sporade', 'Sporade', '', 0],
  ['Polos y casacas', 'Polo Big Cola rojo', 'Big Cola', 'Talla M', 3],
  ['Polos y casacas', 'Polo Big Cola rojo', 'Big Cola', 'Talla S', 4],
  ['Polos y casacas', 'Polo Hey Fit verde', 'Hey Fit', 'Talla única', 12],
  ['Polos y casacas', 'Casaca Sporade', 'Sporade', 'Talla M', 2],
  ['Uniformes', 'Vestido Hey Fit amarillo', 'Hey Fit', '', 1, 1, 'unid.', '', 'img/uniformes/u03.jpg'],
  ['Uniformes', 'Top Volt azul', 'Volt', '', 0, 1, 'unid.', '', 'img/uniformes/u04.jpg'],
  ['Uniformes', 'Vestido franja roja Dilyte', 'Dilyte', '', 1, 1, 'unid.', '', 'img/uniformes/u05.jpg'],
  ['Uniformes', 'Enterizo Cielo naranja', 'Cielo', '', 1, 1, 'unid.', '', 'img/uniformes/u06.jpg'],
  ['Uniformes', 'Enterizo carrera Volt', 'Volt', '', 0, 1, 'unid.', '', 'img/uniformes/u07.jpg'],
  ['Uniformes', 'Vestido sin franja Dilyte', 'Dilyte', '', 0, 1, 'unid.', '', 'img/uniformes/u08.jpg'],
  ['Uniformes', 'Vestido manga larga Volt', 'Volt', '', 0, 1, 'unid.', '', 'img/uniformes/u09.jpg'],
  ['Uniformes', 'Vestido largo azul carrera Volt', 'Volt', '', 1, 1, 'unid.', '', 'img/uniformes/u10.jpg'],
  ['Uniformes', 'Pantalón campana Volt', 'Volt', '', 0, 1, 'unid.', '', 'img/uniformes/u11.jpg'],
  ['Uniformes', 'Enterizo Cielo limón', 'Cielo', '', 0, 1, 'unid.', '', 'img/uniformes/u12.jpg'],
  ['Uniformes', 'Enterizo Sirana Ginger Ale', 'Sirana', '', 0, 1, 'unid.', '', 'img/uniformes/u13.jpg'],
  ['Uniformes', 'Correa vestido Volt', 'Volt', '', 0, 1, 'unid.', '', 'img/uniformes/u14.jpg'],
  ['Uniformes', 'Enterizo Cielo manzana', 'Cielo', '', 1, 1, 'unid.', '', 'img/uniformes/u15.jpg'],
  ['Uniformes', 'Vestido celeste Hey Fit', 'Hey Fit', '', 0, 1, 'unid.', '', 'img/uniformes/u16.jpg'],
  ['Uniformes', 'Vestido rosado Hey Fit', 'Hey Fit', '', 1, 0],
  ['Uniformes', 'Vestido crema Cielo', 'Cielo', '', 1, 0],
];
const AVISO_INICIAL = 'Hay 5 paquetes de botellas Hey Fit vencidas.';

/* ------------------------------------------------------------------ */
/* Instalación                                                         */
/* ------------------------------------------------------------------ */

function setup() {
  let ss;
  if (P.getProperty('SS_ID')) ss = SpreadsheetApp.openById(P.getProperty('SS_ID'));
  else {
    ss = SpreadsheetApp.create('AJE × Free · Inventario');
    P.setProperty('SS_ID', ss.getId());
  }
  Object.keys(ESQUEMA).forEach(function (n) {
    let h = ss.getSheetByName(n);
    if (!h) h = ss.insertSheet(n);
    if (h.getLastRow() === 0) {
      h.getRange(1, 1, 1, ESQUEMA[n].length).setValues([ESQUEMA[n]]).setFontWeight('bold');
      h.setFrozenRows(1);
    }
  });
  ['Hoja 1', 'Sheet1', 'Hoja1'].forEach(function (n) {
    const h = ss.getSheetByName(n);
    if (h && ss.getSheets().length > 1) ss.deleteSheet(h);
  });
  // Si la carga inicial quedó a medias (y nadie ha movido stock aún), se rehace completa.
  const hi = ss.getSheetByName('Items');
  if (leer_('Items').length < SEMILLA.length && leer_('Movimientos').length === 0 && hi.getLastRow() > 1) {
    hi.deleteRows(2, hi.getLastRow() - 1);
  }
  if (leer_('Items').length === 0) {
    const ahora = ahora_();
    const filas = SEMILLA.map(function (s, i) {
      const o = {
        id: 'it' + ('00' + (i + 1)).slice(-3), categoria: s[0], nombre: s[1], marca: s[2], detalle: s[3] || '',
        cantidad: s[4] || 0, stock_anterior: s[5] === undefined ? '' : s[5], unidad: s[6] || 'unid.', nota: s[7] || '',
        foto: s[8] || '', activo: 'SI', actualizado_en: ahora.fecha + ' ' + ahora.hora, actualizado_por: 'Carga inicial (Excel nov.)',
      };
      return ESQUEMA.Items.map(function (k) { return o[k]; });
    });
    hi.getRange(2, 1, filas.length, ESQUEMA.Items.length).setValues(filas);
  }
  if (leer_('Usuarios').length === 0) {
    agregar_('Usuarios', { usuario: 'free', clave: claveAleatoria_(), rol: 'free', nombre: 'Equipo Free', activo: 'SI' });
    agregar_('Usuarios', { usuario: 'aje', clave: claveAleatoria_(), rol: 'cliente', nombre: 'AJE', activo: 'SI' });
  }
  if (leer_('Config').length === 0) agregar_('Config', { clave: 'aviso', valor: AVISO_INICIAL });
  if (!P.getProperty('FOLDER_ID')) {
    const folder = DriveApp.createFolder('AJE × Free · Fotos inventario');
    try { folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) { }
    P.setProperty('FOLDER_ID', folder.getId());
  }
  if (!P.getProperty('SECRETO')) P.setProperty('SECRETO', Utilities.getUuid());
  verAccesos();
}

function verAccesos() {
  Logger.log('Sheet: ' + ss_().getUrl());
  Logger.log('Fotos: https://drive.google.com/drive/folders/' + P.getProperty('FOLDER_ID'));
  leer_('Usuarios').forEach(function (u) { Logger.log(u.rol + ' → usuario: ' + u.usuario + ' · contraseña: ' + u.clave); });
}

/* ------------------------------------------------------------------ */
/* Web app                                                             */
/* ------------------------------------------------------------------ */

function doGet() { return out_({ ok: true, servicio: 'AJE × Free · Inventario' }); }

function doPost(e) {
  let b;
  try { b = JSON.parse(e.postData.contents); } catch (err) { return out_({ ok: false, code: 'val', error: 'Datos inválidos' }); }
  try {
    if (b.tipo === 'login') {
      const u = usuarioPorClave_(b.usuario, b.clave);
      if (!u) return out_({ ok: false, code: 'auth', error: 'Usuario o contraseña incorrectos' });
      return out_({ ok: true, token: token_(u), usuario: publico_(u) });
    }
    const u = usuarioPorToken_(b.token);
    if (!u) return out_({ ok: false, code: 'auth', error: 'Tu sesión expiró. Vuelve a ingresar.' });
    if (b.tipo === 'datos') return out_(datos_(u));
    if (u.rol !== 'free') return out_({ ok: false, code: 'auth', error: 'Solo el equipo Free puede modificar el inventario' });
    const fn = { guardar: guardar_, ajustar: ajustar_, foto: subirFoto_, eliminar: eliminar_, aviso: aviso_ }[b.tipo];
    if (!fn) return out_({ ok: false, code: 'val', error: 'Acción desconocida' });
    return out_(conLock_(function () { return fn(b, u); }));
  } catch (err) {
    return out_({ ok: false, code: err && err.val ? 'val' : 'server', error: String(err && err.message || err) });
  }
}

function datos_(u) {
  const items = leer_('Items').filter(function (i) { return !/^no$/i.test(i.activo); }).map(limpiarItem_);
  const movs = leer_('Movimientos').slice(-300).reverse().map(function (m) {
    m.hora = hhmm_(m.hora); m.fecha = fechaTxt_(m.fecha); return m;
  });
  return { ok: true, usuario: publico_(u), items: items, movimientos: movs, aviso: config_().aviso || '', servidor: ahora_() };
}

function guardar_(b, u) {
  const it = b.item || {};
  const nombre = limpio_(it.nombre);
  if (!nombre) throw val_('Escribe el nombre del artículo');
  if (!limpio_(it.categoria)) throw val_('Elige una categoría');
  const cant = entero_(it.cantidad);
  if (cant === null || cant < 0) throw val_('La cantidad debe ser un número entero, 0 o más');
  const ahora = ahora_();
  const sello = ahora.fecha + ' ' + ahora.hora;
  const campos = {
    categoria: limpio_(it.categoria), nombre: nombre, marca: limpio_(it.marca), detalle: limpio_(it.detalle),
    unidad: limpio_(it.unidad) || 'unid.', nota: limpio_(it.nota), actualizado_en: sello, actualizado_por: u.nombre,
  };
  if (!it.id) {
    const id = 'it' + Date.now().toString(36);
    agregar_('Items', Object.assign(campos, { id: id, cantidad: cant, stock_anterior: '', foto: '', activo: 'SI' }));
    movimiento_(u, id, nombre, 0, cant, it.motivo || 'Artículo nuevo');
    return { ok: true, id: id };
  }
  const fila = fila_('Items', it.id);
  if (!fila) throw val_('El artículo ya no existe');
  const actual = fila.obj;
  const antes = Number(actual.cantidad) || 0;
  campos.cantidad = cant;
  escribir_('Items', fila.n, campos);
  if (antes !== cant) movimiento_(u, it.id, nombre, antes, cant, it.motivo || 'Edición');
  return { ok: true, id: it.id };
}

function ajustar_(b, u) {
  const fila = fila_('Items', b.id);
  if (!fila) throw val_('El artículo ya no existe');
  const antes = Number(fila.obj.cantidad) || 0;
  let nuevo = b.cantidad !== undefined ? entero_(b.cantidad) : antes + (entero_(b.cambio) || 0);
  if (nuevo === null || nuevo < 0) throw val_('El stock no puede quedar negativo');
  const ahora = ahora_();
  escribir_('Items', fila.n, { cantidad: nuevo, actualizado_en: ahora.fecha + ' ' + ahora.hora, actualizado_por: u.nombre });
  if (antes !== nuevo) movimiento_(u, b.id, fila.obj.nombre + (fila.obj.detalle ? ' · ' + fila.obj.detalle : ''), antes, nuevo,
    limpio_(b.motivo) || (nuevo > antes ? 'Ingreso' : 'Salida'));
  return { ok: true, cantidad: nuevo };
}

function subirFoto_(b, u) {
  const fila = fila_('Items', b.id);
  if (!fila) throw val_('El artículo ya no existe');
  const m = String(b.foto || '').match(/^data:(image\/[a-z+]+);base64,(.+)$/);
  if (!m) throw val_('La foto no es válida');
  const blob = Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], (fila.obj.nombre + '_' + Date.now()).replace(/[^\w.-]+/g, '_') + '.jpg');
  const file = DriveApp.getFolderById(P.getProperty('FOLDER_ID')).createFile(blob);
  try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) { }
  const url = 'https://drive.google.com/file/d/' + file.getId() + '/view';
  const ahora = ahora_();
  escribir_('Items', fila.n, { foto: url, actualizado_en: ahora.fecha + ' ' + ahora.hora, actualizado_por: u.nombre });
  return { ok: true, foto: url };
}

function eliminar_(b, u) {
  const fila = fila_('Items', b.id);
  if (!fila) throw val_('El artículo ya no existe');
  const ahora = ahora_();
  escribir_('Items', fila.n, { activo: 'NO', actualizado_en: ahora.fecha + ' ' + ahora.hora, actualizado_por: u.nombre });
  movimiento_(u, b.id, fila.obj.nombre, Number(fila.obj.cantidad) || 0, 0, 'Artículo retirado del inventario');
  return { ok: true };
}

function aviso_(b) {
  const h = hoja_('Config');
  const fila = fila_('Config', 'aviso', 'clave');
  const v = limpio_(b.aviso);
  if (fila) h.getRange(fila.n, 2).setValue(v); else agregar_('Config', { clave: 'aviso', valor: v });
  return { ok: true, aviso: v };
}

function movimiento_(u, id, nombre, antes, despues, motivo) {
  const t = ahora_();
  agregar_('Movimientos', {
    id: 'mv' + Date.now().toString(36) + Math.floor(Math.random() * 1e4), fecha: t.fecha, hora: t.hora, usuario: u.nombre,
    item_id: id, item: nombre, antes: antes, despues: despues, cambio: despues - antes, motivo: motivo,
  });
}

/* ------------------------------------------------------------------ */
/* Accesos                                                             */
/* ------------------------------------------------------------------ */

function usuarioPorClave_(usuario, clave) {
  const nu = norm_(usuario), nc = String(clave || '').trim();
  if (!nu || !nc) return null;
  return leer_('Usuarios').find(function (x) {
    return !/^no$/i.test(x.activo) && norm_(x.usuario) === nu && String(x.clave).trim() === nc;
  }) || null;
}

function token_(u) {
  const firma = Utilities.computeHmacSha256Signature(norm_(u.usuario) + '|' + String(u.clave).trim(), P.getProperty('SECRETO'));
  return Utilities.base64EncodeWebSafe(norm_(u.usuario)) + '.' + Utilities.base64EncodeWebSafe(firma).replace(/=+$/, '');
}

function usuarioPorToken_(t) {
  const partes = String(t || '').split('.');
  if (partes.length !== 2) return null;
  let usuario;
  try { usuario = Utilities.newBlob(Utilities.base64DecodeWebSafe(partes[0])).getDataAsString(); } catch (e) { return null; }
  const u = leer_('Usuarios').find(function (x) { return !/^no$/i.test(x.activo) && norm_(x.usuario) === usuario; });
  return u && token_(u) === t ? u : null;
}

function publico_(u) { return { usuario: u.usuario, nombre: u.nombre, rol: u.rol }; }

function claveAleatoria_() {
  const c = 'abcdefghjkmnpqrstuvwxyz23456789';
  let s = '';
  for (let i = 0; i < 8; i++) s += c.charAt(Math.floor(Math.random() * c.length));
  return s;
}

/* ------------------------------------------------------------------ */
/* Utilidades de Sheet                                                 */
/* ------------------------------------------------------------------ */

function ss_() { return SpreadsheetApp.openById(P.getProperty('SS_ID')); }
function hoja_(n) { return ss_().getSheetByName(n); }

function leer_(n) {
  const h = hoja_(n);
  if (!h || h.getLastRow() < 2) return [];
  const v = h.getRange(1, 1, h.getLastRow(), h.getLastColumn()).getValues();
  const cab = v.shift();
  return v.filter(function (r) { return r[0] !== ''; }).map(function (r) {
    const o = {};
    cab.forEach(function (k, i) { o[k] = r[i]; });
    return o;
  });
}

function fila_(n, valor, col) {
  const h = hoja_(n);
  if (!h || h.getLastRow() < 2) return null;
  const v = h.getRange(1, 1, h.getLastRow(), h.getLastColumn()).getValues();
  const cab = v[0], c = cab.indexOf(col || 'id');
  for (let i = 1; i < v.length; i++) {
    if (String(v[i][c]) === String(valor)) {
      const o = {};
      cab.forEach(function (k, j) { o[k] = v[i][j]; });
      return { n: i + 1, obj: o };
    }
  }
  return null;
}

function escribir_(n, numFila, campos) {
  const h = hoja_(n);
  const cab = h.getRange(1, 1, 1, h.getLastColumn()).getValues()[0];
  Object.keys(campos).forEach(function (k) {
    const c = cab.indexOf(k);
    if (c >= 0) h.getRange(numFila, c + 1).setValue(campos[k]);
  });
}

function agregar_(n, obj) {
  hoja_(n).appendRow(ESQUEMA[n].map(function (k) { return obj[k] === undefined ? '' : obj[k]; }));
}

function config_() {
  const o = {};
  leer_('Config').forEach(function (r) { o[r.clave] = r.valor; });
  return o;
}

function limpiarItem_(i) {
  i.cantidad = Number(i.cantidad) || 0;
  i.stock_anterior = i.stock_anterior === '' ? '' : Number(i.stock_anterior);
  i.actualizado_en = i.actualizado_en instanceof Date ? Utilities.formatDate(i.actualizado_en, TZ, 'yyyy-MM-dd HH:mm') : String(i.actualizado_en || '');
  delete i.activo;
  return i;
}

function conLock_(fn) {
  const l = LockService.getScriptLock();
  l.waitLock(20000);
  try { return fn(); } finally { l.releaseLock(); }
}

function ahora_() {
  const d = new Date();
  return { fecha: Utilities.formatDate(d, TZ, 'yyyy-MM-dd'), hora: Utilities.formatDate(d, TZ, 'HH:mm') };
}
function fechaTxt_(f) { return f instanceof Date ? Utilities.formatDate(f, TZ, 'yyyy-MM-dd') : String(f || ''); }
function hhmm_(h) {
  if (h instanceof Date) return Utilities.formatDate(h, TZ, 'HH:mm');
  const m = String(h || '').match(/(\d{1,2}):(\d{2})/);
  return m ? ('0' + m[1]).slice(-2) + ':' + m[2] : '';
}
function limpio_(s) { return String(s === undefined || s === null ? '' : s).trim().slice(0, 300); }
function norm_(s) { return limpio_(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[\s.]+/g, ''); }
function entero_(v) { const n = Number(v); return v === '' || v === null || !isFinite(n) ? null : Math.round(n); }
function val_(m) { const e = new Error(m); e.val = true; return e; }
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

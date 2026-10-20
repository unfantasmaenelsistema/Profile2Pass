/* engine.js — motor de Profile2Pass (Un Fantasma en el Sistema, MIT)
 * Convierte un perfil (nombres, fechas, números…) en un diccionario de contraseñas candidatas,
 * ordenado de más a menos probable. Funciona en el navegador (window.P2P) y en Node. */
(function (root) {
  'use strict';

  // Campos de texto que aportan palabras y campos que aportan números o fechas.
  var WORD_FIELDS = ['name', 'surname1', 'surname2', 'nickname', 'partnerName', 'fatherName', 'motherName',
    'siblings', 'children', 'pet', 'city', 'company', 'school', 'team', 'hobby', 'keywords'];
  var NUMBER_FIELDS = ['dni', 'ssn', 'phone'];
  var DATE_FIELDS = ['birthdate', 'otherDates'];
  var ALL_FIELDS = WORD_FIELDS.concat(NUMBER_FIELDS, DATE_FIELDS, ['birthyear']);

  var COMMON_NUMBERS = ['1', '12', '123', '1234', '12345', '123456', '0', '00', '01', '11', '13', '21', '69', '77', '99', '007', '321', '666', '777'];
  var SYMBOLS = ['!', '.', '@', '#', '*', '$', '_', '-', '?'];
  var LEET = { a: '4', e: '3', i: '1', o: '0', s: '5', t: '7' };

  var DEFAULTS = {
    caseVariants: true,   // juan, Juan, JUAN
    leet: true,           // juan → ju4n
    numbers: true,        // juan123
    dates: true,          // juan1985, juan1503
    recentYears: true,    // juan2024… (años recientes)
    symbols: true,        // juan!, Juan1985!
    pairs: true,          // juangarcia, JuanGarcia
    minLen: 6,
    maxLen: 20,
    limit: 1000000
  };

  // Minúsculas sin tildes ni diéresis; la ñ pasa a n (García → garcia, Begoña → begona).
  function fold(s) {
    return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }
  function cap(w) { return w.charAt(0).toUpperCase() + w.slice(1); }

  // Valores de un campo: acepta texto separado por comas o listas (JSON).
  function values(v) {
    if (v === undefined || v === null) return [];
    if (Array.isArray(v)) return v.reduce(function (acc, x) { return acc.concat(values(x)); }, []);
    if (typeof v === 'object') return [];
    return String(v).split(/[,;\n]+/).map(function (x) { return x.trim(); }).filter(Boolean);
  }

  // Palabras de un valor: cada palabra y, si hay varias, también todas juntas (Real Madrid → real, madrid, realmadrid).
  function wordsOf(value) {
    var parts = fold(value).split(/[^a-z0-9]+/).filter(Boolean);
    var out = parts.filter(function (p) { return p.length >= 3 && !/^\d+$/.test(p); });
    if (parts.length > 1) out.push(parts.join(''));
    // Iniciales de nombres compuestos (Juan Carlos → jc)
    if (parts.length > 1 && parts.every(function (p) { return /^[a-z]/.test(p); })) out.push(parts.map(function (p) { return p[0]; }).join(''));
    return out;
  }

  // Fechas en DD-MM-AAAA, DD/MM/AAAA, DD.MM.AA, DDMMAAAA o AAAA-MM-DD.
  function parseDate(s) {
    s = String(s).trim();
    var m;
    if ((m = /^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})$/.exec(s))) return mk(m[3], m[2], m[1]);
    if ((m = /^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2}|\d{4})$/.exec(s))) return mk(m[1], m[2], m[3]);
    if ((m = /^(\d{2})(\d{2})(\d{4})$/.exec(s))) return mk(m[1], m[2], m[3]);
    return null;
    function mk(d, mo, y) {
      d = +d; mo = +mo;
      if (y.length === 2) y = (+y > 30 ? '19' : '20') + y;
      if (d < 1 || d > 31 || mo < 1 || mo > 12) return null;
      return { d: d, m: mo, y: y };
    }
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  // Trozos numéricos que la gente pega a sus contraseñas a partir de una fecha.
  function dateParts(dt) {
    var dd = pad(dt.d), mm = pad(dt.m), yyyy = dt.y, yy = yyyy.slice(2);
    return [yyyy, yy, dd + mm, dd + mm + yy, dd + mm + yyyy, dt.d + '' + dt.m, dt.d + '' + dt.m + yy, dd + mm + yy.slice(-2), mm + dd, yyyy + mm + dd]
      .filter(function (x, i, a) { return a.indexOf(x) === i; });
  }

  // Números «propios»: DNI (dígitos y letra), teléfono (entero y últimas cifras), seguridad social.
  function numberParts(field, value) {
    var v = fold(value).replace(/[^a-z0-9]/g, '');
    if (!v) return [];
    var digits = v.replace(/\D/g, ''), out = [v];
    if (digits && digits !== v) out.push(digits);
    if (field === 'phone' && digits.length >= 6) out.push(digits.slice(-4), digits.slice(-3));
    if (field === 'dni' && digits.length >= 6) out.push(digits.slice(-4));
    return out;
  }

  function leet(w) { return w.replace(/[aeiost]/g, function (c) { return LEET[c]; }); }

  /* Genera el diccionario. Devuelve { words: [...], truncated, stats }.
   * El orden importa: primero lo más probable, para que un ataque con el diccionario
   * encuentre antes la contraseña si está. */
  function generate(profile, opts) {
    var o = {}, k;
    for (k in DEFAULTS) o[k] = DEFAULTS[k];
    for (k in (opts || {})) if (opts[k] !== undefined) o[k] = opts[k];
    profile = profile || {};

    // 1. Palabras base
    var base = [];
    WORD_FIELDS.forEach(function (f) { values(profile[f]).forEach(function (v) { base = base.concat(wordsOf(v)); }); });
    base = uniq(base);

    // 2. Números y fechas
    var dates = [];
    DATE_FIELDS.forEach(function (f) { values(profile[f]).forEach(function (v) { var d = parseDate(v); if (d) dates.push(d); }); });
    var years = [];
    values(profile.birthyear).forEach(function (v) { if (/^\d{4}$/.test(v)) years.push(v); });
    dates.forEach(function (d) { years.push(d.y); });
    years = uniq(years);
    var dateSuffixes = [];
    if (o.dates) {
      years.forEach(function (y) { dateSuffixes.push(y, y.slice(2)); });
      dates.forEach(function (d) { dateSuffixes = dateSuffixes.concat(dateParts(d)); });
    }
    if (o.recentYears) {
      var now = new Date().getFullYear();
      for (var y = now - 6; y <= now + 1; y++) dateSuffixes.push(String(y));
    }
    dateSuffixes = uniq(dateSuffixes);
    var own = [];
    NUMBER_FIELDS.forEach(function (f) { values(profile[f]).forEach(function (v) { own = own.concat(numberParts(f, v)); }); });
    own = uniq(own);
    var numSuffixes = o.numbers ? COMMON_NUMBERS.slice() : [];

    // Variantes de cada palabra: juan, Juan, JUAN, ju4n, Ju4n
    function variants(w) {
      var out = [w];
      if (o.caseVariants) { out.push(cap(w)); out.push(w.toUpperCase()); }
      if (o.leet && /[aeiost]/.test(w)) { var l = leet(w); out.push(l); if (o.caseVariants) out.push(cap(l)); }
      return uniq(out);
    }
    var W = [];
    base.forEach(function (w) { W = W.concat(variants(w)); });
    W = uniq(W);
    var Wshort = uniq(base.concat(o.caseVariants ? base.map(cap) : [])); // para combinaciones, sin leet ni MAYÚSCULAS

    var out = new Set(), truncated = false, minL = o.minLen | 0, maxL = o.maxLen | 0 || 64;
    function add(s) {
      if (truncated) return;
      if (s.length < minL || s.length > maxL) return;
      out.add(s);
      if (out.size >= o.limit) truncated = true;
    }

    // Orden de probabilidad
    W.forEach(add);                                                                              // juan
    W.forEach(function (w) { dateSuffixes.forEach(function (s) { add(w + s); }); });              // juan1985
    W.forEach(function (w) { numSuffixes.forEach(function (s) { add(w + s); }); });               // juan123
    W.forEach(function (w) { own.forEach(function (s) { add(w + s); }); });                       // juan2233
    if (o.symbols) {
      W.forEach(function (w) { SYMBOLS.forEach(function (x) { add(w + x); }); });                 // juan!
      W.forEach(function (w) { dateSuffixes.concat(numSuffixes).forEach(function (s) {
        SYMBOLS.forEach(function (x) { add(w + s + x); add(w + x + s); });                        // juan1985! juan.1985
      }); });
    }
    if (o.pairs) {
      Wshort.forEach(function (a) { Wshort.forEach(function (b) {
        if (fold(a) === fold(b)) return;
        if ((a === fold(a)) !== (b === fold(b))) return;                                          // juangarcia / JuanGarcia
        add(a + b);
        dateSuffixes.concat(o.numbers ? ['1', '12', '123'] : []).forEach(function (s) { add(a + b + s); });
        if (o.symbols) ['!', '.', '_'].forEach(function (x) { add(a + x + b); add(a + b + x); });
      }); });
    }
    dateSuffixes.forEach(function (s) { W.forEach(function (w) { add(s + w); }); });              // 1985juan
    own.forEach(add);                                                                             // 600112233
    dates.forEach(function (d) { dateParts(d).forEach(add); });                                   // 15031985

    return { words: Array.from(out), truncated: truncated, stats: { baseWords: base.length, variants: W.length, dateParts: dateSuffixes.length, ownNumbers: own.length } };
  }

  function uniq(a) { return a.filter(function (x, i) { return x && a.indexOf(x) === i; }); }

  /* Importación: JSON (objeto o lista de objetos) o CSV con cabecera.
   * Devuelve { profile, count }: el primer perfil y cuántos había. Claves desconocidas → keywords. */
  function normalizeProfile(obj) {
    var p = {}, extra = [];
    Object.keys(obj || {}).forEach(function (key) {
      if (ALL_FIELDS.indexOf(key) > -1) p[key] = values(obj[key]).join(', ');
      else values(obj[key]).forEach(function (v) { extra.push(v); });
    });
    if (extra.length) p.keywords = (p.keywords ? p.keywords + ', ' : '') + extra.join(', ');
    return p;
  }
  function parseCSV(text) {
    var rows = [], row = [], cell = '', q = false;
    text = String(text).replace(/^﻿/, '');
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; continue; }
      if (c === '"') q = true;
      else if (c === ',' || c === ';') { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    rows = rows.filter(function (r) { return r.some(function (x) { return x.trim(); }); });
    if (rows.length < 2) return [];
    var head = rows[0].map(function (h) { return h.trim(); });
    return rows.slice(1).map(function (r) { var o = {}; head.forEach(function (h, j) { o[h] = (r[j] || '').trim(); }); return o; });
  }
  function importText(name, text) {
    var list;
    if (/\.csv$/i.test(name)) list = parseCSV(text);
    else { var j = JSON.parse(text); list = Array.isArray(j) ? j : [j]; }
    list = list.filter(function (x) { return x && typeof x === 'object'; });
    if (!list.length) throw new Error('empty');
    return { profile: normalizeProfile(list[0]), count: list.length };
  }

  var api = { generate: generate, importText: importText, parseDate: parseDate, fold: fold, DEFAULTS: DEFAULTS, FIELDS: ALL_FIELDS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.P2P = api;
})(typeof window !== 'undefined' ? window : this);

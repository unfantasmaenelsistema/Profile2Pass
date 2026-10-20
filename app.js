/* app.js — interfaz de Profile2Pass (Un Fantasma en el Sistema, MIT)
 * Los datos del perfil no se guardan en ningún sitio: solo el idioma y el tema van a localStorage. */
(function () {
  'use strict';

  var PREVIEW = 3000; // líneas que se muestran; la descarga lleva el diccionario completo

  var GROUPS = [
    { id: 'personal', fields: [['name', 'Juan Carlos'], ['surname1', 'García'], ['surname2', 'Pérez'], ['nickname', 'Juanki'], ['birthdate', '15-03-1985'], ['birthyear', '1985'], ['partnerName', 'Begoña']] },
    { id: 'family', fields: [['fatherName', 'Antonio'], ['motherName', 'María'], ['siblings', 'Jose, Laura'], ['children', 'Daniel, Sofía']] },
    { id: 'extra', fields: [['pet', 'Rex'], ['city', 'Madrid'], ['company', 'Acme'], ['school', 'IES Cervantes'], ['team', 'Real Madrid'], ['hobby', 'pádel'],
      ['dni', '12345678Z'], ['ssn', '281234567840'], ['phone', '600 11 22 33'], ['otherDates', '20-06-2012, 09-09-2015'], ['keywords', 'Ibiza, Metallica']] }
  ];
  var OPTS = ['caseVariants', 'leet', 'numbers', 'dates', 'recentYears', 'symbols', 'pairs'];

  var I18N = {
    es: {
      title: 'Generador de diccionarios a partir de un perfil',
      lead: 'Muchas personas crean sus contraseñas con datos de su vida: el nombre del hijo, la mascota, el equipo, una fecha. <b>Profile2Pass</b> convierte esa información en un diccionario de contraseñas candidatas (como la herramienta CUPP), ordenado de más a menos probable.',
      ethics: '⚖️ <b>Uso responsable.</b> Úsalo en auditorías con autorización por escrito, en CTF, en clase o para comprobar tus propias contraseñas. Atacar cuentas ajenas sin permiso es delito (art. 197 bis del Código Penal).',
      profile: 'Perfil', example: 'Cargar ejemplo', import: 'Importar JSON/CSV', template: 'Plantilla JSON', clear: 'Vaciar',
      personal: 'Información personal', family: 'Familia', extra: 'Detalles adicionales',
      name: 'Nombre', surname1: 'Primer apellido', surname2: 'Segundo apellido', nickname: 'Alias / apodo', birthdate: 'Fecha de nacimiento (DD-MM-AAAA)',
      birthyear: 'Año de nacimiento', partnerName: 'Nombre de la pareja', fatherName: 'Nombre del padre', motherName: 'Nombre de la madre',
      siblings: 'Hermanos (separados por comas)', children: 'Hijos (separados por comas)', pet: 'Mascota', city: 'Ciudad', company: 'Empresa',
      school: 'Colegio / universidad', team: 'Equipo deportivo', hobby: 'Hobby / interés', dni: 'DNI / NIE', ssn: 'Número de la Seguridad Social', phone: 'Teléfono',
      otherDates: 'Otras fechas importantes (bodas, hijos…)', keywords: 'Otras palabras clave (separadas por comas)',
      options: 'Opciones',
      caseVariants: 'Mayúsculas: juan, Juan, JUAN', leet: 'Leet: juan → ju4n', numbers: 'Números comunes: juan123', dates: 'Fechas y años del perfil: juan1985, juan1503',
      recentYears: 'Años recientes: juan2024', symbols: 'Símbolos: juan!, juan.1985', pairs: 'Combinaciones: juangarcia, JuanGarcia',
      minLen: 'Longitud mínima', maxLen: 'Longitud máxima',
      result: 'Diccionario', words: 'contraseñas candidatas', download: 'Descargar .txt', copy: 'Copiar todo', copied: '¡Copiado!',
      empty: 'Rellena algún campo del perfil o carga el ejemplo.',
      trunc: 'Se ha alcanzado el límite de {n} contraseñas: desactiva opciones o sube la longitud mínima para afinar.',
      preview: 'Se muestran las primeras {p} de {n}. La descarga incluye todas.',
      importOk: 'Perfil importado de «{f}».', importMany: 'El archivo tenía {n} perfiles: se ha cargado el primero.', importErr: 'No se ha podido leer «{f}». Debe ser un JSON (objeto o lista) o un CSV con cabecera.',
      privacy: '🔒 Todo se calcula en tu navegador. Los datos del perfil no se envían ni se guardan.',
      howTitle: 'Cómo se usa el diccionario',
      howBody: '<p>El diccionario es una lista de contraseñas, una por línea, para herramientas de auditoría:</p><pre>hashcat -m 0 -a 0 hashes.txt diccionario_profile2pass.txt\njohn --wordlist=diccionario_profile2pass.txt hashes.txt\nhydra -l usuario -P diccionario_profile2pass.txt ssh://10.0.0.5</pre><p>Va ordenado de más a menos probable: primero las palabras solas, luego con fechas del perfil, números comunes, símbolos y combinaciones. Si la herramienta se detiene al acertar, encontrará antes la contraseña si está.</p><p>Para redes WiFi WPA/WPA2, sube la longitud mínima a 8 (es el mínimo del estándar).</p>',
      defTitle: 'Cómo protegerte',
      defBody: '<ul><li>No construyas contraseñas con datos que se puedan encontrar en tus redes sociales: nombres, fechas, mascotas, equipos.</li><li>Usa un <b>gestor de contraseñas</b> con contraseñas aleatorias y distintas en cada sitio, o frases de varias palabras al azar.</li><li>Activa la <b>verificación en dos pasos</b>: aunque adivinen la contraseña, no les bastará.</li><li>Cambiar «juan1985» por «Ju4n1985!» no ayuda: estas variantes son justo lo que prueba un diccionario como este.</li></ul>',
      fLocal: 'Todo funciona en tu navegador', themeTitle: 'Cambiar tema', langTitle: 'English'
    },
    en: {
      title: 'Wordlist generator from a profile',
      lead: 'Many people build their passwords from details of their life: a child’s name, the pet, a football team, a date. <b>Profile2Pass</b> turns that information into a wordlist of candidate passwords (like the CUPP tool), ordered from most to least likely.',
      ethics: '⚖️ <b>Responsible use.</b> Use it in audits with written authorisation, in CTFs, in class or to test your own passwords. Attacking other people’s accounts without permission is a crime.',
      profile: 'Profile', example: 'Load example', import: 'Import JSON/CSV', template: 'JSON template', clear: 'Clear',
      personal: 'Personal details', family: 'Family', extra: 'Additional details',
      name: 'First name', surname1: 'First surname', surname2: 'Second surname', nickname: 'Nickname', birthdate: 'Date of birth (DD-MM-YYYY)',
      birthyear: 'Year of birth', partnerName: 'Partner’s name', fatherName: 'Father’s name', motherName: 'Mother’s name',
      siblings: 'Siblings (comma-separated)', children: 'Children (comma-separated)', pet: 'Pet', city: 'City', company: 'Company',
      school: 'School / university', team: 'Sports team', hobby: 'Hobby / interest', dni: 'ID number (DNI / NIE)', ssn: 'Social security number', phone: 'Phone',
      otherDates: 'Other important dates (weddings, children…)', keywords: 'Other keywords (comma-separated)',
      options: 'Options',
      caseVariants: 'Case: juan, Juan, JUAN', leet: 'Leet: juan → ju4n', numbers: 'Common numbers: juan123', dates: 'Profile dates and years: juan1985, juan1503',
      recentYears: 'Recent years: juan2024', symbols: 'Symbols: juan!, juan.1985', pairs: 'Combinations: juangarcia, JuanGarcia',
      minLen: 'Minimum length', maxLen: 'Maximum length',
      result: 'Wordlist', words: 'candidate passwords', download: 'Download .txt', copy: 'Copy all', copied: 'Copied!',
      empty: 'Fill in some profile fields or load the example.',
      trunc: 'The limit of {n} passwords was reached: turn options off or raise the minimum length to narrow it down.',
      preview: 'Showing the first {p} of {n}. The download includes all of them.',
      importOk: 'Profile imported from “{f}”.', importMany: 'The file had {n} profiles: the first one was loaded.', importErr: 'Could not read “{f}”. It must be JSON (an object or a list) or a CSV with a header row.',
      privacy: '🔒 Everything is computed in your browser. Profile data is never sent or stored.',
      howTitle: 'How to use the wordlist',
      howBody: '<p>The wordlist is a list of passwords, one per line, for auditing tools:</p><pre>hashcat -m 0 -a 0 hashes.txt diccionario_profile2pass.txt\njohn --wordlist=diccionario_profile2pass.txt hashes.txt\nhydra -l user -P diccionario_profile2pass.txt ssh://10.0.0.5</pre><p>It is ordered from most to least likely: single words first, then with profile dates, common numbers, symbols and combinations. If the tool stops on a hit, it will find the password sooner if it is there.</p><p>For WPA/WPA2 Wi-Fi networks, raise the minimum length to 8 (the standard’s minimum).</p>',
      defTitle: 'How to protect yourself',
      defBody: '<ul><li>Do not build passwords from details that can be found on your social media: names, dates, pets, teams.</li><li>Use a <b>password manager</b> with random, unique passwords for each site, or passphrases of several random words.</li><li>Turn on <b>two-factor authentication</b>: even if they guess the password, it will not be enough.</li><li>Changing “juan1985” to “Ju4n1985!” does not help: those variants are exactly what a wordlist like this one tries.</li></ul>',
      fLocal: 'Everything runs in your browser', themeTitle: 'Toggle theme', langTitle: 'Español'
    }
  };

  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  var lang = store('p2p-lang') || ((navigator.language || 'es').slice(0, 2) === 'es' ? 'es' : 'en');
  if (!I18N[lang]) lang = 'es';
  function t(k, vars) {
    var s = I18N[lang][k]; if (s === undefined) s = I18N.es[k];
    if (vars) s = s.replace(/\{(\w+)\}/g, function (_, v) { return vars[v]; });
    return s;
  }
  function $(id) { return document.getElementById(id); }

  // Formulario
  var form = $('profileForm');
  form.innerHTML = GROUPS.map(function (g) {
    return '<fieldset><legend data-i18n="' + g.id + '"></legend><div class="grid">' + g.fields.map(function (f) {
      return '<label class="field"><span data-i18n="' + f[0] + '"></span><input id="f_' + f[0] + '" data-key="' + f[0] + '" placeholder="' + f[1] + '" spellcheck="false"></label>';
    }).join('') + '</div></fieldset>';
  }).join('');
  $('opts').innerHTML = OPTS.map(function (o) {
    return '<label class="opt"><input type="checkbox" id="o_' + o + '"' + (P2P.DEFAULTS[o] ? ' checked' : '') + '><span data-i18n="' + o + '"></span></label>';
  }).join('');

  function readProfile() {
    var p = {};
    form.querySelectorAll('input[data-key]').forEach(function (i) { if (i.value.trim()) p[i.dataset.key] = i.value.trim(); });
    return p;
  }
  function fillProfile(p) {
    form.querySelectorAll('input[data-key]').forEach(function (i) { i.value = p[i.dataset.key] || ''; });
  }
  function readOpts() {
    var o = {};
    OPTS.forEach(function (k) { o[k] = $('o_' + k).checked; });
    o.minLen = Math.max(1, Math.min(64, parseInt($('minLen').value, 10) || 1));
    o.maxLen = Math.max(o.minLen, Math.min(64, parseInt($('maxLen').value, 10) || 64));
    return o;
  }

  var last = { words: [], truncated: false };
  function run() {
    var p = readProfile();
    if (!Object.keys(p).length) { last = { words: [], truncated: false }; render(); return; }
    last = P2P.generate(p, readOpts());
    render();
  }
  function render() {
    var n = last.words.length;
    $('count').textContent = n.toLocaleString(lang === 'es' ? 'es-ES' : 'en-GB');
    $('output').value = n ? last.words.slice(0, PREVIEW).join('\n') : '';
    $('output').placeholder = t('empty');
    $('truncNote').hidden = !last.truncated;
    $('truncNote').textContent = t('trunc', { n: P2P.DEFAULTS.limit.toLocaleString(lang === 'es' ? 'es-ES' : 'en-GB') });
    $('previewNote').hidden = n <= PREVIEW;
    $('previewNote').textContent = t('preview', { p: PREVIEW.toLocaleString(), n: n.toLocaleString() });
    $('downloadBtn').disabled = $('copyBtn').disabled = !n;
  }
  var timer = null;
  function schedule() { clearTimeout(timer); timer = setTimeout(run, 200); }
  form.addEventListener('input', schedule);
  $('opts').addEventListener('change', run);
  $('minLen').addEventListener('input', schedule);
  $('maxLen').addEventListener('input', schedule);

  // Botones
  $('exampleBtn').addEventListener('click', function () {
    var p = {};
    GROUPS.forEach(function (g) { g.fields.forEach(function (f) { p[f[0]] = f[1]; }); });
    fillProfile(p); hideNote(); run();
  });
  $('clearBtn').addEventListener('click', function () { fillProfile({}); hideNote(); run(); });
  $('templateBtn').addEventListener('click', function () {
    var p = {};
    GROUPS.forEach(function (g) { g.fields.forEach(function (f) { p[f[0]] = /siblings|children|otherDates|keywords/.test(f[0]) ? f[1].split(/,\s*/) : f[1]; }); });
    save(JSON.stringify(p, null, 2), 'perfil_plantilla.json', 'application/json');
  });
  $('fileInput').addEventListener('change', function (e) {
    var file = e.target.files[0]; if (!file) return;
    var r = new FileReader();
    r.onload = function () {
      try {
        var res = P2P.importText(file.name, String(r.result));
        fillProfile(res.profile);
        showNote(t('importOk', { f: file.name }) + (res.count > 1 ? ' ' + t('importMany', { n: res.count }) : ''), false);
        run();
      } catch (err) { showNote(t('importErr', { f: file.name }), true); }
      e.target.value = '';
    };
    r.readAsText(file);
  });
  function showNote(msg, bad) { var n = $('importNote'); n.textContent = msg; n.hidden = false; n.classList.toggle('bad', !!bad); }
  function hideNote() { $('importNote').hidden = true; }

  function save(text, name, type) {
    var url = URL.createObjectURL(new Blob([text], { type: type }));
    var a = document.createElement('a'); a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  $('downloadBtn').addEventListener('click', function () {
    if (last.words.length) save(last.words.join('\n') + '\n', 'diccionario_profile2pass.txt', 'text/plain;charset=utf-8');
  });
  $('copyBtn').addEventListener('click', function () {
    if (!last.words.length || !navigator.clipboard) return;
    navigator.clipboard.writeText(last.words.join('\n')).then(function () {
      var b = $('copyBtn'); b.textContent = t('copied'); setTimeout(function () { b.textContent = t('copy'); }, 1500);
    });
  });

  // Idioma y tema
  function applyI18n() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(function (el) { el.textContent = t(el.getAttribute('data-i18n')); });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) { el.innerHTML = t(el.getAttribute('data-i18n-html')); });
    $('langToggle').textContent = lang === 'es' ? 'EN' : 'ES'; $('langToggle').title = t('langTitle');
    $('themeToggle').title = t('themeTitle');
    render();
  }
  function syncTheme() { $('themeToggle').textContent = document.documentElement.getAttribute('data-theme') === 'dark' ? '☀' : '☾'; }
  $('langToggle').addEventListener('click', function () { lang = lang === 'es' ? 'en' : 'es'; store('p2p-lang', lang); applyI18n(); });
  $('themeToggle').addEventListener('click', function () {
    var n = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', n); store('p2p-theme', n); syncTheme();
  });

  syncTheme(); applyI18n();
})();

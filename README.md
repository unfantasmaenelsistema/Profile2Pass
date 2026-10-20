# Profile2Pass

**Generador de diccionarios de contraseñas a partir de un perfil (OSINT)**, de [Un Fantasma en el Sistema](https://www.unfantasmaenelsistema.com).

▶ **Abrir:** https://unfantasmaenelsistema.github.io/Profile2Pass/

Mucha gente crea sus contraseñas con datos de su vida: el nombre del hijo, la mascota, el equipo, una fecha. Profile2Pass convierte esa información en una lista de contraseñas candidatas (como la clásica [CUPP](https://github.com/Mebus/cupp)), ordenada de más a menos probable, lista para `hashcat`, `john` o `hydra`.

> ⚖️ **Uso responsable.** Está pensado para auditorías con autorización por escrito, competiciones CTF, formación y comprobar la fortaleza de tus propias contraseñas. Atacar cuentas o redes ajenas sin permiso es delito.

## Qué hace

Partiendo de los datos de un perfil (nombre, apellidos, apodo, pareja, familia, mascota, ciudad, equipo, fechas, DNI, teléfono, palabras clave…), genera variantes y combinaciones:

- **Mayúsculas:** `juan`, `Juan`, `JUAN`
- **Leet:** `juan` → `ju4n`, `Ju4n`
- **Números comunes:** `juan123`, `juan2233`
- **Fechas y años del perfil:** `juan1985`, `juan1503`, `juan150385`
- **Años recientes:** `juan2024`, `juan2025`
- **Símbolos:** `juan!`, `juan.1985`, `Juan1985!`
- **Combinaciones de palabras:** `juangarcia`, `JuanGarcia`, `juangarcia1985`

Cada opción se activa o desactiva, y se puede acotar por longitud (por ejemplo, mínimo 8 para WPA/WPA2). El resultado va **ordenado por probabilidad**: primero las palabras solas, luego con fechas del perfil, números, símbolos y combinaciones, para que una herramienta que se detiene al acertar encuentre antes la contraseña si está.

Las tildes y la ñ se normalizan (`García` → `garcia`, `Begoña` → `begona`), que es como la gente suele teclear sus contraseñas.

## Entrada

- **Formulario** con los campos del perfil.
- **Importar JSON** (un objeto o una lista de objetos) **o CSV** (con cabecera). Las claves que no reconoce se añaden como palabras clave.
- **Plantilla JSON** descargable para rellenar y volver a subir.

## Salida

- Contador y vista previa (las primeras 3.000 líneas); la **descarga `.txt` lleva el diccionario completo**.
- Botón de copiar al portapapeles.

## Uso del diccionario

```bash
hashcat -m 0 -a 0 hashes.txt diccionario_profile2pass.txt
john --wordlist=diccionario_profile2pass.txt hashes.txt
hydra -l usuario -P diccionario_profile2pass.txt ssh://10.0.0.5
```

## Privacidad

Todo se calcula en tu navegador. Los datos del perfil no se envían ni se guardan en ningún sitio; solo el idioma y el tema quedan en `localStorage`.

## Estructura

```
index.html   interfaz (formulario, opciones, resultado; ES/EN y tema claro/oscuro)
engine.js    motor: variantes, fechas, números propios, combinaciones, orden e importación (también se carga en Node)
app.js       interfaz: formulario, importación, descarga, idioma y tema
styles.css   estilos
icono.png    logo de la casa
```

Para probar en local: `python -m http.server` y abre `http://localhost:8000`.

## English

**Profile2Pass** turns the details of a person’s profile (names, nicknames, family, pet, team, dates, ID numbers, keywords…) into a wordlist of candidate passwords, ordered from most to least likely, ready for `hashcat`, `john` or `hydra` — like the classic CUPP tool, but in the browser. It builds case, leet, number, date, recent-year, symbol and word-combination variants, normalises accents, and lets you toggle each option and filter by length (e.g. 8+ for WPA/WPA2). Input from a form or by importing JSON/CSV; the download contains the full list. Everything runs in your browser; profile data is never sent or stored. **For authorised audits, CTFs and training only.** Bilingual (ES/EN), light/dark themes.

## Licencia / License

[MIT](LICENSE) © Un Fantasma en el Sistema.

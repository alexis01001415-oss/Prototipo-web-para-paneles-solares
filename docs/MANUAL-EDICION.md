# HELIO
## Manual de edición

Una guía práctica para editar textos, colores, tipografías e imágenes del prototipo desde Visual Studio Code.

**Proyecto:** HELIO / Energía solar en Ciudad de México y área metropolitana.

**Carpeta de trabajo:**

```text
C:\Users\alexi\Desktop\Web paneles solares
```

**Edición:** septiembre de 2026. Pensado para un diseñador UX que quiere controlar el contenido y los estilos sin tener que programar las interacciones.

### Tu flujo de trabajo

**ABRIR** la carpeta en Visual Studio Code. **EDITAR** el archivo adecuado. **GUARDAR** con Ctrl + S. **REVISAR** en el navegador y en el teléfono. **COMPILAR** sólo cuando quieras preparar una publicación.

> Los archivos originales están en la raíz, en src y en public. La carpeta dist es una salida generada: cada compilación la vuelve a crear.

### Qué encontrarás

02. Mapa de archivos · 03. Abrir y arrancar · 04. Textos del HTML · 05. Textos interactivos · 06. Colores y estilos · 07. Tipografía y espaciado · 08. Imágenes e iconos · 09. Responsive · 10. Celular y QR · 11. Guardar y publicar · 12. Cotizador e integraciones · 13. Resolver problemas · 14. Rutina y referencias.

<!-- PAGE -->
## 01 / Encuentra el archivo correcto

Todas estas rutas parten de **C:\Users\alexi\Desktop\Web paneles solares**. En VS Code, haz clic en una carpeta para desplegarla y luego en el archivo.

| Quiero cambiar... | Abre... |
| --- | --- |
| H1, párrafo y botones del hero | index.html |
| Introducción, proceso, inspiración, preguntas o footer | index.html |
| Copy del recorrido, capítulos y soluciones | src/content.ts |
| Paleta, fuentes e interlineado global | src/theme.css |
| Estilo de los componentes renovados | src/experience.css |
| Estilos base y otros componentes | src/styles.css |
| Aspecto del cotizador | src/estimator.css |
| Textos y diseño del PDF de cotización | src/estimator.ts |
| Imágenes finales | public/images/ |
| Título y descripción para buscadores | index.html |
| Dominio y claves públicas de integración | .env.local |

### Archivos de uso avanzado

**src/main.ts** conecta menús, animaciones, capítulos y formularios. **src/house-scene.ts** crea la casa 3D. **src/technology-scene.ts** crea los modelos de tecnología. **src/quote-model.ts** contiene los supuestos y las fórmulas del cotizador. **vite.config.ts** configura compilación y SEO.

> Para editar contenido empieza por index.html y src/content.ts. Para cambiar el sistema visual empieza por src/theme.css. No necesitas modificar la lógica 3D para cambiar un título.

**node_modules/** contiene dependencias instaladas. **dist/** contiene la versión lista para hosting. No son los archivos que debes editar.

<!-- PAGE -->
## 02 / Abre y arranca el proyecto

### Abre la carpeta completa

1. Abre **Visual Studio Code**.
2. Elige **Archivo > Abrir carpeta**. Atajo: pulsa **Ctrl + K**, suelta y pulsa **Ctrl + O**.
3. Selecciona **C:\Users\alexi\Desktop\Web paneles solares** y acepta.
4. A la izquierda verás el Explorador. Si está oculto, usa **Ctrl + Shift + E**.
5. Para abrir un archivo rápido, usa **Ctrl + P**, escribe por ejemplo `src/theme.css` y pulsa Enter.

### Enciende la vista de desarrollo

1. Abre **Terminal > Nueva terminal** desde el menú de VS Code.
2. Comprueba que la terminal esté situada en la carpeta del proyecto. Si no lo está, escribe:

```powershell
cd "C:\Users\alexi\Desktop\Web paneles solares"
```

3. Ejecuta el comando siguiente y deja la terminal abierta:

```powershell
npm run dev
```

4. Abre la dirección que indique la terminal, normalmente **http://127.0.0.1:5173/**. Si ese puerto está ocupado, usa exactamente el enlace que aparezca allí.

**La primera vez en otra computadora:** instala Node.js compatible con el README; después ejecuta `npm install` una vez en esta carpeta. Las siguientes sesiones sólo requieren `npm run dev`.

> No abras index.html con doble clic ni uses Live Server para este proyecto. Vite es el servidor que entiende sus módulos y actualiza los cambios al guardar.

Para detener el servidor, vuelve a su terminal y pulsa **Ctrl + C**. Para volver a verlo otro día, repite `npm run dev`.

<!-- PAGE -->
## 03 / Cambia el texto del hero

Abre **index.html**. Pulsa **Ctrl + F** y busca `hero-content` o una frase que aparezca en la pantalla. El texto visible está entre etiquetas HTML; las etiquetas organizan el contenido.

### Un ejemplo pequeño

**Antes:**

```html
<h1>Tu casa tiene un nuevo futuro.</h1>
<p>Convierte tu techo en energía.</p>
```

**Después:**

```html
<h1>Paneles solares para tu casa en CDMX.</h1>
<p>Aprovecha el sol y transforma la manera
   en que consumes energía en tu hogar.</p>
```

El ejemplo muestra el patrón; conserva los `class`, `id`, `span` y otros atributos que encuentres en el bloque real. Si una palabra está dentro de `<span>...</span>`, esa parte puede tener un color o estilo propio. `<br>` fuerza un salto de línea; úsalo sólo si también funciona en móvil.

### Botón: texto y destino son cosas distintas

```html
<a class="button button-lime" href="#cotizador">
  Calcular mi ahorro
</a>
```

**Calcular mi ahorro** es la etiqueta visible. **href="#cotizador"** indica a qué sección se desplaza. El destino existe porque otra etiqueta tiene `id="cotizador"`. Para dirigirlo al contacto, usa `href="#contacto"`. Conserva el icono que tenga el botón real.

Guarda con **Ctrl + S** y revisa la página. Para cambiar otras secciones, busca su frase visible; para buscar en todo el proyecto usa **Ctrl + Shift + F**.

> En HTML escribe `&amp;` si necesitas mostrar el símbolo & dentro de un texto. No borres comillas, signos < > ni etiquetas de cierre al seleccionar una frase.

<!-- PAGE -->
## 04 / Edita el copy interactivo

Algunos textos cambian al hacer scroll o elegir una pestaña. Su fuente editable es **src/content.ts**. Si editas sólo un texto inicial en HTML, la interacción puede volver a sustituirlo por el contenido de este archivo.

### Recorrido de la casa

Busca `tourSteps`. Cada objeto representa una parada. Conserva su orden y modifica sólo el contenido entre comillas:

```typescript
{
  title: 'Tu techo puede cambiar tu recibo.',
  copy: 'Aprovecha la luz del día para cubrir '
      + 'parte del consumo de tu hogar.',
  note: 'GENERACIÓN SOLAR EN CASA'
},
```

**title** es el título, **copy** es el párrafo y **note** es la etiqueta breve. El ejemplo muestra una edición posible; no añadas una parada nueva sin ajustar también las cámaras y los controles.

### Tecnología y soluciones

Busca `techChapters` para Captura, Protección e Inteligencia: `label` es el nombre del capítulo, `title` el título, `copy` el párrafo y `detail` la etiqueta técnica. Busca `solutions` para casa, negocio y movilidad. Cambia el valor de los campos de texto existentes; conserva las claves, la puntuación y la estructura del archivo.

En las soluciones, `points` es una lista: cada elemento entre comillas es un beneficio. `tag` es la etiqueta, `image` la ruta de imagen y `alt` su descripción. Las rutas se escriben como `/images/archivo.webp`; los textos alternativos describen la imagen para personas que no pueden verla.

### Pequeñas reglas que evitan errores

- No cambies nombres como `title`, `copy`, `note`, `home` o `business`: el programa los utiliza.
- Conserva las comas entre campos y objetos. No elimines llaves `{ }` ni corchetes `[ ]`.
- Si una frase contiene un apóstrofo, puedes envolverla con comillas dobles: `title: "Un diseño con tu sello"`.
- Revisa todas las paradas y pestañas después de editar, no sólo la primera.

<!-- PAGE -->
## 05 / Controla la paleta y los estilos

Abre **src/theme.css**. Los nombres que empiezan con `--` son variables CSS o tokens: cambias un valor y los elementos que lo usan se actualizan juntos.

```css
:root {
  --forest: #132a13;
  --ink: #132a13;
  --green: #31572c;
  --olive: #4f772d;
  --sage: #90a955;
  --lime: #ecf39e;
  --paper: #f5f6ec;
}
```

### Cambia un color

Por ejemplo, sustituye el valor de `--lime`, conserva el punto y coma y guarda. Revisa botones, acentos y fondos donde se aplique. Los materiales 3D y el PDF de cotización tienen sus propias definiciones de color: no todos dependen de CSS.

### Cambia un componente concreto

1. En el navegador, haz clic derecho sobre el elemento y elige **Inspeccionar**.
2. En **Elements / Elementos**, identifica su atributo `class`.
3. En **Styles / Estilos**, mira la regla y el archivo que la aplica.
4. Abre ese archivo en VS Code y busca la clase con Ctrl + F.

```css
.button {
  border-radius: 12px;
}
```

El punto selecciona una **clase**. `#contacto` selecciona un **id**. La regla anterior redondea todos los elementos con clase `button`. Úsala en el archivo de estilos correspondiente cuando quieras ese cambio global.

> Los cambios que hagas directamente en el inspector son una prueba temporal. Para conservarlos, copia el valor a tu archivo CSS y guarda. Una regla tachada en el inspector está siendo reemplazada por otra regla.

<!-- PAGE -->
## 06 / Tipografía, interlineado y aire

La pareja seleccionada es **Voltaire para títulos** e **Inter para párrafos e interfaz**. Las fuentes se sirven desde el proyecto. La base de texto es de 16 px; los títulos usan tamaños adaptables.

En **src/theme.css**, busca estos tokens:

```css
:root {
  --font-heading: 'Voltaire', sans-serif;
  --font-body: 'Inter Variable', sans-serif;
  --heading-leading: 1.2;
  --body-leading: 1.4;
  --heading-tracking: 1.5px;
  --body-tracking: 1.5px;
}
```

**line-height: 1.2** equivale al 120 % del tamaño de fuente. Un título de 64 px tiene líneas de 76.8 px. **line-height: 1.4** equivale al 140 %; un párrafo de 16 px tiene líneas de 22.4 px. Son valores sin unidad y escalan con el texto.

**letter-spacing: 1.5px** separa caracteres. No controla la separación entre renglones ni entre bloques. **margin** crea espacio exterior; **padding** crea espacio dentro del elemento.

### Ajusta un título y su separación

```css
.hero h1 {
  font-size: clamp(38px, 4.8vw, 64px);
  margin-bottom: 24px;
}
```

`clamp()` establece un mínimo, un valor fluido y un máximo. `vw` depende del ancho de la ventana. El ejemplo es una variante: edita la regla existente y revisa cómo se parten tus frases antes de conservarla.

Para usar una fuente nueva no basta con escribir su nombre: primero debe estar instalada/importada en el proyecto. Al recibir otra pareja tipográfica, conviene actualizar la carga y los tokens conjuntamente.

<!-- PAGE -->
## 07 / Sustituye imágenes e iconos

### Imágenes: carpeta real y ruta pública

1. Exporta la imagen optimizada, preferiblemente WebP. Ponle un nombre breve sin acentos ni espacios, por ejemplo `casa-solar.webp`.
2. Colócala en **C:\Users\alexi\Desktop\Web paneles solares\public\images**.
3. Busca la imagen anterior en `index.html` o en `src/content.ts`.
4. Sustituye la ruta y actualiza su descripción si corresponde.

```html
<img src="/images/casa-solar.webp"
     alt="Casa con paneles solares en el techo"
     width="1600" height="1000">
```

En la URL se omite **public**. Las dimensiones `width` y `height` deben reflejar la proporción real: ayudan a reservar el espacio antes de que cargue. Si encuentras `<picture>` o `srcset`, revisa también sus versiones para móvil.

### Las capas del hero

El efecto de profundidad depende de capas distintas. Conserva sus proporciones, transparencia cuando exista y función visual. Reemplazar una capa por una fotografía opaca puede ocultar las otras. Para rehacer la composición completa, revisa juntas las imágenes, sus posiciones en CSS y el movimiento en `src/main.ts`.

### Material Symbols

Los iconos pertenecen a Google Material Symbols. La palabra interna es el nombre del símbolo, no un texto para traducir. Un patrón habitual es:

```html
<span class="material-symbol"
      aria-hidden="true">solar_power</span>
```

Conserva la clase exacta utilizada en el proyecto. Cambiar el nombre requiere que ese símbolo esté incluido en los recursos locales; prueba el resultado. En botones que sólo tengan icono, conserva el `aria-label`, que da un nombre accesible al control.

<!-- PAGE -->
## 08 / Ajusta móvil y tablet

El diseño responsive adapta composición, tamaños y espacios al ancho disponible. Después de cambiar copy o tipografía, comprueba **320, 390, 768, 1024 y 1440 px** de ancho, además de tu teléfono real.

### Previsualiza un tamaño

1. En Chrome o Edge abre las herramientas de desarrollo con **F12**.
2. Pulsa el icono de teléfono/tablet o **Ctrl + Shift + M** mientras las herramientas tienen el foco.
3. Elige modo **Responsive** e introduce el ancho.
4. Recorre toda la página; prueba botones, menú, escenas, cotizador y footer.

### Cambios que sólo afectan a pantallas pequeñas

Busca las reglas `@media` existentes en `src/theme.css` y `src/experience.css`. Adapta esas reglas; el siguiente bloque es una variante de ejemplo:

```css
@media (max-width: 767px) {
  :root {
    --heading-tracking: 0.6px;
    --body-tracking: 0.2px;
  }
  .hero-content {
    padding-top: 140px;
  }
}
```

La condición se cumple cuando el ancho de la ventana es de 767 px o menos. Las reglas generales siguen activas; este bloque sólo reemplaza las propiedades indicadas.

### Qué observar

- El texto no debe quedar cortado ni salir horizontalmente de la pantalla.
- Los botones deben conservar etiquetas legibles y espacio para tocarlos.
- La casa y los modelos deben acompañar al copy sin taparlo.
- Los títulos largos pueden necesitar una menor escala o menos saltos `<br>`.
- Prueba orientación vertical y horizontal, y revisa el footer con el teclado abierto.

<!-- PAGE -->
## 09 / Ábrelo en tu celular

El enlace de red local funciona mientras tu computadora esté encendida, el servidor esté abierto y el celular tenga acceso a la misma red. La PC puede estar por Ethernet y el teléfono por Wi-Fi del mismo router.

### Arranca el servidor para dispositivos

Desde la terminal del proyecto ejecuta:

```powershell
npm run dev:mobile
```

La dirección preparada durante esta iteración es:

**http://192.168.100.84:5174/**

Abre ese enlace en el teléfono o escanea el QR. La IP es local: no sirve fuera de esa red ni equivale a una publicación en internet.

### Consulta o regenera el QR

Con el servidor activo, abre en la computadora **http://localhost:5174/acceso-movil.html**. También puedes abrir la imagen **output/helio-qr.png** y escanearla con la cámara del celular.

Si cambias de Wi-Fi o reinicias el router, la IP puede cambiar. Abre **otra terminal**, mantén el servidor encendido y ejecuta:

```powershell
npm run qr
```

Recarga la página del QR y usa la dirección recién generada. No hace falta configurar reenvío de puertos en el router para esta prueba local.

### Si el celular no conecta

Revisa que no use datos móviles o una red de invitados aislada. Confirma que el servidor no se cerró. Si Windows muestra una solicitud de firewall para Node, permite la conexión sólo en tu red privada de confianza. Si hay una VPN, verifica si está impidiendo el acceso a dispositivos locales.

<!-- PAGE -->
## 10 / Guarda, revisa y publica

### Mientras diseñas

**Ctrl + S** guarda el archivo. Con `npm run dev` o `npm run dev:mobile` activo, Vite actualiza normalmente la página al instante. Si no ves el cambio, confirma que editaste la carpeta correcta y abre la dirección del servidor actual.

### Prepara una versión de producción

Cuando estés satisfecho, usa otra terminal en esta misma carpeta:

```powershell
npm run build
npm run preview
```

Ejecuta cada línea por separado. `build` valida TypeScript y genera **dist/**. `preview` sirve esa compilación normalmente en **http://127.0.0.1:4173/**. Si editas después, vuelve a ejecutar `npm run build`: la vista de producción no recompila al guardar.

### Actualiza Hostinger

1. Comprueba el dominio en `.env.local` y guarda.
2. Ejecuta `npm run build` y revisa que termine sin errores.
3. Abre el administrador de archivos del sitio en tu hosting.
4. Sube **el contenido de dist/** a la carpeta web del sitio, normalmente `public_html/`.
5. Incluye `index.html`, `assets/`, `images/`, favicon y `.htaccess`, además de los demás archivos generados. Activa la visualización de archivos ocultos si hace falta.
6. Abre la URL HTTPS y prueba menú, imágenes, cotizador, PDF y formulario.

No subas la carpeta del proyecto completa ni `node_modules`. Tampoco edites `dist/index.html` para mantener cambios: la siguiente compilación lo reemplazará.

> El ZIP de entrega es una fotografía de una versión concreta. Después de editar, la carpeta dist recién compilada es la referencia actualizada. Si necesitas un ZIP nuevo, comprime otra vez su contenido.

<!-- PAGE -->
## 11 / Cotizador, PDF e integraciones

### Cotizador

**src/estimator.css** controla su apariencia. **src/estimator.ts** contiene etiquetas de interfaz y el documento descargable. Busca `createQuotePdf` para encontrar la creación del PDF; sus colores y textos son independientes de `src/theme.css`.

**src/quote-model.ts** contiene precios, generación, superficie y cálculos. No ajustes una cifra únicamente para que la cotización parezca más atractiva: cambia un supuesto sólo cuando tengas una referencia válida para la oferta real y revisa sus efectos. Las notas están en **docs/ESTIMATOR-NOTES.md**.

Si modificas el modelo de cálculo, ejecuta `npm test`, prueba escenarios distintos y descarga un PDF nuevo. Para una edición sólo de copy, basta con revisar pantalla y PDF correspondientes.

### Dominio, Google y contacto

Copia **.env.example** con el nombre **.env.local** en la raíz del proyecto. No borres el archivo de ejemplo. Estas son las opciones disponibles:

| Variable | Para qué sirve |
| --- | --- |
| VITE_SITE_URL | URL final del dominio, con https:// |
| VITE_ALLOW_INDEXING | false para la demostración; true si debe indexarse |
| VITE_GA_ID | Identificador público de la propiedad GA4 |
| VITE_GOOGLE_SITE_VERIFICATION | Valor de verificación de Search Console |
| VITE_CONTACT_ENDPOINT | Ruta del servicio real de contacto |

Tras cambiar `.env.local`, reinicia el servidor local. Para hosting, recompila y vuelve a subir `dist/`. Las variables `VITE_*` quedan visibles en el navegador; no son un lugar para contraseñas o credenciales privadas.

El formulario actual es demostrativo. Una URL en `VITE_CONTACT_ENDPOINT` necesita un servicio que realmente reciba los datos. Analytics requiere su propiedad y consentimiento; Search Console requiere verificar la propiedad desde tu cuenta. El README explica estas conexiones.

<!-- PAGE -->
## 12 / Si algo no se ve como esperabas

### Guardé, pero no veo el cambio

Confirma **Ctrl + S**, carpeta y archivo. Revisa la URL: **5173/5174** muestra desarrollo; **4173** muestra la última compilación. Si estás en producción, ejecuta `npm run build` de nuevo. En un sitio publicado puedes probar **Ctrl + Shift + R** para recargar sin la caché habitual.

### Cambié un texto y reaparece el anterior

Puede ser contenido dinámico. Busca la frase en **src/content.ts**. Para encontrar todas sus apariciones, usa **Ctrl + Shift + F**. Los textos de diálogo o del cotizador pueden estar en **src/main.ts** o **src/estimator.ts**.

### Mi regla CSS no tiene efecto

Inspecciona el elemento. Revisa clase, archivo y si otra regla la reemplaza. Comprueba si estás dentro o fuera del `@media` apropiado. Cambia la regla responsable antes de añadir más reglas al final; evita usar `!important` como primera solución.

### Una imagen no carga

Confirma nombre, extensión y mayúsculas. La ruta debe empezar por **/images/**, sin **public**. Si cambiaste un `<picture>`, revisa todas sus fuentes. Abre la ruta directamente en el navegador para comprobar si devuelve la imagen.

### Aparece una pantalla de error de Vite

Lee el archivo y la línea que indica. Suele faltar una coma, comilla, llave o etiqueta. Si empezó justo después de tu edición, pulsa **Ctrl + Z**, guarda y comprueba. Recupera el último bloque que funcionaba; luego cambia una sola cosa cada vez.

### La terminal no reconoce npm o lo bloquea

Comprueba Node.js e instala la versión indicada en el README si falta. Cierra y abre VS Code después de instalarlo. Si PowerShell bloquea `npm.ps1`, prueba **npm.cmd run dev**. Esto evita cambiar la política de ejecución del sistema para ejecutar el comando.

### El teléfono sigue mostrando una versión antigua

Actualiza su navegador, revisa la IP/puerto y regenera el QR si cambió la red. El QR abre un enlace; no incluye una copia del sitio.

<!-- PAGE -->
## 13 / Una rutina sencilla para iterar

### Antes de una sesión

Haz una copia fechada de los archivos que vas a tocar fuera del proyecto, por ejemplo en una carpeta **HELIO-respaldo-2026-09-18**. Para cambios amplios, copia el proyecto sin `node_modules` ni `dist`; esas carpetas se pueden regenerar. Conserva los archivos ocultos de configuración que necesites para recuperar tu entorno.

### Durante la edición

1. Escribe tu objetivo: “cambiar título y color del botón principal”.
2. Abre sólo los archivos necesarios. Cambia una cosa y guarda.
3. Revisa desktop y móvil antes de seguir con la siguiente.
4. Anota qué cambiaste: archivo, selector o frase, valor anterior y valor nuevo.
5. Compártenos esa nota cuando quieras seguir iterando juntos.

### Revisión antes de compartir

Lee el copy completo. Prueba el menú, las cuatro paradas de la casa, los tres capítulos de tecnología, las tres soluciones, los desplegables y el formulario. Cambia los valores del cotizador y descarga el PDF. Recorre la página con el teclado y comprueba que el foco sea visible. Revisa también tu teléfono real.

### Referencias oficiales para aprender

- [Visual Studio Code: interfaz y Explorador](https://code.visualstudio.com/docs/editing/getting-started/userinterface)
- [Visual Studio Code: atajos de Windows](https://code.visualstudio.com/shortcuts/keyboard-shortcuts-windows.pdf)
- [MDN: line-height](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/line-height)
- [MDN: letter-spacing](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/letter-spacing)
- [MDN: media queries](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Media_queries/Using)
- [Google Material Symbols: biblioteca](https://fonts.google.com/icons)

**Tu primera práctica:** cambia una frase de `index.html`, guarda y mírala en el teléfono. Después cambia un token en `src/theme.css`, revisa su efecto y deshazlo con Ctrl + Z si quieres volver al diseño anterior.

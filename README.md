# HELIO v2 — El futuro tiene sol

Prototipo de venta e instalación de energía solar para CDMX y área metropolitana. Marca ficticia, imágenes originales generadas con IA y modelo 3D procedural. No representa proyectos ejecutados, garantías o precios reales de una empresa.

## Abrir en localhost

Requiere Node.js 22.12 o posterior.

```powershell
npm install
npm run dev
```

Abre [la vista de desarrollo](http://127.0.0.1:5173/). Para volver a abrirlo otro día, ejecuta `npm run dev` en esta carpeta. Si el puerto está ocupado, usa la dirección que muestre la terminal. No abras `index.html` con doble clic: los módulos necesitan un servidor.

```powershell
npm test
npm run build
npm run preview
```

La [vista de producción](http://127.0.0.1:4173/) utiliza el último build. `dist/` contiene el sitio listo para subir. No necesita Node ni una base de datos en el hosting. Guardar cambios actualiza la vista de desarrollo; para actualizar la vista de producción hay que volver a ejecutar `npm run build`.

## Abrir en el celular y generar el QR

La computadora y el teléfono deben tener acceso a la misma red local. La PC puede estar por Ethernet y el celular por Wi-Fi del mismo router.

```powershell
npm run dev:mobile
```

Deja esa terminal abierta. El servidor móvil utiliza el puerto **5174**. En otra terminal de esta misma carpeta, ejecuta:

```powershell
npm run qr
```

El comando detecta la IP local y crea:

- `output/helio-qr.png`: imagen que puedes escanear con la cámara del celular.
- `output/acceso-movil.txt`: enlace y recordatorio de conexión.
- `acceso-movil.html`: [página local con el QR](http://localhost:5174/acceso-movil.html), disponible mientras está activo el servidor de desarrollo.

Durante esta iteración, el enlace del teléfono es [http://192.168.100.84:5174/](http://192.168.100.84:5174/). La IP puede cambiar; ejecuta `npm run qr` otra vez cuando cambies de red. Si se detecta otra interfaz, puedes indicar la IP de la PC explícitamente: `npm run qr -- 192.168.100.84`.

El enlace funciona dentro de esa red, con la PC encendida y el servidor abierto. No es una publicación pública ni necesita abrir puertos del router. Si Windows solicita acceso de Node a la red, habilítalo para la red privada de confianza. Las redes de invitados o algunas VPN pueden impedir que el teléfono vea la PC.

## Publicación automática en GitHub Pages

El repositorio incluye un flujo en `.github/workflows/ci.yml`. Cada `push` a `main` ejecuta las pruebas, compila el proyecto y publica `dist/` en GitHub Pages. La dirección configurada es:

**https://alexis01001415-oss.github.io/Prototipo-web-para-paneles-solares/**

`VITE_BASE_PATH` conserva las rutas de imágenes, fuentes y módulos cuando el sitio vive dentro de la carpeta del repositorio. GitHub Pages sólo está disponible en este plan cuando el repositorio es público; hacer público el repositorio también permite ver y descargar su código y recursos.

## Qué contiene

- Hero con capas fotográficas independientes de cielo, casa y vegetación; versiones de imágenes para móvil y parallax a distintas velocidades. Incluye copy local de CDMX, dos llamadas a la acción y un header simplificado.
- Ocho secciones: visión, recorrido 3D, tecnología, soluciones, proceso, inspiración, cotizador y preguntas frecuentes.
- Three.js: casa, techo fotovoltaico, medidor/inversor, cochera, automóvil y cargador. Cuatro cámaras, recorrido vinculado al scroll y botones accesibles. En escritorio también admite arrastrar la vista; el gesto vertical del móvil se conserva para navegar.
- Tecnología con tres modelos 3D: módulo fotovoltaico en Captura, capas separadas del módulo en Protección e inversor en Inteligencia. Cada capítulo tiene un indicador circular de progreso y se puede seleccionar con su control.
- Soluciones para hogar, negocio y movilidad con imagen propia, selección visible y estados de interacción.
- Voltaire para títulos, Inter para cuerpo e interfaz y Google Material Symbols para iconos, servidos localmente. Los botones agrupan los iconos dentro de un recuadro.
- GSAP ScrollTrigger + Lenis: entrada del hero, revelados, parallax, escenas sticky y capítulos de producto. El recorrido se renderiza en tiempo real, sin descargar una película ni cientos de fotogramas.
- Cotizador por kWh o importe, periodos mensual/bimestral, techo disponible, supuestos ajustables y PDF vectorial de dos páginas.
- Footer con efecto de revelado cuando cabe en una pantalla de escritorio; disposición normal en móvil y pantallas de poca altura.
- Formulario validado, preguntas desplegables, pestañas por tipo de solución y diálogos de privacidad.
- Respeto a `prefers-reduced-motion`, navegación por teclado y alternativa visual cuando WebGL no está disponible.

## Cotizaciones y contacto

El cálculo es una estimación demostrativa, no una tarifa oficial ni una propuesta vinculante. Producción, costo por kWh y precios son supuestos explícitos. El modelo limita los paneles por superficie y no asigna ahorro extra a excedentes sobre el consumo anual. Consulta `docs/ESTIMATOR-NOTES.md` y los supuestos de `src/quote-model.ts`.

El formulario está en **modo demostración**: descarga un archivo de solicitud local y nunca anuncia un envío inexistente. Para recibir solicitudes reales, implementa un endpoint del mismo dominio (por ejemplo `/api/contacto`) y configura `VITE_CONTACT_ENDPOINT`. Debe aceptar JSON `{name,email,message,consent}`, devolver un código 2xx sólo al recibir correctamente la solicitud, validar en servidor, limitar frecuencia y proteger cualquier credencial. Es necesario reemplazar el aviso de privacidad con el de la empresa real. El sitio no incluye un servicio de correo contratado.

## Hostinger y dominio provisional

1. Usa un alojamiento que acepte archivos PHP/HTML estáticos y su dominio provisional, o conecta tu dominio. Este proyecto no requiere el editor visual de Hostinger.
2. Copia `.env.example` a `.env.local`. Establece `VITE_SITE_URL=https://tu-dominio-real` antes de compilar. No pongas secretos en variables `VITE_*`; son públicas.
3. Ejecuta `npm run build`.
4. Sube **el contenido** de `dist/` a `public_html/` del sitio: `index.html`, `assets/`, `images/`, favicon y `.htaccess`, entre otros. No subas el repositorio, `.env.local` o `node_modules`.
5. Activa el certificado SSL del dominio y abre la dirección HTTPS. Comprueba las imágenes, el recorrido, la cotización PDF y los encabezados HTTP.

Guía oficial: [Hostinger: crear un sitio y subir archivos propios](https://support.hostinger.com/en/articles/2458059-how-to-create-a-website), [ubicación de public_html](https://support.hostinger.com/en/articles/4622321-basic-actions-in-cpanel-file-manager).

No se ha publicado en una cuenta de hosting: falta seleccionar la cuenta y el dominio. El paquete local no crea una suscripción ni un dominio por sí mismo.

El paquete de esta iteración es **`output/helio-hostinger-v2.zip`**. Contiene una copia del sitio compilado; después de editar hay que recompilar y preparar un ZIP nuevo, o subir directamente el contenido actualizado de `dist/`.

## SEO, Search Console y Analytics

El prototipo incluye HTML semántico, idioma, título, descripción, Open Graph, favicon y schema WebSite. Está marcado `noindex` porque la marca y la oferta son ficticias. Eso es deliberado; no impide compartir el enlace.

- `VITE_SITE_URL` genera canonical, URL de Open Graph y sitemap con el dominio real.
- `VITE_ALLOW_INDEXING=true` habilita indexación y cambia `robots.txt`. Actívalo sólo al publicar contenido real que quieras indexar.
- `VITE_GOOGLE_SITE_VERIFICATION` añade la etiqueta de verificación de Search Console. Debes crear/verificar la propiedad y enviar el sitemap desde tu cuenta.
- `VITE_GA_ID=G-...` conecta una propiedad GA4. Está vacío por defecto. Aun configurado, sólo carga Google Analytics con consentimiento desde Cookies en el footer. Para una campaña real puede añadirse un aviso inicial de consentimiento con el texto legal del responsable.
- Después de modificar estas variables, recompila y vuelve a subir `dist/`.
- El schema de empresa local debe añadirse con nombre, dirección, teléfono, cobertura y datos reales. No se inventaron reseñas ni certificaciones. [Documentación oficial de Google](https://developers.google.com/search/docs/appearance/structured-data/local-business).

## Diseño y edición

La carpeta del proyecto es **`C:\Users\alexi\Desktop\Web paneles solares`**. Ábrela completa en Visual Studio Code. La guía paso a paso para editar, guardar, revisar en el teléfono y publicar está en **`output/manual-helio.pdf`** (14 páginas); su versión de texto está en **`docs/MANUAL-EDICION.md`**.

Empieza por estos archivos:

- `index.html`: textos estáticos del hero, introducción, proceso, inspiración, preguntas frecuentes y footer; etiquetas de navegación y metadatos.
- `src/content.ts`: copy interactivo de las cuatro paradas (`tourSteps`), los tres capítulos (`techChapters`) y las tres soluciones (`solutions`), incluidas imágenes y textos alternativos de estas últimas.
- `src/theme.css`: tokens editables de paleta, fuentes, interlineado, separación de letras, espaciado y radios. Voltaire e Inter variable se sirven localmente; base de texto de 16 px, interlineado de 120 % para headings y 140 % para párrafos. La separación de letras parte de 1.5 px y se reduce en tablet y móvil.
- `src/experience.css`: composición y responsive de los componentes renovados, incluidos hero, iconos, recorrido, tecnología y soluciones.
- `src/styles.css`: estilos base y componentes generales de la página.
- `src/main.ts`: animación, controles, navegación, contacto y consentimiento.
- `src/house-scene.ts`: geometría, materiales, cámaras y renderizado del recorrido residencial.
- `src/technology-scene.ts`: modelos, transición de capítulos y renderizado de la sección Tecnología.
- `src/quote-model.ts`: cálculo puro y supuestos.
- `src/estimator.ts` / `src/estimator.css`: interfaz del cotizador y documento PDF.
- `public/images`: imágenes WebP finales. `docs/IMAGE-PROMPTS.md`: prompts exactos y herramienta utilizada.
- `public/fonts`: subconjunto local de Google Material Symbols.
- `vite.config.ts`: compilación, SEO por entorno y robots/sitemap.

La paleta principal es **`#132a13`**, **`#31572c`**, **`#4f772d`**, **`#90a955`** y **`#ecf39e`**, con fondo claro **`#f5f6ec`**. Los tokens se declaran al inicio de `src/theme.css`. Los materiales 3D y los colores del PDF se configuran en sus propios archivos.

Guarda con **Ctrl + S** para ver cambios mientras Vite esté activo. `npm run format` ordena el formato de HTML y los archivos principales de estilos y copy. No edites `dist/` o `node_modules/`: modifica las fuentes y vuelve a compilar cuando quieras publicar.

## Rendimiento y seguridad

Imágenes WebP con variantes móviles, dimensiones reservadas, fuentes e iconos locales, módulos 3D/cotizador diferidos y PDF bajo demanda. Los renderers limitan la resolución y suspenden el trabajo cuando sus escenas no están visibles. Las tres capas del hero suman aproximadamente **186 KiB en móvil** y **512 KiB en escritorio**; el resto de imágenes se carga según su uso. Las vistas 3D tienen alternativa visual si WebGL no está disponible.

`public/.htaccess` configura CSP, protección frente a iframes, `nosniff`, política de referer, permisos y caché para Apache/LiteSpeed. La CSP permite Google Analytics y los recursos locales; el contacto se limita al mismo dominio. En otro servidor debes trasladar esas cabeceras a su configuración. HTTPS y configuración del servidor se verifican tras publicar. No existe una garantía de invulnerabilidad.

`npm audit` no reportó vulnerabilidades conocidas en la revisión de entrega. Las pruebas automáticas cubren 438 combinaciones del cotizador, límites de superficie y ahorro, entradas inválidas y equivalencia de periodos. Se revisaron las interacciones en navegador; las puntuaciones públicas de PageSpeed requieren una URL publicada y no se han inventado.

## Referencias de dirección e implementación

- [Prometheus Fuels, Awwwards SOTD](https://www.awwwards.com/sites/prometheus-fuels): narrativa energética e interacción WebGL como referencia de ambición; el diseño y los recursos de HELIO son propios.
- [GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/).
- [Lenis, repositorio oficial](https://github.com/darkroomengineering/lenis).
- [W3C: movimiento reducido](https://www.w3.org/WAI/WCAG22/Techniques/css/C39).
- Referencias energéticas y límites del modelo en `docs/ESTIMATOR-NOTES.md`.

No se promete ni se atribuye un premio Awwwards al prototipo.

Referencias para esta iteración: [Google Material Symbols](https://developers.google.com/fonts/docs/material_symbols), [Carbon: botones y estados](https://carbondesignsystem.com/components/button/usage/). Los prompts nuevos están en docs/IMAGE-PROMPTS-V2.json y los recursos finales en public/images/.

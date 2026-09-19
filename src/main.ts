import './styles.css';
import './experience.css';
import './theme.css';
import { tourSteps, techChapters, solutions } from './content';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const immersiveLayouts = gsap.matchMedia();
const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
let lenis: Lenis | undefined;
if (!reducedMotion.matches) {
  lenis = new Lenis({ duration: 1.1, smoothWheel: true, syncTouch: false, anchors: { offset: 0 } });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(time => lenis?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}
reducedMotion.addEventListener('change', () => window.location.reload());

const menu = $<HTMLDialogElement>('#menu');
const menuButton = $('.menu-toggle');
menuButton.addEventListener('click', () => { menu.showModal(); lenis?.stop(); document.body.style.overflow = 'hidden'; });
const closeMenu = () => menu.close();
$('.close-menu').addEventListener('click', closeMenu);
menu.addEventListener('close', () => { lenis?.start(); document.body.style.overflow = ''; menuButton.focus({ preventScroll: true }); });
menu.querySelectorAll<HTMLAnchorElement>('nav a').forEach(link => link.addEventListener('click', () => { closeMenu(); }));

if (!reducedMotion.matches) {
  gsap.from('.hero-kicker, .hero h1, .hero-content p, .hero-content .button', { y: 22, autoAlpha: 0, duration: 1.1, stagger: .12, ease: 'power3.out', delay: .12 });
  const heroMotion = gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .65 } });
  heroMotion.to('.hero-layer--sky', { yPercent: 15, ease: 'none' }, 0)
    .to('.hero-layer--house', { yPercent: 6, ease: 'none' }, 0)
    .to('.hero-layer--plants', { yPercent: -10, ease: 'none' }, 0);
  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach(el => {
    gsap.from(el, { y: 24, opacity: 0, duration: .8, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 91%', once: true } });
  });
  gsap.fromTo('.project-image-wrap>img', { yPercent: -7 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.project-image-wrap', start: 'top bottom', end: 'bottom top', scrub: true } });
}

let currentStep = 0;
let scene: Awaited<ReturnType<typeof import('./house-scene').mountHouseScene>> | undefined;
let tourTrigger: ScrollTrigger | undefined;
const stepButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-step]')];
function setTourStep(index: number) {
  currentStep = Math.max(0, Math.min(3, index));
  const step = tourSteps[currentStep];
  $('#tour-number').textContent = `0${currentStep + 1} / 04`;
  $('#tour-step-title').textContent = step.title;
  $('#tour-step-copy').textContent = step.copy;
  $('#tour-step-note').textContent = step.note;
  stepButtons.forEach((button, i) => { button.classList.toggle('active', i === currentStep); button.setAttribute('aria-pressed', String(i === currentStep)); });
  scene?.setStep(currentStep);
}
setTourStep(0);
immersiveLayouts.add('(min-height: 541px)', () => {
  if (reducedMotion.matches) return;
  tourTrigger = ScrollTrigger.create({ trigger: '#recorrido', start: 'top top', end: 'bottom bottom', onUpdate: self => {
    const step = Math.min(3, Math.floor(self.progress * 4));
    if (step !== currentStep) setTourStep(step);
  } });
  return () => { tourTrigger = undefined; };
});
stepButtons.forEach((button, i) => button.addEventListener('click', () => {
  setTourStep(i);
  if (tourTrigger) {
    const position = tourTrigger.start + (tourTrigger.end - tourTrigger.start) * (i / 4 + .035);
    if (lenis) lenis.scrollTo(position, { immediate: true });
    else window.scrollTo({ top: position });
  }
}));
const sceneObserver = new IntersectionObserver(async entries => {
  if (!entries.some(entry => entry.isIntersecting)) return;
  sceneObserver.disconnect();
  const stage = $('#house-stage');
  try {
    const { mountHouseScene } = await import('./house-scene');
    scene = await mountHouseScene(stage, { onReady: () => { stage.classList.remove('is-fallback'); stage.classList.add('is-ready'); } });
    scene.setStep(currentStep);
    stage.classList.add('is-ready');
  } catch {
    stage.classList.add('is-fallback');
    $('.scene-loading').textContent = 'Vista de referencia · Explora las etapas con los botones';
  }
}, { rootMargin: '350px' });
sceneObserver.observe($('#recorrido'));
$('#house-stage').addEventListener('house-scene-error', () => {
  $('#house-stage').classList.remove('is-ready');
  $('#house-stage').classList.add('is-fallback');
  $('.scene-loading').textContent = 'Vista de referencia · Explora las etapas con los botones';
});

// Cada tercio del scroll controla un modelo y su círculo de progreso.
let techScene: Awaited<ReturnType<typeof import('./technology-scene').mountTechnologyScene>> | undefined;
let techIndex = -1;
let techProgress = 0;
let techTrigger: ScrollTrigger | undefined;
const techButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-chapter]')];
function setTechChapter(index: number, progress = 0) {
  const next = Math.max(0, Math.min(2, index));
  techProgress = Math.max(0, Math.min(1, progress));
  if (next !== techIndex) {
    techIndex = next;
    const chapter = techChapters[next];
    $('#tech-chapter').textContent = `0${next + 1} / ${chapter.label}`;
    $('#tech-caption-title').textContent = chapter.title;
    $('#tech-caption-copy').textContent = chapter.copy;
    $('#tech-detail').textContent = chapter.detail;
    $('#technology-stage').setAttribute('aria-label', `Modelo 3D: ${chapter.label.toLowerCase()}. ${chapter.title}`);
  }
  techButtons.forEach((button, i) => {
    const value = i < next ? 1 : i === next ? techProgress : 0;
    button.classList.toggle('is-active', i === next);
    button.setAttribute('aria-pressed', String(i === next));
    const circle = button.querySelector<SVGCircleElement>('.ring-fill')!;
    circle.style.strokeDashoffset = String(100 - value * 100);
  });
  techScene?.setChapter(next, techProgress);
}
setTechChapter(0, reducedMotion.matches ? 1 : 0);
immersiveLayouts.add('(min-height: 541px)', () => {
  if (reducedMotion.matches) return;
  techTrigger = ScrollTrigger.create({
    trigger: '#tecnologia', start: 'top top', end: 'bottom bottom',
    onUpdate: self => {
      const scaled = self.progress * 3;
      const index = Math.min(2, Math.floor(scaled));
      setTechChapter(index, scaled - index);
    },
  });
  return () => { techTrigger = undefined; };
});
techButtons.forEach((button, i) => button.addEventListener('click', () => {
  setTechChapter(i, reducedMotion.matches ? 1 : 0);
  if (techTrigger) {
    const position = techTrigger.start + (techTrigger.end - techTrigger.start) * ((i + .015) / 3);
    if (lenis) lenis.scrollTo(position, { immediate: true });
    else window.scrollTo({ top: position });
  }
}));
const technologyStage = $('#technology-stage');
const showTechFallback = () => {
  technologyStage.classList.remove('is-ready');
  technologyStage.classList.add('is-fallback');
  $('.technology-loading').textContent = 'Vista de referencia · Explora los tres capítulos';
};
technologyStage.addEventListener('technology-scene-error', showTechFallback);
const technologyObserver = new IntersectionObserver(async entries => {
  if (!entries.some(entry => entry.isIntersecting)) return;
  technologyObserver.disconnect();
  try {
    const { mountTechnologyScene } = await import('./technology-scene');
    techScene = await mountTechnologyScene(technologyStage, { onReady: () => { technologyStage.classList.remove('is-fallback'); technologyStage.classList.add('is-ready'); } });
    techScene.setChapter(techIndex, techProgress);
  } catch { showTechFallback(); }
}, { rootMargin: '300px' });
technologyObserver.observe($('#tecnologia'));

const solutionTabs = [...document.querySelectorAll<HTMLButtonElement>('[data-solution]')];
function selectSolution(button: HTMLButtonElement, animate = true) {
  const key = button.dataset.solution as keyof typeof solutions;
  const data = solutions[key];
  solutionTabs.forEach(tab => { const selected = tab === button; tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected ? 0 : -1; });
  $('#solution-panel').setAttribute('aria-labelledby', button.id);
  $('#solution-tag').textContent = data.tag; $('#solution-title').textContent = data.title; $('#solution-copy').textContent = data.copy;
  const image = $<HTMLImageElement>('#solution-image');
  image.src = data.image;
  image.alt = data.alt;
  if (animate && !reducedMotion.matches) gsap.fromTo('.solution-image', { opacity: .5 }, { opacity: 1, duration: .4 });
  $('#solution-points').replaceChildren(...data.points.map(text => {
    const li = document.createElement('li');
    const icon = document.createElement('span');
    icon.className = 'material-symbol'; icon.setAttribute('aria-hidden', 'true'); icon.textContent = 'check';
    li.append(icon, document.createTextNode(text)); return li;
  }));
}
selectSolution(solutionTabs[0], false);
solutionTabs.forEach((button, i) => {
  button.addEventListener('click', () => selectSolution(button));
  button.addEventListener('keydown', event => {
    let next = i;
    if (['ArrowDown', 'ArrowRight'].includes(event.key)) next = (i + 1) % solutionTabs.length;
    else if (['ArrowUp', 'ArrowLeft'].includes(event.key)) next = (i + solutionTabs.length - 1) % solutionTabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = solutionTabs.length - 1;
    else return;
    event.preventDefault(); solutionTabs[next].focus(); selectSolution(solutionTabs[next]);
  });
});

const estimatorObserver = new IntersectionObserver(async entries => {
  if (!entries.some(entry => entry.isIntersecting)) return;
  estimatorObserver.disconnect();
  try { const { mountEstimator } = await import('./estimator'); mountEstimator($('#estimator')); ScrollTrigger.refresh(); }
  catch { $('#estimator').textContent = 'No fue posible cargar el cotizador. Recarga la página e inténtalo de nuevo.'; }
}, { rootMargin: '650px' });
estimatorObserver.observe($('#cotizador'));

document.querySelectorAll('details').forEach(el => el.addEventListener('toggle', () => ScrollTrigger.refresh()));

const gaId = /^G-[A-Z0-9]+$/.test(import.meta.env.VITE_GA_ID || '') ? import.meta.env.VITE_GA_ID : '';
let analyticsLoaded = false;
function startAnalytics() {
  if (!gaId) return;
  (window as unknown as Record<string, unknown>)[`ga-disable-${gaId}`] = false;
  if (analyticsLoaded) return;
  analyticsLoaded = true;
  const w = window as unknown as { dataLayer: unknown[]; gtag: (...args: unknown[]) => void };
  w.dataLayer = w.dataLayer || [];
  w.gtag = function () { w.dataLayer.push(arguments); };
  w.gtag('js', new Date()); w.gtag('config', gaId, { send_page_view: true });
  const script = document.createElement('script'); script.async = true; script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`; document.head.append(script);
}
function readConsent() { try { return localStorage.getItem('helio-analytics') === 'yes'; } catch { return false; } }
if (readConsent()) startAnalytics();
const legalDialog = $<HTMLDialogElement>('#legal-dialog');
const legalCopy = {
  privacy: { title: 'Aviso de privacidad', html: '<p>HELIO es una marca ficticia para presentar un prototipo. No existe una empresa receptora de tus datos en esta demostración.</p><p>El cotizador realiza los cálculos en tu navegador. Su PDF se genera localmente. El formulario descarga tu solicitud en tu dispositivo y no transmite su contenido mientras el sitio esté en modo demostración.</p><p>Si el propietario configura un servicio de contacto, deberá sustituir este aviso por el del responsable real y explicar las finalidades, conservación, transferencias y medios para ejercer los derechos aplicables antes de recibir datos.</p><p>La analítica está desactivada por defecto. Si se configura, sólo se inicia después de tu elección en Cookies. Puedes modificarla desde el pie de página.</p>' },
  terms: { title: 'Términos del prototipo', html: '<p>Este sitio muestra un concepto de marca y una experiencia digital. Las imágenes y el modelo 3D son ilustrativos; no documentan instalaciones realizadas ni certificaciones de un proveedor.</p><p>El cotizador ofrece escenarios orientativos, no una oferta comercial, estudio de ingeniería o garantía de ahorro. Los supuestos y exclusiones aparecen en pantalla y en el PDF.</p><p>Un proyecto real requiere un proveedor identificado, revisión técnica, condiciones comerciales, especificaciones y garantías de los equipos, y los trámites de interconexión que correspondan.</p>' },
  cookies: { title: 'Tu privacidad, tu elección', html: `<p>El prototipo no utiliza cookies publicitarias. Guardamos únicamente tu elección de analítica en este navegador.</p><p>${gaId ? 'Google Analytics está disponible, pero sólo se activa si lo autorizas.' : 'Google Analytics todavía no está configurado. No se envían visitas a Google Analytics.'}</p><label><input id="analytics-choice" type="checkbox" ${readConsent() ? 'checked' : ''} ${gaId ? '' : 'disabled'}> Permitir estadísticas de uso con Google Analytics</label><button id="save-cookies" class="button button-lime" type="button">Guardar mi elección</button>` },
};
document.querySelectorAll<HTMLButtonElement>('[data-legal]').forEach(button => button.addEventListener('click', () => {
  const type = button.dataset.legal as keyof typeof legalCopy;
  $('#legal-title').textContent = legalCopy[type].title;
  $('#legal-body').innerHTML = legalCopy[type].html;
  if (type === 'cookies') $<HTMLInputElement>('#analytics-choice').checked = readConsent();
  legalDialog.showModal(); lenis?.stop();
  if (type === 'cookies') $('#save-cookies').addEventListener('click', () => {
    const consent = $<HTMLInputElement>('#analytics-choice').checked;
    try { localStorage.setItem('helio-analytics', consent ? 'yes' : 'no'); } catch { /* Private browsers may deny storage. */ }
    if (gaId) (window as unknown as Record<string, unknown>)[`ga-disable-${gaId}`] = !consent;
    if (consent) startAnalytics();
    legalDialog.close();
  });
}));
$('.legal-close').addEventListener('click', () => legalDialog.close());
legalDialog.addEventListener('close', () => lenis?.start());
legalDialog.addEventListener('click', event => { if (event.target === legalDialog) { const rect = legalDialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) legalDialog.close(); } });

const form = $<HTMLFormElement>('#contact-form');
const configuredEndpoint = import.meta.env.VITE_CONTACT_ENDPOINT || '';
const endpoint = /^\/(?!\/)/.test(configuredEndpoint) ? configuredEndpoint : '';
if (endpoint) {
  $('#contact-submit').firstChild!.textContent = 'Enviar mi solicitud';
  $('#contact-note').textContent = 'Tu solicitud se enviará al servicio de contacto configurado por el propietario de este sitio.';
}
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  if (data.get('company_url')) return;
  const name = String(data.get('name') || '').trim();
  const email = String(data.get('email') || '').trim();
  const message = String(data.get('message') || '').trim();
  if (!name || message.length < 10) { $('#form-status').textContent = 'Escribe tu nombre y al menos 10 caracteres sobre tu proyecto.'; return; }
  const button = $<HTMLButtonElement>('#contact-submit');
  button.disabled = true;
  try {
    if (endpoint) {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, message, consent: true }), signal: AbortSignal.timeout(12000) });
      if (!response.ok) throw new Error('server');
      $('#form-status').textContent = 'Tu solicitud fue recibida por el servicio de contacto.';
    } else {
      const blob = new Blob([`HELIO · Solicitud de proyecto\nDemostración local. No enviada.\n\nNombre: ${name}\nCorreo: ${email}\n\nProyecto:\n${message}\n\nGenerada: ${new Date().toLocaleString('es-MX')}\n`], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'HELIO-mi-proyecto.txt'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 2000);
      $('#form-status').textContent = 'Solicitud preparada. Revisa la descarga; tus datos no se han enviado.';
    }
    form.reset();
  } catch { $('#form-status').textContent = 'No se pudo enviar. Tus datos siguen aquí para que puedas intentarlo de nuevo.'; }
  finally { button.disabled = false; }
});

$('#year').textContent = String(new Date().getFullYear());
// Reveal the footer from under the page only when it fits the desktop viewport.
function layoutFooter() {
  const footer = $('.site-footer'); const wrapper = $('.footer-reveal');
  const canReveal = window.innerWidth >= 1100 && footer.offsetHeight < window.innerHeight - 12 && !reducedMotion.matches;
  wrapper.style.height = canReveal ? `${footer.offsetHeight}px` : '';
  footer.style.position = canReveal ? 'fixed' : 'relative';
  footer.style.bottom = canReveal ? '0' : '';
  footer.style.width = '100%';
}
new ResizeObserver(layoutFooter).observe($('.site-footer'));
window.addEventListener('resize', layoutFooter);
window.addEventListener('load', () => { layoutFooter(); ScrollTrigger.refresh(); });
document.fonts.ready.then(() => ScrollTrigger.refresh());

// Keyboard navigation retains focus even for fixed-footer reveal layouts.
document.addEventListener('focusin', event => { if (event.target instanceof HTMLElement && event.target.closest('.site-footer') && $('.site-footer').style.position === 'fixed') { lenis?.scrollTo(document.documentElement.scrollHeight, { immediate: true }); } });

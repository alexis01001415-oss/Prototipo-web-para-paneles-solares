import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/** Three lightweight product studies, animated only while their scroll state changes. */
export async function mountTechnologyScene(
  container: HTMLElement,
  options: { onReady?: () => void } = {},
): Promise<{ setChapter: (index: number, progress: number) => void; dispose: () => void }> {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-4, 4, 4, -4, .1, 80);
  camera.position.set(0, .15, 18);
  camera.lookAt(0, 0, 0);
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch {
    container.dispatchEvent(new CustomEvent('technology-scene-error', { detail: 'webgl-unavailable' }));
    throw new Error('WebGL no está disponible para la demostración de tecnología.');
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y;';
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.setAttribute('aria-label', 'Modelo tridimensional de un panel solar con células fotovoltaicas y estructura de aluminio.');
  container.appendChild(renderer.domElement);

  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  const instances: THREE.InstancedMesh[] = [];
  const geometry = <T extends THREE.BufferGeometry>(item: T) => { geometries.add(item); return item; };
  const material = (color: THREE.ColorRepresentation, props: THREE.MeshStandardMaterialParameters = {}) => {
    const item = new THREE.MeshStandardMaterial({ color, roughness: .4, metalness: .15, ...props });
    materials.add(item);
    return item;
  };
  const graphite = material('#132a13', { metalness: .65, roughness: .29 });
  const aluminum = material('#a9bdb1', { metalness: .92, roughness: .28 });
  const pale = material('#e5e9cc', { metalness: .16, roughness: .34 });
  const cell = material('#092335', { metalness: .2, roughness: .57, envMapIntensity: .25 });
  const cellAlternate = material('#102d3e', { metalness: .24, roughness: .56, envMapIntensity: .25 });
  const silver = material('#668885', { metalness: .78, roughness: .35 });
  const rubber = material('#10231f', { metalness: .03, roughness: .8 });
  const lime = material('#ecf39e', { emissive: '#90a955', emissiveIntensity: .7, roughness: .24 });
  const amber = material('#e5af53', { emissive: '#b17124', emissiveIntensity: .35 });
  const glass = material('#b3dbd4', { transparent: true, opacity: .14, roughness: .09, metalness: .25, depthWrite: false, side: THREE.DoubleSide });
  const antireflectiveGlass = material('#416b75', { transparent: true, opacity: .045, roughness: .47, metalness: .05, envMapIntensity: .1, depthWrite: false });
  const film = material('#e5eedb', { transparent: true, opacity: .19, roughness: .6, depthWrite: false, side: THREE.DoubleSide });
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, .025);
  scene.environment = environment.texture;
  scene.environmentIntensity = .9;
  room.dispose();
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight('#e9edce', '#31572c', 2));
  const key = new THREE.DirectionalLight('#eaffdb', 4.4);
  key.position.set(-5, 8, 10);
  const rim = new THREE.DirectionalLight('#90a955', 3.4);
  rim.position.set(6, 3, -7);
  const fill = new THREE.DirectionalLight('#c3dde9', 1.8);
  fill.position.set(-6, -3, 5);
  scene.add(key, rim, fill);

  const unitBox = geometry(new THREE.BoxGeometry(1, 1, 1));
  const unitCylinder = geometry(new THREE.CylinderGeometry(1, 1, 1, 16));
  const boltGeometry = geometry(new THREE.CylinderGeometry(.025, .025, .014, 6));
  boltGeometry.rotateX(Math.PI / 2);
  const box = (parent: THREE.Object3D, w: number, h: number, d: number, x: number, y: number, z: number, mat: THREE.Material) => {
    const mesh = new THREE.Mesh(unitBox, mat);
    mesh.scale.set(w, h, d);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };
  const rounded = (parent: THREE.Object3D, w: number, h: number, d: number, radius: number, x: number, y: number, z: number, mat: THREE.Material) => {
    const mesh = new THREE.Mesh(geometry(new RoundedBoxGeometry(w, h, d, 3, radius)), mat);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };
  const cylinder = (parent: THREE.Object3D, radius: number, height: number, x: number, y: number, z: number, mat: THREE.Material) => {
    const mesh = new THREE.Mesh(unitCylinder, mat);
    mesh.scale.set(radius, height, radius);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };
  const tube = (parent: THREE.Object3D, points: number[][], radius: number, mat: THREE.Material) => {
    const path = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point as [number, number, number])));
    const mesh = new THREE.Mesh(geometry(new THREE.TubeGeometry(path, 32, radius, 8, false)), mat);
    parent.add(mesh);
    return mesh;
  };
  const instanced = (parent: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material, transforms: Array<{ position: number[]; scale?: number[] }>) => {
    const mesh = new THREE.InstancedMesh(geo, mat, transforms.length);
    const dummy = new THREE.Object3D();
    transforms.forEach((transform, index) => {
      dummy.position.set(...transform.position as [number, number, number]);
      dummy.scale.set(...(transform.scale ?? [1, 1, 1]) as [number, number, number]);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    parent.add(mesh);
    instances.push(mesh);
    return mesh;
  };
  const moduleFrame = (parent: THREE.Object3D, z = 0) => {
    for (const x of [-1.575, 1.575]) {
      box(parent, .075, 4.65, .16, x, 0, z, graphite);
      box(parent, .012, 4.63, .035, x + Math.sign(x) * .029, 0, z + .071, aluminum);
    }
    for (const y of [-2.29, 2.29]) {
      box(parent, 3.12, .075, .16, 0, y, z, graphite);
      box(parent, 3.12, .012, .035, 0, y + Math.sign(y) * .03, z + .071, aluminum);
    }
    instanced(parent, boltGeometry, aluminum, [-1.575, 1.575].flatMap(x => [-2.29, 0, 2.29].map(y => ({ position: [x, y, z + .086] }))));
  };
  const moduleCells = (parent: THREE.Object3D, z = .05) => {
    const positions: Array<{ position: number[]; scale?: number[] }> = [];
    const accentPositions: Array<{ position: number[]; scale?: number[] }> = [];
    const busbars: Array<{ position: number[]; scale?: number[] }> = [];
    for (let row = 0; row < 12; row++) for (let col = 0; col < 6; col++) {
      const x = -.5 * 2.525 + col * .505;
      const y = -2.064 + row * .3753;
      (row % 4 === 0 ? accentPositions : positions).push({ position: [x, y, z], scale: [.486, .354, .018] });
      for (const offset of [-.15, 0, .15]) busbars.push({ position: [x + offset, y, z + .011], scale: [.005, .35, .004] });
    }
    instanced(parent, unitBox, cell, positions);
    instanced(parent, unitBox, cellAlternate, accentPositions);
    instanced(parent, unitBox, silver, busbars);
    box(parent, 3.09, .011, .004, 0, 0, z + .015, aluminum);
  };
  const models = [new THREE.Group(), new THREE.Group(), new THREE.Group()];
  models.forEach(model => scene.add(model));

  // Capture: cells, anti-reflective surface, machined frame and rear mounting rails.
  const capture = models[0];
  box(capture, 3.11, 4.56, .04, 0, 0, -.05, rubber);
  moduleFrame(capture);
  moduleCells(capture);
  box(capture, 3.075, 4.485, .012, 0, 0, .081, antireflectiveGlass);
  for (const y of [-1.51, 1.51]) {
    box(capture, 3.55, .09, .11, 0, y, -.16, aluminum);
    for (const x of [-1.49, 1.49]) {
      box(capture, .12, .12, .22, x, y, -.1, graphite);
      box(capture, .15, .05, .07, x, y, .08, aluminum);
    }
  }
  rounded(capture, .7, .36, .14, .045, 0, .25, -.14, graphite);
  for (const sign of [-1, 1]) {
    tube(capture, [[sign * .2, .16, -.22], [sign * .65, -.1, -.27], [sign * .73, -.95, -.24], [sign * .98, -1.19, -.23]], .022, rubber);
    const plug = cylinder(capture, .047, .24, sign * 1.06, -1.19, -.23, graphite);
    plug.rotation.z = Math.PI / 2;
  }
  // Slim rays respond to scroll; they do not run an idle particle loop.
  const solarRays = new THREE.Group();
  capture.add(solarRays);
  const rayMaterial = new THREE.MeshBasicMaterial({ color: '#ecf39e', transparent: true, opacity: .5, depthWrite: false });
  materials.add(rayMaterial);
  for (let i = 0; i < 7; i++) {
    const ray = box(solarRays, .009, .3 + i % 3 * .04, .009, -.95 + i * .3, 2.38 + i % 2 * .16, .65 + i % 3 * .13, rayMaterial);
    ray.rotation.x = -.5;
    ray.rotation.z = -.35;
  }

  // Protection: exploded glass / encapsulant / cells / backsheet / perimeter frame.
  const protection = models[1];
  const layers = Array.from({ length: 5 }, () => new THREE.Group());
  layers.forEach(layer => protection.add(layer));
  box(layers[0], 3.09, 4.48, .035, 0, 0, 0, glass);
  // A fine border keeps the optically clear front sheet legible against the dark stage.
  const glassEdgeMaterial = new THREE.LineBasicMaterial({ color: '#a0d0bc', transparent: true, opacity: .55 });
  materials.add(glassEdgeMaterial);
  const edgeGeo = geometry(new THREE.EdgesGeometry(geometry(new THREE.BoxGeometry(3.09, 4.48, .035))));
  layers[0].add(new THREE.LineSegments(edgeGeo, glassEdgeMaterial));
  box(layers[1], 3.06, 4.45, .012, 0, 0, 0, film);
  box(layers[2], 3.07, 4.45, .023, 0, 0, -.025, graphite);
  moduleCells(layers[2], 0);
  box(layers[3], 3.09, 4.48, .035, 0, 0, 0, pale);
  moduleFrame(layers[4]);
  rounded(layers[4], .7, .36, .13, .035, 0, .1, -.14, graphite);
  const guideMaterial = new THREE.LineDashedMaterial({ color: '#b7d5b4', transparent: true, opacity: .25, dashSize: .08, gapSize: .085 });
  materials.add(guideMaterial);
  for (const x of [-1.47, 1.47]) for (const y of [-2.15, 2.15]) {
    const lineGeo = geometry(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, y, -1.8), new THREE.Vector3(x, y, 1.8)]));
    const line = new THREE.Line(lineGeo, guideMaterial);
    line.computeLineDistances();
    protection.add(line);
  }

  // Intelligence: an unbranded residential inverter, functional ports and display.
  const intelligence = models[2];
  rounded(intelligence, 2.45, 3.5, .78, .18, 0, .15, 0, graphite);
  rounded(intelligence, 2.4, 3.45, .34, .17, 0, .18, .38, pale);
  rounded(intelligence, 2.03, .91, .035, .085, 0, .48, .56, rubber);
  const heatFins = Array.from({ length: 15 }, (_, i) => ({ position: [-1.12 + i * .16, .15, -.58], scale: [.05, 3.07, .37] }));
  instanced(intelligence, unitBox, aluminum, heatFins);
  const sideVents = [-1, 1].flatMap(sign => Array.from({ length: 12 }, (_, i) => ({ position: [sign * 1.228, -.95 + i * .14, .005], scale: [.016, .022, .43] })));
  instanced(intelligence, unitBox, rubber, sideVents);
  instanced(intelligence, boltGeometry, aluminum, [-1.07, 1.07].flatMap(x => [-1.38, 1.62].map(y => ({ position: [x, y, .531] }))));
  box(intelligence, .16, .018, .009, -.83, 1.46, .553, graphite);
  box(intelligence, .1, .018, .009, -.83, 1.405, .553, graphite);
  box(intelligence, .048, .018, .009, -.83, 1.35, .553, graphite);
  box(intelligence, 1.98, .008, .008, 0, -.37, .56, aluminum);
  const statusLight = cylinder(intelligence, .04, .019, -.8, -.69, .564, lime);
  statusLight.rotation.x = Math.PI / 2;
  for (let i = 0; i < 3; i++) box(intelligence, .31, .018, .008, -.29 + i * .47, -.69, .555, graphite);
  const powerRing = new THREE.Mesh(geometry(new THREE.TorusGeometry(.13, .012, 8, 28, Math.PI * 1.62)), graphite);
  powerRing.rotation.z = Math.PI * .69;
  powerRing.position.set(0, -1.08, .557);
  intelligence.add(powerRing);
  box(intelligence, .018, .15, .017, 0, -1, .559, graphite);
  // Mounting plate and concealed wall bracket remain visible around the enclosure.
  box(intelligence, 1.8, 2.5, .07, 0, .32, -.83, aluminum);
  for (const x of [-.92, .92]) {
    rounded(intelligence, .18, .52, .07, .02, x, 1.88, -.32, aluminum);
    rounded(intelligence, .18, .42, .07, .02, x, -1.5, -.34, aluminum);
  }
  for (let i = 0; i < 4; i++) {
    const x = -.8 + i * .43;
    cylinder(intelligence, i === 3 ? .1 : .072, .24, x, -1.66, -.02, graphite);
    cylinder(intelligence, i === 3 ? .105 : .076, .06, x, -1.7, -.02, aluminum);
    tube(intelligence, [[x, -1.77, -.02], [x, -2.04, 0], [x + .1, -2.33, -.09], [x + .1, -2.49, -.38]], i === 3 ? .04 : .027, i === 1 ? amber : rubber);
  }
  // Locally drawn instrument graphic, with DEMO status rather than real production data.
  const screenCanvas = document.createElement('canvas');
  screenCanvas.width = 768;
  screenCanvas.height = 288;
  const screenContext = screenCanvas.getContext('2d');
  if (screenContext) {
    const ctx = screenContext;
    ctx.fillStyle = '#132a13'; ctx.fillRect(0, 0, 768, 288);
    ctx.strokeStyle = '#31572c'; ctx.lineWidth = 1;
    for (let y = 96; y <= 252; y += 39) { ctx.beginPath(); ctx.moveTo(36, y); ctx.lineTo(732, y); ctx.stroke(); }
    ctx.fillStyle = '#a8c5af'; ctx.font = '18px sans-serif'; ctx.fillText('GENERACIÓN SOLAR', 35, 39);
    ctx.fillStyle = '#ecf39e'; ctx.font = 'bold 21px sans-serif'; ctx.fillText('DEMO', 650, 39);
    ctx.font = '56px sans-serif'; ctx.fillText('4.8', 35, 104);
    ctx.fillStyle = '#a8c5af'; ctx.font = '22px sans-serif'; ctx.fillText('kW', 133, 103);
    ctx.strokeStyle = '#ecf39e'; ctx.lineWidth = 5;
    ctx.beginPath();
    const curve = [231, 228, 224, 213, 204, 193, 172, 150, 120, 98, 89, 90, 79, 83, 79, 97, 99, 120, 142, 146, 169, 181, 200, 215, 224, 228];
    curve.forEach((y, i) => i ? ctx.lineTo(35 + i * 27.8, y) : ctx.moveTo(35, y));
    ctx.stroke();
    ctx.fillStyle = '#a8c5af'; ctx.font = '16px sans-serif'; ctx.fillText('06:00', 35, 273); ctx.fillText('12:00', 355, 273); ctx.fillText('18:00', 686, 273);
    const screenTexture = new THREE.CanvasTexture(screenCanvas);
    screenTexture.colorSpace = THREE.SRGBColorSpace;
    screenTexture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);
    textures.add(screenTexture);
    const screenMaterial = new THREE.MeshBasicMaterial({ map: screenTexture, toneMapped: false });
    materials.add(screenMaterial);
    const screen = new THREE.Mesh(geometry(new THREE.PlaneGeometry(1.9, .71)), screenMaterial);
    screen.position.set(0, .48, .585);
    intelligence.add(screen);
  }
  // Generous fit leaves room for the exploded geometry at narrow viewport widths.
  let width = 1;
  let height = 1;
  let chapter = 0;
  let progress = 0;
  let desiredProgress = 0;
  let disposed = false;
  let visible = true;
  let contextLost = false;
  let ticking = false;
  let lastTime = 0;
  let didRender = false;
  let dirty = true;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const descriptions = [
    'Modelo tridimensional de un panel solar con células fotovoltaicas y estructura de aluminio.',
    'Vista tridimensional separada del vidrio, encapsulante, células, lámina posterior y marco de un panel solar.',
    'Modelo tridimensional de un inversor solar, con pantalla ilustrativa, disipador y conexiones eléctricas.',
  ];
  const updateModels = () => {
    const p = reducedMotion.matches ? .5 : progress;
    models.forEach((model, index) => { model.visible = index === chapter; });
    capture.rotation.set(.13 + p * .08, -.57 + p * .26, -.09);
    capture.position.y = .06 + Math.sin(p * Math.PI) * .08;
    solarRays.position.y = -.25 * p;
    solarRays.position.z = -.3 * p;
    rayMaterial.opacity = .12 + Math.sin(p * Math.PI) * .4;
    protection.rotation.set(.12, -.61 - p * .13, -.075);
    protection.position.y = .03;
    const separation = .42 + p * .21;
    layers.forEach((layer, index) => { layer.position.z = (2 - index) * separation; });
    intelligence.rotation.set(.035 + p * .055, -.58 + p * .25, -.025);
    intelligence.position.y = .17;
  };
  const updateFrustum = () => {
    const aspect = width / height;
    const verticalSpan = Math.max(6.3, 5.55 / aspect);
    camera.left = -verticalSpan * aspect / 2;
    camera.right = verticalSpan * aspect / 2;
    camera.top = verticalSpan / 2;
    camera.bottom = -verticalSpan / 2;
    camera.updateProjectionMatrix();
  };
  const stop = () => { renderer.setAnimationLoop(null); ticking = false; };
  const frame = (time: number) => {
    if (disposed || !visible || document.hidden || contextLost) { stop(); return; }
    const delta = lastTime ? Math.min((time - lastTime) / 1000, .06) : 1 / 60;
    lastTime = time;
    const mix = reducedMotion.matches ? 1 : 1 - Math.exp(-delta * 10);
    progress = THREE.MathUtils.lerp(progress, desiredProgress, mix);
    const moving = Math.abs(progress - desiredProgress) > .001;
    if (!moving) progress = desiredProgress;
    if (moving || dirty) {
      updateModels();
      try {
        renderer.render(scene, camera);
        dirty = false;
        if (!didRender) { didRender = true; options.onReady?.(); }
      } catch {
        stop();
        contextLost = true;
        container.dispatchEvent(new CustomEvent('technology-scene-error', { detail: 'render-failed' }));
        return;
      }
    }
    if (!moving) stop();
  };
  const requestRender = () => {
    dirty = true;
    if (!disposed && !contextLost && visible && !document.hidden && !ticking) {
      ticking = true;
      lastTime = 0;
      renderer.setAnimationLoop(frame);
    }
  };
  const resize = () => {
    const bounds = container.getBoundingClientRect();
    width = Math.max(bounds.width, 1); height = Math.max(bounds.height, 1);
    renderer.setSize(width, height, false);
    updateFrustum();
    requestRender();
  };
  const setChapter = (index: number, nextProgress: number) => {
    const nextChapter = THREE.MathUtils.clamp(Number.isFinite(index) ? Math.round(index) : 0, 0, 2);
    const normalized = THREE.MathUtils.clamp(Number.isFinite(nextProgress) ? nextProgress : 0, 0, 1);
    if (chapter !== nextChapter) {
      chapter = nextChapter;
      progress = normalized;
      renderer.domElement.setAttribute('aria-label', descriptions[chapter]);
    }
    desiredProgress = normalized;
    requestRender();
  };
  const onVisibility = () => { if (document.hidden) stop(); else requestRender(); };
  const onMotion = () => requestRender();
  const onContextLost = (event: Event) => {
    event.preventDefault();
    contextLost = true;
    stop();
    container.dispatchEvent(new CustomEvent('technology-scene-error', { detail: 'webgl-context-lost' }));
  };
  const onContextRestored = () => { contextLost = false; didRender = false; requestRender(); };
  const resizeObserver = new ResizeObserver(resize);
  const intersectionObserver = new IntersectionObserver(entries => {
    visible = entries[0]?.isIntersecting ?? false;
    if (visible) requestRender(); else stop();
  }, { rootMargin: '100px' });
  resizeObserver.observe(container);
  intersectionObserver.observe(container);
  document.addEventListener('visibilitychange', onVisibility);
  reducedMotion.addEventListener('change', onMotion);
  renderer.domElement.addEventListener('webglcontextlost', onContextLost);
  renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);
  updateModels();
  resize();

  return {
    setChapter,
    dispose() {
      if (disposed) return;
      disposed = true;
      stop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      reducedMotion.removeEventListener('change', onMotion);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
      instances.forEach(item => item.dispose());
      geometries.forEach(item => item.dispose());
      materials.forEach(item => item.dispose());
      textures.forEach(item => item.dispose());
      environment.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

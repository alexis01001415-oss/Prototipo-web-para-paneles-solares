import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * Procedural solar residence; no downloaded models or textures.
 * Camera steps: 0 residence, 1 photovoltaic roof, 2 meter / inverter, 3 EV garage.
 * The container supplies its dimensions. Overlay instructions and step controls in HTML.
 * Desktop pointer drag gently rotates the scene; touch always preserves page scrolling.
 */
export async function mountHouseScene(
  container: HTMLElement,
  options: { onReady?: () => void } = {},
): Promise<{ setStep: (step: number) => void; dispose: () => void }> {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-8, 8, 6, -6, 0.1, 100);
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch {
    throw new Error('WebGL no está disponible. Muestra la imagen alternativa del recorrido.');
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y;cursor:grab;outline:none;';
  renderer.domElement.setAttribute('aria-label', 'Casa solar interactiva. Usa los cuatro botones del recorrido para explorar los paneles, el medidor y el cargador eléctrico.');
  renderer.domElement.setAttribute('role', 'img');
  container.appendChild(renderer.domElement);

  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  const geometry = <T extends THREE.BufferGeometry>(item: T): T => { geometries.add(item); return item; };
  const material = (color: THREE.ColorRepresentation, props: THREE.MeshStandardMaterialParameters = {}) => {
    const value = new THREE.MeshStandardMaterial({ color, roughness: 0.65, metalness: 0, ...props });
    materials.add(value);
    return value;
  };
  const cream = material('#dedbd0', { roughness: 0.88 });
  const ivory = material('#f5f0dd', { roughness: 0.8 });
  const stucco = material('#c2c1aa');
  const concrete = material('#bbbbae', { roughness: 0.94 });
  const edges = material('#e9e5d8');
  const dark = material('#31572c', { roughness: 0.52 });
  const black = material('#132a13', { roughness: 0.46, metalness: 0.22 });
  const timber = material('#9b7551', { roughness: 0.72 });
  const timberLight = material('#bd9870');
  const glass = material('#536b63', { roughness: 0.16, metalness: 0.45 });
  const roofMaterial = material('#a1a794', { roughness: 0.9 });
  const grass = material('#71834c', { roughness: 1 });
  const earth = material('#4f772d', { roughness: 1 });
  const olive = material('#4f772d');
  const sage = material('#90a955');
  const leafDark = material('#31572c');
  const lime = material('#ecf39e', { emissive: '#90a955', emissiveIntensity: 0.3 });
  const carPaint = material('#d3d9b2', { roughness: 0.25, metalness: 0.44 });
  const wheelMaterial = material('#151b19', { roughness: 0.84 });
  const wheelMetal = material('#a4aca4', { metalness: 0.85, roughness: 0.26 });
  const red = material('#d55c43', { emissive: '#c63826', emissiveIntensity: 0.35 });
  const lightMaterial = material('#f2f4dd', { emissive: '#eef6ca', emissiveIntensity: 0.48 });

  // Fine, deterministic stucco grain gives close camera views a tactile surface.
  const surfaceCanvas = document.createElement('canvas');
  surfaceCanvas.width = surfaceCanvas.height = 128;
  const surfaceContext = surfaceCanvas.getContext('2d');
  if (surfaceContext) {
    const pixels = surfaceContext.createImageData(128, 128);
    for (let i = 0; i < pixels.data.length; i += 4) {
      const value = 190 + Math.round((Math.sin(i * 12.9898) * 43758.5453 % 1) * 32);
      pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = value;
      pixels.data[i + 3] = 255;
    }
    surfaceContext.putImageData(pixels, 0, 0);
    const surfaceTexture = new THREE.CanvasTexture(surfaceCanvas);
    surfaceTexture.wrapS = surfaceTexture.wrapT = THREE.RepeatWrapping;
    surfaceTexture.repeat.set(4, 4);
    textures.add(surfaceTexture);
    for (const surface of [cream, ivory, stucco, concrete]) {
      surface.bumpMap = surfaceTexture;
      surface.bumpScale = .026;
      surface.roughnessMap = surfaceTexture;
    }
  }

  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.035);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.45;
  room.dispose();
  pmrem.dispose();

  scene.add(new THREE.HemisphereLight(0xfffbe7, 0x6c7851, 2.1));
  const sun = new THREE.DirectionalLight(0xfff6de, 4.0);
  sun.position.set(-7, 15, 9);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -11;
  sun.shadow.camera.right = 11;
  sun.shadow.camera.top = 12;
  sun.shadow.camera.bottom = -10;
  sun.shadow.camera.far = 40;
  sun.shadow.bias = -0.0003;
  sun.shadow.normalBias = 0.035;
  sun.shadow.radius = 4;
  sun.target.position.set(0, 1, 0);
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight(0xdbe9e1, 1.0);
  fill.position.set(8, 6, -6);
  scene.add(fill);

  const home = new THREE.Group();
  scene.add(home);
  const boxGeometry = geometry(new THREE.BoxGeometry(1, 1, 1));
  const box = (w: number, h: number, d: number, x: number, y: number, z: number, mat: THREE.Material, parent: THREE.Object3D = home) => {
    const mesh = new THREE.Mesh(boxGeometry, mat);
    mesh.scale.set(w, h, d);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const rounded = (w: number, h: number, d: number, radius: number, x: number, y: number, z: number, mat: THREE.Material, parent: THREE.Object3D = home) => {
    const mesh = new THREE.Mesh(geometry(new RoundedBoxGeometry(w, h, d, 3, radius)), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const cylinderGeometry = geometry(new THREE.CylinderGeometry(1, 1, 1, 12));
  const cylinder = (radius: number, height: number, x: number, y: number, z: number, mat: THREE.Material, parent: THREE.Object3D = home) => {
    const mesh = new THREE.Mesh(cylinderGeometry, mat);
    mesh.scale.set(radius, height, radius);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const tube = (points: THREE.Vector3[], radius: number, mat: THREE.Material, parent: THREE.Object3D = home) => {
    const mesh = new THREE.Mesh(geometry(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 28, radius, 7, false)), mat);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  };

  // A soft-edged landscaped island, with layered foundations and generous paving.
  rounded(13.3, 0.42, 10.4, 0.2, 0, -0.32, 0.1, earth);
  rounded(13.25, 0.12, 10.35, 0.13, 0, -0.07, 0.1, grass);
  rounded(10.1, 0.15, 6.2, 0.07, 0, 0.055, -0.1, concrete);
  box(4.6, 0.065, 3.85, 2.75, 0.145, 2.25, stucco);
  for (let i = 0; i < 5; i++) {
    box(4.45, 0.012, 0.017, 2.78, 0.184, 0.6 + i * 0.71, concrete);
  }
  for (let i = 0; i < 4; i++) {
    rounded(1.4, 0.12, 0.48, 0.025, -2.24, 0.14 - i * 0.012, 2.65 + i * 0.64, edges);
  }
  box(0.72, 0.03, 3.2, -4.48, 0.16, 0.1, concrete);
  // Paving seams, drainage and the recessed arrival step read clearly at human scale.
  for (let i = 0; i < 9; i++) box(.013, .008, 3.79, .56 + i * .55, .184, 2.25, concrete);
  box(4.36, .012, .085, 2.75, .187, 3.93, dark);
  for (let i = 0; i < 35; i++) box(.045, .016, .073, .64 + i * .123, .19, 3.93, concrete);
  box(1.5, .08, .85, -1.09, .33, 2.17, edges);

  // Ground floor: solid rear and sides; actual front apertures preserve architectural depth.
  box(5.6, 0.25, 5.15, -1.95, 0.265, -0.25, ivory);
  box(5.6, 2.63, 0.22, -1.95, 1.58, -2.7, cream);
  box(0.24, 2.63, 4.9, -4.63, 1.58, -0.18, cream);
  box(0.24, 2.63, 4.9, 0.73, 1.58, -0.18, cream);
  box(5.82, 0.24, 5.35, -1.95, 2.96, -0.25, ivory);
  box(5.55, 0.16, 0.13, -1.95, 2.79, 2.3, dark);
  // Front, living room to the left, timber entry to the right.
  box(2.7, 2.28, 0.09, -3.1, 1.5, 2.11, glass);
  for (const x of [-4.45, -3.55, -2.65, -1.75]) box(0.045, 2.32, 0.16, x, 1.5, 2.16, black);
  box(2.76, 0.045, 0.16, -3.1, 0.35, 2.16, black);
  box(2.76, 0.045, 0.16, -3.1, 2.65, 2.16, black);
  box(1.12, 2.47, 0.24, -1.06, 1.53, 2.1, timber);
  for (let i = 0; i < 10; i++) box(0.045, 2.41, 0.015, -1.57 + i * 0.108, 1.53, 2.23, timberLight);
  box(0.035, 0.62, 0.05, -0.72, 1.37, 2.26, black);
  box(.11, .025, .09, -.75, 1.66, 2.27, black);
  box(.11, .025, .09, -.75, 1.08, 2.27, black);
  box(.06, .09, .025, -.7, .93, 2.258, wheelMetal);
  box(0.72, 2.47, 0.2, 0.35, 1.53, 2.13, cream);
  box(0.025, 0.3, 0.065, 0.39, 2.07, 2.25, black);
  box(0.029, 0.18, 0.067, 0.39, 2.06, 2.255, lightMaterial);
  // Exterior bench and low planter anchor the façade.
  box(2.14, 0.1, 0.5, -3.29, 0.55, 2.48, timber);
  box(0.13, 0.32, 0.38, -4.1, 0.36, 2.48, dark);
  box(0.13, 0.32, 0.38, -2.48, 0.36, 2.48, dark);

  // Upper volume is slightly offset, creating a shaded floating cantilever.
  box(5.05, 2.52, 0.24, -2.22, 4.32, -2.59, cream);
  box(0.26, 2.52, 4.62, -4.61, 4.32, -0.4, cream);
  box(0.27, 2.52, 4.62, 0.17, 4.32, -0.4, cream);
  box(5.08, 0.48, 0.25, -2.22, 5.35, 1.78, ivory);
  box(5.08, 0.25, 4.95, -2.22, 5.71, -0.4, ivory);
  box(4.62, 0.06, 4.5, -2.22, 5.855, -0.4, roofMaterial);
  box(3.76, 1.92, 0.08, -2.67, 4.1, 1.52, glass);
  for (const x of [-4.49, -3.24, -1.99, -0.8]) box(0.052, 1.95, 0.14, x, 4.1, 1.6, black);
  box(3.75, 0.055, 0.14, -2.64, 3.13, 1.6, black);
  box(3.75, 0.055, 0.14, -2.64, 5.05, 1.6, black);
  // Bronze-toned fins filter the bedroom's western light.
  for (let i = 0; i < 9; i++) box(0.072, 2.15, 0.38, -1.35 + i * 0.184, 4.14, 1.82, timber);
  box(1.65, 0.07, 0.41, -0.61, 3.09, 1.82, timber);
  box(1.65, 0.07, 0.41, -0.61, 5.2, 1.82, timber);
  // Narrow side window and concrete parapets frame the roof.
  box(0.02, 1.4, 1.4, 0.311, 4.23, -0.62, glass);
  box(0.05, 1.47, 0.06, 0.326, 4.23, -1.33, black);
  box(0.05, 1.47, 0.06, 0.326, 4.23, 0.09, black);
  box(0.05, 0.06, 1.45, 0.326, 3.5, -0.62, black);
  box(0.05, 0.06, 1.45, 0.326, 4.95, -0.62, black);
  box(5.1, 0.26, 0.11, -2.22, 5.98, -2.81, edges);
  box(0.11, 0.26, 4.72, -4.72, 5.98, -0.4, edges);
  box(0.11, 0.26, 4.72, 0.29, 5.98, -0.4, edges);
  box(5.1, 0.12, 0.11, -2.22, 5.91, 1.99, edges);

  // Slim rainwater channel and vertical reveal joints articulate the broad side wall.
  box(.075, 5.2, .075, -4.775, 2.97, -2.52, stucco);
  for (const y of [.68, 1.13, 1.58, 2.03, 2.48, 3.47, 3.92, 4.37, 4.82, 5.27]) {
    box(.008, .012, 4.48, -4.766, y, -.4, stucco);
  }
  for (const [y, z] of [[.92, -1.55], [1.81, -.24], [2.25, 1.02], [3.7, -1.55], [4.59, -.24], [5.05, 1.02]]) {
    box(.01, .44, .014, -4.769, y, z, stucco);
  }

  // Six subtly inclined photovoltaic modules with 60 visible cell details each.
  const panelFrame = material('#384947', { metalness: 0.65, roughness: 0.33 });
  const cellMaterial = material('#152f3f', { metalness: 0.52, roughness: 0.29 });
  const cellAccent = material('#325263', { metalness: 0.6, roughness: 0.38 });
  const cellGeometry = geometry(new THREE.PlaneGeometry(0.185, 0.178));
  const cells = new THREE.InstancedMesh(cellGeometry, cellMaterial, 6 * 6 * 10);
  const cellLines = new THREE.InstancedMesh(geometry(new THREE.PlaneGeometry(0.179, 0.006)), cellAccent, 6 * 6 * 10);
  const dummy = new THREE.Object3D();
  const lineDummy = new THREE.Object3D();
  const panelMatrix = new THREE.Matrix4();
  let cellIndex = 0;
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      const panel = new THREE.Group();
      panel.position.set(-3.59 + col * 1.36, 6.12, -1.36 + row * 2.03);
      panel.rotation.x = 0.13;
      home.add(panel);
      box(1.27, 0.062, 1.93, 0, 0, 0, panelFrame, panel);
      box(1.21, 0.01, 1.87, 0, 0.035, 0, black, panel);
      box(0.07, 0.12, 1.65, -0.45, -0.08, 0, dark, panel);
      box(0.07, 0.12, 1.65, 0.45, -0.08, 0, dark, panel);
      for (const x of [-.57, .57]) for (const z of [-.68, .68]) {
        box(.09, .025, .11, x, .053, z, wheelMetal, panel);
        const bolt = cylinder(.018, .016, x, .07, z, panelFrame, panel);
        bolt.castShadow = false;
      }
      box(.23, .08, .14, 0, -.09, -.41, black, panel);
      panel.updateMatrixWorld(true);
      panelMatrix.copy(panel.matrixWorld);
      for (let cellRow = 0; cellRow < 10; cellRow++) {
        for (let cellCol = 0; cellCol < 6; cellCol++) {
          dummy.position.set(-0.499 + cellCol * 0.2, 0.045, -0.834 + cellRow * 0.1853);
          dummy.rotation.set(-Math.PI / 2, 0, 0);
          dummy.updateMatrix();
          cells.setMatrixAt(cellIndex, new THREE.Matrix4().multiplyMatrices(panelMatrix, dummy.matrix));
          lineDummy.position.copy(dummy.position);
          lineDummy.position.y += 0.002;
          lineDummy.rotation.copy(dummy.rotation);
          lineDummy.updateMatrix();
          cellLines.setMatrixAt(cellIndex, new THREE.Matrix4().multiplyMatrices(panelMatrix, lineDummy.matrix));
          cellIndex++;
        }
      }
    }
  }
  cells.instanceMatrix.needsUpdate = true;
  cellLines.instanceMatrix.needsUpdate = true;
  home.add(cells, cellLines);
  for (let row = 0; row < 2; row++) {
    box(4.11, .055, .06, -2.22, 6.02, -1.94 + row * 2.03, wheelMetal);
    box(4.11, .055, .06, -2.22, 5.93, -.75 + row * 2.03, wheelMetal);
    tube([
      new THREE.Vector3(-4.1, 6.02, -1.1 + row * 2.03),
      new THREE.Vector3(-2.45, 6.0, -1.13 + row * 2.03),
      new THREE.Vector3(-.86, 6.02, -1.1 + row * 2.03),
    ], .017, black);
  }

  // Garage: open front, clerestory edge, warm ceiling and a side privacy screen.
  box(4.2, 0.16, 5.3, 2.59, 0.25, -0.08, cream);
  box(4.16, 2.8, 0.2, 2.6, 1.68, -2.65, stucco);
  box(0.18, 2.8, 3.05, 4.59, 1.68, -1.12, cream);
  box(4.47, 0.23, 5.58, 2.58, 3.18, -0.08, ivory);
  box(4.12, 0.06, 5.12, 2.59, 3.04, -0.08, timber);
  box(4.44, 0.065, 5.54, 2.59, 3.325, -0.08, roofMaterial);
  box(0.21, 2.8, 0.22, 4.57, 1.68, 2.45, ivory);
  for (let i = 0; i < 8; i++) box(0.035, 0.035, 4.9, 0.85 + i * 0.46, 3.0, -0.08, timberLight);
  box(2.3, 0.025, 0.028, 2.6, 2.98, 2.27, lightMaterial);
  for (const x of [1.49, 3.64]) for (const z of [-1.13, 1.11]) {
    cylinder(.095, .018, x, 2.96, z, black);
    cylinder(.07, .021, x, 2.95, z, lightMaterial);
  }
  // Ceiling track and a recessed rear utility cabinet make the garage inhabited.
  box(2.67, .055, .055, 2.6, 2.87, -2.31, dark);
  box(1.0, 1.61, .075, 1.42, 1.27, -2.517, edges);
  box(.026, .34, .035, 1.78, 1.29, -2.461, wheelMetal);
  box(.015, 1.51, .01, 1.42, 1.27, -2.473, concrete);
  // A roof garden softens the low volume without obscuring panels.
  rounded(0.62, 0.27, 4.45, 0.035, 4.07, 3.49, -0.15, cream);
  box(0.52, 0.04, 4.28, 4.07, 3.64, -0.15, earth);

  // EV is built from smooth body volumes, glazing, machined wheels and fine lights.
  const car = new THREE.Group();
  car.position.set(2.61, 0.36, 0.24);
  home.add(car);
  rounded(1.86, 0.49, 3.94, 0.19, 0, 0.52, 0, carPaint, car);
  rounded(1.79, 0.35, 3.73, 0.15, 0, 0.7, -0.035, carPaint, car);
  rounded(1.76, 0.16, 3.85, 0.07, 0, 0.32, 0, black, car);
  // Sloping cabin profile extruded across the car gives it a legible sedan silhouette.
  const cabinShape = new THREE.Shape();
  cabinShape.moveTo(-1.34, 0.75);
  cabinShape.lineTo(-0.86, 1.28);
  cabinShape.quadraticCurveTo(-0.72, 1.39, -0.5, 1.4);
  cabinShape.lineTo(0.28, 1.4);
  cabinShape.quadraticCurveTo(0.46, 1.38, 0.59, 1.25);
  cabinShape.lineTo(1.14, 0.75);
  cabinShape.closePath();
  const cabinGeo = geometry(new THREE.ExtrudeGeometry(cabinShape, { depth: 1.48, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.035, bevelThickness: 0.045, curveSegments: 8 }));
  cabinGeo.rotateY(-Math.PI / 2);
  cabinGeo.translate(0.74, 0, 0);
  const cabin = new THREE.Mesh(cabinGeo, glass);
  cabin.castShadow = true;
  car.add(cabin);
  rounded(1.48, 0.075, 0.99, 0.035, 0, 1.43, -0.12, carPaint, car);
  for (const sign of [-1, 1]) {
    box(0.06, 0.66, 0.067, sign * 0.786, 1.09, -0.22, black, car);
    box(0.04, 0.025, 0.22, sign * 0.914, 0.77, -0.42, dark, car);
    box(0.04, 0.025, 0.22, sign * 0.914, 0.77, 0.53, dark, car);
    rounded(0.19, 0.12, 0.29, 0.045, sign * 0.987, 0.91, 0.84, carPaint, car);
    box(.032, .065, .2, sign * 1.087, .92, .82, glass, car);
    // Door shut lines and rocker accents keep the body from reading as one solid block.
    box(.012, .3, .013, sign * .932, .62, -.27, dark, car);
    box(.015, .016, 2.2, sign * .928, .39, -.05, wheelMetal, car);
    const windowTrim = tube([
      new THREE.Vector3(sign * .768, .83, -1.19),
      new THREE.Vector3(sign * .765, 1.29, -.7),
      new THREE.Vector3(sign * .765, 1.43, -.27),
      new THREE.Vector3(sign * .765, 1.37, .37),
      new THREE.Vector3(sign * .765, .84, 1.05),
    ], .016, carPaint, car);
    windowTrim.castShadow = false;
    for (const z of [-1.23, 1.24]) {
      const wheel = new THREE.Mesh(geometry(new THREE.CylinderGeometry(0.36, 0.36, 0.23, 28)), wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(sign * 0.91, 0.36, z);
      wheel.castShadow = true;
      car.add(wheel);
      const hub = new THREE.Mesh(geometry(new THREE.CylinderGeometry(0.251, 0.251, 0.238, 24)), wheelMetal);
      hub.rotation.z = Math.PI / 2;
      hub.position.copy(wheel.position);
      car.add(hub);
      const center = new THREE.Mesh(geometry(new THREE.CylinderGeometry(0.075, 0.075, 0.248, 16)), black);
      center.rotation.z = Math.PI / 2;
      center.position.copy(wheel.position);
      car.add(center);
      for (let spoke = 0; spoke < 5; spoke++) {
        const angle = spoke / 5 * Math.PI * 2;
        const spokeMesh = box(0.016, 0.33, 0.046, sign * 1.035, 0.36, z, dark, car);
        spokeMesh.rotation.x = angle;
      }
    }
  }
  rounded(1.42, 0.042, 0.034, 0.01, 0, 0.74, 1.943, lightMaterial, car);
  rounded(1.48, 0.043, 0.037, 0.01, 0, 0.75, -1.948, red, car);
  box(0.8, 0.075, 0.04, 0, 0.42, 1.978, black, car);
  box(0.25, 0.084, 0.042, 0, 0.57, 1.976, edges, car);
  box(0.018, 0.017, 0.047, 0, 0.79, 1.954, black, car);
  for (const x of [-.58, .58]) {
    box(.19, .036, .023, x, .72, 1.967, lightMaterial, car);
    box(.15, .033, .025, x, .73, -1.973, red, car);
  }

  // Charger on the side wall; a visible cable loops naturally to the parked car.
  const charger = new THREE.Group();
  charger.position.set(4.43, 1.69, 0.08);
  charger.rotation.y = -Math.PI / 2;
  home.add(charger);
  rounded(0.44, 0.78, 0.19, 0.08, 0, 0, 0, edges, charger);
  rounded(0.34, 0.59, 0.055, 0.06, 0, 0.04, 0.12, dark, charger);
  box(0.2, 0.018, 0.01, 0, 0.2, 0.16, lime, charger);
  rounded(.23, .14, .012, .014, 0, .08, .156, black, charger);
  box(.15, .018, .013, 0, .09, .165, lime, charger);
  box(.065, .011, .013, -.042, .048, .165, sage, charger);
  const chargerRing = new THREE.Mesh(geometry(new THREE.TorusGeometry(.04, .007, 6, 18)), lime);
  chargerRing.position.set(0, -.15, .157);
  charger.add(chargerRing);
  tube([
    new THREE.Vector3(4.31, 1.35, 0.08),
    new THREE.Vector3(4.23, 0.73, 0.13),
    new THREE.Vector3(4.12, 0.45, -0.15),
    new THREE.Vector3(3.87, 0.62, -0.66),
    new THREE.Vector3(3.54, 1.03, -1.13),
  ], 0.025, black);
  const chargingPlug = box(0.075, 0.1, 0.21, 3.54, 1.05, -1.1, dark);
  chargingPlug.rotation.x = -0.55;
  // Light on the side of the car indicates a charging session.
  box(0.021, 0.075, 0.12, 3.546, 1.075, -1.0, lime);

  // Meter and inverter on the exposed left wall, connected by realistic conduits.
  rounded(0.15, 1.1, 0.66, 0.03, -4.82, 1.73, 0.23, ivory);
  rounded(0.05, 0.54, 0.46, 0.02, -4.924, 1.89, 0.23, dark);
  const meterFace = new THREE.Mesh(geometry(new THREE.CylinderGeometry(0.164, 0.164, 0.075, 24)), edges);
  meterFace.rotation.z = Math.PI / 2;
  meterFace.position.set(-4.98, 1.9, 0.23);
  home.add(meterFace);
  box(0.012, 0.058, 0.16, -5.025, 1.9, 0.23, black);
  box(0.014, 0.025, 0.08, -5.035, 1.9, 0.23, lime);
  // Meter digits, terminal cover, tamper seal and conduit saddles reward the close view.
  for (let digit = 0; digit < 4; digit++) {
    box(.017, .015, .013, -5.041, 1.9, .181 + digit * .032, dark);
  }
  box(.018, .08, .26, -4.91, 1.43, .23, stucco);
  const seal = cylinder(.023, .014, -4.93, 1.37, .22, red);
  seal.rotation.z = Math.PI / 2;
  for (const y of [2.41, 3.14, 4.2, 5.22]) {
    box(.04, .034, .1, -4.805, y, -.92, wheelMetal);
  }
  for (const z of [-1.18, -.65]) for (const y of [1.36, 2.03]) {
    const fastener = cylinder(.015, .015, -4.943, y, z, wheelMetal);
    fastener.rotation.z = Math.PI / 2;
  }
  rounded(0.18, 0.82, 0.62, 0.055, -4.835, 1.69, -0.92, dark);
  box(0.013, 0.025, 0.24, -4.937, 1.9, -0.92, lime);
  for (let vent = 0; vent < 6; vent++) box(0.014, 0.018, 0.41, -4.937, 1.41 + vent * 0.045, -0.92, black);
  tube([
    new THREE.Vector3(-4.86, 1.24, -0.92),
    new THREE.Vector3(-4.9, 0.8, -0.92),
    new THREE.Vector3(-4.9, 0.74, -0.6),
    new THREE.Vector3(-4.9, 0.8, 0.22),
    new THREE.Vector3(-4.86, 1.14, 0.22),
  ], 0.024, black);
  tube([
    new THREE.Vector3(-4.81, 2.1, -0.92),
    new THREE.Vector3(-4.81, 2.82, -0.92),
    new THREE.Vector3(-4.81, 5.67, -0.92),
    new THREE.Vector3(-4.67, 5.98, -0.92),
    new THREE.Vector3(-4.3, 6.02, -0.92),
  ], 0.02, dark);

  // Layered native-feeling planting: agaves, olive trees and low ornamental grasses.
  const foliageGeo = geometry(new THREE.IcosahedronGeometry(1, 1));
  const plant = (x: number, z: number, scale = 1, y = 0.1) => {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    home.add(group);
    for (let leaf = 0; leaf < 9; leaf++) {
      const angle = leaf * 2.399;
      const length = (0.48 + (leaf % 3) * 0.1) * scale;
      const mesh = new THREE.Mesh(foliageGeo, leaf % 2 ? sage : olive);
      mesh.scale.set(0.075 * scale, length, 0.025 * scale);
      mesh.position.set(Math.cos(angle) * 0.16 * scale, 0.25 * scale, Math.sin(angle) * 0.16 * scale);
      mesh.rotation.set(Math.sin(angle) * 0.64, 0, Math.cos(angle) * 0.64);
      mesh.castShadow = true;
      group.add(mesh);
    }
  };
  const tree = (x: number, z: number, size: number) => {
    cylinder(0.09 * size, 1.65 * size, x, 0.78 * size, z, timber);
    for (let branch = 0; branch < 3; branch++) {
      const a = branch * 2.3;
      const b = cylinder(0.043 * size, 0.85 * size, x + Math.sin(a) * 0.2 * size, 1.45 * size, z + Math.cos(a) * 0.2 * size, timber);
      b.rotation.z = Math.sin(a) * 0.5;
      b.rotation.x = Math.cos(a) * 0.5;
    }
    for (let clump = 0; clump < 7; clump++) {
      const a = clump * 2.399;
      const mesh = new THREE.Mesh(foliageGeo, clump % 3 === 0 ? sage : clump % 3 === 1 ? olive : leafDark);
      mesh.position.set(x + Math.sin(a) * 0.46 * size, (1.8 + clump % 3 * 0.16) * size, z + Math.cos(a) * 0.42 * size);
      mesh.scale.set(0.56 * size, 0.55 * size, 0.5 * size);
      mesh.rotation.y = a;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      home.add(mesh);
    }
  };
  tree(-5.4, -2.8, 1.2);
  tree(5.5, -2.7, 1.12);
  tree(5.75, 3.85, 0.65);
  for (const [x, z, size] of [[-4.9, 3.7, 0.85], [-3.8, 4.35, 0.9], [-5.5, 1.1, 0.6], [-5.75, -0.5, 0.72], [0.02, 3.35, 0.85], [0.38, 4.35, 0.65], [5.54, 1.3, 0.8], [5.55, -0.3, 0.75], [-0.82, 4.55, 0.56]]) plant(x, z, size);
  for (let i = 0; i < 7; i++) plant(4.07, -2 + i * 0.58, 0.5, 3.65);
  const stoneGeo = geometry(new THREE.IcosahedronGeometry(1, 0));
  for (let i = 0; i < 15; i++) {
    const stone = new THREE.Mesh(stoneGeo, i % 2 ? stucco : concrete);
    stone.scale.set(0.11 + i % 3 * 0.027, 0.05, 0.08 + i % 4 * 0.014);
    stone.position.set(-5.8 + (i % 4) * 0.28, 0.075, 2.5 + Math.floor(i / 4) * 0.41);
    stone.rotation.y = i * 1.28;
    stone.receiveShadow = true;
    home.add(stone);
  }
  // Fine perimeter light posts and house-number plaque add human scale.
  for (const x of [-1.13, 4.6]) {
    box(0.09, 0.56, 0.09, x, 0.29, 4.35, dark);
    box(0.095, 0.07, 0.095, x, 0.56, 4.35, lightMaterial);
  }

  // Batch stationary architecture and planting by material. This makes the extra
  // detail affordable on mobile without changing any of the camera-tour behavior.
  home.updateMatrixWorld(true);
  const batches = new Map<string, { material: THREE.Material; meshes: THREE.Mesh[]; castShadow: boolean; receiveShadow: boolean }>();
  home.traverse(object => {
    if (!(object instanceof THREE.Mesh) || object instanceof THREE.InstancedMesh || Array.isArray(object.material)) return;
    const key = `${object.material.uuid}:${object.geometry.index ? 'indexed' : 'plain'}:${Object.keys(object.geometry.attributes).sort().join(',')}`;
    const batch = batches.get(key) ?? { material: object.material, meshes: [] as THREE.Mesh[], castShadow: false, receiveShadow: false };
    batch.meshes.push(object);
    batch.castShadow ||= object.castShadow;
    batch.receiveShadow ||= object.receiveShadow;
    batches.set(key, batch);
  });
  batches.forEach(batch => {
    if (batch.meshes.length < 2) return;
    const pieces = batch.meshes.map(mesh => mesh.geometry.clone().applyMatrix4(mesh.matrixWorld));
    const merged = mergeGeometries(pieces, false);
    pieces.forEach(piece => piece.dispose());
    if (!merged) return;
    const mesh = new THREE.Mesh(geometry(merged), batch.material);
    mesh.castShadow = batch.castShadow;
    mesh.receiveShadow = batch.receiveShadow;
    batch.meshes.forEach(source => source.removeFromParent());
    home.add(mesh);
  });

  // The three floating markers are geometry, so all camera views stay aligned.
  const markers: THREE.Mesh[] = [];
  const markerGeo = geometry(new THREE.SphereGeometry(0.1, 12, 8));
  for (const position of [[-1.1, 6.55, 0.55], [-5.04, 2.52, 0.15], [4.25, 2.3, 0.08]]) {
    const marker = new THREE.Mesh(markerGeo, lime);
    marker.position.set(position[0], position[1], position[2]);
    home.add(marker);
    markers.push(marker);
  }

  // A generated radial contact-shadow texture complements the physical shadows.
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = shadowCanvas.height = 128;
  const ctx = shadowCanvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(64, 64, 10, 64, 64, 62);
    gradient.addColorStop(0, 'rgba(35,49,23,0.28)');
    gradient.addColorStop(0.65, 'rgba(35,49,23,0.13)');
    gradient.addColorStop(1, 'rgba(35,49,23,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    const texture = new THREE.CanvasTexture(shadowCanvas);
    textures.add(texture);
    const shadowMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false });
    materials.add(shadowMat);
    const shadow = new THREE.Mesh(geometry(new THREE.PlaneGeometry(18, 15)), shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -0.56;
    scene.add(shadow);
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const cameraPos = [
    new THREE.Vector3(13, 10.5, 15),
    new THREE.Vector3(8.5, 14.5, 10),
    new THREE.Vector3(-13, 4.8, 6.0),
    new THREE.Vector3(-2.8, 3.45, 13),
  ];
  const cameraTargets = [
    new THREE.Vector3(0, 2.35, 0),
    new THREE.Vector3(-2.1, 5.5, -0.25),
    new THREE.Vector3(-4.25, 2.15, -0.22),
    new THREE.Vector3(2.9, 1.65, 0.1),
  ];
  const cameraSpans = [11.8, 7.5, 5.8, 6.3];
  const currentTarget = cameraTargets[0].clone();
  const desiredTarget = cameraTargets[0].clone();
  const desiredPosition = cameraPos[0].clone();
  camera.position.copy(desiredPosition);
  camera.lookAt(currentTarget);
  let currentSpan = cameraSpans[0];
  let desiredSpan = cameraSpans[0];
  let currentStep = 0;
  let width = 1;
  let height = 1;
  let disposed = false;
  let visible = true;
  let ticking = false;
  let lastTime = 0;
  let dirty = true;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragPointer = -1;
  let yaw = 0;
  let targetYaw = 0;
  let pitch = 0;
  let targetPitch = 0;
  let didRender = false;
  const updateFrustum = () => {
    const aspect = width / height;
    // Fit a wider diorama on narrow screens by expanding vertical field of view.
    const verticalSpan = Math.max(currentSpan, currentSpan * (1.43 / aspect));
    camera.left = -verticalSpan * aspect / 2;
    camera.right = verticalSpan * aspect / 2;
    camera.top = verticalSpan / 2;
    camera.bottom = -verticalSpan / 2;
    camera.updateProjectionMatrix();
  };
  const frame = (time: number) => {
    if (disposed || !visible || document.hidden) {
      renderer.setAnimationLoop(null);
      ticking = false;
      return;
    }
    const delta = Math.min((time - (lastTime || time)) / 1000, 0.06);
    lastTime = time;
    const mix = reducedMotion.matches ? 1 : 1 - Math.exp(-delta * 5.5);
    camera.position.lerp(desiredPosition, mix);
    currentTarget.lerp(desiredTarget, mix);
    currentSpan = THREE.MathUtils.lerp(currentSpan, desiredSpan, mix);
    const isRotating = Math.abs(yaw - targetYaw) > 0.0001 || Math.abs(pitch - targetPitch) > 0.0001;
    yaw = THREE.MathUtils.lerp(yaw, targetYaw, mix);
    pitch = THREE.MathUtils.lerp(pitch, targetPitch, mix);
    if (isRotating) renderer.shadowMap.needsUpdate = true;
    home.rotation.y = yaw;
    home.rotation.x = pitch;
    camera.lookAt(currentTarget);
    updateFrustum();
    const moving = camera.position.distanceToSquared(desiredPosition) > 0.00003 || currentTarget.distanceToSquared(desiredTarget) > 0.00003 || Math.abs(currentSpan - desiredSpan) > 0.003 || Math.abs(yaw - targetYaw) > 0.0001 || Math.abs(pitch - targetPitch) > 0.0001;
    if (moving || dirty) {
      renderer.render(scene, camera);
      dirty = false;
      if (!didRender) {
        didRender = true;
        options.onReady?.();
      }
    }
    if (!moving) {
      renderer.setAnimationLoop(null);
      ticking = false;
    }
  };
  const requestRender = () => {
    dirty = true;
    if (!disposed && visible && !document.hidden && !ticking) {
      ticking = true;
      lastTime = 0;
      renderer.setAnimationLoop(frame);
    }
  };
  const resize = () => {
    const bounds = container.getBoundingClientRect();
    width = Math.max(bounds.width, 1);
    height = Math.max(bounds.height, 1);
    renderer.setSize(width, height, false);
    updateFrustum();
    requestRender();
  };
  const setStep = (step: number) => {
    currentStep = Math.max(0, Math.min(3, Math.round(step)));
    desiredPosition.copy(cameraPos[currentStep]);
    desiredTarget.copy(cameraTargets[currentStep]);
    desiredSpan = cameraSpans[currentStep];
    targetYaw = targetPitch = 0;
    markers.forEach((marker, index) => { marker.visible = currentStep === 0 || index === currentStep - 1; });
    if (reducedMotion.matches) {
      camera.position.copy(desiredPosition);
      currentTarget.copy(desiredTarget);
      currentSpan = desiredSpan;
      yaw = pitch = 0;
    }
    requestRender();
  };
  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType === 'touch' || event.button !== 0 || reducedMotion.matches) return;
    dragPointer = event.pointerId;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    renderer.domElement.setPointerCapture(event.pointerId);
    renderer.domElement.style.cursor = 'grabbing';
  };
  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerId !== dragPointer) return;
    targetYaw = THREE.MathUtils.clamp(targetYaw + (event.clientX - dragStartX) * 0.003, -0.4, 0.4);
    targetPitch = THREE.MathUtils.clamp(targetPitch + (event.clientY - dragStartY) * 0.0015, -0.08, 0.08);
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    // Only rotating the model requires a shadow update. Static camera tours reuse shadows.
    renderer.shadowMap.needsUpdate = true;
    requestRender();
  };
  const onPointerUp = (event: PointerEvent) => {
    if (event.pointerId !== dragPointer) return;
    dragPointer = -1;
    if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId);
    renderer.domElement.style.cursor = 'grab';
  };
  const onVisibility = () => requestRender();
  const onMotion = () => { if (reducedMotion.matches) setStep(currentStep); };
  const onContextLost = (event: Event) => {
    event.preventDefault();
    renderer.setAnimationLoop(null);
    ticking = false;
    container.dispatchEvent(new CustomEvent('house-scene-error', { detail: 'webgl-context-lost' }));
  };
  const onContextRestored = () => { didRender = false; renderer.shadowMap.needsUpdate = true; requestRender(); };
  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  renderer.domElement.addEventListener('pointermove', onPointerMove);
  renderer.domElement.addEventListener('pointerup', onPointerUp);
  renderer.domElement.addEventListener('pointercancel', onPointerUp);
  renderer.domElement.addEventListener('webglcontextlost', onContextLost);
  renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);
  document.addEventListener('visibilitychange', onVisibility);
  reducedMotion.addEventListener('change', onMotion);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  const intersectionObserver = new IntersectionObserver(entries => {
    visible = entries[0]?.isIntersecting ?? true;
    if (visible) requestRender();
    else { renderer.setAnimationLoop(null); ticking = false; }
  }, { rootMargin: '150px' });
  intersectionObserver.observe(container);
  renderer.shadowMap.needsUpdate = true;
  resize();

  return {
    setStep,
    dispose() {
      if (disposed) return;
      disposed = true;
      renderer.setAnimationLoop(null);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      reducedMotion.removeEventListener('change', onMotion);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointercancel', onPointerUp);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
      geometries.forEach(item => item.dispose());
      materials.forEach(item => item.dispose());
      textures.forEach(item => item.dispose());
      cells.dispose();
      cellLines.dispose();
      environment.dispose();
      sun.shadow.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

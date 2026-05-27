import * as THREE from 'three';

// ---------- Renderer & scene ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9bd5ff);
scene.fog = new THREE.Fog(0x9bd5ff, 30, 80);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  200
);
const EYE_HEIGHT = 1.7;
camera.position.set(0, EYE_HEIGHT, 4);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// ---------- Lights ----------
const hemi = new THREE.HemisphereLight(0xfff7e6, 0x6b8e6b, 0.6);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xffffff, 1.0);
sun.position.set(8, 14, 6);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -15;
sun.shadow.camera.right = 15;
sun.shadow.camera.top = 15;
sun.shadow.camera.bottom = -15;
scene.add(sun);

// ---------- Ground ----------
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: 0x6ea96e })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Subtle grid so movement is readable
const grid = new THREE.GridHelper(200, 100, 0x4a7c4a, 0x4a7c4a);
(grid.material as THREE.Material).opacity = 0.25;
(grid.material as THREE.Material).transparent = true;
scene.add(grid);

// ---------- Astronaut character ----------
// Chibi astronaut built from primitives to match the reference sheet:
// big rounded helmet with flat gray visor, stubby white suit body, small limbs,
// rounded backpack and chest control panel.
function buildAstronaut(): THREE.Group {
  const group = new THREE.Group();
  const suit = new THREE.MeshStandardMaterial({ color: 0xf2f2ef, roughness: 0.7 });
  const accent = new THREE.MeshStandardMaterial({ color: 0xe2e2dc, roughness: 0.7 });
  const visorMat = new THREE.MeshStandardMaterial({
    color: 0x888888,
    roughness: 1.0,
    metalness: 0.0,
  });
  const panelMat = new THREE.MeshStandardMaterial({ color: 0xd9d9d9, roughness: 0.6 });

  // Legs
  const legGeom = new THREE.CapsuleGeometry(0.14, 0.18, 8, 16);
  const legL = new THREE.Mesh(legGeom, suit);
  legL.position.set(-0.16, 0.22, 0);
  legL.castShadow = true;
  group.add(legL);
  const legR = legL.clone();
  legR.position.x = 0.16;
  group.add(legR);

  // Boots
  const bootGeom = new THREE.BoxGeometry(0.22, 0.1, 0.28);
  const bootL = new THREE.Mesh(bootGeom, accent);
  bootL.position.set(-0.16, 0.05, 0.02);
  bootL.castShadow = true;
  group.add(bootL);
  const bootR = bootL.clone();
  bootR.position.x = 0.16;
  group.add(bootR);

  // Torso (stubby capsule, slightly tapered with a sphere on top)
  const torso = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.32, 0.28, 12, 24),
    suit
  );
  torso.position.y = 0.72;
  torso.castShadow = true;
  group.add(torso);

  // Chest control panel
  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.14, 0.04),
    panelMat
  );
  panel.position.set(0, 0.7, 0.32);
  panel.castShadow = true;
  group.add(panel);

  // Tiny screen on panel
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.08, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2a })
  );
  screen.position.set(-0.04, 0.74, 0.343);
  group.add(screen);

  // Colored buttons (red/green/blue/yellow)
  const buttonColors = [0xe25555, 0x55c060, 0x4a8fdc, 0xe5b941];
  buttonColors.forEach((c, i) => {
    const btn = new THREE.Mesh(
      new THREE.CircleGeometry(0.012, 12),
      new THREE.MeshStandardMaterial({ color: c })
    );
    const col = i % 2;
    const row = Math.floor(i / 2);
    btn.position.set(0.03 + col * 0.04, 0.72 - row * 0.04, 0.343);
    group.add(btn);
  });

  // Backpack
  const backpack = new THREE.Mesh(
    new THREE.BoxGeometry(0.46, 0.42, 0.18),
    accent
  );
  backpack.position.set(0, 0.78, -0.32);
  backpack.castShadow = true;
  group.add(backpack);

  // Arms
  const armGeom = new THREE.CapsuleGeometry(0.1, 0.26, 8, 16);
  const armL = new THREE.Mesh(armGeom, suit);
  armL.position.set(-0.42, 0.72, 0);
  armL.castShadow = true;
  group.add(armL);
  const armR = armL.clone();
  armR.position.x = 0.42;
  group.add(armR);

  // Gloves
  const gloveGeom = new THREE.SphereGeometry(0.12, 16, 16);
  const gloveL = new THREE.Mesh(gloveGeom, accent);
  gloveL.position.set(-0.42, 0.5, 0);
  gloveL.castShadow = true;
  group.add(gloveL);
  const gloveR = gloveL.clone();
  gloveR.position.x = 0.42;
  group.add(gloveR);

  // Helmet
  const helmet = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 32, 32),
    suit
  );
  helmet.position.y = 1.3;
  helmet.castShadow = true;
  group.add(helmet);

  // Visor — FLAT gray rectangle on the front of the helmet.
  // Slightly recessed so it reads as a screen / portrait frame.
  const visor = new THREE.Mesh(
    new THREE.PlaneGeometry(0.5, 0.36),
    visorMat
  );
  visor.position.set(0, 1.3, 0.395);
  group.add(visor);

  // Visor frame (thin ring around it for readability)
  const frameGeom = new THREE.RingGeometry(0.27, 0.31, 32);
  const frame = new THREE.Mesh(
    frameGeom,
    new THREE.MeshStandardMaterial({ color: 0xe6e6e2 })
  );
  frame.position.set(0, 1.3, 0.396);
  group.add(frame);

  // Small ear-piece bumps on each side of the helmet
  const earGeom = new THREE.SphereGeometry(0.08, 12, 12);
  const earL = new THREE.Mesh(earGeom, accent);
  earL.position.set(-0.38, 1.25, 0);
  group.add(earL);
  const earR = earL.clone();
  earR.position.x = 0.38;
  group.add(earR);

  return group;
}

const astronaut = buildAstronaut();
astronaut.position.set(0, 0, 0);
scene.add(astronaut);

// ---------- FPV controls ----------
let yaw = 0;
let pitch = 0;
let isLocked = false;
const overlay = document.getElementById('overlay')!;

const requestLock = () => {
  document.body.requestPointerLock?.();
};

overlay.addEventListener('click', requestLock);

document.addEventListener('pointerlockchange', () => {
  isLocked = document.pointerLockElement === document.body;
  overlay.classList.toggle('hidden', isLocked);
});

document.addEventListener('mousemove', (e) => {
  if (!isLocked) return;
  yaw -= e.movementX * 0.0022;
  pitch -= e.movementY * 0.0022;
  const limit = Math.PI / 2 - 0.05;
  pitch = Math.max(-limit, Math.min(limit, pitch));
  const euler = new THREE.Euler(pitch, yaw, 0, 'YXZ');
  camera.quaternion.setFromEuler(euler);
});

// ZQSD (AZERTY) + WASD (QWERTY) fallback
const keys: Record<string, boolean> = {};
document.addEventListener('keydown', (e) => {
  keys[e.code] = true;
});
document.addEventListener('keyup', (e) => {
  keys[e.code] = false;
});

const SPEED = 5.5;
const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const move = new THREE.Vector3();
const clock = new THREE.Clock();

function tick() {
  const dt = Math.min(clock.getDelta(), 0.1);

  camera.getWorldDirection(forward);
  forward.y = 0;
  forward.normalize();
  right.crossVectors(forward, camera.up).normalize();

  move.set(0, 0, 0);
  if (keys['KeyZ'] || keys['KeyW']) move.add(forward);
  if (keys['KeyS']) move.sub(forward);
  if (keys['KeyQ'] || keys['KeyA']) move.sub(right);
  if (keys['KeyD']) move.add(right);

  if (move.lengthSq() > 0) {
    move.normalize().multiplyScalar(SPEED * dt);
    camera.position.add(move);
  }
  camera.position.y = EYE_HEIGHT;

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();

// ---------- Resize ----------
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

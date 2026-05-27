import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

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
// Loaded from the Blender-procedural GLB. The 'Visor' mesh is named so it
// can be retrieved here and its material swapped at runtime with the
// player's photo.
const loader = new GLTFLoader();
loader.load('/astronaut.glb', (gltf) => {
  const astronaut = gltf.scene;
  astronaut.position.set(0, 0, 0);
  astronaut.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
  scene.add(astronaut);
}, undefined, (err) => {
  console.error('Failed to load astronaut.glb', err);
});

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

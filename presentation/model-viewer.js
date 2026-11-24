// Drag-to-rotate GLB viewer for the deck. Uses the three.js copy shipped with the inspection scene.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const loader = new GLTFLoader();

export async function mountModel(host, { src, upZ = false, elevation = 0.28, azimuth = 0.7, autoRotate = true, color, mirrorX = false, direction, onReady }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  host.append(renderer.domElement);

  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb9c9bf, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(3, 5, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xdff3e7, 1.1);
  rim.position.set(-4, 2, -3);
  scene.add(rim);

  const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 100);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.autoRotate = autoRotate;
  controls.autoRotateSpeed = 1.4;
  controls.addEventListener("start", () => { controls.autoRotate = false; });

  const gltf = await loader.loadAsync(src);
  const model = gltf.scene;
  if (upZ) model.rotation.x = -Math.PI / 2;
  if (color) {
    const material = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.2 });
    model.traverse(node => { if (node.isMesh) node.material = material; });
  }
  if (mirrorX) model.scale.x *= -1;
  scene.add(model);
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  model.position.sub(center);
  const radius = size.length() / 2;
  const distance = radius / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2)) * 1.02;
  if (direction) {
    camera.position.copy(new THREE.Vector3(...direction).normalize().multiplyScalar(distance * 0.82));
  } else {
    camera.position.set(
      Math.sin(azimuth) * Math.cos(elevation) * distance,
      Math.sin(elevation) * distance,
      Math.cos(azimuth) * Math.cos(elevation) * distance
    );
  }
  camera.near = distance / 100;
  camera.far = distance * 10;
  camera.updateProjectionMatrix();
  controls.target.set(0, 0, 0);
  controls.minPolarAngle = 0.15;
  controls.maxPolarAngle = Math.PI - 0.15;

  const resize = () => {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();
  onReady?.();

  const tick = () => {
    if (!host.isConnected) {
      observer.disconnect();
      controls.dispose();
      renderer.dispose();
      scene.traverse(node => { node.geometry?.dispose?.(); });
      return;
    }
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

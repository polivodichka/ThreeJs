// Imports
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";
import { RGBELoader, TextGeometry } from "three/examples/jsm/Addons.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";

// GUI Setup
const gui = new GUI();

// Constants and Configuration
const textObject = {
  line: "Anastasia",
  toggleStandartMaterial: () => toggleMaterial("isStandartMaterial"),
  toggleNormalMaterial: () => toggleMaterial("isNormalMaterial"),
  toggleMatcapMaterial: () => toggleMaterial("isMatcapMaterial"),
};

// Scene Setup
const canvas = document.querySelector("canvas.webgl");
const scene = new THREE.Scene();

// Window Sizing and Resize Handler
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Materials Configuration
const standartMaterialFolder = gui.addFolder("StandartMaterial");
standartMaterialFolder
  .add(textObject, "toggleStandartMaterial")
  .name("Применить StandartMaterial");

const material = new THREE.MeshPhysicalMaterial({
  metalness: 0,
  roughness: 0,
  transparent: true,
  iridescence: 1,
  iridescenceIOR: 1.3,
  iridescenceThicknessRange: [100, 800],
  transmission: 1,
  ior: 2.41,
  thickness: 2,
});

const bubbleMaterial = material.clone();
bubbleMaterial.thickness = 0.1;

// GUI Controls Setup
function setupMaterialControls() {
  // Standard Material Controls
  standartMaterialFolder
    .add(material, "metalness")
    .min(0)
    .max(1)
    .step(0.001)
    .name("Металлизация");
  standartMaterialFolder
    .add(material, "roughness")
    .min(0)
    .max(1)
    .step(0.001)
    .name("Шероховатость");

  // Iridescence Controls
  const iridescenceFolder = standartMaterialFolder.addFolder("Переливчатость");
  iridescenceFolder.open();
  iridescenceFolder
    .add(material, "iridescence")
    .min(0)
    .max(1)
    .step(0.001)
    .name("Интенсивность");
  iridescenceFolder
    .add(material, "iridescenceIOR")
    .min(1)
    .max(2.5)
    .step(0.001)
    .name("Коэф. преломления");
  iridescenceFolder
    .add(material.iridescenceThicknessRange, "0")
    .min(0)
    .max(1000)
    .step(1)
    .name("Толщина пленки от");
  iridescenceFolder
    .add(material.iridescenceThicknessRange, "1")
    .min(0)
    .max(1000)
    .step(1)
    .name("Толщина пленки до");

  // Transparency Controls
  standartMaterialFolder
    .add(material, "transmission")
    .min(0)
    .max(1)
    .step(0.001)
    .name("Прозрачность");
  standartMaterialFolder
    .add(material, "ior")
    .min(1)
    .max(10)
    .step(0.001)
    .name("Коэф. преломления");
  standartMaterialFolder
    .add(material, "thickness")
    .min(0)
    .max(10)
    .step(0.001)
    .name("Толщина");
}

setupMaterialControls();

// Additional Materials Setup
const normalMaterial = new THREE.MeshNormalMaterial();
const textureObject = { index: 1 };
const textureLoader = new THREE.TextureLoader();
const matcapMaterial = new THREE.MeshMatcapMaterial();

// Texture Management
const loadAndSetTexture = () => {
  let matcapTexture = textureLoader.load(
    `./textures/matcaps/${textureObject.index}.png`
  );
  matcapTexture.colorSpace = THREE.SRGBColorSpace;
  matcapMaterial.matcap = matcapTexture;
};

loadAndSetTexture();

// Environment Setup
const rgbeLoader = new RGBELoader();
rgbeLoader.load("./textures/environmentMap/skies.hdr", (environmentMap) => {
  environmentMap.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = environmentMap;
  scene.environment = environmentMap;
});

// Text System Setup
const fontLoader = new FontLoader();
let text;
let textGeometry;
let font;

function createText() {
  if (text) {
    scene.remove(text);
    textGeometry.dispose();
  }

  textGeometry = new TextGeometry(textObject.line, {
    font,
    size: 0.5,
    depth: 0.2,
    curveSegments: 12,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.02,
    bevelOffset: 0,
    bevelSegments: 5,
  });

  textGeometry.center();

  text = new THREE.Mesh(
    textGeometry,
    currentMaterial.isNormalMaterial
      ? normalMaterial
      : currentMaterial.isMatcapMaterial
      ? matcapMaterial
      : material
  );
  text.position.y = 1.5;

  scene.add(text);
}

function updateText() {
  if (!textGeometry) return;
  createText();
}

// Material State Management
const currentMaterial = {
  isNormalMaterial: false,
  isMatcapMaterial: false,
  isStandartMaterial: true,
};

const toggleMaterial = (materialKey) => {
  if (!currentMaterial.hasOwnProperty(materialKey)) return;

  Object.keys(currentMaterial).forEach((material) => {
    currentMaterial[material] = false;
  });

  currentMaterial[materialKey] = true;
  updateText();
};

// Additional GUI Controls
const normalMaterialFolder = gui.addFolder("NormalMaterial");
normalMaterialFolder.add(textObject, "toggleNormalMaterial").name("Применить NormalMaterial");

const matcapFolder = gui.addFolder("MatcapMaterial");
matcapFolder
  .add(textObject, "toggleMatcapMaterial")
  .name("Применить MatcapMaterial");
matcapFolder
  .add(textureObject, "index")
  .min(1)
  .max(8)
  .step(1)
  .onFinishChange(loadAndSetTexture)
  .name("Matcap текстура");

gui.add(textObject, "line").onFinishChange(updateText).name("Текст");

// Font Loading
fontLoader.load("/fonts/gentilis_bold.typeface.json", (readyFont) => {
  font = readyFont;
  createText();
});

// Scene Objects Setup
function createSceneObjects() {
  const spreadRadius = 15;
  const numberOfObjects = 500;
  const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
  const meshesGroup = new THREE.Group();

  for (let i = 0; i < numberOfObjects; i++) {
    const mesh = new THREE.Mesh(sphereGeometry, bubbleMaterial);
    meshesGroup.add(mesh);

    mesh.position.x = (Math.random() - 0.5) * spreadRadius;
    mesh.position.y = (Math.random() - 0.5) * spreadRadius;
    mesh.position.z = (Math.random() - 0.5) * spreadRadius;

    const scale = Math.random();
    mesh.scale.set(scale, scale, scale);

    mesh.rotation.x = Math.random() * Math.PI;
    mesh.rotation.y = Math.random() * Math.PI;
  }

  scene.add(meshesGroup);
  return meshesGroup;
}

const meshesGroup = createSceneObjects();

// Camera and Controls Setup
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(1, 1, 2);
scene.add(camera);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

// Renderer Setup
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Animation System
function animate() {
  const clock = new THREE.Clock();

  function tick() {
    const elapsedTime = clock.getElapsedTime();

    // Animate objects
    if (text) text.position.y = Math.sin(elapsedTime) * 0.5;
    meshesGroup.rotation.y = elapsedTime * 0.04;

    // Update controls
    controls.update();

    // Render
    renderer.render(scene, camera);

    // Continue animation loop
    window.requestAnimationFrame(tick);
  }

  tick();
}

animate();

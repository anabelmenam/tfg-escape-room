import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createEtsiit } from "../world/etsiit.js";
export class Game {
  constructor(container) {
    this.container = container;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x202020);

    // Camera
    this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    this.camera.position.set(0, 150, 200);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    this.controls.enablePan = true;
    this.controls.enableZoom = true;
    this.controls.enableRotate = true;

    this.controls.zoomSpeed = 3;

    this.controls.target.set(0, 0, 0);
    this.controls.update();

    // Raycaster
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.doors = [];

    this._onPointerDown = (event) => this.onPointerDown(event);
    this.renderer.domElement.addEventListener("pointerdown", this._onPointerDown);

    // Lights
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const dir = new THREE.DirectionalLight(0xffffff, 1);
    dir.position.set(6, 10, 6);
    this.scene.add(dir);

    // Helpers (muy útil al principio)
    //this.scene.add(new THREE.GridHelper(500, 500));
    this.scene.add(new THREE.AxesHelper(2));

    this.init();

    // Resize
    this._onResize = () => this.resize();
    window.addEventListener("resize", this._onResize);

    // Loop
    this.rafId = 0;
    this.loop = this.loop.bind(this);
    this.loop();
  }

  onPointerDown(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();

    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const intersects = this.raycaster.intersectObjects(this.doors, true);

    if (intersects.length === 0) return;

    let clicked = intersects[0].object;

    while (clicked && !clicked.userData.isDoor) {
      clicked = clicked.parent;
    }

    if (!clicked) return;

    clicked.userData.isOpen = !clicked.userData.isOpen;
    clicked.userData.targetAngle = clicked.userData.isOpen ? clicked.userData.openAngle : clicked.userData.closedAngle;
  }

  updateDoors() {
    for (const door of this.doors) {
      const target = door.userData.targetAngle ?? 0;
      door.rotation.z += (target - door.rotation.z) * 0.1;
    }
  }

  async init() {
    const textureLoader = new THREE.TextureLoader();
    const floorTexture = textureLoader.load("/textures/grass.jpg");
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(100, 100);

    // World
    const floorGeometry = new THREE.PlaneGeometry(500, 500);
    const floorMaterial = new THREE.MeshStandardMaterial({
      map: floorTexture,
    });

    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;

    this.scene.add(floor);
    const { etsiit, doors } = await createEtsiit();
    this.scene.add(etsiit);
    this.doors = doors;
  }

  resize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (!w || !h) return;

    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  loop() {
    this.rafId = requestAnimationFrame(this.loop);
    this.controls.update();
    this.updateDoors();
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    cancelAnimationFrame(this.rafId);
    window.removeEventListener("resize", this._onResize);

    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
    this.renderer.domElement.removeEventListener("pointerdown", this._onPointerDown);
    this.renderer.dispose();
  }
}

import * as THREE from "three";
import { Entity } from "../Entity.js";
import { tInteraction, tItem } from "../../../translations/index.js";

const createMesh = (geometry, material, position, { rotationX = 0 } = {}) => {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position);
  mesh.rotation.x = rotationX;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
};

class Bathtub extends Entity {
  constructor({
    id = "bathroom-bathtub",
    position = new THREE.Vector3(),
    rotationY = 0,
    scale = 1,
    heightScale = 1,
    lengthScale = 1,
    fixtureColor = 0xf1ead9,
    metalColor = 0xb9aa83,
  } = {}) {
    super(id);
    this.object3D = new THREE.Group();
    this.object3D.name = id;
    this.object3D.position.copy(position);
    this.object3D.rotation.y = rotationY;
    this.object3D.scale.set(scale, scale * heightScale, scale * lengthScale);
    this.waterFill = 0;
    this.waterFillTarget = 0;
    this.isWaterRunning = false;

    const porcelain = new THREE.MeshStandardMaterial({ color: fixtureColor, roughness: 0.3 });
    const inside = new THREE.MeshStandardMaterial({ color: fixtureColor, roughness: 0.38 });
    const metal = new THREE.MeshStandardMaterial({ color: metalColor, roughness: 0.24, metalness: 0.72 });

    this.object3D.add(
      createMesh(new THREE.BoxGeometry(2.9, 0.22, 5.7), porcelain, new THREE.Vector3(0, 0.11, 0)),
      createMesh(new THREE.BoxGeometry(2.25, 0.12, 4.95), inside, new THREE.Vector3(0, 0.29, 0)),
      createMesh(new THREE.BoxGeometry(2.9, 1.34, 0.3), porcelain, new THREE.Vector3(0, 0.78, -2.7)),
      createMesh(new THREE.BoxGeometry(2.9, 1.34, 0.3), porcelain, new THREE.Vector3(0, 0.78, 2.7)),
      createMesh(new THREE.BoxGeometry(0.3, 1.34, 5.1), porcelain, new THREE.Vector3(-1.3, 0.78, 0)),
      createMesh(new THREE.BoxGeometry(0.3, 1.34, 5.1), porcelain, new THREE.Vector3(1.3, 0.78, 0)),
    );

    [
      [2.9, 0.22, 0.3, 0, 1.58, -2.7],
      [2.9, 0.22, 0.3, 0, 1.58, 2.7],
      [0.3, 0.22, 5.1, -1.3, 1.58, 0],
      [0.3, 0.22, 5.1, 1.3, 1.58, 0],
    ].forEach(([width, height, depth, x, y, z]) => {
      this.object3D.add(createMesh(new THREE.BoxGeometry(width, height, depth), porcelain, new THREE.Vector3(x, y, z)));
    });

    this.faucet = new THREE.Group();
    this.faucet.name = `${id}-tap`;
    const faucetStem = createMesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.7, 16),
      metal,
      new THREE.Vector3(0.65, 1.95, -2.35),
    );
    const faucetNeck = createMesh(
      new THREE.CylinderGeometry(0.07, 0.07, 0.65, 16),
      metal,
      new THREE.Vector3(0.65, 2.27, -2.05),
      { rotationX: Math.PI / 2 },
    );
    const faucetOutlet = createMesh(
      new THREE.CylinderGeometry(0.07, 0.07, 0.18, 16),
      metal,
      new THREE.Vector3(0.65, 2.18, -1.73),
    );
    this.faucetLever = new THREE.Group();
    this.faucetLever.position.set(0.32, 1.73, -2.35);
    const leverJoint = createMesh(new THREE.SphereGeometry(0.11, 16, 10), metal, new THREE.Vector3());
    const leverBar = createMesh(new THREE.BoxGeometry(0.36, 0.07, 0.08), metal, new THREE.Vector3(0.18, 0, 0));
    this.faucetLever.add(leverJoint, leverBar);
    this.faucet.add(faucetStem, faucetNeck, faucetOutlet, this.faucetLever);

    const waterMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x69b7cb,
      transparent: true,
      opacity: 0.64,
      roughness: 0.12,
      transmission: 0.16,
      depthWrite: false,
    });
    this.waterSurface = createMesh(
      new THREE.BoxGeometry(2.34, 0.045, 5.14),
      waterMaterial,
      new THREE.Vector3(0, 0.35, 0),
    );
    this.waterSurface.visible = false;
    this.waterSurface.userData.ignoreAging = true;
    this.waterSurface.renderOrder = 2;
    this.waterStream = createMesh(
      new THREE.CylinderGeometry(0.025, 0.035, 1, 12),
      waterMaterial.clone(),
      new THREE.Vector3(0.65, 1.22, -1.73),
    );
    this.waterStream.visible = false;
    this.waterStream.userData.ignoreAging = true;

    this.object3D.add(this.faucet, this.waterSurface, this.waterStream);
  }

  toggleWater() {
    this.isWaterRunning = !this.isWaterRunning;
    this.waterFillTarget = this.isWaterRunning ? 1 : 0;
    this.waterStream.visible = this.isWaterRunning;
    this.waterSurface.visible = this.isWaterRunning || this.waterFill > 0.01;
    this.faucetLever.rotation.z = this.isWaterRunning ? Math.PI / 3 : 0;
  }

  getInteractables() {
    return [
      {
        id: `${this.id}-tap`,
        object3D: this.faucet,
        enabled: true,
        interact: () => this.toggleWater(),
        getInteractionText: () =>
          this.isWaterRunning ? tInteraction("turnOff", tItem("tap")) : tInteraction("turnOn", tItem("tap")),
      },
    ];
  }

  update(deltaTime) {
    this.waterFill = THREE.MathUtils.damp(this.waterFill, this.waterFillTarget, 0.8, deltaTime);
    const fill = THREE.MathUtils.smoothstep(this.waterFill, 0, 1);
    this.waterSurface.position.y = THREE.MathUtils.lerp(0.35, 1.49, fill);
    const streamTopY = 2.09;
    const streamHeight = streamTopY - this.waterSurface.position.y;
    this.waterStream.position.y = this.waterSurface.position.y + streamHeight / 2;
    this.waterStream.scale.y = streamHeight;
    this.waterSurface.visible = this.isWaterRunning || this.waterFill > 0.01;
  }

  getCollider() {
    this.object3D.updateMatrixWorld(true);
    return new THREE.Box3().setFromObject(this.object3D);
  }
}

export { Bathtub };

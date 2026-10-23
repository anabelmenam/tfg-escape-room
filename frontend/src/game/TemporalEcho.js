import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const mergeStaticMeshes = (group) => {
  [...group.children].filter((child) => child.isGroup).forEach(mergeStaticMeshes);
  const meshesByMaterial = new Map();
  [...group.children].filter((child) => child.isMesh).forEach((mesh) => {
    const entries = meshesByMaterial.get(mesh.material) ?? [];
    entries.push(mesh);
    meshesByMaterial.set(mesh.material, entries);
  });
  meshesByMaterial.forEach((meshes, material) => {
    if (meshes.length < 2) return;
    const geometries = meshes.map((mesh) => {
      mesh.updateMatrix();
      return mesh.geometry.clone().applyMatrix4(mesh.matrix);
    });
    const geometry = mergeGeometries(geometries, false);
    geometries.forEach((entry) => entry.dispose());
    if (!geometry) return;
    meshes.forEach((mesh) => { group.remove(mesh); mesh.geometry.dispose(); });
    const merged = new THREE.Mesh(geometry, material);
    merged.renderOrder = 3;
    group.add(merged);
  });
};

const drawName = (canvas, label, color) => {
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.font = "bold 54px Georgia";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.shadowColor = color;
  context.shadowBlur = 22;
  context.fillStyle = "#fffaf0";
  context.fillText(label, canvas.width / 2, canvas.height / 2);
};

const makeNameSprite = (label, color) => {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  drawName(canvas, label, color);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
  sprite.scale.set(3.25, .81, 1);
  sprite.position.y = 6.42;
  sprite.userData.canvas = canvas;
  sprite.userData.texture = texture;
  return sprite;
};

const ghostMaterial = (color, opacity, emissiveIntensity = .42) => new THREE.MeshStandardMaterial({
  color,
  emissive: color,
  emissiveIntensity,
  transparent: true,
  opacity,
  roughness: .58,
  metalness: .05,
  depthWrite: false,
  side: THREE.FrontSide,
});

const makePlaidMaterial = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  context.fillStyle = "#352628";
  context.fillRect(0, 0, 128, 128);
  context.fillStyle = "rgba(123,48,39,.55)";
  [0, 32, 64, 96].forEach((offset) => context.fillRect(offset, 0, 12, 128));
  context.fillStyle = "rgba(171,118,72,.28)";
  [18, 82].forEach((offset) => context.fillRect(offset, 0, 4, 128));
  context.fillStyle = "rgba(123,48,39,.5)";
  [0, 32, 64, 96].forEach((offset) => context.fillRect(0, offset, 128, 10));
  context.fillStyle = "rgba(214,170,106,.22)";
  [19, 83].forEach((offset) => context.fillRect(0, offset, 128, 3));
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return new THREE.MeshStandardMaterial({ map: texture, color: 0xffffff, emissive: 0x512b27, emissiveIntensity: .18, transparent: true, opacity: .74, roughness: .78, depthWrite: false, side: THREE.FrontSide });
};

class TemporalEcho {
  constructor({ role = "mama", name = "" } = {}) {
    this.role = role;
    this.name = name;
    this.object3D = new THREE.Group();
    this.object3D.name = `eco-${role}`;
    this.object3D.visible = false;
    this.targetPosition = new THREE.Vector3();
    this.targetRotationY = 0;
    this.hasPosition = false;
    this.walkTime = 0;
    this.lastTarget = new THREE.Vector3();

    this.color = role === "mama" ? 0x82d8eb : 0xb09ae0;
    const skin = ghostMaterial(role === "mama" ? 0xd8b09b : 0xc79d87, .48, .13);
    const cloth = ghostMaterial(role === "mama" ? 0x962f28 : 0x253e64, .53, .16);
    const clothDark = role === "mama" ? makePlaidMaterial() : ghostMaterial(0x68605a, .55, .1);
    if (role === "mama") clothDark.opacity = .55;
    const hair = ghostMaterial(role === "mama" ? 0x6b3628 : 0x2d211d, .6, .07);
    const detail = ghostMaterial(0xe8ddc8, .57, .12);
    const eyeMaterial = ghostMaterial(0x151c22, .68, .04);
    const lipMaterial = ghostMaterial(0x8b4d51, .55, .08);
    const sole = ghostMaterial(0x191d21, .56, .08);
    const addPart = (geometry, position, material = cloth, parent = this.object3D, scale = null) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...position);
      if (scale) mesh.scale.set(...scale);
      mesh.renderOrder = 3;
      parent.add(mesh);
      return mesh;
    };

    const neck = addPart(new THREE.CylinderGeometry(.24, .28, .4, 16), [0, 4.72, 0], skin);
    neck.scale.z = .9;
    addPart(new THREE.SphereGeometry(.57, 20, 16), [0, 5.35, 0], skin, this.object3D, [.92, 1.08, .88]);
    addPart(new THREE.SphereGeometry(.13, 12, 8), [-.52, 5.34, 0], skin, this.object3D, [.55, 1, .7]);
    addPart(new THREE.SphereGeometry(.13, 12, 8), [.52, 5.34, 0], skin, this.object3D, [.55, 1, .7]);
    addPart(new THREE.SphereGeometry(.052, 8, 6), [-.19, 5.43, -.49], eyeMaterial);
    addPart(new THREE.SphereGeometry(.052, 8, 6), [.19, 5.43, -.49], eyeMaterial);
    const browLeft = addPart(new THREE.CapsuleGeometry(.025, .22, 5, 8), [-.19, 5.57, -.5], hair);
    const browRight = addPart(new THREE.CapsuleGeometry(.025, .22, 5, 8), [.19, 5.57, -.5], hair);
    browLeft.rotation.z = Math.PI / 2 - .08;
    browRight.rotation.z = Math.PI / 2 + .08;
    const nose = addPart(new THREE.ConeGeometry(.07, .19, 10), [0, 5.28, -.56], skin);
    nose.rotation.x = -Math.PI / 2;
    const mouth = addPart(new THREE.CapsuleGeometry(.022, .19, 5, 8), [0, 5.08, -.52], lipMaterial);
    mouth.rotation.z = Math.PI / 2;

    if (role === "mama") {
      const hairCap = addPart(new THREE.SphereGeometry(.62, 22, 17, 0, Math.PI * 2, 0, Math.PI * .66), [0, 5.58, .1], hair);
      hairCap.scale.set(1.06, .84, 1);
      const bob = addPart(new THREE.SphereGeometry(.61, 22, 17, 0, Math.PI * 2, .42, Math.PI * .7), [0, 5.25, .2], hair);
      bob.scale.set(1.08, .92, .72);
      const bodice = addPart(new THREE.CylinderGeometry(.69, .82, 1.75, 24), [0, 3.94, 0], cloth);
      bodice.scale.z = .64;
      const skirt = addPart(new THREE.CylinderGeometry(.72, 1.02, 1.72, 28), [0, 2.43, 0], clothDark);
      skirt.scale.z = .66;
      addPart(new THREE.BoxGeometry(.52, 1.52, .08), [0, 3.98, -.5], detail);
      const belt = addPart(new THREE.TorusGeometry(.78, .08, 10, 28), [0, 3.1, 0], detail, this.object3D, [1, 1, .7]);
      belt.rotation.x = Math.PI / 2;
      const collarLeft = addPart(new THREE.BoxGeometry(.44, .1, .42), [-.23, 4.68, -.28], detail);
      const collarRight = addPart(new THREE.BoxGeometry(.44, .1, .42), [.23, 4.68, -.28], detail);
      collarLeft.rotation.z = -.28;
      collarRight.rotation.z = .28;
      [3.5, 3.9, 4.3].forEach((y) => addPart(new THREE.SphereGeometry(.055, 10, 8), [0, y, -.55], detail));
      const necklace = addPart(new THREE.TorusGeometry(.34, .025, 8, 30, Math.PI), [0, 4.78, -.3], detail);
      necklace.rotation.x = Math.PI / 2;
      necklace.rotation.z = Math.PI;
      for (let index = 0; index < 9; index += 1) {
        const angle = Math.PI + (index / 8) * Math.PI;
        addPart(new THREE.SphereGeometry(.042, 9, 7), [Math.cos(angle) * .34, 4.78 + Math.sin(angle) * .25, -.51], detail);
      }
    } else {
      const hairCap = addPart(new THREE.SphereGeometry(.59, 22, 17, 0, Math.PI * 2, 0, Math.PI * .61), [0, 5.6, .07], hair);
      hairCap.scale.set(1.02, .76, .97);
      const topHair = addPart(new THREE.SphereGeometry(.48, 20, 15, 0, Math.PI * 2, 0, Math.PI * .48), [-.05, 5.7, -.01], hair);
      topHair.scale.set(1.05, .55, .92);
      const torso = addPart(new THREE.CylinderGeometry(.9, .72, 2.35, 24), [0, 3.7, 0], cloth);
      torso.scale.z = .64;
      addPart(new THREE.BoxGeometry(1.92, .28, .72), [0, 4.54, 0], cloth);
      addPart(new THREE.BoxGeometry(.45, 1.65, .08), [0, 4.02, -.47], detail);
      const vLeft = addPart(new THREE.BoxGeometry(.12, .86, .09), [-.22, 4.5, -.5], cloth);
      const vRight = addPart(new THREE.BoxGeometry(.12, .86, .09), [.22, 4.5, -.5], cloth);
      vLeft.rotation.z = -.48;
      vRight.rotation.z = .48;
      [3.62, 4.02, 4.42].forEach((y) => addPart(new THREE.SphereGeometry(.045, 8, 8), [0, y, -.54], detail));
    }

    const hips = addPart(new THREE.SphereGeometry(.69, 22, 16), [0, 2.56, 0], clothDark, this.object3D, [1, .62, .68]);
    hips.rotation.y = .02;

    this.leftArm = new THREE.Group();
    this.rightArm = new THREE.Group();
    this.leftArm.position.set(-.78, 4.45, 0);
    this.rightArm.position.set(.78, 4.45, 0);
    this.leftArm.rotation.z = -.08;
    this.rightArm.rotation.z = .08;
    addPart(new THREE.SphereGeometry(.27, 16, 12), [0, 0, 0], cloth, this.leftArm, [1, 1.12, .9]);
    addPart(new THREE.SphereGeometry(.27, 16, 12), [0, 0, 0], cloth, this.rightArm, [1, 1.12, .9]);
    addPart(new THREE.CapsuleGeometry(.17, .72, 7, 14), [0, -.48, 0], cloth, this.leftArm);
    addPart(new THREE.CapsuleGeometry(.17, .72, 7, 14), [0, -.48, 0], cloth, this.rightArm);
    this.leftForearm = new THREE.Group();
    this.rightForearm = new THREE.Group();
    this.leftForearm.position.y = -.94;
    this.rightForearm.position.y = -.94;
    addPart(new THREE.SphereGeometry(.18, 14, 10), [0, 0, 0], skin, this.leftForearm);
    addPart(new THREE.SphereGeometry(.18, 14, 10), [0, 0, 0], skin, this.rightForearm);
    addPart(new THREE.CapsuleGeometry(.15, .66, 7, 14), [0, -.45, 0], skin, this.leftForearm);
    addPart(new THREE.CapsuleGeometry(.15, .66, 7, 14), [0, -.45, 0], skin, this.rightForearm);
    addPart(new THREE.SphereGeometry(.19, 16, 12), [0, -.92, -.02], skin, this.leftForearm, [.86, 1.08, .64]);
    addPart(new THREE.SphereGeometry(.19, 16, 12), [0, -.92, -.02], skin, this.rightForearm, [.86, 1.08, .64]);
    this.leftArm.add(this.leftForearm);
    this.rightArm.add(this.rightForearm);
    this.object3D.add(this.leftArm, this.rightArm);

    this.leftLeg = new THREE.Group();
    this.rightLeg = new THREE.Group();
    this.leftLeg.position.set(-.37, 2.35, 0);
    this.rightLeg.position.set(.37, 2.35, 0);
    addPart(new THREE.CapsuleGeometry(.24, .62, 7, 14), [0, -.43, 0], clothDark, this.leftLeg);
    addPart(new THREE.CapsuleGeometry(.24, .62, 7, 14), [0, -.43, 0], clothDark, this.rightLeg);
    this.leftShin = new THREE.Group();
    this.rightShin = new THREE.Group();
    this.leftShin.position.y = -.87;
    this.rightShin.position.y = -.87;
    addPart(new THREE.SphereGeometry(.23, 14, 10), [0, 0, 0], clothDark, this.leftShin, [1, .8, 1]);
    addPart(new THREE.SphereGeometry(.23, 14, 10), [0, 0, 0], clothDark, this.rightShin, [1, .8, 1]);
    addPart(new THREE.CapsuleGeometry(.2, .7, 7, 14), [0, -.49, 0], clothDark, this.leftShin);
    addPart(new THREE.CapsuleGeometry(.2, .7, 7, 14), [0, -.49, 0], clothDark, this.rightShin);
    addPart(new THREE.BoxGeometry(.5, .26, .78), [0, -1.02, -.16], sole, this.leftShin);
    addPart(new THREE.BoxGeometry(.5, .26, .78), [0, -1.02, -.16], sole, this.rightShin);
    this.leftLeg.add(this.leftShin);
    this.rightLeg.add(this.rightShin);
    this.object3D.add(this.leftLeg, this.rightLeg);

    mergeStaticMeshes(this.object3D);

    this.nameSprite = makeNameSprite(name || "Compañero", role === "mama" ? "#6ed8ff" : "#ad8cff");
    this.object3D.add(this.nameSprite);
  }

  setName(name) {
    if (!name || name === this.name) return;
    this.name = name;
    drawName(this.nameSprite.userData.canvas, name, this.role === "mama" ? "#6ed8ff" : "#ad8cff");
    this.nameSprite.userData.texture.needsUpdate = true;
  }

  setConnected(connected) {
    this.object3D.visible = connected && this.hasPosition;
  }

  setTarget({ position, rotationY }) {
    this.targetPosition.set(position.x, position.y - 5.25, position.z);
    if (!this.hasPosition) {
      this.object3D.position.copy(this.targetPosition);
      this.lastTarget.copy(this.targetPosition);
      this.hasPosition = true;
    }
    this.targetRotationY = rotationY;
    this.object3D.visible = true;
  }

  update(delta) {
    if (!this.object3D.visible) return;
    const distanceMoved = this.lastTarget.distanceTo(this.targetPosition);
    this.object3D.position.lerp(this.targetPosition, 1 - Math.exp(-10 * delta));
    let angleDifference = this.targetRotationY - this.object3D.rotation.y;
    angleDifference = Math.atan2(Math.sin(angleDifference), Math.cos(angleDifference));
    this.object3D.rotation.y += angleDifference * (1 - Math.exp(-12 * delta));
    const walking = distanceMoved > .035 || this.object3D.position.distanceTo(this.targetPosition) > .06;
    this.walkTime += delta * (walking ? 8 : 1.8);
    const swing = walking ? Math.sin(this.walkTime) * .46 : Math.sin(this.walkTime) * .025;
    this.leftArm.rotation.x = swing;
    this.rightArm.rotation.x = -swing;
    this.leftLeg.rotation.x = -swing * .72;
    this.rightLeg.rotation.x = swing * .72;
    this.leftForearm.rotation.x = Math.max(0, -swing) * .42 - .08;
    this.rightForearm.rotation.x = Math.max(0, swing) * .42 - .08;
    this.leftShin.rotation.x = Math.max(0, swing) * .55;
    this.rightShin.rotation.x = Math.max(0, -swing) * .55;
    this.lastTarget.lerp(this.targetPosition, 1 - Math.exp(-14 * delta));
  }

  dispose() {
    const geometries = new Set();
    const materials = new Set();
    this.object3D.traverse((object) => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.material) materials.add(object.material);
    });
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => { material.map?.dispose(); material.dispose(); });
  }
}

export { TemporalEcho };

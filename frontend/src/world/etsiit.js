import * as THREE from "three";
import * as CSG from "three-bvh-csg";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const loadModel = (modelPath, texturePath) => {
  const loader = new GLTFLoader();
  const textureLoader = new THREE.TextureLoader();

  return new Promise((resolve, reject) => {
    loader.load(
      modelPath,
      (gltf) => {
        const model = gltf.scene;

        model.scale.set(1, 1, 1);
        model.position.set(0, 0, 0);
        const texture = texturePath ? textureLoader.load(texturePath) : null;
        if (texture) {
          texture.colorSpace = THREE.SRGBColorSpace;
        }
        model.traverse((child) => {
          if (child.isMesh) {
            if (texture) {
              child.material = new THREE.MeshStandardMaterial({
                map: texture,
                side: THREE.DoubleSide,
                roughness: 1,
                metalness: 0,
              });
            } else {
              child.material.side = THREE.DoubleSide;
            }

            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        resolve(model);
      },
      undefined,
      reject,
    );
  });
};

const createGlassMaterial = () => {
  return new THREE.MeshStandardMaterial({
    color: 0xaed8ff,
    transparent: true,
    opacity: 0.45,
    roughness: 0.15,
    metalness: 0.05,
  });
};

const subtractWindowHoles = (building, evaluator, windows) => {
  for (const win of windows) {
    const holeGeometry = new THREE.BoxGeometry(win.w, win.h, win.d);
    if (win.rotateY) holeGeometry.rotateY(win.rotateY);

    const holeBrush = new CSG.Brush(holeGeometry, new THREE.MeshStandardMaterial({ color: 0x000000 }));

    holeBrush.position.set(win.x, win.y, win.z);
    holeBrush.updateMatrixWorld(true);

    building = evaluator.evaluate(building, holeBrush, CSG.SUBTRACTION);
  }

  return building;
};

const addWindowGlasses = (building, windows) => {
  const glassMaterial = createGlassMaterial();

  for (const win of windows) {
    const glassGeometry = new THREE.BoxGeometry(
      win.glassW ?? win.w * 0.82,
      win.glassH ?? win.h * 0.82,
      win.glassD ?? 0.35,
    );

    const glass = new THREE.Mesh(glassGeometry, glassMaterial.clone());

    if (win.rotateY) glass.rotation.y = win.rotateY;

    glass.position.set(win.glassX ?? win.x, win.glassY ?? win.y, win.glassZ ?? win.z);

    building.add(glass);
  }
};

const createBuilding1 = async () => {
  const evaluator = new CSG.Evaluator();
  const textureLoader = new THREE.TextureLoader();

  const wallTexture = textureLoader.load("/textures/wall1.jpg");
  wallTexture.wrapS = THREE.RepeatWrapping;
  wallTexture.wrapT = THREE.RepeatWrapping;
  wallTexture.repeat.set(0.05, 0.05);
  wallTexture.anisotropy = 16;

  const buildingMaterial = new THREE.MeshStandardMaterial({
    map: wallTexture,
    roughness: 1,
    metalness: 0,
  });

  const buildingShape1 = new THREE.Shape();
  buildingShape1.moveTo(0, 0);
  buildingShape1.lineTo(200, 0);
  buildingShape1.lineTo(160, 40);
  buildingShape1.lineTo(150, 40);
  buildingShape1.bezierCurveTo(150, 60, 120, 60, 120, 40);
  buildingShape1.lineTo(40, 40);
  buildingShape1.lineTo(0, 0);
  buildingShape1.closePath();

  const extrudeSettings = { depth: 100, bevelEnabled: false };
  const buildingGeometry1 = new THREE.ExtrudeGeometry(buildingShape1, extrudeSettings);
  buildingGeometry1.center();
  const buildingMaterial1 = new THREE.MeshStandardMaterial({ color: 0x888888 });
  const buildingMaterialSubtract = new THREE.MeshStandardMaterial({ color: 0x000000 });
  const building1 = new CSG.Brush(buildingGeometry1, buildingMaterial1);
  const buildingInteriorGeometry1 = new THREE.ExtrudeGeometry(buildingShape1, extrudeSettings);
  buildingInteriorGeometry1.center();
  const buildingInterior1 = new CSG.Brush(buildingInteriorGeometry1, buildingMaterialSubtract);
  building1.rotation.x = Math.PI / 2;
  buildingInterior1.rotation.x = Math.PI / 2;
  buildingInterior1.position.set(0.5, -0.5, 0);
  building1.scale.set(0.75, 0.75, 0.75);
  buildingInterior1.scale.set(0.74, 0.74, 0.74);

  building1.updateMatrixWorld(true);
  buildingInterior1.updateMatrixWorld(true);

  let building = evaluator.evaluate(building1, buildingInterior1, CSG.SUBTRACTION);

  // Doors
  const leftDoor = await loadModel("/models/door.glb", "/textures/wood.jpg");
  const rightDoor = await loadModel("/models/door.glb", "/textures/wood.jpg");
  leftDoor.position.set(-10.8, 12.5, 43);
  leftDoor.scale.set(0.2, 0.5, 0.15);
  rightDoor.position.set(-2.75, 12.5, 43);
  rightDoor.scale.set(-0.2, -0.5, -0.15);

  const leftPivot = new THREE.Group();
  leftPivot.position.set(-11.9, 12.5, 43); // posición de la bisagra izquierda
  leftDoor.position.set(1.1, 0, 0); // desplaza la puerta respecto al pivot
  leftDoor.scale.set(0.2, 0.5, 0.15);
  leftPivot.add(leftDoor);

  leftPivot.userData.isDoor = true;
  leftPivot.userData.isOpen = false;
  leftPivot.userData.closedAngle = 0;
  leftPivot.userData.openAngle = Math.PI / 2;
  leftPivot.userData.targetAngle = 0;

  const rightPivot = new THREE.Group();
  rightPivot.position.set(-1.65, 12.5, 43); // posición de la bisagra derecha
  rightDoor.position.set(-1.1, 0, 0);
  rightDoor.scale.set(-0.2, -0.5, -0.15);
  rightPivot.add(rightDoor);

  rightPivot.userData.isDoor = true;
  rightPivot.userData.isOpen = false;
  rightPivot.userData.closedAngle = 0;
  rightPivot.userData.openAngle = -Math.PI / 2;
  rightPivot.userData.targetAngle = 0;

  building.add(leftPivot);
  building.add(rightPivot);

  const doorsHoleGeometry = new THREE.BoxGeometry(12.2, 10.8, 3);
  const doorsHoleMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
  const doorsHole = new CSG.Brush(doorsHoleGeometry, doorsHoleMaterial);
  doorsHole.position.set(-5.1, -32.5, 10.5);
  doorsHole.updateMatrixWorld(true);

  building = evaluator.evaluate(building, doorsHole, CSG.SUBTRACTION);
  building.position.set(5, 25, -10);
  building.scale.set(0.25, 0.25, 0.5);

  building.geometry.computeVertexNormals();
  building.material = buildingMaterial;

  building.add(leftDoor);
  building.add(rightDoor);

  building.scale.set(1, 1.5, 1);
  building.position.set(5, 50, -10);

  return { building, doors: [leftPivot, rightPivot] };
};

const createBuilding2 = async () => {
  const evaluator = new CSG.Evaluator();
  const textureLoader = new THREE.TextureLoader();

  const wallTexture = textureLoader.load("/textures/wall1.jpg");
  wallTexture.wrapS = THREE.RepeatWrapping;
  wallTexture.wrapT = THREE.RepeatWrapping;
  wallTexture.repeat.set(0.05, 0.05);
  wallTexture.anisotropy = 16;

  const buildingMaterial = new THREE.MeshStandardMaterial({
    map: wallTexture,
    roughness: 1,
    metalness: 0,
  });

  const buildingShape2 = new THREE.Shape();
  buildingShape2.moveTo(0, 0);
  buildingShape2.lineTo(200, 0);
  buildingShape2.lineTo(160, 40);
  buildingShape2.lineTo(40, 40);
  buildingShape2.lineTo(0, 0);
  buildingShape2.closePath();

  const extrudeSettings = { depth: 100, bevelEnabled: false };
  const buildingGeometry2 = new THREE.ExtrudeGeometry(buildingShape2, extrudeSettings);
  buildingGeometry2.center();
  const buildingMaterial2 = new THREE.MeshStandardMaterial({ color: 0x888888 });
  const building2 = new CSG.Brush(buildingGeometry2, buildingMaterial2);
  const buildingInteriorGeometry2 = new THREE.ExtrudeGeometry(buildingShape2, extrudeSettings);
  buildingInteriorGeometry2.center();
  const buildingMaterialSubtract = new THREE.MeshStandardMaterial({ color: 0x000000 });
  const buildingInterior2 = new CSG.Brush(buildingInteriorGeometry2, buildingMaterialSubtract);
  building2.rotation.x = Math.PI / 2;
  buildingInterior2.rotation.x = Math.PI / 2;
  building2.rotation.z = -Math.PI / 2;
  buildingInterior2.rotation.z = -Math.PI / 2;
  buildingInterior2.position.set(0, -0.3, 0);
  building2.scale.set(0.75, 0.75, 0.75);
  buildingInterior2.scale.set(0.74, 0.74, 0.74);

  building2.updateMatrixWorld(true);
  buildingInterior2.updateMatrixWorld(true);

  let building = evaluator.evaluate(building2, buildingInterior2, CSG.SUBTRACTION);

  // Doors
  const leftDoor = await loadModel("/models/door.glb", "/textures/wood.jpg");
  const rightDoor = await loadModel("/models/door.glb", "/textures/wood.jpg");
  leftDoor.position.set(-18, 19.8, 43);
  leftDoor.scale.set(0.2, 0.5, 0.15);
  rightDoor.position.set(-10, 19.8, 43);
  rightDoor.scale.set(-0.2, -0.5, -0.15);

  const leftPivot = new THREE.Group();
  leftPivot.position.set(-11.9, 12.5, 43); // posición de la bisagra izquierda
  leftDoor.position.set(1.1, 0, 0); // desplaza la puerta respecto al pivot
  leftDoor.scale.set(0.2, 0.5, 0.15);
  leftPivot.add(leftDoor);

  leftPivot.userData.isDoor = true;
  leftPivot.userData.isOpen = false;
  leftPivot.userData.closedAngle = 0;
  leftPivot.userData.openAngle = Math.PI / 2;
  leftPivot.userData.targetAngle = 0;

  const rightPivot = new THREE.Group();
  rightPivot.position.set(-1.65, 12.5, 43); // posición de la bisagra derecha
  rightDoor.position.set(-1.1, 0, 0);
  rightDoor.scale.set(-0.2, -0.5, -0.15);
  rightPivot.add(rightDoor);

  rightPivot.userData.isDoor = true;
  rightPivot.userData.isOpen = false;
  rightPivot.userData.closedAngle = 0;
  rightPivot.userData.openAngle = -Math.PI / 2;
  rightPivot.userData.targetAngle = 0;

  building.add(leftPivot);
  building.add(rightPivot);

  const doorsHoleGeometry = new THREE.BoxGeometry(12.2, 10.8, 3);
  doorsHoleGeometry.rotateY(Math.PI / 2);
  const doorsHoleMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
  const doorsHole = new CSG.Brush(doorsHoleGeometry, doorsHoleMaterial);
  doorsHole.position.set(16.1, -32.5, 10.5);
  doorsHole.updateMatrixWorld(true);

  building = evaluator.evaluate(building, doorsHole, CSG.SUBTRACTION);
  building.position.set(-15, 25, 15);
  building.scale.set(0.25, 0.25, 0.5);

  building.material = buildingMaterial;
  building.add(leftDoor);
  building.add(rightDoor);

  building.scale.set(1, 1.5, 1);
  building.position.set(-90, 50, 80);

  return { building, doors: [leftPivot, rightPivot] };
};

const createEtsiit = async () => {
  const etsiit = new THREE.Group();

  //EDIFICIOS
  const building1 = await createBuilding1();
  const building2 = await createBuilding2();

  etsiit.add(building1.building);
  etsiit.add(building2.building);

  return {
    etsiit,
    doors: [...building1.doors, ...building2.doors],
  };
};

export { createEtsiit };

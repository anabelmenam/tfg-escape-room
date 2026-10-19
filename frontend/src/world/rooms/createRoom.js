import * as THREE from "three";

const textureLoader = new THREE.TextureLoader();

const loadTexture = ({ path, repeat = { x: 1, y: 1 } }) => {
  if (!path) {
    return null;
  }

  const texture = textureLoader.load(path, undefined, undefined, (error) => {
    console.error(`No se pudo cargar la textura: ${path}`, error);
  });

  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  texture.repeat.set(repeat.x ?? 1, repeat.y ?? 1);
  texture.colorSpace = THREE.SRGBColorSpace;

  return texture;
};

const createRoom = ({
  width = 30,
  height = 12,
  depth = 30,
  wallThickness = 0.3,

  wallColor = 0xd9d9d9,
  floorColor = 0x6b4f35,
  ceilingColor = wallColor,

  wallTexture = null,
  floorTexture = null,
  ceilingTexture = null,

  wallTextureRepeat = {
    x: 4,
    y: 2,
  },

  floorTextureRepeat = {
    x: 4,
    y: 4,
  },

  ceilingTextureRepeat = {
    x: 4,
    y: 4,
  },

  door = {
    wall: "front",
    position: 0,
    width: 5,
    height: 8,
  },

  windows = [],
  passages = [],
  omitWalls = [],
} = {}) => {
  const room = new THREE.Group();
  const roomColliders = [];

  const validWalls = ["front", "back", "left", "right"];

  const loadedWallTexture = loadTexture({
    path: wallTexture,
    repeat: wallTextureRepeat,
  });
  const loadedFloorTexture = loadTexture({
    path: floorTexture,
    repeat: floorTextureRepeat,
  });
  const loadedCeilingTexture = loadTexture({
    path: ceilingTexture,
    repeat: ceilingTextureRepeat,
  });

  const wallMaterial = new THREE.MeshStandardMaterial({
    color: wallColor,
    map: loadedWallTexture,
    roughness: 0.9,
  });

  const floorMaterial = new THREE.MeshStandardMaterial({
    color: floorColor,
    map: loadedFloorTexture,
    roughness: 0.8,
  });

  const ceilingMaterial = new THREE.MeshStandardMaterial({
    color: ceilingColor,
    map: loadedCeilingTexture,
    roughness: 0.9,
  });

  const createBox = ({ name, size, position, material, isCollider = true, configureGeometry = null }) => {
    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);

    if (configureGeometry) {
      configureGeometry(geometry);
    }

    const mesh = new THREE.Mesh(geometry, material);

    mesh.name = name;
    mesh.position.copy(position);

    mesh.receiveShadow = true;
    mesh.castShadow = true;

    mesh.userData.isCollider = isCollider;

    room.add(mesh);

    if (isCollider) {
      roomColliders.push(mesh);
    }

    return mesh;
  };

  const openings = [];

  if (door) {
    openings.push({
      id: "door-opening",
      type: "door",
      wall: door.wall,
      position: door.position,
      width: door.width,
      height: door.height,
      bottom: 0,
    });
  }

  windows.forEach((window, index) => {
    openings.push({
      id: window.id ?? `window-opening-${index}`,
      type: "window",
      wall: window.wall,
      position: window.position,
      width: window.width,
      height: window.height,
      bottom: window.bottom ?? 3,
    });
  });

  passages.forEach((passage, index) => {
    openings.push({
      id: passage.id ?? `passage-opening-${index}`,
      type: "passage",
      wall: passage.wall,
      position: passage.position,
      width: passage.width,
      height: passage.height,
      bottom: passage.bottom ?? 0,
    });
  });

  const validateOpening = (opening) => {
    if (!validWalls.includes(opening.wall)) {
      throw new Error(`Pared no válida para ${opening.id}: ${opening.wall}`);
    }

    if (opening.width <= 0 || opening.height <= 0) {
      throw new Error(`El hueco ${opening.id} debe tener un tamaño positivo`);
    }

    if (opening.bottom < 0) {
      throw new Error(`El hueco ${opening.id} no puede estar debajo del suelo`);
    }

    if (opening.bottom + opening.height > height) {
      throw new Error(`El hueco ${opening.id} supera la altura de la habitación`);
    }

    const wallLength = opening.wall === "front" || opening.wall === "back" ? width : depth;

    const openingMin = opening.position - opening.width / 2;

    const openingMax = opening.position + opening.width / 2;

    const wallMin = -wallLength / 2;
    const wallMax = wallLength / 2;

    if (openingMin <= wallMin || openingMax >= wallMax) {
      throw new Error(`El hueco ${opening.id} no cabe en la pared ${opening.wall}`);
    }
  };

  openings.forEach(validateOpening);

  const openingsOverlap = (firstOpening, secondOpening) => {
    const firstMinX = firstOpening.position - firstOpening.width / 2;

    const firstMaxX = firstOpening.position + firstOpening.width / 2;

    const firstMinY = firstOpening.bottom;

    const firstMaxY = firstOpening.bottom + firstOpening.height;

    const secondMinX = secondOpening.position - secondOpening.width / 2;

    const secondMaxX = secondOpening.position + secondOpening.width / 2;

    const secondMinY = secondOpening.bottom;

    const secondMaxY = secondOpening.bottom + secondOpening.height;

    const overlapsHorizontally = firstMinX < secondMaxX && firstMaxX > secondMinX;

    const overlapsVertically = firstMinY < secondMaxY && firstMaxY > secondMinY;

    return overlapsHorizontally && overlapsVertically;
  };

  validWalls.forEach((wall) => {
    const wallOpenings = openings.filter((opening) => opening.wall === wall);

    for (let firstIndex = 0; firstIndex < wallOpenings.length; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < wallOpenings.length; secondIndex += 1) {
        const firstOpening = wallOpenings[firstIndex];

        const secondOpening = wallOpenings[secondIndex];

        if (openingsOverlap(firstOpening, secondOpening)) {
          throw new Error(`Los huecos ${firstOpening.id} y ${secondOpening.id} se solapan`);
        }
      }
    }
  });

  const applyContinuousWallUVs = ({ geometry, wall, sectionCenter, sectionCenterY, wallLength }) => {
    const positionAttribute = geometry.attributes.position;
    const uvAttribute = geometry.attributes.uv;
    const normalAttribute = geometry.attributes.normal;

    for (let index = 0; index < positionAttribute.count; index += 1) {
      const localX = positionAttribute.getX(index);
      const localY = positionAttribute.getY(index);
      const localZ = positionAttribute.getZ(index);
      const normalX = Math.abs(normalAttribute.getX(index));
      const normalZ = Math.abs(normalAttribute.getZ(index));
      const horizontalWall = wall === "front" || wall === "back";
      const mainFace = horizontalWall ? normalZ > 0.5 : normalX > 0.5;
      const horizontalPosition = horizontalWall ? sectionCenter + localX : sectionCenter + localZ;
      const verticalPosition = sectionCenterY + localY;
      let u;
      let v;

      if (mainFace) {
        u = (horizontalPosition + wallLength / 2) / wallLength;
        v = verticalPosition / height;
        if (wall === "front" || wall === "right") u = 1 - u;
      } else if (normalX > 0.5 || normalZ > 0.5) {
        const revealPosition = horizontalWall ? localZ : localX;
        u = (revealPosition + wallThickness / 2) / wallLength;
        v = verticalPosition / height;
      } else {
        u = (horizontalPosition + wallLength / 2) / wallLength;
        v = (localZ + wallThickness / 2) / wallLength;
      }

      uvAttribute.setXY(index, u, v);
    }

    uvAttribute.needsUpdate = true;
  };

  const createWallWithOpenings = (wall) => {
    const horizontalWall = wall === "front" || wall === "back";

    const wallLength = horizontalWall ? width : depth;

    const wallOpenings = openings.filter((opening) => opening.wall === wall);

    const horizontalCuts = [-wallLength / 2, wallLength / 2];

    const verticalCuts = [0, height];

    wallOpenings.forEach((opening) => {
      horizontalCuts.push(opening.position - opening.width / 2, opening.position + opening.width / 2);

      verticalCuts.push(opening.bottom, opening.bottom + opening.height);
    });

    const uniqueHorizontalCuts = [...new Set(horizontalCuts)].sort((a, b) => a - b);

    const uniqueVerticalCuts = [...new Set(verticalCuts)].sort((a, b) => a - b);

    for (let horizontalIndex = 0; horizontalIndex < uniqueHorizontalCuts.length - 1; horizontalIndex += 1) {
      const minHorizontal = uniqueHorizontalCuts[horizontalIndex];

      const maxHorizontal = uniqueHorizontalCuts[horizontalIndex + 1];

      const sectionLength = maxHorizontal - minHorizontal;

      const sectionCenter = (minHorizontal + maxHorizontal) / 2;

      for (let verticalIndex = 0; verticalIndex < uniqueVerticalCuts.length - 1; verticalIndex += 1) {
        const minVertical = uniqueVerticalCuts[verticalIndex];

        const maxVertical = uniqueVerticalCuts[verticalIndex + 1];

        const sectionHeight = maxVertical - minVertical;

        const sectionCenterY = (minVertical + maxVertical) / 2;

        if (sectionLength <= 0 || sectionHeight <= 0) {
          continue;
        }

        const insideOpening = wallOpenings.some((opening) => {
          const openingMin = opening.position - opening.width / 2;

          const openingMax = opening.position + opening.width / 2;

          const openingBottom = opening.bottom;

          const openingTop = opening.bottom + opening.height;

          return (
            sectionCenter > openingMin &&
            sectionCenter < openingMax &&
            sectionCenterY > openingBottom &&
            sectionCenterY < openingTop
          );
        });

        if (insideOpening) {
          continue;
        }

        let size;
        let position;

        switch (wall) {
          case "front":
            size = new THREE.Vector3(sectionLength, sectionHeight, wallThickness);

            position = new THREE.Vector3(sectionCenter, sectionCenterY, depth / 2);
            break;

          case "back":
            size = new THREE.Vector3(sectionLength, sectionHeight, wallThickness);

            position = new THREE.Vector3(sectionCenter, sectionCenterY, -depth / 2);
            break;

          case "left":
            size = new THREE.Vector3(wallThickness, sectionHeight, sectionLength);

            position = new THREE.Vector3(-width / 2, sectionCenterY, sectionCenter);
            break;

          case "right":
            size = new THREE.Vector3(wallThickness, sectionHeight, sectionLength);

            position = new THREE.Vector3(width / 2, sectionCenterY, sectionCenter);
            break;

          default:
            return;
        }

        createBox({
          name: `${wall}-wall-section-${horizontalIndex}-${verticalIndex}`,
          size,
          position,
          material: wallMaterial,

          configureGeometry: (geometry) => {
            applyContinuousWallUVs({
              geometry,
              wall,
              sectionCenter,
              sectionCenterY,
              wallLength,
            });
          },
        });

      }
    }
  };

  createBox({
    name: "floor",
    size: new THREE.Vector3(width, 1, depth),
    position: new THREE.Vector3(0, -0.5, 0),
    material: floorMaterial,
  });

  createBox({
    name: "ceiling",
    size: new THREE.Vector3(width, 1, depth),
    position: new THREE.Vector3(0, height + 0.5, 0),
    material: ceilingMaterial,
  });

  validWalls
    .filter((wall) => !omitWalls.includes(wall))
    .forEach((wall) => {
      createWallWithOpenings(wall);
    });

  const getOpeningTransform = (opening) => {
    const position = new THREE.Vector3();

    let rotationY = 0;

    const centerY = opening.bottom + opening.height / 2;

    switch (opening.wall) {
      case "front":
        position.set(opening.position, centerY, depth / 2);

        rotationY = Math.PI;
        break;

      case "back":
        position.set(opening.position, centerY, -depth / 2);

        rotationY = 0;
        break;

      case "left":
        position.set(-width / 2, centerY, opening.position);

        rotationY = Math.PI / 2;
        break;

      case "right":
        position.set(width / 2, centerY, opening.position);

        rotationY = -Math.PI / 2;
        break;
    }

    return {
      ...opening,
      position,
      wallPosition: opening.position,
      rotationY,
    };
  };

  const doorOpening = door ? getOpeningTransform(openings.find((opening) => opening.type === "door")) : null;

  const windowOpenings = openings.filter((opening) => opening.type === "window").map(getOpeningTransform);
  const passageOpenings = openings.filter((opening) => opening.type === "passage").map(getOpeningTransform);

  const placeAgainstWall = (entity, wall, gap = 0) => {
    const object = entity.object3D ?? entity;
    if (object.parent !== room) throw new Error("El objeto debe pertenecer a la habitación antes de colocarlo.");
    room.updateWorldMatrix(true, true);
    const box = new THREE.Box3()
      .setFromObject(entity.wallMountObject ?? object)
      .applyMatrix4(room.matrixWorld.clone().invert());
    const axis = wall === "left" || wall === "right" ? "x" : "z";
    const positive = wall === "right" || wall === "front";
    const innerFace = ((axis === "x" ? width : depth) - wallThickness) / 2;
    const offset = new THREE.Vector3();
    offset[axis] = positive ? innerFace - gap - box.max[axis] : -innerFace + gap - box.min[axis];
    object.position.add(offset);
    object.updateMatrixWorld(true);
    return offset;
  };

  return {
    room,
    roomColliders,
    placeAgainstWall,

    bounds: {
      minX: -width / 2 + 0.5,
      maxX: width / 2 - 0.5,
      minZ: -depth / 2 + 0.5,
      maxZ: depth / 2 - 0.5,
      floorY: 5.25,
      ceilingY: height,
    },

    doorOpening,
    windowOpenings,
    passageOpenings,
  };
};

export { createRoom };

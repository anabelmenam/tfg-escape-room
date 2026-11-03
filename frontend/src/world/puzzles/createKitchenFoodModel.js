import * as THREE from "three";

const createTomatoes = (quantity = 3) => {
  const group = new THREE.Group();
  const positions = [
    [-0.2, 0],
    [0.2, 0],
    [0, -0.22],
    [0, 0.22],
  ];
  positions.slice(0, quantity).forEach(([x, z], index) => {
    const tomato = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 18, 14),
      new THREE.MeshStandardMaterial({ color: 0xb9362f, roughness: 0.78 }),
    );
    tomato.scale.y = 0.88;
    tomato.position.set(x, index === 2 ? 0.18 : 0.12, z);
    const crown = new THREE.Mesh(
      new THREE.ConeGeometry(0.085, 0.045, 5),
      new THREE.MeshStandardMaterial({ color: 0x416332, roughness: 0.9 }),
    );
    crown.position.set(x, tomato.position.y + 0.18, z);
    group.add(tomato, crown);
  });
  return group;
};

const createCarrotGeometry = (bendDirection = 1) => {
  const profile = [
    new THREE.Vector2(0.012, -0.41),
    new THREE.Vector2(0.035, -0.36),
    new THREE.Vector2(0.064, -0.24),
    new THREE.Vector2(0.086, -0.06),
    new THREE.Vector2(0.102, 0.17),
    new THREE.Vector2(0.096, 0.31),
    new THREE.Vector2(0.072, 0.38),
    new THREE.Vector2(0.025, 0.41),
  ];
  const geometry = new THREE.LatheGeometry(profile, 24);
  const positions = geometry.attributes.position;
  for (let vertex = 0; vertex < positions.count; vertex += 1) {
    const y = positions.getY(vertex);
    const normalizedHeight = (y + 0.41) / 0.82;
    const curve = Math.sin(normalizedHeight * Math.PI) * 0.032 * bendDirection;
    positions.setX(vertex, positions.getX(vertex) + curve);
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
};

const createCarrots = (quantity = 2) => {
  const group = new THREE.Group();
  [-0.2, 0, 0.2].slice(0, quantity).forEach((z, index) => {
    const carrot = new THREE.Mesh(
      createCarrotGeometry(index === 0 ? -1 : 1),
      new THREE.MeshStandardMaterial({ color: index === 0 ? 0xe17a2d : 0xd96f27, roughness: 0.84 }),
    );
    carrot.rotation.z = -Math.PI / 2;
    carrot.rotation.y = index === 0 ? -0.08 : 0.1;
    carrot.position.set(0.02, 0.15, z);
    group.add(carrot);

    const leafShape = new THREE.Shape();
    leafShape.moveTo(0, 0);
    leafShape.bezierCurveTo(-0.12, 0.055, -0.3, 0.08, -0.46, 0);
    leafShape.bezierCurveTo(-0.3, -0.08, -0.12, -0.055, 0, 0);
    const leaf = new THREE.Mesh(
      new THREE.ShapeGeometry(leafShape, 10),
      new THREE.MeshStandardMaterial({
        color: index === 0 ? 0x527f40 : 0x648f4b,
        roughness: 0.9,
        side: THREE.DoubleSide,
      }),
    );
    leaf.position.set(-0.4, 0.17, z);
    leaf.rotation.set(index === 0 ? -0.12 : 0.12, 0, index === 0 ? -0.13 : 0.1);
    const vein = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.009, 0.008),
      new THREE.MeshStandardMaterial({ color: 0x365d30, roughness: 0.95 }),
    );
    vein.position.set(-0.2, 0, 0.006);
    leaf.add(vein);
    group.add(leaf);

    [
      [-0.12, 0.255],
      [0.08, 0.225],
      [0.25, 0.19],
    ].forEach(([x, y], ridgeIndex) => {
      const ridge = new THREE.Mesh(
        new THREE.BoxGeometry(0.012, 0.012, 0.085 - ridgeIndex * 0.012),
        new THREE.MeshStandardMaterial({ color: 0xb95d22, roughness: 0.92 }),
      );
      ridge.rotation.x = index === 0 ? -0.18 : 0.18;
      ridge.position.set(x, y, z + (ridgeIndex - 1) * 0.018);
      group.add(ridge);
    });
  });
  return group;
};

const createCheese = (quantity = 1) => {
  const group = new THREE.Group();
  Array.from({ length: quantity }, (_, cheeseIndex) => {
    const cheeseGroup = new THREE.Group();
    cheeseGroup.position.x = (cheeseIndex - (quantity - 1) / 2) * 0.48;
    const cheese = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.36, 0.22, 3),
      new THREE.MeshStandardMaterial({ color: 0xd8b64a, roughness: 0.72 }),
    );
    cheese.rotation.y = -0.18;
    cheese.position.y = 0.12;
    cheeseGroup.add(cheese);
    [
      [-0.12, 0.12],
      [0.07, 0.04],
      [0.15, -0.12],
    ].forEach(([x, z], index) => {
      const hole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.032 + index * 0.006, 0.032 + index * 0.006, 0.008, 14),
        new THREE.MeshStandardMaterial({ color: 0x9f7b2f, roughness: 0.88 }),
      );
      hole.position.set(x, 0.235, z);
      cheeseGroup.add(hole);
    });
    group.add(cheeseGroup);
  });
  return group;
};

const createKitchenFoodModel = (kind, quantity = null) => {
  if (kind === "tomato" || kind === "kitchen-tomatoes") return createTomatoes(quantity ?? 3);
  if (kind === "carrot" || kind === "kitchen-carrots") return createCarrots(quantity ?? 2);
  return createCheese(quantity ?? 1);
};

export { createKitchenFoodModel };

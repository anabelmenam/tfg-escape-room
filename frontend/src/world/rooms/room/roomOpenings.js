import * as THREE from "three";

const VALID_WALLS = ["front", "back", "left", "right"];

const createOpenings = ({ door, windows, passages, width, height, depth }) => {
  const openings = [];
  if (door) openings.push({ id: "door-opening", type: "door", ...door, bottom: 0 });
  windows.forEach((window, index) =>
    openings.push({
      id: window.id ?? `window-opening-${index}`,
      type: "window",
      ...window,
      bottom: window.bottom ?? 3,
    }),
  );
  passages.forEach((passage, index) =>
    openings.push({
      id: passage.id ?? `passage-opening-${index}`,
      type: "passage",
      ...passage,
      bottom: passage.bottom ?? 0,
    }),
  );
  openings.forEach((opening) => {
    if (!VALID_WALLS.includes(opening.wall)) throw new Error(`Pared no válida para ${opening.id}: ${opening.wall}`);
    if (opening.width <= 0 || opening.height <= 0)
      throw new Error(`El hueco ${opening.id} debe tener un tamaño positivo`);
    if (opening.bottom < 0) throw new Error(`El hueco ${opening.id} no puede estar debajo del suelo`);
    if (opening.bottom + opening.height > height)
      throw new Error(`El hueco ${opening.id} supera la altura de la habitación`);
    const wallLength = ["front", "back"].includes(opening.wall) ? width : depth;
    if (
      opening.position - opening.width / 2 <= -wallLength / 2 ||
      opening.position + opening.width / 2 >= wallLength / 2
    )
      throw new Error(`El hueco ${opening.id} no cabe en la pared ${opening.wall}`);
  });
  VALID_WALLS.forEach((wall) => {
    const wallOpenings = openings.filter((opening) => opening.wall === wall);
    wallOpenings.forEach((first, firstIndex) =>
      wallOpenings.slice(firstIndex + 1).forEach((second) => {
        const horizontal =
          first.position - first.width / 2 < second.position + second.width / 2 &&
          first.position + first.width / 2 > second.position - second.width / 2;
        const vertical = first.bottom < second.bottom + second.height && first.bottom + first.height > second.bottom;
        if (horizontal && vertical) throw new Error(`Los huecos ${first.id} y ${second.id} se solapan`);
      }),
    );
  });
  return openings;
};

const transformOpening = (opening, { width, depth }) => {
  const position = new THREE.Vector3();
  const centerY = opening.bottom + opening.height / 2;
  let rotationY = 0;
  if (opening.wall === "front") {
    position.set(opening.position, centerY, depth / 2);
    rotationY = Math.PI;
  } else if (opening.wall === "back") position.set(opening.position, centerY, -depth / 2);
  else if (opening.wall === "left") {
    position.set(-width / 2, centerY, opening.position);
    rotationY = Math.PI / 2;
  } else if (opening.wall === "right") {
    position.set(width / 2, centerY, opening.position);
    rotationY = -Math.PI / 2;
  }
  return { ...opening, position, wallPosition: opening.position, rotationY };
};

const getTransformedOpenings = (openings, dimensions) => ({
  doorOpening: openings.some(({ type }) => type === "door")
    ? transformOpening(
        openings.find(({ type }) => type === "door"),
        dimensions,
      )
    : null,
  windowOpenings: openings
    .filter(({ type }) => type === "window")
    .map((opening) => transformOpening(opening, dimensions)),
  passageOpenings: openings
    .filter(({ type }) => type === "passage")
    .map((opening) => transformOpening(opening, dimensions)),
});

export { VALID_WALLS, createOpenings, getTransformedOpenings };

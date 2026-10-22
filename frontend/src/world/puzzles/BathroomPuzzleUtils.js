const markBathroomControl = (object, control) => object.traverse((child) => { child.userData.roomPuzzleControl = control; });
const finishBathroomObject = (object) => object.traverse((child) => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });

export { finishBathroomObject, markBathroomControl };

const gameImageUrls = [
  "/images/decor/bedroom-landscape.png",
  "/images/decor/couple-photo-1980s.png",
  "/images/decor/family-breakfast.png",
  "/images/decor/family-photo-1980s.png",
  "/images/decor/family-picnic.png",
  "/images/decor/kitchen-still-life.png",
  "/images/family/daughter-portrait.png",
  "/images/family/son-portrait.png",
  "/images/icons/bathroom/screwdriver.png",
  "/images/icons/bathroom/wave-key.png",
  "/images/icons/bedroom/clock-hand.png",
  "/images/icons/bedroom/flashlight.png",
  "/images/icons/bedroom/fuse.png",
  "/images/icons/bedroom/moon-key.png",
  "/images/icons/bedroom/radio-dial.png",
  "/images/icons/children-room/bolt-cutters.png",
  "/images/icons/children-room/crowbar.png",
  "/images/icons/children-room/push-pin.png",
  "/images/icons/children-room/star-key.png",
  "/images/icons/kitchen/carrots.png",
  "/images/icons/kitchen/cheese.png",
  "/images/icons/kitchen/dad-napkin.png",
  "/images/icons/kitchen/daughter-napkin.png",
  "/images/icons/kitchen/mum-napkin.png",
  "/images/icons/kitchen/son-napkin.png",
  "/images/icons/kitchen/tile.png",
  "/images/icons/kitchen/tomatoes.png",
  "/images/icons/living-room/fallen-painting.png",
  "/images/icons/living-room/flame-key.png",
  "/images/icons/living-room/match.png",
  "/images/icons/living-room/painting-fragment-1.png",
  "/images/icons/living-room/painting-fragment-2.png",
  "/images/icons/living-room/scissors.png",
  "/images/icons/shared/key.png",
  "/images/puzzles/bathroom-mosaic/blue-tiles-atlas.png",
  "/images/puzzles/children-memories/memory-home.jpg",
  "/images/puzzles/children-memories/memory-park.jpg",
  "/images/puzzles/children-memories/memory-school.jpg",
  "/images/puzzles/children-memories/memory-station.jpg",
  "/images/puzzles/electrical-plan-lights.png",
  "/images/puzzles/family-photo-1998.png",
  "/images/puzzles/mountain-lake-landscape.png",
  "/images/puzzles/photo-order-diary.png",
  "/images/puzzles/radio-program-note.png",
  "/images/puzzles/rainbow-drawing.png",
  "/textures/azulejoPared.jpeg",
  "/textures/brickWall.jpg",
  "/textures/door.jpeg",
  "/textures/furniture/carpet.jpg",
  "/textures/furniture/kitchen-cabinet-sage-enamel.png",
  "/textures/furniture/kitchen-cabinet-walnut.png",
  "/textures/furniture/kitchen-marble.png",
  "/textures/furniture/wood1.jpg",
  "/textures/furniture/wood2.jpg",
  "/textures/grass.jpg",
  "/textures/rooms/bathroom-floor-tiles.png",
  "/textures/rooms/floor.jpg",
  "/textures/rooms/floor.png",
  "/textures/rooms/floor2.jpg",
  "/textures/rooms/whiteWall.jpg",
  "/textures/wall1.jpg",
  "/textures/wall2.png",
];

const imageCache = new Map();

const loadImage = (url) => {
  if (imageCache.has(url)) return imageCache.get(url).promise;

  const image = new Image();
  image.decoding = "async";
  const promise = new Promise((resolve, reject) => {
    image.onload = async () => {
      try {
        await image.decode?.();
      } catch {
        console.log(`No se pudo decodificar la imagen del juego: ${url}`);
      }
      resolve(image);
    };
    image.onerror = () => reject(new Error(`No se pudo cargar la imagen del juego: ${url}`));
    image.src = url;
  });

  imageCache.set(url, { image, promise });
  return promise;
};

const preloadGameImages = () => Promise.all(gameImageUrls.map(loadImage));

export { preloadGameImages };

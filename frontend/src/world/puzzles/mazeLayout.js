import { tInteraction } from "../../translations/index.js";

// Coordinates are [column, row], starting at the top left in both eras.
export const MAZE_SIZE = 9;
export const MAZE_ROUTE = [
  [0, 0],
  [1, 0],
  [1, 1],
  [1, 2],
  [2, 2],
  [3, 2],
  [3, 1],
  [3, 0],
  [4, 0],
  [5, 0],
  [5, 1],
  [5, 2],
  [6, 2],
  [7, 2],
  [7, 1],
  [7, 0],
  [8, 0],
  [8, 1],
  [8, 2],
  [8, 3],
  [7, 3],
  [6, 3],
  [6, 4],
  [5, 4],
  [4, 4],
  [4, 3],
  [3, 3],
  [2, 3],
  [2, 4],
  [2, 5],
  [3, 5],
  [4, 5],
  [5, 5],
  [6, 5],
  [7, 5],
  [8, 5],
  [8, 6],
  [7, 6],
  [7, 7],
  [8, 7],
  [8, 8],
];
const branches = [
  [
    [1, 1],
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4],
  ],
  [
    [2, 2],
    [2, 1],
    [2, 0],
  ],
  [
    [3, 3],
    [3, 4],
  ],
  [
    [5, 1],
    [6, 1],
    [6, 0],
  ],
  [
    [8, 3],
    [8, 4],
    [7, 4],
  ],
  [
    [5, 4],
    [5, 3],
  ],
  [
    [2, 4],
    [1, 4],
    [1, 5],
    [0, 5],
    [0, 6],
    [1, 6],
  ],
  [
    [3, 5],
    [3, 6],
    [2, 6],
    [2, 7],
    [1, 7],
    [0, 7],
    [0, 8],
  ],
  [
    [5, 5],
    [5, 6],
    [4, 6],
    [4, 7],
    [3, 7],
    [3, 8],
  ],
  [
    [7, 7],
    [6, 7],
    [6, 8],
    [5, 8],
  ],
];
const edge = (a, b) => [a.join(","), b.join(",")].sort().join("|");
const edges = new Set([MAZE_ROUTE, ...branches].flatMap((path) => path.slice(1).map((cell, i) => edge(path[i], cell))));
export const canMove = (from, to) => edges.has(edge(from, to));

export function drawMaze(ctx, canvas, { solution = false } = {}) {
  const size = canvas.width,
    margin = size * 0.12,
    cell = (size - 2 * margin) / MAZE_SIZE;
  ctx.fillStyle = "#e5d2a3";
  ctx.fillRect(0, 0, size, canvas.height);
  ctx.fillStyle = "#3d2b1e";
  ctx.textAlign = "center";
  ctx.font = `bold ${size * 0.038}px serif`;
  ctx.fillText(tInteraction(solution ? "mazeSolution" : "mazeTitle"), size / 2, size * 0.065);
  ctx.strokeStyle = "#503b28";
  ctx.lineWidth = size * 0.005;
  if (solution) {
    for (let y = 0; y < MAZE_SIZE; y++)
      for (let x = 0; x < MAZE_SIZE; x++) {
        const left = margin + x * cell,
          top = margin + y * cell;
        const line = (a, b, c, d) => {
          ctx.beginPath();
          ctx.moveTo(a, b);
          ctx.lineTo(c, d);
          ctx.stroke();
        };
        if (y === 0) line(left, top, left + cell, top);
        if (x === 0) line(left, top, left, top + cell);
        if (!canMove([x, y], [x + 1, y])) line(left + cell, top, left + cell, top + cell);
        if (!canMove([x, y], [x, y + 1])) line(left, top + cell, left + cell, top + cell);
      }
  } else {
    // The dad only shows the boundary; the mum note reveals the walls.
    ctx.strokeRect(margin, margin, cell * MAZE_SIZE, cell * MAZE_SIZE);
  }
  const center = ([x, y]) => [margin + (x + 0.5) * cell, margin + (y + 0.5) * cell];
  if (solution) {
    ctx.strokeStyle = "#a23728";
    ctx.lineWidth = size * 0.012;
    ctx.lineJoin = "round";
    ctx.beginPath();
    MAZE_ROUTE.forEach((p, i) => {
      const [x, y] = center(p);
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    });
    ctx.stroke();
  }
  for (const [point, label] of [
    [MAZE_ROUTE[0], "INICIO"],
    [MAZE_ROUTE.at(-1), "SALIDA"],
  ]) {
    const [x, y] = center(point);
    ctx.fillStyle = "#3d2b1e";
    ctx.font = `bold ${cell * 0.19}px sans-serif`;
    ctx.fillText(label, x, y + cell * 0.32);
  }
  ctx.fillStyle = "#503b28";
  ctx.font = `${size * 0.028}px serif`;
  ctx.fillText(solution ? "Guía la llave desde el inicio hasta la salida." : "Usa las flechas.", size / 2, size * 0.95);
}

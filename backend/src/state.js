export const createInitialState = () => ({
  timelines: {
    past: { objects: {}, puzzles: {} },
    present: { objects: {}, puzzles: {} },
  },
  inventories: { past: [], present: [] },
});

export const createInitialState = () => ({
  timelines: {
    past: { objects: {}, puzzles: {} },
    present: { objects: {}, puzzles: {} },
  },
  inventories: { past: [], present: [] },
  ending: {
    phase: "locked",
    holding: { past: false, present: false },
    choice: null,
    sacrificeTimeline: null,
  },
});

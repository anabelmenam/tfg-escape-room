export const createInitialState = () => ({
  characters: {
    mum: { objects: {}, puzzles: {} },
    dad: { objects: {}, puzzles: {} },
  },
  inventories: { mum: [], dad: [] },
  journalEntries: [],
  ending: {
    phase: "locked",
    holding: { mum: false, dad: false },
    choice: null,
    sacrificeCharacter: null,
  },
});

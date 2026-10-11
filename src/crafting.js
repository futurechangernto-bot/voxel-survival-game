import { BLOCKS } from './blocks.js';

export class CraftingSystem {
  constructor({ inventory } = {}) {
    this.inventory = inventory;
    this.grid2x2 = Array(4).fill(null);
    this.grid3x3 = Array(9).fill(null);
    this.ovenQueue = [];
  }

  setGrid2x2(index, itemId) {
    if (index < 0 || index >= this.grid2x2.length) return;
    this.grid2x2[index] = itemId ?? null;
  }

  setGrid3x3(index, itemId) {
    if (index < 0 || index >= this.grid3x3.length) return;
    this.grid3x3[index] = itemId ?? null;
  }

  clearGrid2x2() {
    this.grid2x2.fill(null);
  }

  clearGrid3x3() {
    this.grid3x3.fill(null);
  }

  craft2x2() {
    const values = this.grid2x2.filter(Boolean);
    const logCount = values.filter(v => [BLOCKS.OAK_WOOD, BLOCKS.SPRUCE_WOOD, BLOCKS.ACACIA_WOOD].includes(v)).length;
    if (values.length === 1 && logCount === 1) {
      this.clearGrid2x2();
      this.inventory?.addItem(BLOCKS.CRAFTING_TABLE, 1);
      return true;
    }
    return false;
  }

  craft3x3() {
    const logMap = new Map();
    for (const value of this.grid3x3) {
      if ([BLOCKS.OAK_WOOD, BLOCKS.SPRUCE_WOOD, BLOCKS.ACACIA_WOOD].includes(value)) {
        logMap.set(value, (logMap.get(value) ?? 0) + 1);
      }
    }

    for (const [type, count] of logMap.entries()) {
      if (count === 4) {
        if (type === BLOCKS.OAK_WOOD) {
          this.clearGrid3x3();
          this.inventory?.addItem(BLOCKS.OAK_PLANKS, 16);
          return true;
        }
        if (type === BLOCKS.SPRUCE_WOOD) {
          this.clearGrid3x3();
          this.inventory?.addItem(BLOCKS.SPRUCE_PLANKS, 16);
          return true;
        }
        if (type === BLOCKS.ACACIA_WOOD) {
          this.clearGrid3x3();
          this.inventory?.addItem(BLOCKS.ACACIA_PLANKS, 16);
          return true;
        }
      }
    }

    if (this.grid3x3.filter(v => v === BLOCKS.STONE).length === 4) {
      this.clearGrid3x3();
      this.inventory?.addItem(BLOCKS.STONE_BRICKS, 2);
      return true;
    }

    if (this.grid3x3.filter(v => v === BLOCKS.STONE_BRICKS).length === 4) {
      this.clearGrid3x3();
      this.inventory?.addItem(BLOCKS.OVEN, 1);
      return true;
    }

    return false;
  }

  addOvenRecipe({ inputItemId, outputItemId, amount = 1, durationMs = 15000 } = {}) {
    if (!this.inventory) return false;
    if (this.ovenQueue.length >= 4) return false;
    this.ovenQueue.push({ inputItemId, outputItemId, amount, durationMs, elapsed: 0 });
    return true;
  }

  tick(deltaMs) {
    for (let i = this.ovenQueue.length - 1; i >= 0; i--) {
      const job = this.ovenQueue[i];
      job.elapsed += deltaMs;
      if (job.elapsed >= job.durationMs) {
        this.inventory?.addItem(job.outputItemId, job.amount);
        this.ovenQueue.splice(i, 1);
      }
    }
  }

  makeGlassA() {
    if (!this.inventory) return false;
    if (!this.inventory.hasItem(BLOCKS.SAND, 1)) return false;
    if (!this.inventory.hasItem(BLOCKS.OAK_PLANKS, 1)) return false;
    this.inventory.removeItem(BLOCKS.SAND, 1);
    this.inventory.removeItem(BLOCKS.OAK_PLANKS, 1);
    return this.addOvenRecipe({
      inputItemId: BLOCKS.SAND,
      outputItemId: BLOCKS.GLASS,
      amount: 1,
      durationMs: 15000
    });
  }

  makeGlassB() {
    if (!this.inventory) return false;
    if (!this.inventory.hasItem(BLOCKS.SAND, 4)) return false;
    if (!this.inventory.hasItem(BLOCKS.OAK_WOOD, 1)) return false;
    this.inventory.removeItem(BLOCKS.SAND, 4);
    this.inventory.removeItem(BLOCKS.OAK_WOOD, 1);
    return this.addOvenRecipe({
      inputItemId: BLOCKS.SAND,
      outputItemId: BLOCKS.GLASS,
      amount: 4,
      durationMs: 15000
    });
  }
}

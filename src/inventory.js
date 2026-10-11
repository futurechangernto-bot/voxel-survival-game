import { BLOCKS, HOTBAR_SLOTS, MAIN_INVENTORY_SLOTS, STACK_LIMIT } from './blocks.js';

export class InventorySystem {
  constructor({ onOpenChange } = {}) {
    this.mainSlots = Array.from({ length: MAIN_INVENTORY_SLOTS }, () => null);
    this.hotbarSlots = Array.from({ length: HOTBAR_SLOTS }, () => null);
    this.selectedIndex = 0;
    this.open = false;
    this.onOpenChange = onOpenChange ?? (() => {});

    this.inventoryGridEl = document.getElementById('inventory-grid');
    this.hotbarGridEl = document.getElementById('hotbar-grid');
    this.overlayEl = document.getElementById('inventory-overlay');
    this.closeBtn = document.getElementById('close-inventory-btn');
    this.breakProgressEl = document.getElementById('break-progress');

    this.miningActive = false;
    this.miningStart = 0;
    this.miningDuration = 0;
    this.miningTarget = null;

    this.bindUI();
    this.render();
  }

  bindUI() {
    document.addEventListener('keydown', (event) => {
      if (event.code === 'KeyI') {
        event.preventDefault();
        if (this.open) this.close();
        else this.openInventory();
      }
    });

    document.addEventListener('keydown', (event) => {
      const mapping = {
        Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Digit5: 4,
        Digit6: 5, Digit7: 6, Digit8: 7, Digit9: 8, Digit0: 9
      };
      if (Object.hasOwn(mapping, event.code)) {
        const idx = mapping[event.code];
        if (idx < this.hotbarSlots.length) {
          this.selectedIndex = idx;
          this.render();
        }
      }
    });

    this.closeBtn?.addEventListener('click', () => this.close());
  }

  openInventory() {
    this.open = true;
    this.overlayEl?.classList.remove('hidden');
    this.onOpenChange?.(true);
  }

  close() {
    this.open = false;
    this.overlayEl?.classList.add('hidden');
    this.onOpenChange?.(false);
  }

  getSelectedItem() {
    return this.hotbarSlots[this.selectedIndex] ?? null;
  }

  setSelectedIndex(index) {
    if (index < 0) index = 0;
    if (index >= this.hotbarSlots.length) index = this.hotbarSlots.length - 1;
    this.selectedIndex = index;
    this.render();
  }

  itemName(itemId) {
    const names = {
      [BLOCKS.OAK_WOOD]: 'Oak Log',
      [BLOCKS.SPRUCE_WOOD]: 'Spruce Log',
      [BLOCKS.ACACIA_WOOD]: 'Acacia Log',
      [BLOCKS.DIRT]: 'Dirt',
      [BLOCKS.SAND]: 'Sand',
      [BLOCKS.STONE]: 'Stone',
      [BLOCKS.OAK_PLANKS]: 'Oak Planks',
      [BLOCKS.SPRUCE_PLANKS]: 'Spruce Planks',
      [BLOCKS.ACACIA_PLANKS]: 'Acacia Planks',
      [BLOCKS.STONE_BRICKS]: 'Stone Bricks',
      [BLOCKS.OVEN]: 'Oven',
      [BLOCKS.GLASS]: 'Glass',
      [BLOCKS.CRAFTING_TABLE]: 'Crafting Table',
      [BLOCKS.GRASS]: 'Grass',
      [BLOCKS.SNOW]: 'Snow'
    };
    return names[itemId] ?? `Item ${itemId}`;
  }

  addItem(itemId, amount = 1) {
    if (!Number.isInteger(amount) || amount <= 0) return 0;
    let remaining = amount;

    for (let i = 0; i < this.hotbarSlots.length; i++) {
      const slot = this.hotbarSlots[i];
      if (slot && slot.itemId === itemId && slot.amount < STACK_LIMIT) {
        const add = Math.min(remaining, STACK_LIMIT - slot.amount);
        slot.amount += add;
        remaining -= add;
      }
      if (remaining <= 0) break;
    }

    for (let i = 0; i < this.mainSlots.length; i++) {
      const slot = this.mainSlots[i];
      if (slot && slot.itemId === itemId && slot.amount < STACK_LIMIT) {
        const add = Math.min(remaining, STACK_LIMIT - slot.amount);
        slot.amount += add;
        remaining -= add;
      }
      if (remaining <= 0) break;
    }

    if (remaining > 0) {
      for (let i = 0; i < this.hotbarSlots.length; i++) {
        if (!this.hotbarSlots[i]) {
          const add = Math.min(remaining, STACK_LIMIT);
          this.hotbarSlots[i] = { itemId, amount: add };
          remaining -= add;
        }
        if (remaining <= 0) break;
      }
    }

    if (remaining > 0) {
      for (let i = 0; i < this.mainSlots.length; i++) {
        if (!this.mainSlots[i]) {
          const add = Math.min(remaining, STACK_LIMIT);
          this.mainSlots[i] = { itemId, amount: add };
          remaining -= add;
        }
        if (remaining <= 0) break;
      }
    }

    this.render();
    return amount - remaining;
  }

  removeItem(itemId, amount = 1) {
    let remaining = amount;
    const removeFrom = (slots) => {
      for (let i = 0; i < slots.length && remaining > 0; i++) {
        const slot = slots[i];
        if (!slot || slot.itemId !== itemId) continue;
        const take = Math.min(slot.amount, remaining);
        slot.amount -= take;
        remaining -= take;
        if (slot.amount <= 0) slots[i] = null;
      }
    };

    removeFrom(this.hotbarSlots);
    removeFrom(this.mainSlots);
    this.render();
    return amount - remaining;
  }

  hasItem(itemId, amount = 1) {
    let total = 0;
    for (const slot of [...this.hotbarSlots, ...this.mainSlots]) {
      if (!slot) continue;
      if (slot.itemId === itemId) total += slot.amount;
      if (total >= amount) return true;
    }
    return false;
  }

  consumeSelected(amount = 1) {
    const slot = this.hotbarSlots[this.selectedIndex];
    if (!slot) return false;
    slot.amount -= amount;
    if (slot.amount <= 0) this.hotbarSlots[this.selectedIndex] = null;
    this.render();
    return true;
  }

  getSelectedBlockId() {
    const slot = this.hotbarSlots[this.selectedIndex];
    return slot ? slot.itemId : null;
  }

  startMining(target, blockType) {
    const base = {
      [BLOCKS.DIRT]: 0.4,
      [BLOCKS.GRASS]: 0.4,
      [BLOCKS.SAND]: 0.4,
      [BLOCKS.SNOW]: 0.4,
      [BLOCKS.OAK_WOOD]: 0.8,
      [BLOCKS.SPRUCE_WOOD]: 0.8,
      [BLOCKS.ACACIA_WOOD]: 0.8,
      [BLOCKS.OAK_PLANKS]: 0.8,
      [BLOCKS.SPRUCE_PLANKS]: 0.8,
      [BLOCKS.ACACIA_PLANKS]: 0.8,
      [BLOCKS.STONE]: 1.5,
      [BLOCKS.STONE_BRICKS]: 1.5,
      [BLOCKS.OVEN]: 1.5,
      [BLOCKS.CRAFTING_TABLE]: 0.8
    };

    this.miningActive = true;
    this.miningTarget = target;
    this.miningDuration = base[blockType] ?? 0.5;
    this.miningStart = performance.now();
  }

  stopMining() {
    this.miningActive = false;
    this.miningTarget = null;
    this.miningDuration = 0;
    this.miningStart = 0;
    this.breakProgressEl.style.opacity = '0';
    this.breakProgressEl.style.width = '0%';
  }

  updateMining(deltaMs) {
    if (!this.miningActive || !this.miningTarget) return false;
    const elapsed = performance.now() - this.miningStart;
    const progress = Math.min(1, elapsed / (this.miningDuration * 1000));
    this.breakProgressEl.style.opacity = '1';
    this.breakProgressEl.style.width = `${Math.round(progress * 100)}%`;
    if (progress >= 1) {
      this.stopMining();
      return true;
    }
    return false;
  }

  render() {
    if (this.inventoryGridEl) {
      this.inventoryGridEl.innerHTML = '';
      for (let i = 0; i < this.mainSlots.length; i++) {
        const slot = document.createElement('div');
        slot.className = 'inventory-slot';
        const item = this.mainSlots[i];
        if (item) {
          slot.innerHTML = `<div class="item-name">${this.itemName(item.itemId)}</div><div class="item-stack">${item.amount}</div>`;
        } else {
          slot.innerHTML = '<div class="item-name empty">Empty</div>';
        }
        this.inventoryGridEl.appendChild(slot);
      }
    }

    if (this.hotbarGridEl) {
      this.hotbarGridEl.innerHTML = '';
      for (let i = 0; i < this.hotbarSlots.length; i++) {
        const slot = document.createElement('div');
        slot.className = `inventory-slot ${i === this.selectedIndex ? 'selected' : ''}`;
        const item = this.hotbarSlots[i];
        if (item) {
          slot.innerHTML = `<div class="item-name">${this.itemName(item.itemId)}</div><div class="item-stack">${item.amount}</div>`;
        } else {
          slot.innerHTML = '<div class="item-name empty">Empty</div>';
        }
        this.hotbarGridEl.appendChild(slot);
      }
    }
  }

  autoPickup(dropEntities, playerPos) {
    for (let i = dropEntities.length - 1; i >= 0; i--) {
      const drop = dropEntities[i];
      if (!drop || !drop.mesh) continue;
      const dist = drop.mesh.position.distanceTo(playerPos);
      if (dist <= 1.5) {
        const added = this.addItem(drop.itemId, drop.amount);
        if (added > 0) {
          drop.dispose();
          dropEntities.splice(i, 1);
        }
      }
    }
  }
}

export const BLOCKS = Object.freeze({
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  SAND: 4,
  OAK_WOOD: 5,
  WATER: 6,
  SNOW: 7,
  OAK_LEAVES: 8,
  SPRUCE_WOOD: 9,
  SPRUCE_LEAVES: 10,
  ACACIA_WOOD: 11,
  ACACIA_LEAVES: 12,
  CACTUS: 13,
  BEDROCK: 14,
  OAK_PLANKS: 15,
  SPRUCE_PLANKS: 16,
  ACACIA_PLANKS: 17,
  STONE_BRICKS: 18,
  OVEN: 19,
  GLASS: 20,
  CRAFTING_TABLE: 21
});

export const MAIN_INVENTORY_SLOTS = 30;
export const HOTBAR_SLOTS = 10;
export const STACK_LIMIT = 32;

export const BLOCK_HARDNESS = Object.freeze({
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
  [BLOCKS.CRAFTING_TABLE]: 0.8,
  [BLOCKS.GLASS]: 0.8
});

export const BLOCK_COLORS = Object.freeze({
  [BLOCKS.GRASS]: 0x5daa3d,
  [BLOCKS.DIRT]: 0x7a4d2b,
  [BLOCKS.STONE]: 0x8d8d8d,
  [BLOCKS.SAND]: 0xd6c37a,
  [BLOCKS.OAK_WOOD]: 0x8d5a2d,
  [BLOCKS.WATER]: 0x4ca3ff,
  [BLOCKS.SNOW]: 0xeaf7ff,
  [BLOCKS.OAK_LEAVES]: 0x4a8d36,
  [BLOCKS.SPRUCE_WOOD]: 0x74512d,
  [BLOCKS.SPRUCE_LEAVES]: 0x3d7340,
  [BLOCKS.ACACIA_WOOD]: 0xa1663f,
  [BLOCKS.ACACIA_LEAVES]: 0x6e9d39,
  [BLOCKS.CACTUS]: 0x4f9d42,
  [BLOCKS.BEDROCK]: 0x4c4c4c,
  [BLOCKS.OAK_PLANKS]: 0xc69d63,
  [BLOCKS.SPRUCE_PLANKS]: 0x9d7a56,
  [BLOCKS.ACACIA_PLANKS]: 0xb26d3d,
  [BLOCKS.STONE_BRICKS]: 0x9aa0a3,
  [BLOCKS.OVEN]: 0x5a5f68,
  [BLOCKS.GLASS]: 0xcaf0ff,
  [BLOCKS.CRAFTING_TABLE]: 0x9f7140
});

export function blockDisplayName(type) {
  const names = {
    [BLOCKS.AIR]: 'Air',
    [BLOCKS.GRASS]: 'Grass',
    [BLOCKS.DIRT]: 'Dirt',
    [BLOCKS.STONE]: 'Stone',
    [BLOCKS.SAND]: 'Sand',
    [BLOCKS.OAK_WOOD]: 'Oak Log',
    [BLOCKS.WATER]: 'Water',
    [BLOCKS.SNOW]: 'Snow',
    [BLOCKS.OAK_LEAVES]: 'Oak Leaves',
    [BLOCKS.SPRUCE_WOOD]: 'Spruce Log',
    [BLOCKS.SPRUCE_LEAVES]: 'Spruce Leaves',
    [BLOCKS.ACACIA_WOOD]: 'Acacia Log',
    [BLOCKS.ACACIA_LEAVES]: 'Acacia Leaves',
    [BLOCKS.CACTUS]: 'Cactus',
    [BLOCKS.BEDROCK]: 'Bedrock',
    [BLOCKS.OAK_PLANKS]: 'Oak Planks',
    [BLOCKS.SPRUCE_PLANKS]: 'Spruce Planks',
    [BLOCKS.ACACIA_PLANKS]: 'Acacia Planks',
    [BLOCKS.STONE_BRICKS]: 'Stone Bricks',
    [BLOCKS.OVEN]: 'Oven',
    [BLOCKS.GLASS]: 'Glass',
    [BLOCKS.CRAFTING_TABLE]: 'Crafting Table'
  };
  return names[type] ?? 'Unknown';
}

export function isSolidType(type) {
  return type > 0 && type !== BLOCKS.WATER && type !== BLOCKS.AIR;
}

import type { ResourceDefinition } from "./ResourceDefinitions.entity";

export type EconomyItem = {
  id: string; // The same IDs from ResourceDefinitions, e.g. ore_1
  name: string;
  sellPrice: number;
  buyPrice: number;
}

export type CraftRecipe = {
  resultId: string;
  quantityProduced: number;
  ingredients: { itemId: string; quantity: number }[];
}

// Map of standard item prices
export const ECONOMY_PRICES: Record<string, EconomyItem> = {
  // Raw Ores / Drops
  ore_1: { id: 'ore_1', name: 'Pedra', sellPrice: 3, buyPrice: 4 },
  coal: { id: 'coal', name: 'Carvão', sellPrice: 4, buyPrice: 5 },
  ore_2: { id: 'ore_2', name: 'Minério de Alumínio', sellPrice: 12, buyPrice: 15 },
  ore_4: { id: 'ore_4', name: 'Minério de Cobre', sellPrice: 12, buyPrice: 17 },
  ore_6: { id: 'ore_6', name: 'Minério de Ferro', sellPrice: 14, buyPrice: 19 },
  ore_7: { id: 'ore_7', name: 'Minério de Ouro', sellPrice: 32, buyPrice: 43 },
  ore_8: { id: 'ore_8', name: 'Minério de Platina', sellPrice: 42, buyPrice: 53 },
  
  // Gems (Ametista = ore_3, Rubi = ore_9, Diamante = ore_5)
  ore_3: { id: 'ore_3', name: 'Ametista', sellPrice: 300, buyPrice: 0 },
  ore_9: { id: 'ore_9', name: 'Rubi', sellPrice: 425, buyPrice: 0 },
  ore_5: { id: 'ore_5', name: 'Diamante', sellPrice: 550, buyPrice: 0 },

  // Ingots
  ingot_copper: { id: 'ingot_copper', name: 'Lingote de Cobre', sellPrice: 120, buyPrice: 170 },
  ingot_iron: { id: 'ingot_iron', name: 'Lingote de Ferro', sellPrice: 140, buyPrice: 190 },
  ingot_gold: { id: 'ingot_gold', name: 'Lingote de Ouro', sellPrice: 320, buyPrice: 430 },
  ingot_platinum: { id: 'ingot_platinum', name: 'Lingote de Platina', sellPrice: 426, buyPrice: 533 },

  // Extras
  nails: { id: 'nails', name: 'Pregos', sellPrice: 0, buyPrice: 50 },

  // Plants, Sticks and Moss
  stick: { id: 'stick', name: 'Graveto', sellPrice: 0, buyPrice: 3 },
  cotton: { id: 'cotton', name: 'Algodão', sellPrice: 0, buyPrice: 4 },
  hibiscus: { id: 'hibiscus', name: 'Flor Hibiscus', sellPrice: 0, buyPrice: 3 },
  perpetual: { id: 'perpetual', name: 'Flor Perpétua', sellPrice: 0, buyPrice: 8 },
  borago: { id: 'borago', name: 'Flor Borago', sellPrice: 0, buyPrice: 14 },
  moss: { id: 'moss', name: 'Musgo', sellPrice: 0, buyPrice: 12 },
  
  // Mushrooms
  mushroom_1: { id: 'mushroom_1', name: 'Cogumelo Enoki', sellPrice: 0, buyPrice: 7 },
  mushroom_2: { id: 'mushroom_2', name: 'Cogumelo Shimeji', sellPrice: 0, buyPrice: 19 },
  mushroom_3: { id: 'mushroom_3', name: 'Cogumelo Shitake', sellPrice: 0, buyPrice: 17 },
  mushroom_4: { id: 'mushroom_4', name: 'Cogumelo Eryngii', sellPrice: 0, buyPrice: 23 },
  mushroom_5: { id: 'mushroom_5', name: 'Cogumelo Kikurage', sellPrice: 0, buyPrice: 645 },
};

export const CRAFTING_RECIPES: CraftRecipe[] = [
  {
    resultId: 'ingot_copper',
    quantityProduced: 1,
    ingredients: [
      { itemId: 'ore_4', quantity: 6 }, // Cobre
      { itemId: 'ore_2', quantity: 1 }, // Alumínio
      { itemId: 'coal', quantity: 1 },  // Carvão
    ]
  },
  {
    resultId: 'ingot_iron',
    quantityProduced: 1,
    ingredients: [
      { itemId: 'ore_6', quantity: 8 }, // Ferro
      { itemId: 'coal', quantity: 1 },  // Carvão
    ]
  },
  {
    resultId: 'ingot_gold',
    quantityProduced: 1,
    ingredients: [
      { itemId: 'ore_7', quantity: 8 }, // Ouro
      { itemId: 'coal', quantity: 2 },  // Carvão
    ]
  },
  {
    resultId: 'ingot_platinum',
    quantityProduced: 1,
    ingredients: [
      { itemId: 'ore_8', quantity: 8 }, // Platina
      { itemId: 'coal', quantity: 3 },  // Carvão
    ]
  }
];

export type ProfitCalculationResult = {
  grossRevenue: number;
  totalCost: number;
  netProfit: number;
  details: {
    itemsSold: Record<string, number>;
    itemsBought: Record<string, number>;
    itemsCrafted: Record<string, number>;
  }
}

/**
 * Calcula o lucro vendendo tudo como minério bruto.
 */
export function calculateRawProfit(resourceCounts: Record<string, number>): ProfitCalculationResult {
  let grossRevenue = 0;
  const itemsSold: Record<string, number> = {};

  for (const [itemId, quantity] of Object.entries(resourceCounts)) {
    const ecoDef = ECONOMY_PRICES[itemId];
    if (ecoDef && ecoDef.sellPrice > 0) {
      grossRevenue += quantity * ecoDef.sellPrice;
      itemsSold[itemId] = quantity;
    }
  }

  return {
    grossRevenue,
    totalCost: 0,
    netProfit: grossRevenue,
    details: {
      itemsSold,
      itemsBought: {},
      itemsCrafted: {}
    }
  };
}

/**
 * Calcula o lucro fazendo o máximo de lingotes possível.
 * Compra os auxiliares (como carvão) se não estiverem no inventário.
 */
export function calculateCraftingProfit(resourceCounts: Record<string, number>): ProfitCalculationResult {
  const inventory = { ...resourceCounts };
  let grossRevenue = 0;
  let totalCost = 0;

  const itemsSold: Record<string, number> = {};
  const itemsBought: Record<string, number> = {};
  const itemsCrafted: Record<string, number> = {};

  // Tenta craftar o máximo de cada receita (prioriza os mais caros ou na ordem)
  // A ordem atual é a do array CRAFTING_RECIPES
  for (const recipe of CRAFTING_RECIPES) {
    // Determina o gargalo dos materiais que não são compráveis ou principais
    // Vamos iterar até não conseguir mais ou até uma condição
    let canCraft = true;
    let craftedAmount = 0;

    while (canCraft) {
      // Checa se temos os minérios brutps requeridos (assumimos que carvão pode ser comprado)
      let missingPrimary = false;
      const roundCosts: { id: string, buyCount: number }[] = [];
      
      for (const ing of recipe.ingredients) {
        const has = inventory[ing.itemId] || 0;
        if (has < ing.quantity) {
          // Precisamos de mais. Podemos comprar?
          // Regra: Carvão, Pregos e Alumínio podem ser comprados se faltarem para fechar uma receita.
          if (ing.itemId !== 'coal' && ing.itemId !== 'nails' && ing.itemId !== 'ore_2') {
            missingPrimary = true;
            break;
          } else {
            // Conta quanto precisa comprar
            roundCosts.push({ id: ing.itemId, buyCount: ing.quantity - has });
          }
        }
      }

      if (missingPrimary) {
        canCraft = false;
        break;
      }

      // Desconta do inventário e adiciona os custos
      for (const ing of recipe.ingredients) {
        let has = inventory[ing.itemId] || 0;
        
        if (has < ing.quantity) {
          // Compra a diferença
          const buyAmount = ing.quantity - has;
          totalCost += buyAmount * (ECONOMY_PRICES[ing.itemId]?.buyPrice || 0);
          itemsBought[ing.itemId] = (itemsBought[ing.itemId] || 0) + buyAmount;
          // Subtrai apenas o que tinha (fica 0)
          inventory[ing.itemId] = 0;
        } else {
          // Tem o suficiente
          inventory[ing.itemId] -= ing.quantity;
        }
      }

      craftedAmount += recipe.quantityProduced;
    }

    if (craftedAmount > 0) {
      itemsCrafted[recipe.resultId] = craftedAmount;
      // Adiciona a receita da venda do lingote
      const sellPrice = ECONOMY_PRICES[recipe.resultId]?.sellPrice || 0;
      grossRevenue += craftedAmount * sellPrice;
      itemsSold[recipe.resultId] = craftedAmount;
    }
  }

  // Vende o que sobrou no inventário (que não virou lingote, como Pedras e Gemas, ou restos de minério)
  for (const [itemId, quantity] of Object.entries(inventory)) {
    if (quantity > 0) {
      const ecoDef = ECONOMY_PRICES[itemId];
      if (ecoDef && ecoDef.sellPrice > 0) {
        grossRevenue += quantity * ecoDef.sellPrice;
        itemsSold[itemId] = (itemsSold[itemId] || 0) + quantity;
      }
    }
  }

  return {
    grossRevenue,
    totalCost,
    netProfit: grossRevenue - totalCost,
    details: {
      itemsSold,
      itemsBought,
      itemsCrafted
    }
  };
}

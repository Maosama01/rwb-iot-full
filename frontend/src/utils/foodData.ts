export type FoodCategory = 
  | 'Fruits & Vegetables'
  | 'Breads & Grains'
  | 'Dairy & Eggs'
  | 'Meat & Fish'
  | 'Desserts & Sweets'
  | 'Garden & Yard'
  | 'Other';

export interface FoodItem {
  id: string;
  name: string;
  category: FoodCategory;
  compostable: boolean;
  notes?: string;
  aliases?: string[];
}

export const foodLibrary: FoodItem[] = [
  // Fruits & Vegetables
  { id: '1', name: 'Apple Cores', category: 'Fruits & Vegetables', compostable: true },
  { id: '2', name: 'Bananas', category: 'Fruits & Vegetables', compostable: true },
  { id: '3', name: 'Citrus Peels', category: 'Fruits & Vegetables', compostable: true, notes: 'Use in moderation to balance pH.' },
  { id: '4', name: 'Onion Scraps', category: 'Fruits & Vegetables', compostable: true, notes: 'Chop them up to break down faster.' },
  { id: '5', name: 'Potato Peels', category: 'Fruits & Vegetables', compostable: true, aliases: ['Aloo'] },
  { id: '6', name: 'Spinach', category: 'Fruits & Vegetables', compostable: true, aliases: ['Palak'] },
  { id: '7', name: 'Bitter Gourd', category: 'Fruits & Vegetables', compostable: true, aliases: ['Karela'] },
  
  // Breads & Grains
  { id: '8', name: 'Bread', category: 'Breads & Grains', compostable: true, notes: 'Stale bread is perfectly fine.' },
  { id: '9', name: 'Rice', category: 'Breads & Grains', compostable: true, aliases: ['Chawal'] },
  { id: '10', name: 'Pasta', category: 'Breads & Grains', compostable: true },
  { id: '11', name: 'Oats', category: 'Breads & Grains', compostable: true },

  // Dairy & Eggs
  { id: '12', name: 'Eggshells', category: 'Dairy & Eggs', compostable: true, notes: 'Crush them up first for best results. Have an egg-cellent day!' },
  { id: '13', name: 'Cheese', category: 'Dairy & Eggs', compostable: true, notes: 'Use in moderation.' },
  { id: '14', name: 'Butter', category: 'Dairy & Eggs', compostable: false, notes: 'Too much fat or oil can prevent your Food Grounds from drying or cause them to clump up.' },
  { id: '15', name: 'Paneer', category: 'Dairy & Eggs', compostable: true },

  // Meat & Fish
  { id: '16', name: 'Meat Scraps', category: 'Meat & Fish', compostable: true, notes: "Don't make the mi-steak of adding too much meat! Small amounts are okay." },
  { id: '17', name: 'Fish Bones', category: 'Meat & Fish', compostable: false, notes: 'Large bones cannot be broken down effectively.' },
  { id: '18', name: 'Chicken Bones', category: 'Meat & Fish', compostable: false, notes: 'Too hard for the grinder.' },

  // Desserts & Sweets
  { id: '19', name: 'Cake Scraps', category: 'Desserts & Sweets', compostable: true },
  { id: '20', name: 'Chocolate', category: 'Desserts & Sweets', compostable: true },

  // Garden & Yard
  { id: '21', name: 'Leaves', category: 'Garden & Yard', compostable: true },
  { id: '22', name: 'Grass Clippings', category: 'Garden & Yard', compostable: true },
  { id: '23', name: 'Twigs', category: 'Garden & Yard', compostable: false, notes: 'Woody items can jam the grinder.' },

  // Other
  { id: '24', name: 'Coffee Grounds', category: 'Other', compostable: true },
  { id: '25', name: 'Coffee Filters', category: 'Other', compostable: true, notes: 'Make sure they are paper, not synthetic.' },
  { id: '26', name: 'Tea Bags', category: 'Other', compostable: true, notes: 'Remove staples and ensure the bag is compostable.' },
  { id: '27', name: 'Cooking Oil', category: 'Other', compostable: false, notes: 'Fats and oils can create a greasy jam.' },
  { id: '28', name: 'Plastic Packaging', category: 'Other', compostable: false },
  { id: '29', name: 'Glass', category: 'Other', compostable: false },
];

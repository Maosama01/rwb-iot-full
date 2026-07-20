import React, { useState } from 'react';
import { Search, Info, CheckCircle2, XCircle, ChevronRight, Apple, Croissant, Milk, Drumstick, Cake, Leaf as LeafIcon, Package } from 'lucide-react';
import { foodLibrary, FoodItem, FoodCategory } from '../utils/foodData';
import AskRawbinCard from '../components/AskRawbinCard';

const categoryIcons: Record<FoodCategory, React.ElementType> = {
  'Fruits & Vegetables': Apple,
  'Breads & Grains': Croissant,
  'Dairy & Eggs': Milk,
  'Meat & Fish': Drumstick,
  'Desserts & Sweets': Cake,
  'Garden & Yard': LeafIcon,
  'Other': Package,
};

export default function LibraryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | null>(null);

  const filteredItems = searchQuery
    ? foodLibrary.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.aliases?.some(alias => alias.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : selectedCategory
    ? foodLibrary.filter(item => item.category === selectedCategory)
    : [];

  // Group items by category for the empty state
  const categories: FoodCategory[] = [
    'Fruits & Vegetables', 'Breads & Grains', 'Dairy & Eggs', 
    'Meat & Fish', 'Desserts & Sweets', 'Garden & Yard', 'Other'
  ];

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setSelectedItem(null);
    setSelectedCategory(null);
  };

  const renderItemDetail = (item: FoodItem) => {
    return (
      <div className="animate-fade-in organic-card p-6 md:p-10 border border-border/50 bg-white">
        <button 
          onClick={() => setSelectedItem(null)}
          className="text-compost-500 hover:text-compost-900 mb-6 flex items-center gap-2 font-medium"
        >
          <ChevronRight className="rotate-180" size={20} /> Back to Search
        </button>
        
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="flex-1">
            <h2 className="text-4xl font-serif font-bold text-compost-900 mb-2">{item.name}</h2>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-lg mb-8 ${item.compostable ? 'bg-leaf-100 text-leaf-900' : 'bg-[#FFF5F3] text-terracotta-600'}`}>
              {item.compostable ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
              {item.compostable ? 'Rawbin Approved' : 'Not OK to add'}
            </div>

            {item.notes && (
              <div className="bg-cream-50 p-6 rounded-2xl border border-border/50">
                <h4 className="font-bold text-compost-900 mb-2 flex items-center gap-2">
                  <Info size={20} className="text-leaf-600" />
                  Keep in mind
                </h4>
                <p className="text-compost-700 leading-relaxed text-lg">{item.notes}</p>
              </div>
            )}
          </div>
          
          <div className="w-full md:w-64 bg-cream-100 rounded-3xl p-6 text-center shrink-0">
             <div className="w-24 h-24 mx-auto bg-white rounded-2xl flex items-center justify-center shadow-organic-sm mb-4 text-leaf-600">
               {React.createElement(categoryIcons[item.category] || Package, { size: 48, strokeWidth: 1.5 })}
             </div>
             <p className="font-medium text-compost-500">{item.category}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto min-h-screen pb-20">
      <div className="text-center mb-10 pt-4">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-compost-900 tracking-tight mb-4">
          What can go in Rawbin?
        </h1>
        <p className="text-xl text-compost-500 font-medium max-w-lg mx-auto mb-8">
          Search from thousands of tested items, so you always know exactly what to add.
        </p>
        
        <div className="max-w-2xl mx-auto text-left">
          <AskRawbinCard 
            title="Ask Rawbin AI"
            subtitle="Not sure? Chat about any item"
            greeting="Hi! Ask me whether something's compostable, or how to keep your Rawbin healthy."
          />
        </div>
      </div>

      <div className="relative max-w-2xl mx-auto mb-12">
        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
          <Search className="h-6 w-6 text-compost-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-16 pr-6 py-5 text-lg border-2 border-border/50 rounded-full bg-white text-compost-900 placeholder-compost-400 focus:outline-none focus:ring-0 focus:border-leaf-600 transition-colors shadow-organic-sm"
          placeholder="Search for an item (e.g. Eggshells)"
          value={searchQuery}
          onChange={handleSearch}
        />
        {searchQuery && (
          <button 
            onClick={() => {setSearchQuery(''); setSelectedItem(null);}}
            className="absolute inset-y-0 right-0 pr-6 flex items-center text-compost-400 hover:text-compost-900"
          >
            <XCircle size={24} />
          </button>
        )}
      </div>

      {selectedItem ? (
        renderItemDetail(selectedItem)
      ) : searchQuery || selectedCategory ? (
        <div className="organic-card p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="px-4 py-2 text-sm font-bold text-compost-500 uppercase tracking-wider">
              {searchQuery ? `Results for "${searchQuery}"` : `${selectedCategory} Items`}
            </h3>
            {selectedCategory && !searchQuery && (
              <button 
                onClick={() => setSelectedCategory(null)}
                className="text-compost-500 hover:text-compost-900 text-sm font-medium mr-4 flex items-center gap-1"
              >
                <XCircle size={16} /> View all categories
              </button>
            )}
          </div>
          {filteredItems.length > 0 ? (
            <div className="divide-y divide-border/30">
              {filteredItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="w-full flex items-center justify-between p-4 hover:bg-cream-50 transition-colors rounded-xl text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${item.compostable ? 'bg-leaf-100 text-leaf-600' : 'bg-terracotta-500/10 text-terracotta-500'}`}>
                       {item.compostable ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                    </div>
                    <div>
                      <span className="font-bold text-compost-900 text-lg">{item.name}</span>
                      <p className="text-sm text-compost-500">{item.category}</p>
                    </div>
                  </div>
                  <ChevronRight className="text-compost-300" />
                </button>
              ))}
            </div>
          ) : (
             <div className="text-center py-12">
                <p className="text-xl font-medium text-compost-500 mb-2">No items found.</p>
                <p className="text-compost-400">Try a different search term or check out our guide.</p>
             </div>
          )}
        </div>
      ) : (
        <div>
          <h3 className="text-2xl font-serif font-bold text-compost-900 mb-6">Browse by Category</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map(category => {
               const Icon = categoryIcons[category];
               return (
                 <button 
                   key={category} 
                   onClick={() => setSelectedCategory(category)}
                   className="w-full group cursor-pointer organic-card p-6 flex flex-col items-center text-center hover:border-leaf-600 hover:shadow-organic transition-all"
                 >
                   <div className="bg-cream-100 text-leaf-600 p-4 rounded-full mb-4 group-hover:scale-110 group-hover:bg-leaf-100 transition-transform">
                     <Icon size={32} strokeWidth={1.5} />
                   </div>
                   <span className="font-bold text-compost-900">{category}</span>
                 </button>
               )
            })}
          </div>
        </div>
      )}
    </div>
  );
}

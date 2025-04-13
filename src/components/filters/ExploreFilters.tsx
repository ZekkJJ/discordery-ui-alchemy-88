
import React, { useState } from 'react';
import { Filter, SlidersHorizontal, X } from 'lucide-react';

interface FilterOption {
  id: string;
  label: string;
}

const categoryOptions: FilterOption[] = [
  { id: 'gaming', label: 'Gaming' },
  { id: 'music', label: 'Music' },
  { id: 'education', label: 'Education' },
  { id: 'technology', label: 'Technology' },
  { id: 'art', label: 'Art & Design' },
  { id: 'community', label: 'Community' }
];

const typeOptions: FilterOption[] = [
  { id: 'all', label: 'All' },
  { id: 'bots', label: 'Bots' },
  { id: 'servers', label: 'Servers' }
];

const sortOptions: FilterOption[] = [
  { id: 'trending', label: 'Trending' },
  { id: 'newest', label: 'Newest' },
  { id: 'members', label: 'Most Members' },
  { id: 'alphabetical', label: 'Alphabetical' }
];

const ExploreFilters: React.FC = () => {
  const [selectedType, setSelectedType] = useState('all');
  const [selectedSort, setSelectedSort] = useState('trending');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
    } else {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };
  
  const clearFilters = () => {
    setSelectedType('all');
    setSelectedSort('trending');
    setSelectedCategories([]);
  };
  
  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Explore</h1>
        
        {/* Mobile filter button */}
        <button 
          className="md:hidden flex items-center gap-2 btn-secondary"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
        </button>
        
        {/* Desktop filters - always visible */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-discordery-gray" />
            <span className="text-sm text-discordery-gray">Sort:</span>
            <select 
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="bg-discordery-card-bg border border-discordery-gray/20 rounded-md text-sm p-1.5 pr-8 appearance-none focus:outline-none focus:border-discordery-indigo"
            >
              {sortOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-discordery-gray">Type:</span>
            <div className="flex rounded-md overflow-hidden border border-discordery-gray/20">
              {typeOptions.map((option) => (
                <button
                  key={option.id}
                  className={`px-3 py-1.5 text-sm transition-colors ${
                    selectedType === option.id 
                      ? 'bg-discordery-indigo text-discordery-text' 
                      : 'bg-discordery-card-bg text-discordery-gray hover:bg-discordery-gray/20'
                  }`}
                  onClick={() => setSelectedType(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          
          {selectedCategories.length > 0 && (
            <button 
              onClick={clearFilters}
              className="text-sm text-discordery-indigo hover:text-discordery-indigo-highlight flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Clear filters
            </button>
          )}
        </div>
      </div>
      
      {/* Mobile filters - conditionally visible */}
      {showMobileFilters && (
        <div className="md:hidden mb-6 p-4 bg-discordery-card-bg rounded-lg border border-discordery-gray/20 animate-fade-in">
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2 text-discordery-gray">Sort by</h3>
            <select 
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="w-full bg-discordery-background border border-discordery-gray/20 rounded-md text-sm p-2 appearance-none focus:outline-none focus:border-discordery-indigo"
            >
              {sortOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2 text-discordery-gray">Type</h3>
            <div className="flex rounded-md overflow-hidden border border-discordery-gray/20">
              {typeOptions.map((option) => (
                <button
                  key={option.id}
                  className={`flex-1 py-2 text-sm transition-colors ${
                    selectedType === option.id 
                      ? 'bg-discordery-indigo text-discordery-text' 
                      : 'bg-discordery-background text-discordery-gray hover:bg-discordery-gray/20'
                  }`}
                  onClick={() => setSelectedType(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          
          <button 
            onClick={() => {
              clearFilters();
              setShowMobileFilters(false);
            }}
            className="w-full btn-secondary mt-2"
          >
            Apply Filters
          </button>
        </div>
      )}
      
      {/* Category filters - visible on both mobile and desktop */}
      <div className="flex flex-wrap gap-2">
        {categoryOptions.map((category) => (
          <button
            key={category.id}
            className={`px-3 py-1.5 rounded-full text-sm transition-all ${
              selectedCategories.includes(category.id)
                ? 'bg-discordery-indigo text-discordery-text'
                : 'bg-discordery-gray/20 text-discordery-gray hover:bg-discordery-gray/30'
            }`}
            onClick={() => toggleCategory(category.id)}
          >
            {category.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ExploreFilters;

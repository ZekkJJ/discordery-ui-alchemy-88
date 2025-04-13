
import React, { useState } from 'react';
import { Search } from 'lucide-react';

const SearchHero: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Searching for:', searchQuery);
    // In a real app, this would navigate to search results
  };
  
  return (
    <div className="text-center max-w-4xl mx-auto px-4">
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 animate-fade-in-1">
        Discover the Best{' '}
        <span className="bg-gradient-to-r from-discordery-indigo to-discordery-teal bg-clip-text text-transparent">
          Discord Communities
        </span>
      </h1>
      
      <p className="text-discordery-gray text-lg md:text-xl mb-8 max-w-2xl mx-auto animate-fade-in-2">
        Find and join the perfect Discord servers and bots for gaming, education, art,
        music, or whatever community you're looking for.
      </p>
      
      <form onSubmit={handleSearch} className="animate-fade-in-3">
        <div className="relative max-w-2xl mx-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for Discord servers or bots..."
            className="search-input"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-discordery-indigo hover:bg-discordery-indigo-highlight transition-colors duration-200 text-white p-2 rounded-md"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default SearchHero;


import React from 'react';
import { Search } from 'lucide-react';

const SearchBar: React.FC = () => {
  return (
    <div className="relative hidden md:block">
      <input
        type="text"
        placeholder="Quick search..."
        className="bg-discordery-card-bg text-sm rounded-full py-1.5 pl-9 pr-4 w-48 focus:w-64 transition-all duration-200 border border-discordery-gray/30 focus:border-discordery-indigo focus:outline-none"
      />
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-discordery-gray w-4 h-4" />
    </div>
  );
};

export default SearchBar;

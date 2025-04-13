
import React from 'react';
import { Search } from 'lucide-react';

const SearchBar = () => {
  return (
    <div className="relative">
      <div className="relative flex items-center">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Quick search..."
          className="w-full md:w-64 bg-gray-800 text-gray-100 text-sm rounded-full py-2 pl-9 pr-4 border border-gray-700 focus:border-indigo-500 focus:outline-none"
        />
      </div>
    </div>
  );
};

export default SearchBar;

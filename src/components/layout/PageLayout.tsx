
import React from 'react';
import Navbar from './Navbar';

interface PageLayoutProps {
  children: React.ReactNode;
  fullWidth?: boolean;
}

const PageLayout: React.FC<PageLayoutProps> = ({ children, fullWidth = false }) => {
  return (
    <div className="min-h-screen flex flex-col bg-discordery-background">
      <Navbar />
      
      <main className="flex-grow pt-16">
        <div className={fullWidth ? 'w-full' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'}>
          {children}
        </div>
      </main>
      
      <footer className="py-6 border-t border-discordery-gray/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="font-bold text-xl bg-gradient-to-r from-discordery-indigo to-discordery-teal bg-clip-text text-transparent">
                Discordery
              </div>
              <p className="text-discordery-gray text-sm mt-1">Discover the perfect Discord communities</p>
            </div>
            <div className="flex space-x-6 text-discordery-gray">
              <a href="#" className="hover:text-discordery-text transition-colors">About</a>
              <a href="#" className="hover:text-discordery-text transition-colors">Terms</a>
              <a href="#" className="hover:text-discordery-text transition-colors">Privacy</a>
              <a href="#" className="hover:text-discordery-text transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PageLayout;

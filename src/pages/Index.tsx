
import React from 'react';
import PageLayout from '../components/layout/PageLayout';
import SearchHero from '../components/search/SearchHero';
import FeaturedSection from '../components/featured/FeaturedSection';

const Index: React.FC = () => {
  return (
    <PageLayout>
      <section className="py-16 md:py-24">
        <SearchHero />
      </section>
      
      <FeaturedSection />
      
      {/* Categories Section */}
      <section className="py-12">
        <h2 className="text-2xl font-bold mb-6">
          <span className="text-discordery-teal">#</span> Browse Categories
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {['Gaming', 'Music', 'Education', 'Technology', 'Art & Design', 'Community'].map((category) => (
            <div
              key={category}
              className="bg-discordery-card-bg border border-discordery-gray/20 rounded-lg p-4 text-center hover:border-discordery-indigo transition-colors cursor-pointer"
            >
              <div className="text-discordery-indigo mb-2">
                {/* Icon placeholder */}
                <div className="w-12 h-12 mx-auto bg-discordery-indigo/20 rounded-full flex items-center justify-center">
                  <span className="text-xl">{category.charAt(0)}</span>
                </div>
              </div>
              <h3 className="text-lg font-medium">{category}</h3>
            </div>
          ))}
        </div>
      </section>
      
      {/* Call to Action */}
      <section className="py-12">
        <div className="bg-gradient-to-r from-discordery-indigo to-discordery-teal p-8 md:p-12 rounded-xl text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Add Your Discord Server or Bot</h2>
          <p className="text-lg opacity-80 mb-6 max-w-xl mx-auto">
            Reach thousands of users by listing your Discord server or bot on Discordery.
            It's completely free and takes just a few minutes.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="btn-primary bg-white text-discordery-indigo hover:bg-gray-100">
              Add Server
            </button>
            <button className="btn-secondary border-white text-white hover:bg-white/10">
              Add Bot
            </button>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Index;

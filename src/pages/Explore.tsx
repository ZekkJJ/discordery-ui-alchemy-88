
import React, { useState } from 'react';
import PageLayout from '../components/layout/PageLayout';
import ExploreFilters from '../components/filters/ExploreFilters';
import DiscordCard from '../components/cards/DiscordCard';

// Sample data - in a real app, this would come from an API
const exploreItems = [
  {
    id: 'gamers-haven',
    type: 'server' as const,
    name: 'Gamers Haven',
    description: 'The ultimate Discord server for gamers of all levels. Join tournaments, find teammates, and discuss the latest releases.',
    imageUrl: '/placeholder.svg',
    tags: ['Gaming', 'Community', 'Tournaments'],
    stats: { members: 15420 }
  },
  {
    id: 'music-lounge',
    type: 'server' as const,
    name: 'Music Lounge',
    description: 'A community for music lovers. Share your favorite songs, discover new artists, and join listening parties.',
    imageUrl: '/placeholder.svg',
    tags: ['Music', 'Community', 'Artists'],
    stats: { members: 8750 }
  },
  {
    id: 'designers-collective',
    type: 'server' as const,
    name: 'Designers Collective',
    description: 'A community for UI/UX designers, graphic artists and creative professionals to share work and get feedback.',
    imageUrl: '/placeholder.svg',
    tags: ['Design', 'Creative', 'Feedback'],
    stats: { members: 8765 }
  },
  {
    id: 'coding-hub',
    type: 'server' as const,
    name: 'Coding Hub',
    description: 'Connect with fellow developers, get help with coding problems, and collaborate on projects.',
    imageUrl: '/placeholder.svg',
    tags: ['Programming', 'Development', 'Technology'],
    stats: { members: 12340 }
  },
  {
    id: 'anime-world',
    type: 'server' as const,
    name: 'Anime World',
    description: 'A welcoming community for anime fans to discuss shows, share art, and participate in watch parties.',
    imageUrl: '/placeholder.svg',
    tags: ['Anime', 'Entertainment', 'Community'],
    stats: { members: 12800 }
  },
  {
    id: 'language-exchange',
    type: 'server' as const,
    name: 'Language Exchange',
    description: 'Practice languages with native speakers. Voice channels for English, Spanish, French, Japanese, and more!',
    imageUrl: '/placeholder.svg',
    tags: ['Education', 'Languages', 'International'],
    stats: { members: 6800 }
  },
  {
    id: 'developers-hub',
    type: 'server' as const,
    name: 'Developers Hub',
    description: 'Connect with fellow developers, get help with coding problems, and collaborate on projects.',
    imageUrl: '/placeholder.svg',
    tags: ['Programming', 'Development', 'Collaboration'],
    stats: { members: 9300 }
  },
  {
    id: 'art-showcase',
    type: 'server' as const,
    name: 'Art Showcase',
    description: 'Share your artwork, get constructive feedback, and connect with other artists. All skill levels welcome!',
    imageUrl: '/placeholder.svg',
    tags: ['Art', 'Creative', 'Showcase'],
    stats: { members: 5600 }
  },
];

const Explore: React.FC = () => {
  const [loading, setLoading] = useState(false);
  
  return (
    <PageLayout>
      <ExploreFilters />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {exploreItems.map((item, index) => (
          <div 
            key={item.id}
            className={`opacity-0 animate-fade-in`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <DiscordCard
              id={item.id}
              type={item.type}
              name={item.name}
              description={item.description}
              imageUrl={item.imageUrl}
              tags={item.tags}
              stats={item.stats}
            />
          </div>
        ))}
      </div>
      
      <div className="flex justify-center mt-10">
        <button 
          className="btn-secondary flex items-center justify-center min-w-40"
          disabled={loading}
          onClick={() => {
            setLoading(true);
            setTimeout(() => setLoading(false), 1000);
          }}
        >
          {loading ? 
            <span className="inline-block w-5 h-5 border-2 border-t-transparent border-discordery-indigo rounded-full animate-spin"></span> : 
            "Load More"
          }
        </button>
      </div>
    </PageLayout>
  );
};

export default Explore;

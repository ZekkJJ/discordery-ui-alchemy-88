
import React from 'react';
import DiscordCard from '../cards/DiscordCard';
import { Link } from 'react-router-dom';

// Sample data
const featuredItems = [
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
    id: 'music-master',
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
  }
];

const FeaturedSection: React.FC = () => {
  return (
    <section className="py-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">
          <span className="text-discordery-teal">#</span> Trending Now
        </h2>
        <Link to="/explore" className="text-discordery-indigo hover:text-discordery-indigo-highlight transition-colors flex items-center">
          View all
        </Link>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {featuredItems.map((item) => (
          <DiscordCard
            key={item.id}
            id={item.id}
            type={item.type}
            name={item.name}
            description={item.description}
            imageUrl={item.imageUrl}
            tags={item.tags}
            stats={item.stats}
          />
        ))}
      </div>
    </section>
  );
};

export default FeaturedSection;

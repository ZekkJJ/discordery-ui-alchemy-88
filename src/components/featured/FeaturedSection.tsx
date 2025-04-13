
import React from 'react';
import DiscordCard from '../cards/DiscordCard';

// Sample data
const featuredItems = [
  {
    id: 1,
    type: 'server' as const,
    name: 'Gamers Haven',
    description: 'The ultimate Discord server for gamers of all levels. Join tournaments, find teammates, and discuss the latest releases.',
    imageUrl: '/placeholder.svg',
    tags: ['Gaming', 'Community', 'Tournaments'],
    stats: { members: 15420 }
  },
  {
    id: 2,
    type: 'bot' as const,
    name: 'MusicMaster',
    description: 'Premium music bot with high quality audio, no lag, and support for Spotify, YouTube, and more platforms.',
    imageUrl: '/placeholder.svg',
    tags: ['Music', 'Audio', 'Utility'],
    stats: { stars: 4320 }
  },
  {
    id: 3,
    type: 'server' as const,
    name: 'Designers Collective',
    description: 'A community for UI/UX designers, graphic artists and creative professionals to share work and get feedback.',
    imageUrl: '/placeholder.svg',
    tags: ['Design', 'Creative', 'Feedback'],
    stats: { members: 8765 }
  },
  {
    id: 4,
    type: 'bot' as const,
    name: 'ModeratorPro',
    description: 'Advanced moderation bot with auto-mod features, custom commands, and detailed logging for server management.',
    imageUrl: '/placeholder.svg',
    tags: ['Moderation', 'Utility', 'Security'],
    stats: { stars: 6250 }
  }
];

const FeaturedSection: React.FC = () => {
  return (
    <section className="py-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">
          <span className="text-discordery-teal">#</span> Trending Now
        </h2>
        <a href="/explore" className="text-discordery-indigo hover:text-discordery-indigo-highlight transition-colors flex items-center">
          View all
        </a>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {featuredItems.map((item) => (
          <DiscordCard
            key={item.id}
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

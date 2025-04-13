
import React, { useState } from 'react';
import PageLayout from '../components/layout/PageLayout';
import ExploreFilters from '../components/filters/ExploreFilters';
import DiscordCard from '../components/cards/DiscordCard';

// Sample data - in a real app, this would come from an API
const exploreItems = [
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
  },
  {
    id: 5,
    type: 'server' as const,
    name: 'Anime World',
    description: 'A welcoming community for anime fans to discuss shows, share art, and participate in watch parties.',
    imageUrl: '/placeholder.svg',
    tags: ['Anime', 'Entertainment', 'Community'],
    stats: { members: 12800 }
  },
  {
    id: 6,
    type: 'bot' as const,
    name: 'EconomySimulator',
    description: 'Create a virtual economy in your server with currency, jobs, gambling, and more interactive features.',
    imageUrl: '/placeholder.svg',
    tags: ['Economy', 'Games', 'RPG'],
    stats: { stars: 3900 }
  },
  {
    id: 7,
    type: 'server' as const,
    name: 'Developers Hub',
    description: 'Connect with fellow developers, get help with coding problems, and collaborate on projects.',
    imageUrl: '/placeholder.svg',
    tags: ['Programming', 'Development', 'Collaboration'],
    stats: { members: 9300 }
  },
  {
    id: 8,
    type: 'bot' as const,
    name: 'EventPlanner',
    description: 'Organize server events with RSVP functionality, reminders, and timezone management.',
    imageUrl: '/placeholder.svg',
    tags: ['Events', 'Organization', 'Utility'],
    stats: { stars: 2840 }
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

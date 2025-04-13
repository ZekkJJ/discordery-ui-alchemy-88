
import React from 'react';
import { Users, Star, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DiscordCardProps {
  id?: string;
  type: 'bot' | 'server';
  name: string;
  description: string;
  imageUrl: string;
  tags: string[];
  stats: {
    stars?: number;
    members?: number;
  };
}

const DiscordCard: React.FC<DiscordCardProps> = ({
  id = '1',
  type,
  name,
  description,
  imageUrl,
  tags,
  stats
}) => {
  // For proper routing
  const detailPath = type === 'server' ? `/server/${id}` : `/bot/${id}`;
  
  return (
    <div className="discord-card h-full flex flex-col">
      {/* Card image */}
      <div className="h-32 overflow-hidden relative">
        <img 
          src={imageUrl || "/placeholder.svg"}
          alt={name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2">
          <div className={`tag-pill ${type === 'bot' ? 'bg-discordery-indigo/30' : 'bg-discordery-teal/30'}`}>
            {type === 'bot' ? 'Bot' : 'Server'}
          </div>
        </div>
      </div>
      
      {/* Card content */}
      <div className="p-4 flex-grow flex flex-col">
        <h3 className="text-lg font-semibold">{name}</h3>
        <p className="text-discordery-gray text-sm mt-1 line-clamp-2 flex-grow">{description}</p>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {tags.slice(0, 3).map((tag, index) => (
            <span key={index} className={`tag-pill ${index % 2 === 0 ? 'teal' : ''}`}>
              {tag}
            </span>
          ))}
        </div>
        
        {/* Stats */}
        <div className="flex items-center justify-between mt-4 text-sm text-discordery-gray">
          <div className="flex space-x-3">
            {stats.stars !== undefined && (
              <div className="flex items-center">
                <Star className="w-4 h-4 mr-1 text-yellow-400" />
                <span>{stats.stars.toLocaleString()}</span>
              </div>
            )}
            {stats.members !== undefined && (
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                <span>{stats.members.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Card footer */}
      <div className="px-4 pb-4">
        <Link to={detailPath} className="btn-primary w-full flex items-center justify-center">
          <span className="mr-1">View {type === 'bot' ? 'Bot' : 'Server'}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default DiscordCard;

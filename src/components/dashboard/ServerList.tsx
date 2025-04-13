
import { useState } from "react";

interface Guild {
  id: string;
  name: string;
  icon: string;
  owner: boolean;
  isAlreadyListed: boolean;
}

interface ServerListProps {
  userGuilds: Guild[];
  selectedGuild: Guild | null;
  onSelectGuild: (guild: Guild) => void;
  loading: boolean;
}

const ServerList = ({ userGuilds, selectedGuild, onSelectGuild, loading }: ServerListProps) => {
  return (
    <div className="bg-gray-800 rounded-lg p-6 h-full">
      <h2 className="text-xl font-semibold text-white mb-4">Your Discord Servers</h2>
      
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : userGuilds.length === 0 ? (
        <p className="text-gray-400 text-center py-4">No servers found where you are the owner.</p>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {userGuilds.map((guild) => (
            <div 
              key={guild.id}
              onClick={() => !guild.isAlreadyListed && onSelectGuild(guild)}
              className={`p-3 rounded-lg border flex items-center gap-3 cursor-pointer transition-all ${
                selectedGuild?.id === guild.id 
                  ? 'bg-indigo-900 border-indigo-500' 
                  : guild.isAlreadyListed 
                    ? 'bg-gray-700 border-gray-600 opacity-60' 
                    : 'bg-gray-700 border-gray-600 hover:border-gray-500'
              }`}
            >
              <div className="flex-shrink-0 w-10 h-10 bg-gray-600 rounded-full overflow-hidden">
                {guild.icon ? (
                  <img 
                    src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`} 
                    alt={guild.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg font-medium text-white">
                    {guild.name.substring(0, 1)}
                  </div>
                )}
              </div>
              <div className="flex-grow">
                <p className="font-medium text-white">{guild.name}</p>
                {guild.isAlreadyListed && (
                  <span className="text-xs text-green-400">Already in directory</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServerList;

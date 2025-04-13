
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import { Star, Users, UserCheck, UserMinus, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

// Mock data - would be fetched from API in a real app
const serverData = {
  id: 'gamers-haven',
  name: 'Gamers Haven',
  description: 'The ultimate Discord server for gamers of all levels. Join tournaments, find teammates, and discuss the latest releases.',
  longDescription: `Welcome to Gamers Haven - the ultimate Discord community for gamers of all types!

Our server features dedicated channels for:
• Popular game titles including Minecraft, Fortnite, League of Legends, Valorant, and more
• Voice channels for team play with crystal-clear audio
• Tournament organization with weekly events and prizes
• Gaming news and discussion for staying up-to-date with the latest releases
• Looking-for-group systems to easily find teammates

We pride ourselves on maintaining a friendly, inclusive environment where gamers of all skill levels can connect, improve, and have fun. Our active moderation team ensures the community remains welcoming and toxic-free.

Join thousands of other gamers today and find your new gaming family!`,
  imageUrl: '/placeholder.svg',
  bannerUrl: '/placeholder.svg',
  tags: ['Gaming', 'Community', 'Tournaments', 'E-sports', 'Casual'],
  stats: {
    totalMembers: 15420,
    onlineMembers: 3241,
    offlineMembers: 12179
  },
  rating: 4.7,
  reviewCount: 342,
  comments: [
    {
      id: 1,
      username: "GamerPro99",
      content: "Found so many great teammates here. The tournaments are really well organized too!",
      rating: 5,
      timestamp: "2023-12-15"
    },
    {
      id: 2,
      username: "NovicePlayer",
      content: "Very helpful community for new players. Everyone is patient and willing to teach.",
      rating: 5,
      timestamp: "2023-11-28"
    },
    {
      id: 3,
      username: "MidnightGamer",
      content: "Active at all hours which is perfect for my weird schedule. Good moderation too.",
      rating: 4,
      timestamp: "2023-10-22"
    }
  ]
};

const ServerDetail: React.FC = () => {
  const { serverId } = useParams<{ serverId: string }>();
  const [joining, setJoining] = useState(false);
  
  // In a real app, we would fetch the server data based on the serverId
  // For now, we'll just use our mock data
  const server = serverData;
  
  // Function to handle joining the server
  const handleJoinServer = () => {
    setJoining(true);
    setTimeout(() => {
      setJoining(false);
      toast.success("Invite link copied to clipboard! Join the server now.");
    }, 800);
  };

  return (
    <PageLayout>
      <div className="animate-fade-in">
        {/* Back button */}
        <Link to="/explore" className="inline-flex items-center text-discordery-gray hover:text-discordery-text transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          <span>Back to Explore</span>
        </Link>
        
        {/* Server Banner */}
        <div className="relative w-full h-48 md:h-64 bg-discordery-card-bg overflow-hidden rounded-t-lg">
          <img 
            src={server.bannerUrl}
            alt={`${server.name} banner`}
            className="w-full h-full object-cover"
          />
          
          {/* Server Icon (overlaid on banner) */}
          <div className="absolute -bottom-12 left-6 w-24 h-24 rounded-full bg-discordery-background border-4 border-discordery-background overflow-hidden">
            <img
              src={server.imageUrl}
              alt={`${server.name} icon`}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        
        {/* Server Name and Tags */}
        <div className="bg-discordery-card-bg rounded-b-lg pt-16 pb-4 px-6 border-b border-discordery-gray/20">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{server.name}</h1>
          <div className="flex flex-wrap gap-2">
            {server.tags.map((tag, index) => (
              <span 
                key={index} 
                className={`tag-pill ${index % 2 === 0 ? 'teal' : ''}`}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        
        {/* Main content area - two column layout */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Primary column - Main area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Join Button and Member Stats */}
            <div className="bg-discordery-card-bg rounded-lg p-6 border border-discordery-gray/20">
              <button 
                className={`btn-primary w-full py-3 text-lg flex items-center justify-center transition-all duration-200 hover:scale-[1.02] ${joining ? 'opacity-80' : ''}`}
                onClick={handleJoinServer}
                disabled={joining}
              >
                {joining ? (
                  <span className="inline-block w-5 h-5 border-2 border-t-transparent border-discordery-text rounded-full animate-spin mr-2"></span>
                ) : null}
                {joining ? "Getting invite link..." : "Join Server"}
              </button>
              
              <div className="flex flex-col sm:flex-row justify-between mt-6 text-center divide-y sm:divide-y-0 sm:divide-x divide-discordery-gray/20">
                <div className="flex-1 pb-4 sm:pb-0">
                  <div className="flex items-center justify-center gap-2">
                    <Users className="w-5 h-5 text-discordery-gray" />
                    <span className="text-lg font-medium">{server.stats.totalMembers.toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-discordery-gray mt-1">Total Members</p>
                </div>
                <div className="flex-1 py-4 sm:py-0 sm:px-4">
                  <div className="flex items-center justify-center gap-2">
                    <UserCheck className="w-5 h-5 text-discordery-teal" />
                    <span className="text-lg font-medium">{server.stats.onlineMembers.toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-discordery-gray mt-1">Online</p>
                </div>
                <div className="flex-1 pt-4 sm:pt-0 sm:px-4">
                  <div className="flex items-center justify-center gap-2">
                    <UserMinus className="w-5 h-5 text-discordery-gray" />
                    <span className="text-lg font-medium">{server.stats.offlineMembers.toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-discordery-gray mt-1">Offline</p>
                </div>
              </div>
            </div>
            
            {/* Description */}
            <div className="bg-discordery-card-bg rounded-lg p-6 border border-discordery-gray/20">
              <h2 className="text-xl font-semibold mb-4">About this Server</h2>
              <div className="whitespace-pre-line">{server.longDescription}</div>
            </div>
          </div>
          
          {/* Sidebar - Secondary area */}
          <div className="space-y-6">
            {/* Rating section */}
            <div className="bg-discordery-card-bg rounded-lg p-6 border border-discordery-gray/20">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold">Rating</h2>
                <div className="flex items-center">
                  <span className="text-2xl font-bold mr-2">{server.rating}</span>
                  <span className="text-discordery-gray text-sm">/ 5</span>
                </div>
              </div>
              
              <div className="flex items-center mb-2">
                {/* Rating stars */}
                <div className="flex mr-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.floor(server.rating)
                          ? "text-discordery-teal fill-discordery-teal"
                          : star <= server.rating
                          ? "text-discordery-teal fill-discordery-teal/50" // Half star
                          : "text-discordery-gray"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-discordery-gray text-sm">
                  ({server.reviewCount} {server.reviewCount === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            </div>
            
            {/* Comments section */}
            <div className="bg-discordery-card-bg rounded-lg p-6 border border-discordery-gray/20">
              <h2 className="text-xl font-semibold mb-4">Comments</h2>
              
              <div className="space-y-4">
                {server.comments.map((comment) => (
                  <div key={comment.id} className="p-3 bg-discordery-background rounded-md border border-discordery-gray/20">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">{comment.username}</span>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i}
                            className={`w-3 h-3 ${i < comment.rating ? 'text-discordery-teal fill-discordery-teal' : 'text-discordery-gray'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-discordery-gray mb-1">{comment.content}</p>
                    <div className="text-xs text-discordery-gray">{comment.timestamp}</div>
                  </div>
                ))}
                
                <button className="w-full text-center py-2 text-sm text-discordery-indigo hover:text-discordery-indigo-highlight transition-colors">
                  View all comments
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default ServerDetail;

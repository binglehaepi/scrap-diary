import React, { useState } from 'react';
import { TwitterEmbed } from 'react-social-media-embed';
import { ScrapMetadata } from '../../types';

interface TwitterCardProps {
  data: ScrapMetadata;
}

const TwitterCard: React.FC<TwitterCardProps> = ({ data }) => {
  // We use an overlay to capture mouse events for dragging.
  // The user can toggle this to interact with the embed.
  const [isInteractive, setIsInteractive] = useState(false);

  return (
    <div className="w-[350px] bg-white p-2 pb-6 shadow-xl relative group transition-transform">
       {/* 1. Texture Overlay (The "Printed Look" Trick) */}
       <div className="texture-overlay"></div>

       {/* 2. Tape Handle */}
       <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-32 h-10 z-30 opacity-90 rotate-1">
          <div className="w-full h-full bg-blue-100/60 backdrop-blur-sm shadow-sm border-l border-r border-white/40" 
               style={{ clipPath: 'polygon(0% 10%, 5% 0%, 95% 0%, 100% 10%, 100% 90%, 95% 100%, 5% 100%, 0% 90%)' }}>
          </div>
       </div>

       {/* 3. Drag Overlay (Solves iframe drag issue) */}
       {!isInteractive && (
         <div className="absolute inset-0 z-20 bg-transparent cursor-grab active:cursor-grabbing" title="Drag to move">
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors pointer-events-none"></div>
         </div>
       )}

       {/* 4. Controls */}
       <button 
         onClick={(e) => { e.stopPropagation(); setIsInteractive(!isInteractive); }}
         className={`absolute top-2 right-2 z-40 w-8 h-8 rounded-full shadow-md flex items-center justify-center transition-all ${isInteractive ? 'bg-blue-500 text-white' : 'bg-white text-slate-400 opacity-0 group-hover:opacity-100'}`}
         title={isInteractive ? "Lock to Drag" : "Unlock to Interact"}
       >
          {isInteractive ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 6.89a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
            </svg>
          )}
       </button>

       {/* 5. Embed Content */}
       <div className={`transition-opacity ${isInteractive ? 'opacity-100' : 'opacity-90'}`}>
          <TwitterEmbed url={data.url} width="100%" />
       </div>
    </div>
  );
};

export default TwitterCard;
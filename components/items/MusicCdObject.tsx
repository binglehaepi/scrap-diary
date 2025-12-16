import React, { useState, useRef } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';
import { ScrapMetadata } from '../../types';

interface MusicCdObjectProps {
  data: ScrapMetadata;
}

const MusicCdObject: React.FC<MusicCdObjectProps> = ({ data }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef<any>(null);

  const getVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };
  const videoId = getVideoId(data.url);

  const onPlayerReady: YouTubeProps['onReady'] = (event) => {
    playerRef.current = event.target;
  };

  const onPlayerStateChange: YouTubeProps['onStateChange'] = (event) => {
    // 1: Playing, 2: Paused, 0: Ended
    if (event.data === 1) {
        setIsPlaying(true);
    } else if (event.data === 2 || event.data === 0) {
        setIsPlaying(false);
    }
  };

  const togglePlay = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!playerRef.current) return;
      
      // If player exists, toggle state
      if (isPlaying) {
          playerRef.current.pauseVideo();
      } else {
          playerRef.current.playVideo();
      }
  };

  if (!videoId) return <div className="p-4 bg-red-100 rounded">Invalid YouTube URL</div>;

  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
       {/* 1. Tiny Hidden YouTube Player (Behind the CD) */}
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 overflow-hidden opacity-0 pointer-events-none -z-10">
           <YouTube 
                videoId={videoId} 
                opts={{ 
                    height: '1', 
                    width: '1', 
                    playerVars: { 
                        autoplay: 0, 
                        controls: 0,
                        playsinline: 1 
                    } 
                }}
                onReady={onPlayerReady}
                onStateChange={onPlayerStateChange}
           />
       </div>

       {/* 2. The CD Visual */}
       <div 
          onClick={togglePlay}
          className={`
            w-48 h-48 rounded-full shadow-2xl relative cursor-pointer group 
            transition-transform duration-500 ease-out border-2 border-slate-200/20
            ${isPlaying ? 'scale-110' : 'hover:scale-105'}
          `}
       >
          {/* Album Art Container with Spin Animation */}
          <div 
            className={`w-full h-full rounded-full overflow-hidden relative shadow-md bg-slate-900 ${isPlaying ? 'animate-spin-slow' : 'paused-animation'}`}
            style={{ animationDuration: '4s' }}
          >
             <img 
                src={data.imageUrl} 
                alt="album art" 
                className="w-full h-full object-cover"
                onError={(e) => {
                    const target = e.currentTarget;
                    if (videoId) {
                        target.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
                    }
                }}
             />
             
             {/* CLEAN LOOK: Glossy Plastic Overlay */}
             <div className="gloss-overlay rounded-full opacity-50"></div>
             
             {/* Inner hole subtle border */}
             <div className="absolute inset-[40%] border border-white/10 rounded-full"></div>
          </div>

          {/* Center Hole / Label */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-inner z-10 border border-white/30">
              <div className="w-3 h-3 bg-white/80 rounded-full shadow-sm"></div>
          </div>

          {/* Pause/Play Overlay (only on hover) */}
          <div className={`absolute inset-0 rounded-full bg-black/20 flex items-center justify-center transition-opacity z-20 ${isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
              {isPlaying ? (
                   <svg className="w-12 h-12 text-white fill-current drop-shadow-md" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              ) : (
                   <svg className="w-12 h-12 text-white fill-current drop-shadow-md ml-1" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              )}
          </div>
       </div>
    </div>
  );
};

export default MusicCdObject;
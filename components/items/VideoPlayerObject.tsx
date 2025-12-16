import React, { useState } from 'react';
import YouTube from 'react-youtube';
import { ScrapMetadata } from '../../types';

interface VideoPlayerObjectProps {
  data: ScrapMetadata;
}

const VideoPlayerObject: React.FC<VideoPlayerObjectProps> = ({ data }) => {
  const [isPlayerActive, setIsPlayerActive] = useState(false);

  const getVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };
  const videoId = getVideoId(data.url);
  const start = data.youtubeConfig?.startTime || 0;

  if (!videoId) return <div className="p-4 bg-red-100 font-handwriting">Invalid</div>;

  return (
    <div className="w-[320px] bg-paper p-2 pb-6 shadow-xl relative group">
      {/* Texture Overlay for the frame */}
      <div className="texture-overlay"></div>

      {/* Decorative Washi Tape */}
      <div className="absolute -top-3 left-8 w-20 h-6 bg-yellow-400/80 rotate-[-2deg] shadow-sm backdrop-blur-sm z-10 tape-edge"></div>
      <div className="absolute -bottom-3 right-8 w-16 h-6 bg-blue-400/80 rotate-[3deg] shadow-sm backdrop-blur-sm z-10 tape-edge"></div>

      {/* Video Container */}
      <div className="relative w-full aspect-video bg-black rounded border-2 border-slate-800 overflow-hidden z-10">
        {!isPlayerActive ? (
             /* Thumbnail Facade */
             <div 
                className="absolute inset-0 cursor-pointer group/play"
                onClick={(e) => { e.stopPropagation(); setIsPlayerActive(true); }}
             >
                 <img 
                    src={data.imageUrl || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`} 
                    alt={data.title} 
                    className="w-full h-full object-cover opacity-90 group-hover/play:opacity-100 transition-opacity"
                    onError={(e) => {
                        e.currentTarget.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
                    }}
                 />
                 <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover/play:bg-black/10 transition-colors">
                     <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center shadow-xl group-hover/play:scale-110 transition-transform">
                          <svg className="w-7 h-7 text-white fill-current ml-1" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                     </div>
                 </div>
             </div>
        ) : (
            /* Actual Player */
            <YouTube 
                videoId={videoId}
                opts={{
                    width: '100%',
                    height: '100%',
                    playerVars: {
                        start: start,
                        autoplay: 1, // Auto-play when facade is clicked
                        modestbranding: 1,
                        origin: window.location.origin 
                    }
                }}
                className="w-full h-full"
                iframeClassName="w-full h-full"
            />
        )}
        
        {/* Drag Handle (Visible only when player is not active or via overlay if we wanted, but Facade handles drag better) */}
        {!isPlayerActive && (
             <div className="absolute top-0 right-0 w-8 h-8 z-20 cursor-move bg-slate-800/50 hover:bg-slate-800 text-white flex items-center justify-center rounded-bl-lg pointer-events-none">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>
             </div>
        )}
      </div>

      {/* Only show title on hover or when active */}
      {isPlayerActive && data.title && (
        <div className="mt-2 px-1 relative z-10">
          <h3 className="font-handwriting font-bold text-sm text-slate-600 leading-tight line-clamp-1 text-center">{data.title}</h3>
        </div>
      )}
    </div>
  );
};

export default VideoPlayerObject;
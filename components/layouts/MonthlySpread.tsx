import React, { useRef, useState } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';
import { ScrapItem, LayoutTextData, ScrapType } from '../../types';
import { compressImage } from '../../services/imageUtils';

interface MonthlySpreadProps {
  currentDate: Date;
  items: ScrapItem[];
  textData: LayoutTextData;
  onDateClick: (date: Date) => void;
  onWeekSelect: (date: Date) => void;
  onUpdateText: (key: string, field: string, value: string) => void;
}

const MonthlySpread: React.FC<MonthlySpreadProps> = ({ currentDate, items, textData, onDateClick, onWeekSelect, onUpdateText }) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // Mobile tab state
  const [mobileTab, setMobileTab] = useState<'dashboard' | 'calendar'>('dashboard');
  
  // Create a unique key for this month's dashboard data
  const dashboardKey = `${year}-${String(month + 1).padStart(2, '0')}-DASHBOARD`;
  const currentData = textData[dashboardKey] || {};

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptySlots = Array.from({ length: firstDayOfMonth }, (_, i) => i);
  
  const formatDate = (d: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  // D-Day Logic
  const calculateDDay = () => {
      if (!currentData.dDayDate) return "D-?";
      const today = new Date();
      today.setHours(0,0,0,0);
      const target = new Date(currentData.dDayDate);
      target.setHours(0,0,0,0);
      const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diff === 0) return "D-Day";
      if (diff > 0) return `D-${diff}`;
      return `D+${Math.abs(diff)}`;
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const musicCoverInputRef = useRef<HTMLInputElement>(null);
  const monthlyBgInputRef = useRef<HTMLInputElement>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkInputValue, setLinkInputValue] = useState('');
  
  // YouTube Logic for Dashboard CD
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef<any>(null);

  const getVideoId = (url: string) => {
      if (!url) return null;
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
  };
  
  const videoId = getVideoId(currentData.musicUrl || '');

  const onPlayerReady: YouTubeProps['onReady'] = (event) => {
      playerRef.current = event.target;
  };

  const onPlayerStateChange: YouTubeProps['onStateChange'] = (event) => {
      if (event.data === 1) setIsPlaying(true);
      else if (event.data === 2 || event.data === 0) setIsPlaying(false);
  };

  const handleCdClick = () => {
      if (!videoId) {
          // If no music, open upload
          musicCoverInputRef.current?.click();
      } else {
          // If music exists, toggle play
          if (playerRef.current) {
              if (isPlaying) playerRef.current.pauseVideo();
              else playerRef.current.playVideo();
          }
      }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    if (e.target.files && e.target.files[0]) {
      try {
          // Use larger size for backgrounds
          const maxWidth = field === 'monthlyBackground' ? 1200 : 400;
          const result = await compressImage(e.target.files[0], maxWidth, 0.7);
          onUpdateText(dashboardKey, field, result);
      } catch (err) {
          console.error("Image upload failed", err);
      }
    }
  };

  const handleLinkSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          e.preventDefault();
          const url = linkInputValue.trim();
          
          if (url) {
              onUpdateText(dashboardKey, 'musicUrl', url);
              
              // Auto-extract thumbnail if YouTube
              const id = getVideoId(url);
              if (id) {
                  const thumbUrl = `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
                  onUpdateText(dashboardKey, 'photoUrl', thumbUrl);
              }
          }
          
          setLinkInputValue('');
          setShowLinkInput(false);
      }
  };

  const handleLinkBlur = () => {
      // Save on blur if there's a value
      const url = linkInputValue.trim();
      if (url) {
          onUpdateText(dashboardKey, 'musicUrl', url);
          
          // Auto-extract thumbnail if YouTube
          const id = getVideoId(url);
          if (id) {
              const thumbUrl = `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
              onUpdateText(dashboardKey, 'photoUrl', thumbUrl);
          }
      }
      
      setLinkInputValue('');
      setShowLinkInput(false);
  };

  // Helper function to get display image from any item type
  const getItemDisplayImage = (item: ScrapItem): string | null => {
      const { metadata, type } = item;
      
      // Direct image URL
      if (metadata.imageUrl) {
          return metadata.imageUrl;
      }
      
      // Video thumbnail
      if (metadata.videoUrl) {
          return metadata.videoUrl;
      }
      
      // YouTube thumbnail
      if (type === ScrapType.YOUTUBE && metadata.url) {
          const videoId = metadata.url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=))([^#&?]*)/)?.[1];
          if (videoId) {
              return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
          }
      }
      
      return null;
  };

  // Calendar Cell Renderer
  const renderCell = (day: number) => {
      const dateStr = formatDate(day);
      const dayItems = items.filter(i => i.diaryDate === dateStr);
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
      
      // Find the item selected for calendar display
      const mainItem = dayItems.find(i => i.isMainItem);
      const displayImage = mainItem ? getItemDisplayImage(mainItem) : null;
      
      return (
        <div 
            key={day} 
            onClick={(e) => {
                e.stopPropagation(); // Prevent week click
                onDateClick(new Date(year, month, day));
            }}
            className={`
                border-b border-r border-slate-300/60 relative p-1 h-24 
                hover:bg-yellow-50/40 cursor-pointer transition-colors group/cell overflow-hidden
                ${isToday ? 'bg-yellow-50/30 ring-1 ring-yellow-300 ring-inset' : ''}
            `}
        >
            {/* Date Number */}
            <div className="relative z-10 flex justify-between items-start mb-1">
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded transition-all shadow-sm ${isToday ? 'bg-red-500 text-white scale-110' : 'text-slate-700 bg-white/90'}`}>
                    {day}
                </span>
                {/* Item count indicator (subtle) */}
                {dayItems.length > 0 && (
                    <span className="text-[8px] text-slate-400 bg-white/70 px-1 py-0.5 rounded-full font-mono">
                        {dayItems.length}
                    </span>
                )}
            </div>
            
            {/* Selected Item Display - Square Cropped Sticker Style */}
            {displayImage ? (
                <div className="relative z-10 w-[calc(100%-8px)] aspect-square mx-auto rounded-sm overflow-hidden shadow-lg border-2 border-white group-hover/cell:scale-[1.02] transition-transform">
                    {mainItem?.type === ScrapType.MOVING_PHOTO && mainItem.metadata.videoUrl ? (
                        <video 
                            src={mainItem.metadata.videoUrl} 
                            className="w-full h-full object-cover" 
                            muted 
                            loop 
                            autoPlay 
                            playsInline 
                        />
                    ) : (
                        <img 
                            src={displayImage} 
                            alt="Calendar preview" 
                            className="w-full h-full object-cover"
                        />
                    )}
                    {/* Subtle frame effect */}
                    <div className="absolute inset-0 ring-1 ring-inset ring-black/5 pointer-events-none"></div>
                </div>
            ) : (
                /* Empty or no item selected - Clean minimal look */
                <div className="relative z-10 w-[calc(100%-8px)] aspect-square mx-auto"></div>
            )}
            
            {/* Hover Hint */}
            <div className="absolute bottom-1 right-1 opacity-0 group-hover/cell:opacity-100 transition-opacity z-20">
                <span className="text-[7px] text-slate-500 bg-white/90 px-1.5 py-0.5 rounded-full shadow-sm font-bold">VIEW</span>
            </div>
        </div>
      );
  };

  // Generate Grid
  const totalCells = 35; // 5 rows * 7 cols usually fits
  const filledCells = emptySlots.length + daysArray.length;
  const requiredCells = filledCells > 35 ? 42 : 35;
  const trailingEmpty = requiredCells - filledCells;

  const allCells = [
      ...emptySlots.map(i => <div key={`empty-${i}`} className="border-b border-r border-slate-300/60 bg-slate-50/20"></div>),
      ...daysArray.map(day => renderCell(day)),
      ...Array.from({ length: trailingEmpty }).map((_, i) => <div key={`trail-${i}`} className="border-b border-r border-slate-300/60 bg-slate-50/20"></div>)
  ];

  // Split into rows of 7
  const weeks = [];
  for (let i = 0; i < allCells.length; i += 7) {
      weeks.push(allCells.slice(i, i + 7));
  }

  return (
    <div className="w-full h-full flex flex-col lg:flex-row overflow-hidden">
      {/* --- Left Page (Dashboard Area) - Desktop Only --- */}
      <div className="hidden lg:flex flex-1 relative bg-custom-paper flex-col p-8 gap-4 bg-grid-pattern overflow-hidden">
         {/* Background Hint for Draggable Items (z-0) */}
         <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none z-0">
             <span className="font-handwriting text-4xl text-slate-400 rotate-[-10deg]">Dashboard</span>
         </div>
         
         {/* Monthly Background Change Button */}
         <button
             onClick={() => monthlyBgInputRef.current?.click()}
             className="absolute top-2 right-2 z-50 bg-white/80 hover:bg-purple-100 border border-purple-200 rounded-lg px-2 py-1 flex items-center gap-1 text-[10px] font-bold text-purple-600 shadow-sm hover:shadow-md transition-all"
             title="Change this month's background"
         >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
             </svg>
             {currentData.monthlyBackground ? 'BG' : 'BG+'}
         </button>
         <input 
             type="file" 
             ref={monthlyBgInputRef} 
             className="hidden" 
             accept="image/*" 
             onChange={(e) => handleImageUpload(e, 'monthlyBackground')} 
         />
         
         {/* Content Grid (z-40 to be above canvas layer) */}
         <div className="relative z-40 w-full h-full flex flex-col gap-4">
            
            {/* Top Row: Profile (1/3) & Goals (2/3) */}
            <div className="flex gap-4 h-[35%]">
                {/* 1. Profile */}
                <div className="w-[30%] border border-slate-400/60 bg-white/40 p-2 flex flex-col items-center gap-2 shadow-sm rounded-sm backdrop-blur-[1px]">
                    <div 
                        className="w-16 h-16 rounded-full bg-slate-100 border-2 border-slate-300 overflow-hidden cursor-pointer hover:brightness-95 transition-all"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {currentData.profileImage ? (
                            <img src={currentData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>
                        )}
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'profileImage')} />
                    </div>
                    <input 
                        className="w-full text-center font-bold text-base bg-transparent border-b border-transparent hover:border-slate-300 focus:border-purple-400 outline-none"
                        value={currentData.profileName || ''}
                        onChange={(e) => onUpdateText(dashboardKey, 'profileName', e.target.value)}
                        placeholder="Name"
                    />
                    <input 
                        className="w-full text-center text-sm text-slate-500 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-purple-400 outline-none"
                        value={currentData.profileStatus || ''}
                        onChange={(e) => onUpdateText(dashboardKey, 'profileStatus', e.target.value)}
                        placeholder="Status..."
                    />
                </div>

                {/* 2. Goals (Expanded) */}
                <div className="flex-1 border border-slate-400/60 bg-white/40 p-3 flex flex-col shadow-sm rounded-sm backdrop-blur-[1px]">
                    <div className="bg-pink-100/50 -mx-3 -mt-3 mb-2 px-3 py-1.5 border-b border-slate-200 flex justify-between items-center">
                        <span className="text-xs font-bold text-pink-500 uppercase tracking-widest">Monthly Goals</span>
                        <span className="text-[10px] text-pink-400">Target</span>
                    </div>
                    <textarea 
                        className="flex-1 w-full bg-transparent resize-none text-sm font-handwriting leading-relaxed focus:outline-none"
                        value={currentData.goals || ''}
                        onChange={(e) => onUpdateText(dashboardKey, 'goals', e.target.value)}
                        placeholder="- Goal 1..."
                    />
                </div>
            </div>

            {/* Middle Row: Stacked Small Items & CD Music Player */}
            <div className="flex gap-4 h-[35%]">
                {/* Column 1: D-Day & OhaAsa Stacked */}
                <div className="w-[30%] flex flex-col gap-4">
                     {/* 3. D-Day (Half Size) */}
                    <div className="flex-1 border border-slate-400/60 bg-white/40 p-1 flex flex-col items-center justify-center shadow-sm rounded-sm backdrop-blur-[1px]">
                        <input 
                            className="w-full text-center text-xs font-bold text-slate-500 bg-transparent outline-none uppercase tracking-wide"
                            value={currentData.dDayTitle || ''}
                            onChange={(e) => onUpdateText(dashboardKey, 'dDayTitle', e.target.value)}
                            placeholder="EVENT"
                        />
                        <div className="font-mono text-xl font-bold text-slate-700 my-0.5">
                            {calculateDDay()}
                        </div>
                        <input 
                            type="date"
                            className="w-full text-xs bg-transparent text-slate-400 text-center outline-none"
                            value={currentData.dDayDate || ''}
                            onChange={(e) => onUpdateText(dashboardKey, 'dDayDate', e.target.value)}
                        />
                    </div>

                    {/* 5. OhaAsa (Half Size) */}
                    <div className="flex-1 border border-slate-400/60 bg-white/40 p-1 flex flex-col items-center justify-center shadow-sm rounded-sm backdrop-blur-[1px] relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-pink-50/50 to-purple-50/50 pointer-events-none"></div>
                        <span className="text-xl mb-0.5 filter drop-shadow-sm">🔮</span>
                        <h4 className="font-bold text-[10px] text-purple-800 leading-none mb-1">Oha-Asa</h4>
                        <a 
                            href="https://twitter.com/search?q=오하아사&src=typed_query&f=live" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-purple-100 hover:bg-purple-200 text-purple-700 text-[8px] font-bold px-2 py-0.5 rounded-full transition-colors z-10"
                        >
                            Luck
                        </a>
                    </div>
                </div>

                {/* Column 2: Square CD Player Object (Muji Style) */}
                <div className="flex-1 relative group/player">
                     {/* Hidden Player */}
                     {videoId && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 overflow-hidden opacity-0 -z-10 pointer-events-none">
                            <YouTube 
                                videoId={videoId} 
                                opts={{ 
                                    height: '1', 
                                    width: '1', 
                                    playerVars: { autoplay: 0, controls: 0, playsinline: 1 } 
                                }}
                                onReady={onPlayerReady}
                                onStateChange={onPlayerStateChange}
                            />
                        </div>
                     )}

                     {/* The Player Body */}
                     <div className="absolute inset-0 bg-slate-50 rounded-xl shadow-[2px_4px_10px_rgba(0,0,0,0.1),-1px_-1px_4px_rgba(255,255,255,0.8)] border border-slate-200 flex flex-row items-center p-3 gap-3">
                         
                         {/* LEFT: CD Area (Larger) */}
                         <div 
                            className="relative flex-shrink-0 cursor-pointer group/cd"
                            onClick={handleCdClick}
                         >
                             {/* The CD */}
                             <div 
                                className={`w-40 h-40 rounded-full shadow-lg border border-slate-200 overflow-hidden bg-slate-900 relative ${isPlaying ? 'animate-spin-slow' : 'paused-animation'}`}
                                style={{ animationDuration: '4s' }}
                             >
                                 {currentData.photoUrl ? (
                                     <img src={currentData.photoUrl} alt="CD" className="w-full h-full object-cover" />
                                 ) : (
                                     <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-800">
                                         <span className="text-[8px]">NO DISC</span>
                                     </div>
                                 )}
                                 
                                 {/* Glossy Overlay */}
                                 <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none rounded-full"></div>
                                 <div className="absolute inset-[40%] border border-white/10 rounded-full"></div>
                             </div>

                             {/* Center Hub */}
                             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white/30 backdrop-blur rounded-full border border-white/40 flex items-center justify-center z-10 pointer-events-none">
                                <div className="w-2.5 h-2.5 bg-white rounded-full shadow-inner"></div>
                             </div>

                             {/* Hover Play Icon */}
                             <div className={`absolute inset-0 rounded-full flex items-center justify-center z-20 transition-opacity bg-black/10 ${isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-0 group-hover/cd:opacity-100'}`}>
                                 {isPlaying ? (
                                     <svg className="w-10 h-10 text-white drop-shadow-md" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                                 ) : (
                                     <svg className="w-10 h-10 text-white drop-shadow-md ml-1" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                                 )}
                             </div>
                         </div>

                         {/* RIGHT: Controls & Display */}
                         <div className="flex-1 flex flex-col h-full justify-center gap-2 min-w-0">
                             
                             {/* Digital Display Screen */}
                             <div className="bg-slate-800 rounded p-2 border-2 border-slate-700 shadow-inner mb-1 flex items-center h-16 relative overflow-hidden">
                                 {/* LCD Glow Effect */}
                                 <div className="absolute inset-0 bg-teal-500/5 pointer-events-none"></div>
                                 <input 
                                    className="w-full bg-transparent text-teal-400 font-mono text-sm outline-none placeholder-teal-400/30 text-center"
                                    placeholder="TRACK 01..."
                                    value={currentData.musicTitle || ''}
                                    onChange={(e) => onUpdateText(dashboardKey, 'musicTitle', e.target.value)}
                                 />
                                 {/* Playing Indicator */}
                                 {isPlaying && (
                                     <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(239,68,68,0.8)]"></div>
                                 )}
                             </div>

                             {/* Physical-style Buttons */}
                             <div className="flex flex-col gap-2">
                                 {showLinkInput ? (
                                     <input 
                                        className="w-full text-center bg-white rounded px-1 py-1 text-sm border border-purple-200 focus:border-purple-400 outline-none animate-in fade-in slide-in-from-top-1"
                                        placeholder="Paste YouTube Link..."
                                        value={linkInputValue}
                                        onChange={(e) => setLinkInputValue(e.target.value)}
                                        onKeyDown={handleLinkSubmit}
                                        onBlur={handleLinkBlur}
                                        autoFocus
                                     />
                                 ) : (
                                     <div className="flex gap-2 justify-center">
                                         <button 
                                            onClick={() => {
                                                setLinkInputValue(currentData.musicUrl || '');
                                                setShowLinkInput(true);
                                            }}
                                            className="h-8 flex-1 bg-white rounded shadow-sm border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-1 active:scale-95"
                                            title="Add YouTube Link"
                                         >
                                             <span className="text-[10px] font-bold text-slate-500">LINK</span>
                                         </button>
                                         <button 
                                            onClick={() => musicCoverInputRef.current?.click()}
                                            className="h-8 w-8 bg-white rounded shadow-sm border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center active:scale-95"
                                            title="Change Art"
                                         >
                                             <span className="text-sm">🖼️</span>
                                         </button>
                                     </div>
                                 )}
                                 
                                 {/* Fake Play Controls for aesthetic */}
                                 <div className="flex justify-between px-2 pt-1 border-t border-slate-200">
                                     <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                                     <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                                     <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                                 </div>
                             </div>
                         </div>
                     </div>
                     
                     <input type="file" ref={musicCoverInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'photoUrl')} />
                </div>
            </div>

            {/* Bottom Row: Bucket List */}
            <div className="flex-1 border border-slate-400/60 bg-white/40 p-2 flex flex-col shadow-sm rounded-sm backdrop-blur-[1px]">
                <div className="flex items-center gap-2 border-b border-dashed border-slate-300 pb-1 mb-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-1 rounded">Bucket List</span>
                </div>
                <textarea 
                    className="flex-1 w-full bg-transparent resize-none text-xs font-handwriting leading-6 focus:outline-none scrollbar-thin scrollbar-thumb-slate-200"
                    value={currentData.bucketList || ''}
                    onChange={(e) => onUpdateText(dashboardKey, 'bucketList', e.target.value)}
                    placeholder="1. Travel to..."
                />
            </div>
         </div>
      </div>

      {/* --- Right Page (Full Calendar) --- */}
      <div className="flex-1 relative bg-custom-paper flex flex-col p-4 lg:p-8 bg-grid-pattern">
          {/* Header */}
          <div className="flex justify-between items-end mb-4 border-b-2 border-slate-800 pb-2">
             <div className="flex flex-col">
                 <h2 className="text-4xl font-handwriting font-bold text-slate-800 uppercase leading-none">
                     {currentDate.toLocaleString('default', { month: 'long' })}
                 </h2>
                 <p className="text-[10px] text-purple-400 font-handwriting mt-1 flex items-center gap-1">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                     </svg>
                     Hover over week rows to view weekly plan
                 </p>
             </div>
             <span className="font-mono text-slate-500 font-bold text-xl">{year}</span>
          </div>

          {/* Calendar Grid Container */}
          <div className="flex-1 flex flex-col border-t border-l border-slate-400/50 mb-4 bg-white/30 shadow-sm backdrop-blur-[1px] rounded-bl-lg">
             {/* Header Row */}
             <div className="flex h-8 border-b border-slate-400/50 bg-slate-50/30">
                 {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d, i) => (
                     <div key={d} className={`flex-1 border-r border-slate-400/50 flex items-center justify-center font-mono font-bold text-xs ${i===0 ? 'text-red-400' : 'text-slate-600'}`}>
                         {d}
                     </div>
                 ))}
             </div>
             {/* Weeks */}
             <div className="flex-1 flex flex-col">
                 {weeks.map((week, wIdx) => {
                     // Calculate date for this week row to pass to weekly view
                     const dayInWeek = new Date(year, month, (wIdx * 7) - emptySlots.length + 1 + 3); 

                     return (
                         <div 
                             key={wIdx} 
                             className="flex flex-1 border-slate-400/50 hover:bg-purple-50/30 transition-all relative group/week"
                         >
                             {/* Week cells */}
                             <div className="flex flex-1">
                                 {week.map((cell: any, cIdx: number) => (
                                     <div key={cIdx} className="flex-1 relative">
                                        {cell}
                                     </div>
                                 ))}
                             </div>
                             
                             {/* Weekly View Button - Right Side */}
                             <button
                                 onClick={(e) => {
                                     e.stopPropagation();
                                     onWeekSelect(dayInWeek);
                                 }}
                                 className="absolute -right-20 top-1/2 -translate-y-1/2 
                                     bg-white hover:bg-purple-500 text-purple-500 hover:text-white 
                                     border-2 border-purple-300 hover:border-purple-500
                                     rounded-lg shadow-sm hover:shadow-md
                                     px-3 py-2 
                                     flex items-center gap-2
                                     transition-all duration-200
                                     opacity-0 group-hover/week:opacity-100
                                     hover:scale-105 active:scale-95
                                     z-50 whitespace-nowrap"
                                 title="View this week in detail"
                             >
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                 </svg>
                                 <span className="text-xs font-bold tracking-wide">WEEK</span>
                             </button>
                         </div>
                     );
                 })}
             </div>
          </div>
      </div>
    </div>
  );
};

export default MonthlySpread;
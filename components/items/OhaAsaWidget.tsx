import React from 'react';
import { ScrapMetadata } from '../../types';

interface OhaAsaWidgetProps {
  data: ScrapMetadata;
}

const OhaAsaWidget: React.FC<OhaAsaWidgetProps> = ({ data }) => {
  const handleClick = () => {
    // Open Twitter search for OhaAsa
    window.open('https://twitter.com/search?q=오하아사&src=typed_query&f=live', '_blank');
  };

  return (
    <div 
        onClick={handleClick}
        className="w-40 h-40 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full shadow-lg border-4 border-white flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-transform group relative overflow-hidden"
    >
        {/* Shine effect */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/40 to-transparent pointer-events-none"></div>

        <div className="text-4xl animate-bounce">🔮</div>
        <h3 className="font-handwriting font-bold text-lg text-purple-800 mt-1">Oha-Asa</h3>
        <p className="text-[10px] text-purple-500 font-bold uppercase tracking-wider">Check Luck</p>

        {/* Hover Hint */}
        <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="bg-white px-2 py-1 rounded-full text-xs font-bold text-slate-700 shadow-sm">Go to Twitter</span>
        </div>
    </div>
  );
};

export default OhaAsaWidget;
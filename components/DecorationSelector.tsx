import React, { useState } from 'react';
import { ScrapType, ScrapMetadata } from '../types';

interface DecorationSelectorProps {
  onSelect: (type: ScrapType, metadata: ScrapMetadata) => void;
  className?: string;
}

const EMOJIS = ['🧸', '🎀', '✨', '💖', '🐰', '🍒', '🦋', '🍀', '👑', '⭐️', '🐾', '🌷', '🍰', '🎧', '📸'];
const TAPE_COLORS = [
    { name: 'Red', val: 'rgba(252, 165, 165, 0.8)' },
    { name: 'Orange', val: 'rgba(253, 186, 116, 0.8)' },
    { name: 'Yellow', val: 'rgba(253, 224, 71, 0.8)' },
    { name: 'Green', val: 'rgba(134, 239, 172, 0.8)' },
    { name: 'Blue', val: 'rgba(147, 197, 253, 0.8)' },
    { name: 'Purple', val: 'rgba(216, 180, 254, 0.8)' },
    { name: 'Pink', val: 'rgba(249, 168, 212, 0.8)' },
    { name: 'Grey', val: 'rgba(209, 213, 219, 0.8)' },
];

const DecorationSelector: React.FC<DecorationSelectorProps> = ({ onSelect, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'sticker' | 'tape'>('sticker');

  return (
    <div className={`relative ${className}`}>
        {/* Toggle Button - Styled to match Top Toolbar */}
        <button 
            onClick={() => setIsOpen(!isOpen)}
            className="w-10 h-10 md:w-10 md:h-10 sm:w-12 sm:h-12 bg-white rounded-full shadow-md border border-stone-200 flex items-center justify-center text-stone-600 hover:text-purple-600 active:text-purple-600 hover:scale-105 active:scale-105 transition-all group touch-manipulation"
            title="Decorations"
        >
            <span className="text-lg md:text-lg sm:text-xl group-hover:rotate-12 group-active:rotate-12 transition-transform block">🎨</span>
        </button>

        {/* Modal Popover */}
        {isOpen && (
            <div className="fixed top-8 right-24 md:top-8 md:right-24 sm:top-20 sm:right-4 z-[9000] bg-white/95 backdrop-blur rounded-2xl shadow-2xl border border-slate-200 w-64 md:w-64 sm:w-[280px] overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                <div className="flex bg-slate-100 p-1">
                    <button onClick={() => setActiveTab('sticker')} className={`flex-1 py-2 md:py-1.5 sm:py-2.5 text-xs md:text-xs sm:text-sm font-bold rounded-lg transition-colors touch-manipulation ${activeTab === 'sticker' ? 'bg-white shadow text-slate-800' : 'text-slate-400'}`}>STICKERS</button>
                    <button onClick={() => setActiveTab('tape')} className={`flex-1 py-2 md:py-1.5 sm:py-2.5 text-xs md:text-xs sm:text-sm font-bold rounded-lg transition-colors touch-manipulation ${activeTab === 'tape' ? 'bg-white shadow text-slate-800' : 'text-slate-400'}`}>TAPE</button>
                    <button onClick={() => setIsOpen(false)} className="px-3 md:px-3 sm:px-4 text-slate-400 hover:text-red-500 active:text-red-500 font-bold text-xl touch-manipulation">×</button>
                </div>

                <div className="p-3 md:p-3 sm:p-4 max-h-[300px] md:max-h-[300px] sm:max-h-[400px] overflow-y-auto">
                    {activeTab === 'sticker' && (
                        <div className="grid grid-cols-4 md:grid-cols-4 sm:grid-cols-5 gap-2 md:gap-2 sm:gap-3">
                            {EMOJIS.map(emoji => (
                                <button 
                                    key={emoji} 
                                    onClick={() => {
                                        onSelect(ScrapType.STICKER, { title: 'Sticker', url: '', stickerConfig: { emoji } });
                                        setIsOpen(false);
                                    }}
                                    className="text-2xl md:text-2xl sm:text-3xl hover:bg-slate-100 active:bg-slate-200 rounded p-1 md:p-1 sm:p-2 transition-transform hover:scale-125 active:scale-125 touch-manipulation"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    )}

                    {activeTab === 'tape' && (
                        <div className="flex flex-col gap-2 md:gap-2 sm:gap-3">
                            {TAPE_COLORS.map(color => (
                                <button
                                    key={color.name}
                                    onClick={() => {
                                        onSelect(ScrapType.TAPE, { title: 'Tape', url: '', tapeConfig: { color: color.val, pattern: 'solid' } });
                                        setIsOpen(false);
                                    }}
                                    className="w-full h-8 md:h-8 sm:h-10 tape-edge shadow-sm hover:opacity-80 active:opacity-70 transition-opacity touch-manipulation"
                                    style={{ backgroundColor: color.val }}
                                >
                                </button>
                            ))}
                            <div className="text-[10px] md:text-[10px] sm:text-xs text-center text-slate-400 mt-2">Tap to add washi tape</div>
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

export default DecorationSelector;
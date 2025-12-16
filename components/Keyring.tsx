import React from 'react';

interface KeyringProps {
  charm: string; // Emoji or Image URL
}

const Keyring: React.FC<KeyringProps> = ({ charm }) => {
  const isImage = charm.startsWith('http') || charm.startsWith('data:');

  return (
    <div className="absolute top-[80px] -left-[22px] z-[60] flex flex-col items-center animate-swing cursor-pointer group">
       {/* 1. Metal Clasp attached to the spine hole */}
       <div className="w-5 h-8 border-2 border-slate-400 rounded-full relative bg-gradient-to-br from-slate-200 to-slate-400 shadow-sm">
           {/* Spring Clip Detail */}
           <div className="absolute top-3 w-full h-[1px] bg-slate-500"></div>
       </div>

       {/* 2. Chain (3 links) */}
       <div className="-mt-1 w-2.5 h-4 border-2 border-slate-300 rounded-full"></div>
       <div className="-mt-1 w-2.5 h-4 border-2 border-slate-300 rounded-full"></div>
       <div className="-mt-1 w-2.5 h-4 border-2 border-slate-300 rounded-full"></div>

       {/* 3. The Charm */}
       <div className="-mt-1 relative group-active:scale-95 transition-transform">
           {isImage ? (
               <div className="w-16 h-16 relative filter drop-shadow-lg transform transition-transform group-hover:rotate-12">
                   <img src={charm} alt="charm" className="w-full h-full object-contain" />
               </div>
           ) : (
               <>
                   {/* Acrylic Texture Background */}
                   <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px] rounded-full scale-110 shadow-md"></div>
                   
                   {/* Charm Content */}
                   <div className="text-5xl filter drop-shadow-lg transform transition-transform group-hover:rotate-12">
                       {charm}
                   </div>

                   {/* Sparkle Reflection */}
                   <div className="absolute top-1 right-2 w-3 h-3 bg-white/60 rounded-full blur-[1px]"></div>
               </>
           )}
       </div>
    </div>
  );
};

export default Keyring;
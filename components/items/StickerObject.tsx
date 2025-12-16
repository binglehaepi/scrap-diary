import React from 'react';
import { ScrapMetadata } from '../../types';

interface StickerObjectProps {
  data: ScrapMetadata;
}

const StickerObject: React.FC<StickerObjectProps> = ({ data }) => {
  return (
    <div className="flex items-center justify-center p-2 cursor-grab group">
        <div className="text-[100px] leading-none drop-shadow-md select-none transform transition-transform group-hover:scale-110">
            {data.stickerConfig?.emoji || '⭐'}
        </div>
        {/* Subtle white border for sticker cut-out look */}
        <div className="absolute inset-0 -z-10 bg-white opacity-0 group-hover:opacity-20 rounded-full blur-md"></div>
    </div>
  );
};

export default StickerObject;
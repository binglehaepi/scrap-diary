import React, { useRef, useState, useEffect } from 'react';
import { ScrapItem, ScrapPosition, BorderStyle } from '../types';

interface DraggableItemProps {
  item: ScrapItem;
  onUpdatePosition: (id: string, newPos: Partial<ScrapPosition>) => void;
  onBringToFront: (id: string) => void;
  onDelete: (id: string) => void;
  onSetMainItem: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  snapToGrid?: boolean;
  children: React.ReactNode;
}

const DraggableItem: React.FC<DraggableItemProps> = ({ item, onUpdatePosition, onBringToFront, onDelete, onSetMainItem, onToggleFavorite, snapToGrid = false, children }) => {
  const ref = useRef<HTMLDivElement>(null);
  
  // State for dragging
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // State for resizing
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, initialScale: 1 });

  // State for rotating
  const [isRotating, setIsRotating] = useState(false);
  const [rotationStart, setRotationStart] = useState({ angle: 0 });

  // Mobile touch detection
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile device
    const checkMobile = () => {
      setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // --- Drag Handlers ---
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag if not clicking a button/input inside
    if ((e.target as HTMLElement).closest('button, input, textarea, .no-drag')) return;
    
    // Support touch, pen (Apple Pencil), and mouse
    if (e.pointerType === 'touch' || e.pointerType === 'pen') {
      e.preventDefault(); // Prevent scrolling and default touch behaviors
    }
    e.stopPropagation();
    
    onBringToFront(item.id);
    setIsDragging(true);
    
    // Capture the pointer to ensure we get all move/up events
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  // --- Resize Handlers ---
  const handleResizeDown = (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation(); // Prevent drag start
      
      // Support touch, pen, and mouse
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      
      onBringToFront(item.id);
      setIsResizing(true);
      setResizeStart({
          x: e.clientX,
          initialScale: item.position.scale || 1
      });
  };

  // --- Rotate Handlers ---
  const handleRotateDown = (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Support touch, pen, and mouse
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      
      onBringToFront(item.id);
      setIsRotating(true);
      // We calculate initial angle relative to the center of the item is handled in move
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      // Logic for resizing
      if (isResizing) {
          const deltaX = e.clientX - resizeStart.x;
          // Scale sensitivity: 0.005 per pixel. 
          const newScale = Math.max(0.3, Math.min(4, resizeStart.initialScale + (deltaX * 0.005)));
          
          onUpdatePosition(item.id, { scale: newScale });
          return;
      }

      // Logic for rotating
      if (isRotating && ref.current) {
          const rect = ref.current.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          
          const dx = e.clientX - centerX;
          const dy = e.clientY - centerY;
          
          // Calculate angle in degrees
          let angle = Math.atan2(dy, dx) * (180 / Math.PI);
          
          // Adjust so the handle feels natural (offset by 45 or 90 deg if needed, but atan2 is standard)
          // Adding 45 degrees because the handle is at bottom-left corner usually
          angle = angle - 135; 

          onUpdatePosition(item.id, { rotation: angle });
          return;
      }

      // Logic for dragging
      if (isDragging) {
          let newX = e.clientX - dragOffset.x;
          let newY = e.clientY - dragOffset.y;

          // Magnetic Grid Logic (Snap to 20px)
          if (snapToGrid) {
              const gridSize = 20;
              newX = Math.round(newX / gridSize) * gridSize;
              newY = Math.round(newY / gridSize) * gridSize;
          }

          onUpdatePosition(item.id, { x: newX, y: newY });
      }
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setIsRotating(false);
    };

    if (isDragging || isResizing || isRotating) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, isResizing, isRotating, dragOffset, resizeStart, item.id, onUpdatePosition, onBringToFront, snapToGrid]);

  const deleteItem = (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete(item.id);
  };
  
  const toggleMainItem = (e: React.MouseEvent) => {
      e.stopPropagation();
      onSetMainItem(item.id);
  };
  
  const toggleFavorite = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onToggleFavorite) {
          onToggleFavorite(item.id);
      }
  };

  // Dynamic Styles (keeping the visual logic but removing the toggle button)
  const getBorderClasses = (style?: BorderStyle) => {
      switch(style) {
          case 'stitch': return 'border-2 border-dashed border-stone-400/50 p-2 rounded-xl'; 
          case 'marker': return 'border-4 border-stone-800 p-1 rounded-sm';
          case 'tape': return 'shadow-[0_0_0_8px_rgba(255,255,255,0.4)] rounded-none';
          case 'shadow': return 'drop-shadow-[10px_10px_15px_rgba(0,0,0,0.5)]';
          default: return '';
      }
  };

  return (
    <div
      ref={ref}
      onPointerDown={handlePointerDown}
      className={`absolute select-none transition-shadow group/item ${isDragging ? 'z-50 cursor-grabbing drop-shadow-2xl' : 'cursor-grab'} ${getBorderClasses(item.borderStyle)}`}
      style={{
        transform: `translate(${item.position.x}px, ${item.position.y}px) rotate(${item.position.rotation}deg) scale(${item.position.scale || 1})`,
        zIndex: isDragging || isResizing || isRotating ? 9999 : item.position.z,
        transformOrigin: 'center center', // Better for rotation
        touchAction: 'none' // Prevent browser touch behaviors
      }}
    >
      {/* Content */}
      <div className={isResizing || isRotating ? 'pointer-events-none' : ''}>
         {children}
      </div>

      {/* --- Controls Overlay (Visible on Hover/Touch) --- */}
      
      {/* 0. Favorite Button (Top Left) - 영구 소장 */}
      {onToggleFavorite && (
      <button 
          onPointerDown={(e) => e.stopPropagation()}
          onClick={toggleFavorite}
          className={`
            absolute -top-4 -left-4 rounded-full shadow-lg flex items-center justify-center transition-all active:scale-90 z-50 no-drag
            w-11 h-11 min-w-[44px] min-h-[44px]
            ${item.isFavorite 
                ? 'bg-red-500 text-white opacity-100' 
                : 'bg-white text-red-300 opacity-90 hover:text-red-500'}
          `}
          title={item.isFavorite ? "영구 소장 중 ❤️" : "영구 소장하기 🤍"}
          style={{ touchAction: 'manipulation' }}
      >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
            <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
          </svg>
      </button>
      )}
      
      {/* 1. Delete Button (Top Right) */}
      <button 
          onPointerDown={(e) => e.stopPropagation()}
          onClick={deleteItem}
          className="absolute -top-4 -right-4 w-11 h-11 min-w-[44px] min-h-[44px] bg-red-500 hover:bg-red-600 active:bg-red-700 rounded-full text-white shadow-lg flex items-center justify-center transition-all active:scale-90 z-50 no-drag opacity-90"
          title="Delete Item"
          style={{ touchAction: 'manipulation' }}
      >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
      </button>

      {/* 2. Rotate Handle (Bottom Left) */}
      <div 
          onPointerDown={handleRotateDown}
          className={`
            absolute -bottom-4 -left-4 w-11 h-11 min-w-[44px] min-h-[44px] bg-blue-500 hover:bg-blue-600 active:bg-blue-700 rounded-full text-white shadow-lg flex items-center justify-center 
            cursor-grab active:cursor-grabbing transition-all active:scale-90 z-50 no-drag opacity-90
            ${isRotating ? 'bg-blue-700 scale-95' : ''}
          `}
          title="Rotate"
          style={{ touchAction: 'none' }}
      >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
             <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
      </div>

      {/* 3. Calendar Cover Toggle (Top Center) - Click to show in monthly view */}
      <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={toggleMainItem}
          className={`
            absolute -top-5 left-1/2 -translate-x-1/2 rounded-lg shadow-md flex items-center justify-center gap-1 transition-all z-50 no-drag px-3 py-2 min-h-[36px]
            text-xs font-bold
            ${item.isMainItem 
                ? 'bg-purple-500 text-white scale-105' 
                : 'bg-white text-slate-400 hover:text-purple-500 hover:bg-purple-50 opacity-90'}
          `}
          title={item.isMainItem ? "Showing in calendar" : "Show in calendar"}
          style={{ touchAction: 'manipulation' }}
      >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {item.isMainItem && <span>ON</span>}
      </button>

      {/* Resize Handle (Bottom Right) */}
      <div 
        onPointerDown={handleResizeDown}
        className={`
            absolute -bottom-4 -right-4 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-green-500 hover:bg-green-600 active:bg-green-700 shadow-lg border-2 border-white
            flex items-center justify-center cursor-nwse-resize z-50 text-white transition-all active:scale-90 opacity-90 no-drag
            ${isResizing ? 'bg-green-700 scale-95' : ''}
        `}
        title="Drag to resize"
        style={{ touchAction: 'none' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
           <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      </div>

      {/* Debug/Info Scale Label (Optional, visible when resizing) */}
      {isResizing && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
              {Math.round((item.position.scale || 1) * 100)}%
          </div>
      )}
    </div>
  );
};

export default DraggableItem;
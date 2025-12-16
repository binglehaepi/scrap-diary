import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Toaster } from 'react-hot-toast';
import { db } from './db';
import { ScrapItem, ScrapType, ScrapPosition, ScrapMetadata, LayoutType, BorderStyle, LayoutTextData, DiaryStyle } from './types';
import { parseUrlType } from './services/urlParser';
import { fetchMetadata } from './services/geminiService';
import { compressImage } from './services/imageUtils';
import DraggableItem from './components/DraggableItem';
import UrlInput from './components/UrlInput';
import YoutubeModal from './components/YoutubeModal';
import CreationModal from './components/CreationModal';
import DecorationSelector from './components/DecorationSelector';
import Keyring from './components/Keyring';
import HeroScrapInput from './components/HeroScrapInput';

// Import Item Components
import TwitterCard from './components/items/TwitterCard';
import InstagramCard from './components/items/InstagramCard';
import PinterestCard from './components/items/PinterestCard';
import BookObject from './components/items/BookObject';
import MusicCdObject from './components/items/MusicCdObject';
import VideoPlayerObject from './components/items/VideoPlayerObject';
import FashionTag from './components/items/FashionTag';
import EditableScrap from './components/items/EditableScrap';
import ChatPhoneObject from './components/items/ChatPhoneObject';
import TicketObject from './components/items/TicketObject';
import BoardingPassObject from './components/items/BoardingPassObject';
import ReceiptObject from './components/items/ReceiptObject';
import ToploaderObject from './components/items/ToploaderObject';
import CupSleeveObject from './components/items/CupSleeveObject';
import TextNoteObject from './components/items/TextNoteObject';
import StickerObject from './components/items/StickerObject';
import TapeObject from './components/items/TapeObject';
import MovingPhotoObject from './components/items/MovingPhotoObject';
import ProfileWidget from './components/items/ProfileWidget';
import TodoWidget from './components/items/TodoWidget';
import OhaAsaWidget from './components/items/OhaAsaWidget';

// Import Layouts
import FreeLayout from './components/layouts/FreeLayout';
import MonthlySpread from './components/layouts/MonthlySpread';
import WeeklySpread from './components/layouts/WeeklySpread';

const STORAGE_KEY = 'smart_scrap_diary_layout_v2'; 
const LAYOUT_PREF_KEY = 'smart_scrap_layout_pref';
const TEXT_DATA_KEY = 'smart_scrap_text_data';
const STYLE_PREF_KEY = 'smart_scrap_style_pref';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const GLOBAL_SCRAP_PAGE_KEY = 'GLOBAL_SCRAP_PAGE';

const App: React.FC = () => {
  // ✅ Dexie.js 실시간 쿼리 - DB가 변경되면 자동으로 화면이 업데이트됩니다
  const items = useLiveQuery(() => db.getItems(), []) || [];
  const textData = useLiveQuery(() => db.getTextData(), []) || {};
  const diaryStyle = useLiveQuery(() => db.getStyle(), []) || {
      coverColor: '#ffffff', 
      coverPattern: 'quilt' as const, 
      keyring: 'https://i.ibb.co/V0JFcWp8/0000-1.png',
      backgroundImage: ''
  };
  
  // Default to Home page
  const [currentLayout, setCurrentLayout] = useState<LayoutType>('home');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  const [loading, setLoading] = useState(false);
  const [maxZ, setMaxZ] = useState(10);
  const [toastMsg, setToastMsg] = useState('');
  
  // Mobile Zoom & Pan State
  const [scale, setScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastTouch, setLastTouch] = useState<{ x: number; y: number } | null>(null);
  
  const bookRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  
  // Modal States
  const [pendingYoutube, setPendingYoutube] = useState<{ url: string, metadata: ScrapMetadata } | null>(null);
  const [showCreationModal, setShowCreationModal] = useState(false);

  // --- Date Helpers ---
  const formatDateKey = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
  };

  const formatMonthKey = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      return `${year}-${month}`;
  };

  const getFilteredItems = () => {
      // Favorites (13번째 탭 - 영구 소장)
      if (currentLayout === 'favorites') {
          return items.filter(item => item.isFavorite === true);
      }
      
      // Global Scrap Page
      if (currentLayout === 'scrap_page') {
          return items.filter(item => item.diaryDate === GLOBAL_SCRAP_PAGE_KEY);
      }

      // In Monthly view, we show items that belong to the "Month Canvas" (Left Page)
      if (currentLayout === 'monthly') {
          const monthKey = formatMonthKey(currentDate);
          return items.filter(item => item.diaryDate === monthKey);
      }
      
      // In Free view, we show items for the specific day
      if (currentLayout === 'free') {
          const dateKey = formatDateKey(currentDate);
          return items.filter(item => item.diaryDate === dateKey);
      }
      return []; 
  };

  const filteredItems = getFilteredItems();

  // --- 1. Load Data & Migrate from LocalStorage ---
  useEffect(() => {
    const initializeDB = async () => {
      try {
        // LocalStorage에서 마이그레이션 (최초 1회만 실행됨)
        await db.migrateFromLocalStorage();
        
        // 최대 Z값 계산
        const loadedItems = await db.getItems();
        if (loadedItems.length > 0) {
          const highestZ = Math.max(...loadedItems.map(i => i.position.z || 1));
          setMaxZ(highestZ + 1);
        }
        
        console.log('✅ Dexie.js 데이터베이스 초기화 완료');
      } catch (e) {
        console.error("데이터베이스 초기화 실패:", e);
      }
    };

    initializeDB();
  }, []);

  // --- Effect: Spawn Default Profile Widget for Month ---
  useEffect(() => {
    if (currentLayout === 'monthly') {
        const monthKey = formatMonthKey(currentDate);
        const hasProfile = items.some(item => item.diaryDate === monthKey && item.type === ScrapType.PROFILE);
        
        // Removed auto-spawn logic for profile since we now have a fixed dashboard
        // if (!hasProfile) { ... }
    }
  }, [currentLayout, currentDate, items]); 

  // --- 2. Save & Clear Functions ---
  const handleSaveLayout = async () => {
    try {
      // Dexie.js에 저장 (자동 백업)
      await db.saveItems(items);
      await db.saveTextData(textData);
      await db.saveStyle(diaryStyle);
      
      setToastMsg('💾 Saved');
      setTimeout(() => setToastMsg(''), 2000);
    } catch (e: any) {
      console.error("저장 실패:", e);
      setToastMsg('❌ Error');
      setTimeout(() => setToastMsg(''), 2000);
    }
  };

  const handleClearLayout = async () => {
    if (window.confirm("Clear this page?")) {
      // Clear only filtered items (current page)
      const currentKeys = new Set(filteredItems.map(i => i.id));
      const remainingItems = items.filter(i => !currentKeys.has(i.id));
      await db.saveItems(remainingItems);
      
      setToastMsg('🗑️ Cleared');
      setTimeout(() => setToastMsg(''), 2000);
    }
  };

  // 백업 생성
  const handleCreateBackup = async () => {
    try {
      const description = prompt("백업 메모 (선택사항):");
      await db.createBackup(description || undefined);
      setToastMsg('📦 Backup Created');
      setTimeout(() => setToastMsg(''), 2000);
    } catch (e) {
      console.error('백업 생성 실패:', e);
      setToastMsg('❌ Backup Failed');
      setTimeout(() => setToastMsg(''), 2000);
    }
  };

  // JSON 파일로 내보내기
  const handleExport = async () => {
    try {
      await db.exportToJSON();
      setToastMsg('📥 Exported');
      setTimeout(() => setToastMsg(''), 2000);
    } catch (e) {
      console.error('내보내기 실패:', e);
      setToastMsg('❌ Export Failed');
      setTimeout(() => setToastMsg(''), 2000);
    }
  };

  // JSON 파일에서 가져오기
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.endsWith('.json')) {
        alert('JSON 파일만 가져올 수 있습니다.');
        return;
      }

      if (!window.confirm('가져오기를 실행하면 현재 데이터가 교체됩니다. 자동 백업이 먼저 생성됩니다. 계속하시겠습니까?')) {
        return;
      }

      try {
        await db.importFromJSON(file);
        setToastMsg('📤 Imported!');
        setTimeout(() => {
          setToastMsg('');
          window.location.reload(); // 새로고침하여 데이터 반영
        }, 1500);
      } catch (e) {
        console.error('가져오기 실패:', e);
        alert('파일을 읽을 수 없습니다. 올바른 백업 파일인지 확인해주세요.');
      }
    }
    // input value 초기화
    if (e.target) e.target.value = '';
  };

  const changeLayout = (type: LayoutType) => {
      setCurrentLayout(type);
      localStorage.setItem(LAYOUT_PREF_KEY, type);
      const displayMsg = type === 'scrap_page' ? 'SCRAPBOOK' 
                       : type === 'home' ? 'HOME'
                       : type === 'favorites' ? '🏆 HALL OF FAME'
                       : type.toUpperCase();
      setToastMsg(displayMsg);
      setTimeout(() => setToastMsg(''), 1500);
  };

  const handleDateChange = (days: number) => {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + days);
      setCurrentDate(newDate);
  };

  const handleMonthSelect = (monthIndex: number) => {
      const newDate = new Date(currentDate);
      newDate.setMonth(monthIndex);
      setCurrentDate(newDate);
      changeLayout('monthly');
  };

  const handleDateClick = (date: Date) => {
      setCurrentDate(date);
      changeLayout('free'); 
  };

  const handleWeekSelect = (date: Date) => {
      setCurrentDate(date);
      changeLayout('weekly');
  };

  // Generic Update Text Data Handler
  const handleUpdateText = async (key: string, field: string, value: string) => {
      const newData = {
          ...textData,
          [key]: {
              ...textData[key],
              [field]: value
          }
      };
      await db.saveTextData(newData);
  };

  const handleDeleteItem = useCallback(async (id: string) => {
    if (window.confirm("Delete item?")) {
        const newItems = items.filter(item => item.id !== id);
        await db.saveItems(newItems);
    }
  }, [items]);
  
  const handleSetMainItem = useCallback(async (id: string) => {
      const targetItem = items.find(i => i.id === id);
      if (!targetItem) return;
      
      const newItems = items.map(item => {
          // If item belongs to the same day as the target
          if (item.diaryDate === targetItem.diaryDate) {
              // Toggle the target, unset others
              return {
                  ...item,
                  isMainItem: item.id === id ? !item.isMainItem : false
              };
          }
          return item;
      });
      
      await db.saveItems(newItems);
      setToastMsg('📌 Set Cover');
      setTimeout(() => setToastMsg(''), 1000);
  }, [items]);

  const handleToggleFavorite = useCallback(async (id: string) => {
      const newItems = items.map(item => 
          item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
      );
      await db.saveItems(newItems);
      
      const item = items.find(i => i.id === id);
      if (item?.isFavorite === false) {
          setToastMsg('❤️ 영구 소장!');
      } else {
          setToastMsg('🤍 소장 해제');
      }
      setTimeout(() => setToastMsg(''), 1000);
  }, [items]);

  const handleScrap = useCallback(async (url: string) => {
    setLoading(true);
    try {
      const type = parseUrlType(url);
      
      // 지원하지 않는 타입 체크
      if (type === ScrapType.GENERAL) {
        throw new Error('지원하지 않는 사이트입니다');
      }
      
      const metadata = await fetchMetadata(url, type);
      
      // 메타데이터 검증
      if (!metadata || !metadata.title || metadata.title === 'New Scrap Object') {
        throw new Error('메타데이터를 가져올 수 없습니다');
      }
      
      if (type === ScrapType.YOUTUBE) {
          setPendingYoutube({ url, metadata });
          setLoading(false);
          return;
      }
      
      await addItem(type, metadata);
      
      // 홈 페이지에서 스크랩 시 monthly 레이아웃으로 자동 이동
      if (currentLayout === 'home') {
        setTimeout(() => {
          changeLayout('monthly');
        }, 500); // 약간의 딜레이로 자연스럽게
      }
    } catch (error: any) {
      console.error('스크랩 실패:', error);
      // 에러를 다시 throw하여 HeroScrapInput에서 처리할 수 있게 함
      throw error;
    } finally {
      if (parseUrlType(url) !== ScrapType.YOUTUBE) setLoading(false);
    }
  }, [maxZ, currentDate, currentLayout]);

  const handleCreateManual = (type: ScrapType, metadata: ScrapMetadata) => {
      addItem(type, metadata);
      setShowCreationModal(false);
  };

  const handleDecoration = (type: ScrapType, metadata: ScrapMetadata) => {
      addItem(type, metadata);
  };

  const handleUpload = useCallback(async (file: File) => {
      try {
          // Compress uploaded photo
          const result = await compressImage(file, 600, 0.7);
          
          if (result) {
              const metadata: ScrapMetadata = {
                  title: "Image",
                  subtitle: "Upload",
                  description: "",
                  imageUrl: result,
                  url: "", 
                  isEditable: false
              };
              spawnItem(ScrapType.GENERAL, metadata); 
          }
      } catch (e) {
          console.error("Upload processing failed", e);
          setToastMsg('Error');
      }
  }, [maxZ]);

  const addItem = async (type: ScrapType, metadata: ScrapMetadata) => await spawnItem(type, metadata);

  const spawnItem = async (type: ScrapType, metadata: ScrapMetadata) => {
      const bookWidth = bookRef.current?.clientWidth || window.innerWidth * 0.8;
      const bookHeight = bookRef.current?.clientHeight || window.innerHeight * 0.8;
      
      // Determine context
      let targetDateKey = formatDateKey(currentDate);
      if (currentLayout === 'monthly') targetDateKey = formatMonthKey(currentDate);
      if (currentLayout === 'scrap_page') targetDateKey = GLOBAL_SCRAP_PAGE_KEY;

      // Spawn location logic
      let startX, startY;
      if (currentLayout === 'monthly') {
          // Spawn on left page for monthly
          startX = (bookWidth / 4) + (Math.random() * 60 - 30);
          startY = (bookHeight / 2) + (Math.random() * 60 - 30);
      } else {
          // Spawn anywhere or right page for free layout & scrap page
          startX = (bookWidth * 0.5) + (Math.random() * 100 - 50); 
          startY = (bookHeight * 0.5) + (Math.random() * 100 - 50);
      }

      const newItem: ScrapItem = {
        id: crypto.randomUUID(),
        type,
        metadata,
        position: {
          x: startX,
          y: startY,
          z: maxZ + 1,
          rotation: (Math.random() * 4) - 2, 
          // REDUCED DEFAULT SCALE: 0.5
          scale: 0.5 
        },
        createdAt: Date.now(),
        diaryDate: targetDateKey,
        borderStyle: 'none'
      };

      await db.saveItems([...items, newItem]);
      setMaxZ(prev => prev + 1);
  };

  const confirmYoutube = (config: { mode: 'cd' | 'player'; startTime: number }) => {
      if (pendingYoutube) {
          const updatedMetadata = { ...pendingYoutube.metadata, youtubeConfig: config };
          addItem(ScrapType.YOUTUBE, updatedMetadata);
          setPendingYoutube(null);
      }
  };

  const updatePosition = useCallback(async (id: string, newPos: Partial<ScrapPosition>) => {
    const newItems = items.map(item => {
      if (item.id === id) {
        return { ...item, position: { ...item.position, ...newPos } };
      }
      return item;
    });
    await db.saveItems(newItems);
  }, [items]);

  const updateMetadata = useCallback(async (id: string, newMeta: Partial<ScrapMetadata>) => {
    const newItems = items.map(item => 
        item.id === id ? { ...item, metadata: { ...item.metadata, ...newMeta } } : item
    );
    await db.saveItems(newItems);
  }, [items]);

  const bringToFront = useCallback(async (id: string) => {
    const newMax = maxZ + 1;
    const newItems = items.map(item => 
      item.id === id ? { ...item, position: { ...item.position, z: newMax } } : item
    );
    await db.saveItems(newItems);
    setMaxZ(newMax);
  }, [items, maxZ]);

  // --- Mobile Touch Handlers for Zoom & Pan ---
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // Single touch - prepare for panning
      const touch = e.touches[0];
      setLastTouch({ x: touch.clientX, y: touch.clientY });
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Two finger pinch zoom
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      // Store initial distance if not panning
      if (!isPanning) {
        setIsPanning(true);
        (containerRef.current as any)._initialDistance = distance;
        (containerRef.current as any)._initialScale = scale;
      }
      
      const initialDistance = (containerRef.current as any)._initialDistance || distance;
      const initialScale = (containerRef.current as any)._initialScale || 1;
      const newScale = Math.max(0.5, Math.min(3, initialScale * (distance / initialDistance)));
      
      setScale(newScale);
    } else if (e.touches.length === 1 && lastTouch && scale > 1) {
      // Single touch panning when zoomed
      e.preventDefault();
      const touch = e.touches[0];
      const deltaX = touch.clientX - lastTouch.x;
      const deltaY = touch.clientY - lastTouch.y;
      
      setPanOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      setLastTouch({ x: touch.clientX, y: touch.clientY });
    }
  }, [lastTouch, scale, isPanning]);

  const handleTouchEnd = useCallback(() => {
    setIsPanning(false);
    setLastTouch(null);
    if (containerRef.current) {
      delete (containerRef.current as any)._initialDistance;
      delete (containerRef.current as any)._initialScale;
    }
  }, []);

  // Reset zoom on double tap
  const handleDoubleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (scale !== 1) {
      setScale(1);
      setPanOffset({ x: 0, y: 0 });
    } else {
      setScale(1.5);
    }
  }, [scale]);

  // Wheel zoom for desktop
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY * 0.001;
      setScale(prev => Math.max(0.5, Math.min(3, prev + delta)));
    }
  }, []);

  // --- Drag & Drop Handlers ---
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    // Handle URLs from drag
    const url = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text/uri-list');
    
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      // It's a URL link
      await handleScrap(url);
      setToastMsg('Link Added!');
      setTimeout(() => setToastMsg(''), 2000);
    } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // It's a file
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        await handleUpload(file);
        setToastMsg('Image Added!');
        setTimeout(() => setToastMsg(''), 2000);
      }
    }
  }, [handleScrap, handleUpload]);

  const renderItemContent = (item: ScrapItem) => {
    if (item.metadata.isEditable || item.type === ScrapType.GENERAL) {
        return <EditableScrap data={item.metadata} onSave={(newData) => updateMetadata(item.id, newData)} />;
    }
    switch (item.type) {
      case ScrapType.PROFILE: return <ProfileWidget data={item.metadata} onUpdate={(d) => updateMetadata(item.id, d)} />;
      case ScrapType.TODO: return <TodoWidget data={item.metadata} onUpdate={(d) => updateMetadata(item.id, d)} />;
      case ScrapType.OHAASA: return <OhaAsaWidget data={item.metadata} />;
      case ScrapType.MOVING_PHOTO: return <MovingPhotoObject data={item.metadata} />;
      case ScrapType.STICKER: return <StickerObject data={item.metadata} />;
      case ScrapType.TAPE: return <TapeObject data={item.metadata} />;
      case ScrapType.TWITTER: return <TwitterCard data={item.metadata} />;
      case ScrapType.INSTAGRAM: return <InstagramCard data={item.metadata} />;
      case ScrapType.PINTEREST: return <PinterestCard data={item.metadata} />;
      case ScrapType.BOOK: return <BookObject data={item.metadata} />;
      case ScrapType.YOUTUBE:
        return item.metadata.youtubeConfig?.mode === 'cd' ? <MusicCdObject data={item.metadata} /> : <VideoPlayerObject data={item.metadata} />;
      case ScrapType.FASHION: return <FashionTag data={item.metadata} />;
      case ScrapType.CHAT: return <ChatPhoneObject data={item.metadata} />;
      case ScrapType.TICKET: return <TicketObject data={item.metadata} />;
      case ScrapType.BOARDING: return <BoardingPassObject data={item.metadata} />;
      case ScrapType.RECEIPT: return <ReceiptObject data={item.metadata} />;
      case ScrapType.TOPLOADER: return <ToploaderObject data={item.metadata} />;
      case ScrapType.CUPSLEEVE: return <CupSleeveObject data={item.metadata} />;
      case ScrapType.NOTE: return <TextNoteObject data={item.metadata} />;
      default: return <EditableScrap data={item.metadata} onSave={(newData) => updateMetadata(item.id, newData)} />;
    }
  };

  // Get current month's background
  const getCurrentBackground = () => {
    if (currentLayout === 'monthly') {
      const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-DASHBOARD`;
      const monthlyBg = textData[monthKey]?.monthlyBackground;
      if (monthlyBg) return monthlyBg;
    }
    return diaryStyle.backgroundImage;
  };

  return (
    <>
      {/* Toast 알림 컨테이너 */}
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
            fontSize: '14px',
            borderRadius: '12px',
            padding: '12px 20px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      
      {/* Outer Background: Custom Desk Image or Default Color (Monthly-specific or Global) */}
      <div 
          ref={containerRef}
          className="w-screen min-h-screen flex flex-col items-center relative font-handwriting select-none bg-cover bg-center transition-all duration-500 overflow-y-auto overflow-x-hidden"
          style={{ 
              backgroundColor: '#f4f1ea',
              backgroundImage: getCurrentBackground() ? `url(${getCurrentBackground()})` : undefined 
          }}
      >
      
      {/* --- HOME PAGE (Full Screen Hero) --- */}
      {currentLayout === 'home' && (
        <div className="w-full min-h-screen flex items-center justify-center px-4">
          <div className="w-full max-w-4xl">
            <HeroScrapInput onScrap={handleScrap} isLoading={loading} />
            
            {/* 시작 안내 */}
            <div className="mt-16 text-center space-y-4">
              <p className="text-stone-600 text-lg">
                링크를 스크랩하면 자동으로 다이어리에 추가돼요 📔
              </p>
              <div className="flex flex-wrap justify-center gap-4 mt-8">
                <button
                  onClick={() => changeLayout('monthly')}
                  className="px-6 py-3 bg-white rounded-xl shadow-md border border-stone-200 hover:shadow-lg hover:scale-105 transition-all text-stone-700 font-medium"
                >
                  📅 월간 달력 보기
                </button>
                <button
                  onClick={() => changeLayout('free')}
                  className="px-6 py-3 bg-white rounded-xl shadow-md border border-stone-200 hover:shadow-lg hover:scale-105 transition-all text-stone-700 font-medium"
                >
                  ✏️ 오늘의 다이어리
                </button>
                <button
                  onClick={() => changeLayout('scrap_page')}
                  className="px-6 py-3 bg-white rounded-xl shadow-md border border-stone-200 hover:shadow-lg hover:scale-105 transition-all text-stone-700 font-medium"
                >
                  ⭐ 스크랩북
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* --- PLANNER WRAPPER (Other Layouts) --- */}
      {currentLayout !== 'home' && (
      <div 
        className="w-full min-h-screen flex items-center justify-center pb-10 px-4"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleTap}
      >
      
      {/* --- PLANNER CONTAINER --- */}
      {/* Aspect Ratio 1.6 (approx 3:2) for realistic open planner look */}
      <div 
        className="relative h-[85vh] aspect-[1.6] max-w-[95vw] max-h-[900px] md:h-[85vh] sm:h-[70vh] transition-transform origin-center"
        style={{
          transform: `scale(${scale}) translate(${panOffset.x / scale}px, ${panOffset.y / scale}px)`,
          touchAction: 'none'
        }}
      >
          
          {/* Main Book Body */}
          <div className="absolute inset-0 bg-white rounded-lg shadow-2xl flex z-10 overflow-hidden border border-stone-200">
              
              {/* Paper Texture & Layout Render */}
              <div 
                ref={bookRef}
                className={`flex-1 flex bg-custom-paper paper-texture relative transition-all ${isDragOver ? 'ring-4 ring-purple-400 ring-inset bg-purple-50/20' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                  {/* --- LINK BAR (Embedded in Page) --- */}
                  {/* Position Logic: Right for Daily/ScrapPage, Left for Monthly */}
                  {(currentLayout === 'free' || currentLayout === 'monthly' || currentLayout === 'scrap_page' || currentLayout === 'favorites') && (
                    <UrlInput 
                        onScrap={handleScrap} 
                        onUpload={handleUpload} 
                        onCreateOpen={() => setShowCreationModal(true)} 
                        isLoading={loading}
                        className={`absolute top-5 ${currentLayout === 'monthly' ? 'left-8' : 'right-8'}`} 
                    />
                  )}

                  {currentLayout === 'free' && (
                      <FreeLayout 
                        currentDate={currentDate} 
                        onPrevDay={() => handleDateChange(-1)} 
                        onNextDay={() => handleDateChange(1)} 
                      />
                  )}
                  {currentLayout === 'scrap_page' && (
                      <FreeLayout 
                        currentDate={currentDate} 
                        isStaticPage={true}
                      />
                  )}
                  {currentLayout === 'favorites' && (
                      <FreeLayout 
                        currentDate={currentDate} 
                        isStaticPage={true}
                        title="🏆 Hall of Fame"
                      />
                  )}
                  {currentLayout === 'monthly' && (
                      <MonthlySpread 
                        currentDate={currentDate} 
                        items={items} 
                        textData={textData}
                        onDateClick={handleDateClick}
                        onWeekSelect={handleWeekSelect}
                        onUpdateText={handleUpdateText}
                      />
                  )}
                  {currentLayout === 'weekly' && (
                      <WeeklySpread 
                        currentDate={currentDate} 
                        items={items} 
                        textData={textData}
                        onUpdateText={handleUpdateText}
                      />
                  )}

                  {/* Center Spine / Gutter */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-stone-300 z-20"></div>
                  <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-16 bg-gradient-to-r from-transparent via-stone-500/5 to-transparent pointer-events-none z-20"></div>

                  {/* Drag & Drop Hint Overlay */}
                  {isDragOver && (
                      <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
                          <div className="bg-purple-500 text-white px-8 py-4 rounded-2xl shadow-2xl font-bold text-xl animate-pulse">
                              📎 Drop link or image here!
                          </div>
                      </div>
                  )}

                  {/* Canvas Layer (Draggable Items) */}
                  {(currentLayout === 'free' || currentLayout === 'monthly' || currentLayout === 'scrap_page' || currentLayout === 'favorites') && (
                      <div className="absolute inset-0 z-30 overflow-hidden pointer-events-none" id="canvas-area">
                         {filteredItems.map(item => (
                          <div key={item.id} className="pointer-events-auto">
                              <DraggableItem 
                                item={item} 
                                onUpdatePosition={updatePosition}
                                onBringToFront={bringToFront}
                                onDelete={handleDeleteItem}
                                onSetMainItem={handleSetMainItem}
                                onToggleFavorite={handleToggleFavorite}
                                snapToGrid={currentLayout === 'scrap_page' || currentLayout === 'favorites'}
                              >
                                {renderItemContent(item)}
                              </DraggableItem>
                          </div>
                        ))}
                      </div>
                  )}
              </div>
          </div>

          {/* Side Tabs (Indices) */}
          <div className="absolute top-8 -right-8 md:-right-8 sm:-right-2 flex flex-col gap-1 z-0">
              {/* HOME Tab (0번째) */}
              <button 
                onClick={() => changeLayout('home')}
                className={`
                    w-12 h-10 md:w-12 md:h-10 sm:w-10 sm:h-9 rounded-r-md flex items-center justify-center shadow-sm border border-l-0 border-stone-200 transition-transform hover:translate-x-1 active:translate-x-1 mb-2
                    ${currentLayout === 'home' ? 'bg-blue-500 text-white translate-x-1 font-black' : 'bg-white text-stone-600'}
                `}
                title="Home"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z" clipRule="evenodd" />
                  </svg>
              </button>
              
              {MONTHS.map((m, i) => (
                  <button 
                    key={m}
                    onClick={() => handleMonthSelect(i)}
                    className={`
                        w-12 h-8 md:w-12 md:h-8 sm:w-10 sm:h-7 rounded-r-md flex items-center pl-2 md:text-[10px] sm:text-[8px] text-[10px] font-bold tracking-widest shadow-sm border border-l-0 border-stone-200 transition-transform hover:translate-x-1 active:translate-x-1
                        ${(currentLayout !== 'scrap_page' && currentDate.getMonth() === i) ? 'bg-white text-stone-900 translate-x-1 font-black' : 'bg-[#f4f1ea] text-stone-400'}
                    `}
                  >
                      {m}
                  </button>
              ))}
              
              {/* Star Scrap Page Tab */}
              <button 
                onClick={() => changeLayout('scrap_page')}
                className={`
                    w-12 h-10 md:w-12 md:h-10 sm:w-10 sm:h-9 rounded-r-md flex items-center justify-center shadow-sm border border-l-0 border-yellow-300 transition-transform hover:translate-x-1 active:translate-x-1 mt-2
                    ${currentLayout === 'scrap_page' ? 'bg-yellow-300 text-white translate-x-1' : 'bg-yellow-100 text-yellow-400'}
                `}
                title="My Scrap Page"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                  </svg>
              </button>
              
              {/* Hall of Fame Tab (13번째 - 영구 소장) */}
              <button 
                onClick={() => changeLayout('favorites')}
                className={`
                    w-12 h-10 md:w-12 md:h-10 sm:w-10 sm:h-9 rounded-r-md flex items-center justify-center shadow-sm border border-l-0 border-red-300 transition-transform hover:translate-x-1 active:translate-x-1
                    ${currentLayout === 'favorites' ? 'bg-red-500 text-white translate-x-1' : 'bg-red-100 text-red-400'}
                `}
                title="Hall of Fame - 영구 소장"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                  </svg>
              </button>
          </div>

          {/* Keyring (Decorative) */}
          <div className="absolute top-10 -left-2 z-50">
             <Keyring charm={diaryStyle.keyring} />
          </div>

      </div>
      </div>
      )}

      {/* --- UI Overlays --- */}

      {/* Minimal Top Toolbar - Moved to absolute right to avoid overlapping the book content */}
      <div className="fixed top-8 right-8 md:top-8 md:right-8 sm:top-4 sm:right-4 z-[100] flex flex-col gap-3">
            {/* Decoration Selector (Stickers/Tape) */}
            <DecorationSelector onSelect={handleDecoration} />

            {/* Save */}
            <button 
                onClick={handleSaveLayout}
                className="w-10 h-10 md:w-10 md:h-10 sm:w-12 sm:h-12 bg-white rounded-full shadow-md border border-stone-200 flex items-center justify-center text-stone-600 hover:text-blue-500 active:text-blue-500 hover:scale-105 active:scale-105 transition-all"
                title="Save"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                </svg>
            </button>

            {/* Divider */}
            <div className="w-10 h-px bg-stone-300 self-center"></div>
            
            {/* Backup */}
            <button 
                onClick={handleCreateBackup}
                className="w-10 h-10 md:w-10 md:h-10 sm:w-12 sm:h-12 bg-white rounded-full shadow-md border border-stone-200 flex items-center justify-center text-stone-600 hover:text-purple-500 active:text-purple-500 hover:scale-105 active:scale-105 transition-all"
                title="Create Backup"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
                    <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" />
                </svg>
            </button>

            {/* Export to JSON */}
            <button 
                onClick={handleExport}
                className="w-10 h-10 md:w-10 md:h-10 sm:w-12 sm:h-12 bg-white rounded-full shadow-md border border-stone-200 flex items-center justify-center text-stone-600 hover:text-green-500 active:text-green-500 hover:scale-105 active:scale-105 transition-all"
                title="Export to File"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>

            {/* Import from JSON */}
            <button 
                onClick={() => importInputRef.current?.click()}
                className="w-10 h-10 md:w-10 md:h-10 sm:w-12 sm:h-12 bg-white rounded-full shadow-md border border-stone-200 flex items-center justify-center text-stone-600 hover:text-orange-500 active:text-orange-500 hover:scale-105 active:scale-105 transition-all"
                title="Import from File"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <input 
                    type="file" 
                    ref={importInputRef} 
                    className="hidden" 
                    accept=".json" 
                    onChange={handleImport} 
                />
            </button>

            {/* Divider */}
            <div className="w-10 h-px bg-stone-300 self-center"></div>
            
            {/* Clear */}
            <button 
                onClick={handleClearLayout}
                className="w-10 h-10 md:w-10 md:h-10 sm:w-12 sm:h-12 bg-white rounded-full shadow-md border border-stone-200 flex items-center justify-center text-stone-600 hover:text-red-500 active:text-red-500 hover:scale-105 active:scale-105 transition-all"
                title="Clear Page"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                   <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
            </button>
      </div>

      {/* Modals */}
      {pendingYoutube && <YoutubeModal onConfirm={confirmYoutube} onCancel={() => setPendingYoutube(null)} />}
      {showCreationModal && <CreationModal onConfirm={handleCreateManual} onCancel={() => setShowCreationModal(false)} />}
      
      {/* Toast (Legacy - can be removed if prefer react-hot-toast only) */}
      {toastMsg && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-stone-800 text-white text-xs font-bold px-4 py-2 rounded-full shadow-xl animate-bounce z-[200]">
              {toastMsg}
          </div>
      )}

      </div> {/* End of outer container */}
    </>
  );
};

export default App;
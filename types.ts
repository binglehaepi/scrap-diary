
export enum ScrapType {
  TWITTER = 'twitter',
  INSTAGRAM = 'instagram',
  PINTEREST = 'pinterest',
  BOOK = 'book',
  YOUTUBE = 'youtube',
  FASHION = 'fashion',
  CHAT = 'chat',
  TICKET = 'ticket',
  BOARDING = 'boarding',
  RECEIPT = 'receipt',
  TOPLOADER = 'toploader',
  CUPSLEEVE = 'cupsleeve',
  NOTE = 'note',
  GENERAL = 'general',
  STICKER = 'sticker',
  TAPE = 'tape',
  MOVING_PHOTO = 'moving_photo',
  PROFILE = 'profile',
  TODO = 'todo',
  OHAASA = 'ohaasa',
  NAVER = 'naver',
  NAVER_BLOG = 'naver_blog',
  POSTYPE = 'postype'
}

export type LayoutType = 'home' | 'free' | 'monthly' | 'weekly' | 'favorites';
export type BorderStyle = 'none' | 'stitch' | 'marker' | 'tape' | 'shadow';

export interface ScrapMetadata {
  title: string;
  subtitle?: string; // Author, artist, or price
  description?: string; // Tweet text or short summary
  imageUrl?: string;
  videoUrl?: string; // Added for MP4 loops
  url: string;
  themeColor?: string;
  isEditable?: boolean; // Level 4: Fallback UI support
  
  // Advanced YouTube Config
  youtubeConfig?: {
    mode: 'cd' | 'player';
    startTime?: number; // seconds
  };

  // Ticket Config
  ticketConfig?: {
    date: string;
    time: string;
    seat: string;
    cinema: string;
  };

  // Boarding Pass Config
  boardingConfig?: {
    from: string;
    to: string;
    flight: string;
    seat: string;
    date: string;
    gate: string;
    color: string;
  };

  // Receipt Config
  receiptConfig?: {
    items: { name: string; price: string }[];
    total: string;
    date: string;
  };

  // Toploader Config
  toploaderConfig?: {
    stickers: { id: string; x: number; y: number; emoji: string; rotation: number }[];
  };

  // Cup Sleeve Config
  cupSleeveConfig?: {
    cafeName: string;
    eventDate: string;
  };

  // Fashion Tag Config
  fashionConfig?: {
    brand: string;
    price: string;
    size?: string;
  };

  // Handwritten Note Config
  noteConfig?: {
    text: string;
    color?: string; // ink color
    fontSize?: string;
  };

  // Sticker Config
  stickerConfig?: {
    emoji: string;
  };

  // Tape Config
  tapeConfig?: {
    color: string;
    pattern?: 'solid' | 'stripe' | 'grid';
  };

  // Profile Config
  profileConfig?: {
    name: string;
    status: string;
    tags: string[];
  };

  // Todo Config
  todoConfig?: {
    items: { id: string; text: string; completed: boolean }[];
  };
}

export interface ScrapPosition {
  x: number;
  y: number;
  z: number;
  rotation: number;
  scale?: number;
}

export interface ScrapItem {
  id: string;
  type: ScrapType;
  metadata: ScrapMetadata;
  position: ScrapPosition;
  createdAt: number;
  diaryDate: string; // Format: YYYY-MM-DD for daily, YYYY-MM for monthly left page
  borderStyle?: BorderStyle;
  isMainItem?: boolean; // Represents the cover image for this day in Monthly view
  isFavorite?: boolean; // 영구 소장용 (13번째 탭)
}

// Persistable Text Data for Layouts
export interface LayoutTextData {
  [key: string]: { 
     goals?: string;
     important?: string;
     memo?: string;
     coverImage?: string; // Used for weekly cover

     // Monthly Dashboard Fields
     profileName?: string;
     profileStatus?: string;
     profileImage?: string;
     dDayTitle?: string;
     dDayDate?: string;
     photoUrl?: string; // Used for CD Cover or Photo Add
     musicTitle?: string;
     musicUrl?: string; // Added for YouTube Link
     bucketList?: string;
     monthlyBackground?: string; // Monthly background image
  }
}

// Global Style Preferences
export interface DiaryStyle {
  coverColor: string;
  coverPattern: 'quilt' | 'leather' | 'denim' | 'fur';
  keyring: string; // emoji char
  backgroundImage?: string; // Custom Desk Image
}

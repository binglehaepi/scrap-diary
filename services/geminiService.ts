import { GoogleGenAI } from "@google/genai";
import { ScrapType, ScrapMetadata } from "../types";

// ------------------------------------------------------------------
// 🛡️ ARCHITECTURE NOTE:
// This service implements a "Safety & Caching Layer" for data fetching.
//
// In a full production Next.js environment, the logic below (specifically 
// the fetchWithGemini and caching) should reside in an API Route 
// (e.g., app/api/scrap/route.ts) to protect the API_KEY and avoid CORS.
//
// Currently, it simulates this backend behavior within the client service
// to provide immediate performance benefits and architecture readiness.
// ------------------------------------------------------------------

// --- 1. Caching Layer (In-Memory) ---
// Stores metadata to prevent redundant API calls and speed up the UI.
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 Hours Cache
const memoryCache = new Map<string, { data: ScrapMetadata; timestamp: number }>();

const getCachedData = (url: string): ScrapMetadata | null => {
  const cached = memoryCache.get(url);
  if (!cached) return null;
  
  // Check Expiry
  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    memoryCache.delete(url);
    return null;
  }
  return cached.data;
};

const setCachedData = (url: string, data: ScrapMetadata) => {
  // Save to memory (In Prod, use Redis)
  memoryCache.set(url, { data, timestamp: Date.now() });
};

// --- 2. Platform Specific Fetchers ---

// 📌 Pinterest: Uses Proxy + OEmbed
// Note: Proxies are necessary in client-side only. In Next.js, use direct fetch.
const fetchPinterest = async (url: string): Promise<ScrapMetadata | null> => {
  try {
    const PROXY_URL = "https://api.allorigins.win/raw?url=";
    const oembedUrl = `https://www.pinterest.com/oembed.json?url=${encodeURIComponent(url)}&format=json`;
    
    // Cached fetch logic relies on the main facade, but individual fetchers assume fresh call needed
    const response = await fetch(PROXY_URL + encodeURIComponent(oembedUrl));
    if (!response.ok) return null;
    const data = await response.json();
    
    return {
      title: data.title || "Pinterest Pin",
      subtitle: data.author_name || "Pinterest",
      description: "Saved from Pinterest",
      imageUrl: data.thumbnail_url, // Official High-res
      url: url,
      themeColor: "#E60023",
      isEditable: false
    };
  } catch (e) {
    console.warn("Pinterest Fetch Failed", e);
    return null;
  }
};

// 📺 YouTube: Zero-Quota Strategy (Regex + OEmbed)
const fetchYoutube = async (url: string): Promise<ScrapMetadata | null> => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = (match && match[2].length === 11) ? match[2] : null;

    if (!videoId) return null;

    // Try OEmbed for Title (No API Key needed, High Quota)
    let title = "YouTube Video";
    let author = "YouTube";
    try {
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
        const response = await fetch(oembedUrl);
        if (response.ok) {
            const data = await response.json();
            title = data.title;
            author = data.author_name;
        }
    } catch (e) {
        // Ignore oEmbed failure, fallback to basic ID
    }

    return {
      title: title,
      subtitle: author,
      description: "Watch on YouTube",
      imageUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      url: url,
      themeColor: "#FF0000",
      isEditable: false,
      // Default config, can be overridden by user modal
      youtubeConfig: { mode: 'player', startTime: 0 }
    };
};

// ------------------------------------------------------------------
// 🧩 3. Generic Open Graph Fetcher (No API Key Needed)
// ------------------------------------------------------------------
// 네이버, 포스타입, 서점 등 대부분의 한국 사이트는 OG태그가 잘 되어 있습니다.
// AI를 쓰지 않고 HTML 헤더만 긁어오면 되어 속도가 빠르고 무료입니다.

const fetchOpenGraph = async (url: string, type: ScrapType): Promise<ScrapMetadata | null> => {
  try {
    // 1. 네이버 블로그는 모바일 주소로 변환해야 파싱이 쉽습니다.
    let targetUrl = url;
    if (targetUrl.includes("blog.naver.com") && !targetUrl.includes("m.blog.naver.com")) {
      targetUrl = targetUrl.replace("https://blog.naver.com", "https://m.blog.naver.com");
    }

    // 2. 무료 프록시를 통해 HTML 요청 (CORS 우회)
    const PROXY_URL = "https://api.allorigins.win/get?url=";
    const response = await fetch(PROXY_URL + encodeURIComponent(targetUrl));
    
    if (!response.ok) return null;
    
    const json = await response.json();
    const htmlString = json.contents;

    // 3. HTML 파싱
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");

    // 4. 메타데이터 추출 (og:title, og:image 등)
    const getMeta = (property: string) => 
      doc.querySelector(`meta[property='${property}']`)?.getAttribute("content");

    const title = getMeta("og:title") || doc.title || "Scrap Link";
    const image = getMeta("og:image") || "";
    let description = getMeta("og:description") || "";
    const siteName = getMeta("og:site_name") || "";
    const author = getMeta("og:article:author") || getMeta("author") || siteName;

    // 5. 사이트별 테마 컬러 및 디테일 설정
    let themeColor = "#000000";
    
    // 블로그/미디어
    if (url.includes("naver.com")) themeColor = "#03C75A"; // 네이버 그린
    else if (url.includes("postype.com")) themeColor = "#3E465B"; // 포스타입 네이비
    else if (url.includes("brunch.co.kr")) themeColor = "#00C4C4"; // 브런치 민트
    else if (url.includes("velog.io")) themeColor = "#20C997"; // 벨로그 민트
    
    // 서점
    else if (url.includes("yes24.com")) themeColor = "#0080FF"; // 예스24 블루
    else if (url.includes("aladin.co.kr")) themeColor = "#EB5B93"; // 알라딘 핑크/레드
    else if (url.includes("kyobobook.co.kr")) themeColor = "#5055B1"; // 교보문고 퍼플/네이비
    
    // 크라우드펀딩
    else if (url.includes("tumblbug.com")) themeColor = "#FA4A4A"; // 텀블벅 레드
    
    // 영화/드라마
    else if (url.includes("watcha.com") || url.includes("pedia.watcha.com")) themeColor = "#FF2F6E"; // 왓챠 핑크
    
    // 패션/쇼핑
    else if (url.includes("musinsa.com")) themeColor = "#000000"; // 무신사 블랙
    else if (url.includes("29cm.co.kr")) themeColor = "#000000"; // 29CM 블랙

    // 가격 정보가 있다면 서브타이틀로 활용 (쇼핑몰용)
    const price = getMeta("product:price:amount");
    const currency = getMeta("product:price:currency") || "원";
    const subtitle = price ? `${price}${currency}` : author;

    return {
      title: title,
      subtitle: subtitle,
      description: description,
      imageUrl: image,
      url: url,
      themeColor: themeColor,
      isEditable: false
    };

  } catch (e) {
    console.warn(`OpenGraph Fetch Failed for ${url}`, e);
    return null;
  }
};

// 🤖 General/Commerce: Gemini AI with Grounding
const fetchWithGemini = async (url: string, type: ScrapType): Promise<ScrapMetadata> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Explicit prompt for JSON structure
    const prompt = `
      I am a web scraper. Analyze this URL: "${url}" (Type: ${type}).
      
      Extract or infer the following details in strict JSON format:
      {
        "title": "Main title, book name, or product name",
        "subtitle": "Author, Brand, Website Name, or Price",
        "description": "Short summary (max 120 chars)",
        "themeColor": "Hex color code matching the content (e.g. #FF0000)",
        "imageKeyword": "A single visual keyword to search for a background image if scraping fails"
      }
      
      Use Google Search Grounding to find real information.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json"
            }
        });

        const jsonText = response.text || "{}";
        let json;
        try {
            json = JSON.parse(jsonText);
        } catch {
            console.warn("JSON Parse Failed, using fallback");
            json = { title: "Web Scrap", subtitle: "Website" };
        }
        
        // Deterministic Image Seed
        const seed = encodeURIComponent(json.imageKeyword || json.title || 'scrap');
        let imageUrl = `https://picsum.photos/seed/${seed}/400/400`;
        
        // Context-aware sizing
        if (type === ScrapType.BOOK) imageUrl = `https://picsum.photos/seed/${seed}/300/450`;
        if (type === ScrapType.FASHION) imageUrl = `https://picsum.photos/seed/${seed}/400/500`;

        return {
            title: json.title || "Web Scrap",
            subtitle: json.subtitle || new URL(url).hostname,
            description: json.description || "",
            imageUrl: imageUrl, 
            url: url,
            themeColor: json.themeColor || "#000000",
            isEditable: false
        };

    } catch (e) {
        console.error("Gemini Fetch Failed", e);
        throw e;
    }
};

// --- 3. Main Facade (The "Proxy") ---

export const fetchMetadata = async (url: string, type: ScrapType): Promise<ScrapMetadata> => {
    // A. Check Cache First (Zero-Latency Return)
    const cached = getCachedData(url);
    if (cached) {
        console.log(`⚡ Cache Hit: ${url}`);
        return cached;
    }

    console.log(`🔄 Fetching Fresh: ${url}`);
    let result: ScrapMetadata | null = null;

    try {
        const domain = new URL(url).hostname;

        // B. Route Logic
        // 1. 한국 사이트들은 '무료 OG 파서' 사용 (블로그/서점/쇼핑/펀딩/영화)
        if (
            domain.includes('naver.com') || 
            domain.includes('postype.com') ||
            domain.includes('yes24.com') ||
            domain.includes('aladin.co.kr') ||
            domain.includes('kyobobook.co.kr') ||
            domain.includes('brunch.co.kr') ||
            domain.includes('tumblbug.com') ||
            domain.includes('watcha.com') ||
            domain.includes('musinsa.com') ||
            domain.includes('29cm.co.kr') ||
            domain.includes('velog.io')
        ) {
            result = await fetchOpenGraph(url, type);
        }
        // 2. 기존 플랫폼별 로직
        else {
            switch (type) {
                case ScrapType.MOVING_PHOTO:
                    const isVideo = url.toLowerCase().endsWith('.mp4');
                    result = {
                        title: "Moving Photo",
                        subtitle: isVideo ? "Video Loop" : "Animated GIF",
                        description: "",
                        imageUrl: isVideo ? "" : url,
                        videoUrl: isVideo ? url : undefined,
                        url: url,
                        isEditable: true,
                        themeColor: "#000000"
                    };
                    break;
                case ScrapType.PINTEREST:
                    result = await fetchPinterest(url);
                    break;
                case ScrapType.YOUTUBE:
                    result = await fetchYoutube(url);
                    break;
                case ScrapType.TWITTER:
                case ScrapType.INSTAGRAM:
                    result = {
                        title: type === ScrapType.TWITTER ? "Twitter Post" : "Instagram Post",
                        subtitle: type === ScrapType.TWITTER ? "X / Twitter" : "Instagram",
                        description: "",
                        imageUrl: "",
                        url: url,
                        themeColor: type === ScrapType.TWITTER ? "#000000" : "#E1306C",
                        isEditable: false
                    };
                    break;
                default:
                    // 위 사이트가 아니면 Gemini 사용 (최후의 수단)
                    result = await fetchWithGemini(url, type);
                    break;
            }
        }
    } catch (error) {
        console.error("Scraping failed:", error);
        result = null;
    }

    // C. Default Fallback & Cache Write
    const finalData = result || {
        title: "New Scrap Object",
        subtitle: "Click to Edit",
        description: "Could not load details automatically.",
        url: url,
        imageUrl: `https://picsum.photos/seed/${Date.now()}/400/400`,
        themeColor: "#64748b",
        isEditable: true
    };

    setCachedData(url, finalData);
    return finalData;
};
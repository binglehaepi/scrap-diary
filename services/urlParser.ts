import { ScrapType } from '../types';

export const parseUrlType = (url: string): ScrapType => {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    const pathname = urlObj.pathname.toLowerCase();

    // Direct File Checks
    if (pathname.endsWith('.gif') || pathname.endsWith('.webp') || pathname.endsWith('.mp4')) {
      return ScrapType.MOVING_PHOTO;
    }

    if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
      return ScrapType.TWITTER;
    }

    if (hostname.includes('instagram.com')) {
      return ScrapType.INSTAGRAM;
    }

    if (hostname.includes('pinterest.com') || hostname.includes('pinterest.co.kr')) {
      return ScrapType.PINTEREST;
    }
    
    // Book sites
    if (hostname.includes('aladin.co.kr') || 
        hostname.includes('yes24.com') || 
        hostname.includes('kyobobook.co.kr') ||
        hostname.includes('amazon.com')) {
      return ScrapType.BOOK;
    }

    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      return ScrapType.YOUTUBE;
    }

    // Korean sites
    if (hostname.includes('blog.naver.com')) {
      return ScrapType.NAVER_BLOG;
    }

    if (hostname.includes('naver.com')) {
      return ScrapType.NAVER;
    }

    if (hostname.includes('postype.com')) {
      return ScrapType.POSTYPE;
    }

    // Shopping sites (Fashion/Commerce)
    if (
        hostname.includes('musinsa') || 
        hostname.includes('29cm.co.kr') ||
        hostname.includes('zara') || 
        hostname.includes('hm.com') ||
        hostname.includes('uniqlo') ||
        hostname.includes('nike') || 
        url.includes('/shop/') ||
        url.includes('/product/')
      ) {
      return ScrapType.FASHION;
    }

    // Crowdfunding
    if (hostname.includes('tumblbug.com')) {
      return ScrapType.GENERAL;
    }

    // Movie/Drama
    if (hostname.includes('watcha.com') || hostname.includes('pedia.watcha.com')) {
      return ScrapType.GENERAL;
    }

    // Developer blogs
    if (hostname.includes('velog.io')) {
      return ScrapType.NAVER_BLOG; // Use blog styling
    }

    return ScrapType.GENERAL;
  } catch (e) {
    return ScrapType.GENERAL;
  }
};
// Utility functions for robust sharing across WhatsApp, Social Media, and Web Share API
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';

export const DEFAULT_CHURCH_LOGO = "https://i.ibb.co/mVw3Ftpw/PCI-logo.png";
export const PRODUCTION_WEB_DOMAIN = "https://www.cpibethel.com";
export const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.pcibethel.app";

/**
 * Returns a publicly accessible URL for sharing.
 * - On Native Android / iOS App: Returns the official Google Play Store download link.
 * - On Web App: Returns the direct webpage link (e.g. https://www.cpibethel.com/announcements/...).
 */
export function getPublicShareUrl(pathOrUrl?: string): string {
  const isNative = Capacitor.isNativePlatform();

  // If in native Android / mobile app, share the Play Store link
  if (isNative) {
    return PLAY_STORE_URL;
  }

  // Web app mode: Share the direct website page link
  let input = pathOrUrl;
  if (!input && typeof window !== 'undefined') {
    input = window.location.pathname + window.location.search + window.location.hash;
  }
  if (!input) return PRODUCTION_WEB_DOMAIN;

  input = input.trim();

  // If already full http/https or capacitor URL
  if (/^https?:\/\//i.test(input) || /^capacitor:\/\//i.test(input)) {
    // If it points to localhost / 127.0.0.1 / capacitor
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(input) || /^capacitor:\/\/localhost/i.test(input)) {
      return input
        .replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, PRODUCTION_WEB_DOMAIN)
        .replace(/^capacitor:\/\/localhost/i, PRODUCTION_WEB_DOMAIN);
    }
    return input;
  }

  // If relative path
  const normalizedPath = input.startsWith('/') ? input : `/${input}`;

  const isLocalHost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' ||
    window.location.protocol === 'capacitor:' ||
    window.location.protocol === 'ionic:'
  );

  if (isLocalHost) {
    return `${PRODUCTION_WEB_DOMAIN}${normalizedPath}`;
  }

  if (typeof window !== 'undefined' && window.location.origin) {
    return `${window.location.origin}${normalizedPath}`;
  }

  return `${PRODUCTION_WEB_DOMAIN}${normalizedPath}`;
}

/**
 * Executes a native share dialog via Capacitor Share Plugin (on Android / iOS)
 * or Web Share API (on supporting browsers).
 */
export async function performNativeShare({
  title,
  text,
  url,
  dialogTitle,
}: {
  title: string;
  text?: string;
  url?: string;
  dialogTitle?: string;
}): Promise<boolean> {
  const publicUrl = getPublicShareUrl(url);

  // 1. Try Capacitor Native Share Sheet (Works on Android & iOS apps)
  try {
    if (Capacitor.isNativePlatform()) {
      await Share.share({
        title,
        text,
        url: publicUrl,
        dialogTitle: dialogTitle || title,
      });
      return true;
    }
  } catch (err: any) {
    if (err?.name === 'AbortError' || err?.message?.includes('canceled') || err?.message?.includes('dismissed')) {
      return true;
    }
    console.warn("Capacitor share fallback:", err);
  }

  // 2. Try Browser Web Share API (navigator.share)
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url: publicUrl,
      });
      return true;
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return true;
      }
      console.warn("navigator.share fallback:", err);
    }
  }

  return false;
}

/**
 * Strips HTML tags and decodes common HTML entities into clean readable text
 */
export function cleanHtmlToText(htmlOrText?: string): string {
  if (!htmlOrText) return '';
  return htmlOrText
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<\/p>|<\/div>|<br\s*\/?>|<\/h[1-6]>|<\/li>|<\/tr>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts at least two sentences from article text or HTML content.
 * Gracefully handles honorifics, abbreviations, and punctuation.
 */
export function extractAtLeastTwoSentences(contentOrText?: string, minSentences = 2): string {
  const text = cleanHtmlToText(contentOrText);
  if (!text) return '';

  // Protect common abbreviations and titles from false sentence splitting
  // (e.g. Rev., Dr., Upa., Pu., Pi., Tv., Nl., etc. and numerical decimals)
  const protectedText = text
    .replace(/\b(Rev|Dr|Prof|Upa|Pu|Pi|Tv|Nl|Ch|vs|v|eg|i\.e|etc)\./gi, '$1§DOT§')
    .replace(/(\d+)\.(\d+)/g, '$1§DOT§$2');

  // Split by sentence terminators (. ! ?) followed by quotes, whitespace, or end of string
  const parts = protectedText.split(/(?<=[.!?])(?=['"]?\s+|$)/);

  const sentences = parts
    .map(s => s.replace(/§DOT§/g, '.').trim())
    .filter(s => s.length > 0);

  if (sentences.length >= minSentences) {
    let combined = sentences.slice(0, minSentences).join(' ');
    // If the two sentences are exceptionally brief (e.g., fewer than 70 chars total),
    // include a third sentence if one is available
    if (combined.length < 70 && sentences.length > minSentences) {
      combined = sentences.slice(0, minSentences + 1).join(' ');
    }
    return combined;
  }

  if (sentences.length > 0) {
    return sentences.join(' ');
  }

  // Fallback for text with no punctuation: cut around 180-200 characters at a whole word
  if (text.length <= 200) {
    return text;
  }
  const slice = text.slice(0, 200);
  const lastSpace = slice.lastIndexOf(' ');
  return (lastSpace > 50 ? slice.slice(0, lastSpace) : slice) + '...';
}

/**
 * Extracts the first image embedded in an article's HTML content,
 * explicit image URLs, or falls back to the official church logo.
 */
export function extractFirstImage(data: {
  imageUrl?: string;
  image?: string;
  content?: string;
  text?: string;
  imageUrls?: string[];
  images?: string[];
}): { url: string; isLogo: boolean } {
  // 1. Check explicit single image URL
  if (data.imageUrl && typeof data.imageUrl === 'string' && data.imageUrl.trim()) {
    return { url: data.imageUrl.trim(), isLogo: false };
  }
  if (data.image && typeof data.image === 'string' && data.image.trim()) {
    return { url: data.image.trim(), isLogo: false };
  }

  // 2. Check image arrays
  if (data.imageUrls && Array.isArray(data.imageUrls) && data.imageUrls.length > 0 && data.imageUrls[0]?.trim()) {
    return { url: data.imageUrls[0].trim(), isLogo: false };
  }
  if (data.images && Array.isArray(data.images) && data.images.length > 0 && data.images[0]?.trim()) {
    return { url: data.images[0].trim(), isLogo: false };
  }

  // 3. Search HTML content for embedded <img> tags
  if (data.content && typeof data.content === 'string') {
    const match = data.content.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (match && match[1] && match[1].trim()) {
      return { url: match[1].trim(), isLogo: false };
    }
  }

  // 4. Search plain text / markdown for images
  if (data.text && typeof data.text === 'string') {
    const matchHtml = data.text.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (matchHtml && matchHtml[1] && matchHtml[1].trim()) {
      return { url: matchHtml[1].trim(), isLogo: false };
    }
    const matchMd = data.text.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/i);
    if (matchMd && matchMd[1] && matchMd[1].trim()) {
      return { url: matchMd[1].trim(), isLogo: false };
    }
  }

  // 5. Default fallback to the official Champhai Bethel Church Logo
  return { url: DEFAULT_CHURCH_LOGO, isLogo: true };
}

/**
 * Formats a clean, high-impact share message including title, author,
 * at least two sentences of the article, and "Read more" with the URL link.
 */
export function generateShareMessage({
  title,
  author,
  excerpt,
  targetUrl,
  language = 'mizo',
}: {
  title: string;
  author?: string;
  excerpt?: string;
  targetUrl: string;
  language?: string;
}): string {
  const parts: string[] = [];

  // Title with bold formatting for WhatsApp / markdown
  parts.push(`*${title.trim()}*`);
  if (author && author.trim()) {
    parts.push(`_By ${author.trim()}_`);
  }

  // Two sentences excerpt
  if (excerpt && excerpt.trim()) {
    parts.push('');
    parts.push(excerpt.trim());
  }

  // Read more / Download app link
  parts.push('');
  const isNative = Capacitor.isNativePlatform();
  const readMoreLabel = isNative
    ? (language === 'en' 
        ? '📲 Download Bethel Kohhran App on Google Play Store:' 
        : '📲 Bethel Kohhran App Google Play Store-ah download rawh:')
    : (language === 'en' 
        ? '👉 Read more:' 
        : '👉 Chhiar chhunzawmna / Read more:');
  parts.push(readMoreLabel);
  parts.push(targetUrl);

  // Church footer
  parts.push('');
  parts.push('Champhai Bethel Kohhran');

  return parts.join('\n');
}

/**
 * Updates dynamic meta tags in the document head for social unfurling & previews
 */
export function updateShareMetaTags(meta: {
  title?: string;
  description?: string;
  imageUrl?: string;
  url?: string;
}) {
  if (typeof document === 'undefined') return;

  const setMetaTag = (property: string, content: string, isName = false) => {
    const selector = isName ? `meta[name="${property}"]` : `meta[property="${property}"]`;
    let element = document.querySelector(selector);
    if (!element) {
      element = document.createElement('meta');
      if (isName) {
        element.setAttribute('name', property);
      } else {
        element.setAttribute('property', property);
      }
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  };

  if (meta.title) {
    setMetaTag('og:title', meta.title);
    setMetaTag('twitter:title', meta.title, true);
  }
  if (meta.description) {
    setMetaTag('og:description', meta.description);
    setMetaTag('twitter:description', meta.description, true);
    setMetaTag('description', meta.description, true);
  }
  if (meta.imageUrl) {
    setMetaTag('og:image', meta.imageUrl);
    setMetaTag('og:image:secure_url', meta.imageUrl);
    setMetaTag('twitter:image', meta.imageUrl, true);
  }
  if (meta.url) {
    setMetaTag('og:url', meta.url);
  }
}

import { storage } from '../services/firebase';

export const IMGBB_API_KEY = '7939507abc655d09649cc02e47dc9d49';

/**
 * Convert data URL / base64 string to a Blob
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Compress an image file/blob to a lightweight data URL using Canvas (client-side preview)
 */
export async function compressImageToDataUrl(file: File | Blob, maxWidth = 1200, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target?.result as string || '');
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Upload image to Firebase Storage first, with ImgBB fallback
 */
export async function uploadImageToHosting(fileOrBlob: File | Blob): Promise<string> {
  // 1. Try Firebase Storage if available
  if (storage && typeof storage.ref === 'function') {
    try {
      const extension = fileOrBlob.type ? fileOrBlob.type.split('/')[1] || 'jpg' : 'jpg';
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${extension}`;
      const storageRef = storage.ref().child(`about_images/${fileName}`);
      
      const snapshot = await storageRef.put(fileOrBlob);
      const downloadUrl = await snapshot.ref.getDownloadURL();
      if (downloadUrl) {
        return downloadUrl;
      }
    } catch (firebaseErr) {
      console.warn('Firebase Storage upload failed or not configured, trying ImgBB fallback:', firebaseErr);
    }
  }

  // 2. Fallback to ImgBB
  try {
    const formData = new FormData();
    formData.append('image', fileOrBlob);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    if (result.success && result.data && result.data.url) {
      return result.data.url;
    }
  } catch (imgbbErr) {
    console.error('ImgBB upload error:', imgbbErr);
  }

  // 3. Last resort fallback: return compressed small data URL so app never crashes
  console.warn('Both Firebase Storage and ImgBB failed, using compressed fallback');
  return await compressImageToDataUrl(fileOrBlob, 600, 0.6);
}

/**
 * Scans an HTML string, identifies any base64 data URLs in <img> src attributes,
 * uploads each to cloud hosting, and replaces the src with the hosted HTTPS URL.
 * This prevents Firestore 1MB document size limits.
 */
export async function ensureAllImagesHosted(html: string): Promise<string> {
  if (!html || typeof html !== 'string') return html;

  // Regex to find data:image URLs in src attributes
  const dataUrlRegex = /src=["'](data:image\/[a-zA-Z0-9+.-]+;base64,[^"']+)["']/g;
  const matches: string[] = [];
  let match;

  while ((match = dataUrlRegex.exec(html)) !== null) {
    if (match[1] && !matches.includes(match[1])) {
      matches.push(match[1]);
    }
  }

  if (matches.length === 0) {
    return html;
  }

  let updatedHtml = html;

  // Upload each base64 image in parallel
  const uploadPromises = matches.map(async (dataUrl) => {
    try {
      const blob = dataUrlToBlob(dataUrl);
      const hostedUrl = await uploadImageToHosting(blob);
      return { dataUrl, hostedUrl };
    } catch (err) {
      console.error('Failed to convert base64 image to hosted URL:', err);
      return { dataUrl, hostedUrl: dataUrl };
    }
  });

  const results = await Promise.all(uploadPromises);

  for (const { dataUrl, hostedUrl } of results) {
    if (hostedUrl && hostedUrl !== dataUrl) {
      updatedHtml = updatedHtml.split(dataUrl).join(hostedUrl);
    }
  }

  return updatedHtml;
}

/**
 * Sanitizes all string fields in a content object to ensure no base64 images are stored in Firestore
 */
export async function sanitizeContentForStorage<T extends Record<string, any>>(content: T): Promise<T> {
  const result: any = { ...content };

  for (const [key, value] of Object.entries(result)) {
    if (typeof value === 'string' && value.includes('data:image/')) {
      result[key] = await ensureAllImagesHosted(value);
    }
  }

  return result as T;
}

/**
 * Inserts an image cleanly into a Quill editor at the current selection or end
 */
export function insertImageAtQuillCursor(quill: any, imageUrl: string, alt = 'Bethel Church Photo') {
  if (!quill) return;
  const range = quill.getSelection(true) || { index: quill.getLength() - 1, length: 0 };
  
  // Insert newline if needed, then insert image
  quill.insertEmbed(range.index, 'image', imageUrl, 'user');
  quill.setSelection(range.index + 1, 0);

  // Set alt and styling attributes if the image element is in DOM
  setTimeout(() => {
    try {
      const imgs = quill.root.querySelectorAll('img');
      imgs.forEach((img: HTMLImageElement) => {
        if (img.src === imageUrl && !img.alt) {
          img.alt = alt;
          img.setAttribute('class', 'church-inserted-image');
        }
      });
    } catch {
      // ignore
    }
  }, 100);
}

/**
 * Attach clipboard paste and drag-drop image handlers to a Quill instance
 */
export function attachImagePasteAndDrop(
  quill: any, 
  onStatusChange?: (status: { uploading: boolean; message: string }) => void
): () => void {
  if (!quill || !quill.root) return () => {};

  const handlePaste = async (event: ClipboardEvent) => {
    const clipboardData = event.clipboardData;
    if (!clipboardData) return;

    // Check if items contain an image
    const items = Array.from(clipboardData.items || []);
    const imageItem = items.find(item => item.type.startsWith('image/'));

    if (imageItem) {
      event.preventDefault();
      event.stopPropagation();

      const file = imageItem.getAsFile();
      if (!file) return;

      onStatusChange?.({ uploading: true, message: 'Uploading pasted image to cloud storage...' });
      try {
        const url = await uploadImageToHosting(file);
        insertImageAtQuillCursor(quill, url, 'Pasted church image');
        onStatusChange?.({ uploading: false, message: 'Image inserted successfully!' });
      } catch (err) {
        console.error('Failed to paste image:', err);
        onStatusChange?.({ uploading: false, message: 'Failed to paste image' });
      } finally {
        setTimeout(() => onStatusChange?.({ uploading: false, message: '' }), 2500);
      }
      return;
    }

    // Also check if HTML was pasted that contains base64 images
    const pastedHtml = clipboardData.getData('text/html');
    if (pastedHtml && pastedHtml.includes('data:image/')) {
      event.preventDefault();
      event.stopPropagation();
      onStatusChange?.({ uploading: true, message: 'Uploading embedded images to cloud...' });
      try {
        const cleanHtml = await ensureAllImagesHosted(pastedHtml);
        const range = quill.getSelection(true) || { index: quill.getLength() - 1, length: 0 };
        quill.clipboard.dangerouslyPasteHTML(range.index, cleanHtml, 'user');
        onStatusChange?.({ uploading: false, message: 'Content pasted with hosted images!' });
      } catch (err) {
        console.error('Failed to process pasted HTML with images:', err);
      } finally {
        setTimeout(() => onStatusChange?.({ uploading: false, message: '' }), 2500);
      }
    }
  };

  const handleDrop = async (event: DragEvent) => {
    const dataTransfer = event.dataTransfer;
    if (!dataTransfer) return;

    const files = Array.from(dataTransfer.files || []);
    const imageFile = files.find(file => file.type.startsWith('image/'));

    if (imageFile) {
      event.preventDefault();
      event.stopPropagation();

      onStatusChange?.({ uploading: true, message: 'Uploading dropped image to cloud storage...' });
      try {
        const url = await uploadImageToHosting(imageFile);
        insertImageAtQuillCursor(quill, url, 'Uploaded church image');
        onStatusChange?.({ uploading: false, message: 'Image dropped successfully!' });
      } catch (err) {
        console.error('Failed to drop image:', err);
        onStatusChange?.({ uploading: false, message: 'Failed to drop image' });
      } finally {
        setTimeout(() => onStatusChange?.({ uploading: false, message: '' }), 2500);
      }
    }
  };

  const rootElement = quill.root;
  rootElement.addEventListener('paste', handlePaste, true);
  rootElement.addEventListener('drop', handleDrop, true);

  return () => {
    rootElement.removeEventListener('paste', handlePaste, true);
    rootElement.removeEventListener('drop', handleDrop, true);
  };
}


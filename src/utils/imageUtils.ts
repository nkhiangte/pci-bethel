/**
 * Utility functions for handling image upload, compression, and inserting into rich text editors (Quill)
 */

export const IMGBB_API_KEY = '7939507abc655d09649cc02e47dc9d49';

/**
 * Compress an image file/blob to a lightweight data URL using Canvas
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
 * Upload image file to ImgBB with automatic fallback to compressed Data URL
 */
export async function uploadImageToHosting(file: File | Blob): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    if (result.success && result.data && result.data.url) {
      return result.data.url;
    }
  } catch (err) {
    console.warn('ImgBB upload failed, falling back to local compressed image data:', err);
  }

  // Fallback to compressed base64 if network/ImgBB is down
  return await compressImageToDataUrl(file);
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

      onStatusChange?.({ uploading: true, message: 'Uploading pasted image...' });
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

      onStatusChange?.({ uploading: true, message: 'Uploading dropped image...' });
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

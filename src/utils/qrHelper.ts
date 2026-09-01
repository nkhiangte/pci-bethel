import QRCode from 'qrcode';

export interface BookQrPayload {
  type: 'book';
  id: string;
  accessionNo: string;
  title: string;
}

export interface MemberQrPayload {
  type: 'member';
  id: string;
  memberNo: string;
  name: string;
}

/**
 * Generate high quality QR code data URL (Base64 PNG)
 */
export async function generateQrCodeDataUrl(text: string, options?: { width?: number; margin?: number; color?: { dark?: string; light?: string } }): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: options?.width || 300,
      margin: options?.margin || 2,
      color: {
        dark: options?.color?.dark || '#0f172a',
        light: options?.color?.light || '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    return '';
  }
}

/**
 * Encode Book Payload string for QR code
 */
export function encodeBookQr(accessionNo: string, bookId?: string): string {
  return `KB-BOOK:${accessionNo}${bookId ? `:${bookId}` : ''}`;
}

/**
 * Encode Member Payload string for QR code
 */
export function encodeMemberQr(memberNo: string, memberId?: string): string {
  return `KB-MEMBER:${memberNo}${memberId ? `:${memberId}` : ''}`;
}

/**
 * Parse scanned QR string to determine if it is a book or member or raw code
 */
export function parseScannedQr(code: string): {
  type: 'book' | 'member' | 'unknown';
  raw: string;
  identifier: string;
  id?: string;
} {
  const trimmed = code.trim();

  // 1. Check formatted prefix KB-BOOK:ACCESSION_NO:ID
  if (trimmed.startsWith('KB-BOOK:')) {
    const parts = trimmed.split(':');
    return {
      type: 'book',
      raw: trimmed,
      identifier: parts[1] || '',
      id: parts[2] || undefined,
    };
  }

  // 2. Check formatted prefix KB-MEMBER:MEMBER_NO:ID
  if (trimmed.startsWith('KB-MEMBER:')) {
    const parts = trimmed.split(':');
    return {
      type: 'member',
      raw: trimmed,
      identifier: parts[1] || '',
      id: parts[2] || undefined,
    };
  }

  // 3. Check JSON format
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.type === 'book' || parsed.accessionNo) {
        return {
          type: 'book',
          raw: trimmed,
          identifier: parsed.accessionNo || parsed.id || '',
          id: parsed.id,
        };
      }
      if (parsed.type === 'member' || parsed.memberNo) {
        return {
          type: 'member',
          raw: trimmed,
          identifier: parsed.memberNo || parsed.id || '',
          id: parsed.id,
        };
      }
    } catch {
      // not json
    }
  }

  // 4. Heuristic check based on prefixes like BTH-M or MEM- for member
  if (/^(BTH-M|MEM-|M-|MEMBER)/i.test(trimmed)) {
    return {
      type: 'member',
      raw: trimmed,
      identifier: trimmed,
    };
  }

  // 5. Default to book accession number / ISBN / code
  return {
    type: 'book',
    raw: trimmed,
    identifier: trimmed,
  };
}

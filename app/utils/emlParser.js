/**
 * Minimal EML (RFC 822 / MIME) parser for browser.
 * Parses headers, body, and multipart attachments; decodes quoted-printable and base64.
 */

const CRLF = '\r\n';
const LF = '\n';

/**
 * Split raw EML into header block and body (first occurrence of blank line).
 * @param {string} raw
 * @returns {{ headers: string, body: string }}
 */
function splitHeadersAndBody(raw) {
  const normalized = raw.replace(/\r\n/g, LF).replace(/\r/g, LF);
  const idx = normalized.indexOf(LF + LF);
  if (idx === -1) {
    return { headers: normalized.trimEnd(), body: '' };
  }
  return {
    headers: normalized.slice(0, idx).trimEnd(),
    body: normalized.slice(idx + 2),
  };
}

/**
 * Parse header block into key-value object. Handles folding (lines starting with space/tab).
 * @param {string} headerBlock
 * @returns {Record<string, string>}
 */
function parseHeaders(headerBlock) {
  const lines = headerBlock.split(/\r?\n/);
  const result = {};
  let currentKey = null;
  let currentValue = [];

  for (const line of lines) {
    if (/^[ \t]/.test(line) && currentKey) {
      currentValue.push(line.trimStart());
    } else {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        if (currentKey) {
          result[currentKey] = currentValue.join(' ').trim();
        }
        currentKey = line.slice(0, colonIdx).trim();
        currentValue = [line.slice(colonIdx + 1).trim()];
      }
    }
  }
  if (currentKey) {
    result[currentKey] = currentValue.join(' ').trim();
  }
  return result;
}

/**
 * Parse Content-Type value and extract type, charset, boundary, name (filename).
 * @param {string} value
 * @returns {{ type: string, charset: string, boundary?: string, name?: string }}
 */
function parseContentType(value) {
  if (!value || typeof value !== 'string') {
    return { type: 'text/plain', charset: 'utf-8' };
  }
  const parts = value.split(';').map((p) => p.trim());
  const type = parts[0].toLowerCase();
  let charset = 'utf-8';
  let boundary = undefined;
  let name = undefined;
  for (let i = 1; i < parts.length; i++) {
    const match = parts[i].match(/^([a-z]+)=(.+)$/i);
    if (!match) continue;
    const key = match[1].toLowerCase();
    let val = match[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1).replace(/\\/g, '');
    }
    if (key === 'charset') charset = val;
    if (key === 'boundary') boundary = val;
    if (key === 'name' || key === 'filename') name = val;
  }
  return { type, charset, boundary, name };
}

/**
 * Decode quoted-printable string.
 * @param {string} str
 * @returns {string}
 */
function decodeQuotedPrintable(str) {
  if (!str) return '';
  return str
    .replace(/=\r?\n/g, '')
    .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

/**
 * Decode base64 to string (for text). For binary use base64ToBlob.
 * @param {string} str
 * @returns {string}
 */
function decodeBase64ToString(str) {
  if (!str) return '';
  try {
    return decodeURIComponent(escape(atob(str.replace(/\s/g, ''))));
  } catch {
    try {
      return atob(str.replace(/\s/g, ''));
    } catch {
      return '';
    }
  }
}

/**
 * Decode base64 to Blob (for attachments).
 * @param {string} b64
 * @param {string} contentType
 * @returns {Blob}
 */
function base64ToBlob(b64, contentType = 'application/octet-stream') {
  const cleaned = (b64 || '').replace(/\s/g, '');
  if (!cleaned) return new Blob([], { type: contentType });
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: contentType });
}

/**
 * Decode body by Content-Transfer-Encoding.
 * @param {string} body
 * @param {string} encoding
 * @param {string} contentType - for blob path later
 * @returns {{ decoded: string, blob?: Blob }}
 */
function decodeBody(body, encoding, contentType = 'application/octet-stream') {
  if (!body) return { decoded: '' };
  const enc = (encoding || '7bit').toLowerCase();
  if (enc === 'quoted-printable') {
    return { decoded: decodeQuotedPrintable(body) };
  }
  if (enc === 'base64') {
    return { decoded: decodeBase64ToString(body), blob: base64ToBlob(body, contentType) };
  }
  return { decoded: body };
}

/**
 * Get decoded body text and optional blob from a part (headers + raw body).
 * @param {Record<string, string>} partHeaders
 * @param {string} rawBody
 * @param {boolean} wantBlob - if true and base64, also return blob
 * @returns {{ decoded: string, blob?: Blob }}
 */
function decodePartBody(partHeaders, rawBody, wantBlob = false) {
  const encoding = (partHeaders['Content-Transfer-Encoding'] || '7bit').toLowerCase();
  const ct = partHeaders['Content-Type'] || '';
  const { type } = parseContentType(ct);
  if (encoding === 'base64' && wantBlob) {
    const blob = base64ToBlob(rawBody, type);
    const decoded = type.startsWith('text/') ? decodeBase64ToString(rawBody) : '';
    return { decoded, blob };
  }
  if (encoding === 'quoted-printable') {
    return { decoded: decodeQuotedPrintable(rawBody) };
  }
  if (encoding === 'base64') {
    return { decoded: decodeBase64ToString(rawBody) };
  }
  return { decoded: rawBody };
}

/**
 * Split multipart body by boundary.
 * @param {string} body
 * @param {string} boundary
 * @returns {string[]}
 */
function splitByBoundary(body, boundary) {
  if (!boundary) return [body];
  const delim = '--' + boundary;
  const parts = body.split(new RegExp('\\r?\\n' + delim.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  const result = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].replace(/^\r?\n/, '').replace(/\r?\n--\r?\n?$/, '').trimEnd();
    if (part === '' || part === '--') continue;
    result.push(part);
  }
  return result;
}

/**
 * Check if part is attachment. multipart/* is never an attachment (handled by recursion).
 * If there is no filename and type is text/plain or text/html, use as message content (not attachment).
 * @param {Record<string, string>} headers
 * @param {string} contentType
 * @param {string|undefined} filename - from Content-Type name or Content-Disposition filename
 * @returns {boolean}
 */
function isAttachment(headers, contentType, filename) {
  const type = (contentType || '').toLowerCase();
  if (type.startsWith('multipart/')) return false;
  const disp = (headers['Content-Disposition'] || '').toLowerCase();
  if (disp.includes('attachment')) return true;
  const isTextOrHtml = type.startsWith('text/plain') || type.startsWith('text/html');
  if (!filename && isTextOrHtml) return false;
  if (filename) return true;
  if (isTextOrHtml) return false;
  return true;
}

/**
 * Parse a single part (headers + body), optionally treating as attachment.
 * @param {string} partRaw
 * @param {boolean} forceAttachment
 * @returns {{ headers: Record<string, string>, body: string, blob?: Blob, filename?: string, contentType?: string }}
 */
function parsePart(partRaw, forceAttachment = false) {
  const { headers: headerBlock, body: rawBody } = splitHeadersAndBody(partRaw);
  const headers = parseHeaders(headerBlock);
  const ct = headers['Content-Type'] || 'text/plain';
  const { type, name } = parseContentType(ct);
  const filename = name || (headers['Content-Disposition'] || '').match(/filename\s*=\s*["']?([^"'\s;]+)/i)?.[1];
  const wantBlob = forceAttachment || !!filename || (headers['Content-Disposition'] || '').toLowerCase().includes('attachment');
  const { decoded, blob } = decodePartBody(headers, rawBody, wantBlob);
  return {
    headers,
    body: decoded,
    blob,
    filename: filename || undefined,
    contentType: type,
  };
}

/**
 * Build a single part descriptor for the UI (contentType, body/blob, filename, isAttachment).
 * text/plain or text/html without filename = message part, not attachment.
 * @param {ReturnType<parsePart>} part
 * @returns {{ contentType: string, body?: string, blob?: Blob, filename?: string, size: number, isAttachment: boolean }}
 */
function toPartDescriptor(part, partContentType, index) {
  const filename = part.filename || undefined;
  const isAtt = isAttachment(part.headers, partContentType, filename);
  const blob = part.blob || (part.body != null ? new Blob([part.body], { type: partContentType }) : null);
  const size = blob ? blob.size : 0;
  const displayFilename = filename || (isAtt ? `attachment-${index}` : undefined);
  return {
    contentType: partContentType,
    body: part.body,
    blob: blob || undefined,
    filename: displayFilename,
    size,
    isAttachment: isAtt,
  };
}

/**
 * Process a single part (raw string). If it is multipart/*, recurse into sub-parts.
 * @param {string} partRaw - raw part including headers and body
 * @param {number} attachmentCount - current number of attachments (for default attachment filename)
 * @returns {{ parts: Array, attachments: Array<{ filename?: string, contentType: string, size: number, blob: Blob }>, body?: string, bodyContentType?: string }}
 */
function processPart(partRaw, attachmentCount) {
  const { headers: headerBlock, body: rawBody } = splitHeadersAndBody(partRaw);
  const headers = parseHeaders(headerBlock);
  const ctHeader = headers['Content-Type'] || 'text/plain';
  const { type: partType, boundary: partBoundary } = parseContentType(ctHeader);

  if (partType.startsWith('multipart/') && partBoundary) {
    const subPartRaws = splitByBoundary(rawBody, partBoundary);
    const collectedParts = [];
    const collectedAttachments = [];
    let firstBody = '';
    let firstBodyContentType = '';
    let count = attachmentCount;

    for (let i = 0; i < subPartRaws.length; i++) {
      const sub = processPart(subPartRaws[i], count);
      collectedParts.push(...sub.parts);
      collectedAttachments.push(...sub.attachments);
      count += sub.attachments.length;
      if (!firstBody && (sub.body != null && sub.body !== '')) {
        firstBody = sub.body;
        firstBodyContentType = sub.bodyContentType || '';
      }
    }

    return {
      parts: collectedParts,
      attachments: collectedAttachments,
      body: firstBody || undefined,
      bodyContentType: firstBodyContentType || undefined,
    };
  }

  const part = parsePart(partRaw, false);
  const partContentType = part.contentType || 'application/octet-stream';
  const desc = toPartDescriptor(part, partContentType, attachmentCount);

  const attachments = [];
  if (desc.isAttachment && (part.blob || part.body)) {
    const blob = part.blob || new Blob([part.body], { type: partContentType });
    attachments.push({
      filename: part.filename || undefined,
      contentType: partContentType,
      size: blob.size,
      blob,
    });
  }

  return {
    parts: [desc],
    attachments,
    body: !desc.isAttachment ? (part.body || '') : undefined,
    bodyContentType: !desc.isAttachment ? partContentType : undefined,
  };
}

/**
 * Parse full EML and return headers, parts (all MIME parts), and attachments (with blobs).
 * @param {string} raw - raw EML string (from FileReader.readAsText)
 * @returns {{ headers: Record<string, string>, body: string, contentType: string, bodyContentType: string, parts: Array<{ contentType: string, body?: string, blob?: Blob, filename?: string, size: number, isAttachment: boolean }>, attachments: Array<{ filename: string, contentType: string, size: number, blob: Blob }> } | { error: string }}
 */
export function parseEml(raw) {
  if (!raw || typeof raw !== 'string') {
    return { error: 'Invalid or empty input' };
  }

  try {
    const { headers: headerBlock, body: rawBody } = splitHeadersAndBody(raw);
    const headers = parseHeaders(headerBlock);
    const contentTypeHeader = headers['Content-Type'] || 'text/plain';
    const { type: contentType, boundary } = parseContentType(contentTypeHeader);

    const attachments = [];
    const parts = [];
    let body = '';
    let bodyContentType = contentType;
    const encoding = (headers['Content-Transfer-Encoding'] || '7bit').toLowerCase();

    if (contentType.startsWith('multipart/') && boundary) {
      const partRaws = splitByBoundary(rawBody, boundary);
      let attachmentCount = 0;

      for (let i = 0; i < partRaws.length; i++) {
        const result = processPart(partRaws[i], attachmentCount);
        attachmentCount += result.attachments.length;

        for (const p of result.parts) {
          parts.push(p);
        }
        for (const att of result.attachments) {
          attachments.push({
            filename: att.filename || `attachment-${attachments.length}`,
            contentType: att.contentType,
            size: att.size,
            blob: att.blob,
          });
        }

        if (!body && result.body) {
          body = result.body;
          bodyContentType = result.bodyContentType || bodyContentType;
        }
      }
    } else {
      const { decoded } = decodeBody(rawBody, encoding);
      body = decoded;
      parts.push({
        contentType,
        body: decoded,
        size: new Blob([decoded]).size,
        isAttachment: false,
      });
    }

    return {
      headers,
      body,
      contentType,
      bodyContentType,
      parts,
      attachments,
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Parse error' };
  }
}

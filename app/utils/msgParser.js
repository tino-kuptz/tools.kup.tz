/**
 * MSG (Outlook) file parser for browser.
 * Uses @npeersab/msgreader; returns same structure as parseEml for the viewer.
 */

import MsgReader from '@npeersab/msgreader';

/**
 * Parse raw headers string (e.g. from MSG) into key-value object.
 * @param {string} headerBlock
 * @returns {Record<string, string>}
 */
function parseHeadersString(headerBlock) {
  if (!headerBlock || typeof headerBlock !== 'string') return {};
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
 * Build headers object from MSG getFileData() and optional raw headers string.
 * @param { { senderName?: string, senderEmail?: string, subject?: string, recipients?: Array<{ name?: string, email?: string }> } } data
 * @returns {Record<string, string>}
 */
function buildHeaders(data, parsedHeaders) {
  const headers = { ...parsedHeaders };
  if (data.senderName && !headers.From) {
    headers.From = data.senderEmail ? `${data.senderName} <${data.senderEmail}>` : data.senderName;
  } else if (data.senderEmail && !headers.From) {
    headers.From = data.senderEmail;
  }
  if (data.subject != null && data.subject !== '' && !headers.Subject) {
    headers.Subject = data.subject;
  }
  if (data.recipients && data.recipients.length && !headers.To) {
    const to = data.recipients.map((r) => r.email || r.name || '').filter(Boolean).join(', ');
    if (to) headers.To = to;
  }
  return headers;
}

/**
 * Parse MSG file (ArrayBuffer) and return same structure as parseEml for the viewer.
 * @param {ArrayBuffer} arrayBuffer - raw MSG file (from FileReader.readAsArrayBuffer)
 * @returns {{ headers: Record<string, string>, body: string, bodyContentType: string, parts: Array<{ contentType: string, body?: string, blob?: Blob, filename?: string, size: number, isAttachment: boolean }>, attachments: Array<{ filename: string, contentType: string, size: number, blob: Blob }> } | { error: string }}
 */
export function parseMsg(arrayBuffer) {
  if (!arrayBuffer || !(arrayBuffer instanceof ArrayBuffer)) {
    return { error: 'Invalid or empty input' };
  }

  try {
    const reader = new MsgReader(arrayBuffer);
    const data = reader.getFileData();

    if (!data) {
      return { error: 'Could not read MSG file' };
    }

    const parsedHeaders = parseHeadersString(data.headers || '');
    const headers = buildHeaders(data, parsedHeaders);

    const body = (data.body != null ? String(data.body) : '').trim();
    const bodyContentType = body.startsWith('<') ? 'text/html' : 'text/plain';

    const parts = [];
    if (body !== '') {
      parts.push({
        contentType: bodyContentType,
        body,
        size: new Blob([body]).size,
        isAttachment: false,
      });
    }

    const attachments = [];
    const attachmentList = data.attachments || [];
    for (let i = 0; i < attachmentList.length; i++) {
      const att = attachmentList[i];
      try {
        const { fileName, content } = reader.getAttachment(att);
        const blob = new Blob([content], { type: 'application/octet-stream' });
        const filename = fileName || att.fileNameShort || `attachment-${i}`;
        attachments.push({
          filename,
          contentType: 'application/octet-stream',
          size: blob.size,
          blob,
        });
      } catch (e) {
        // skip broken attachment
      }
    }

    return {
      headers,
      body,
      contentType: 'multipart/mixed',
      bodyContentType,
      parts,
      attachments,
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Parse error' };
  }
}

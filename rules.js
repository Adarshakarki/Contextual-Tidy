const TITLE_SUFFIXES = [
  'pinterest', 'instagram', 'youtube', 'twitter', 'x', 'facebook',
  'reddit', 'tiktok', 'google', 'wikipedia', 'linkedin', 'tumblr',
  'flickr', 'unsplash', 'pexels', 'shutterstock', 'getty images',
];

export function applyRules(context) {
  const { originalName, url, pageTitle, mimeType, contentDisposition } = context;

  // 1. Setup extension & base name
  const ext = getExtension(mimeType) || getExtFromFilename(originalName) || '';
  const cleanOriginal = stripExtension(originalName);

  // 2. Content-Disposition is the most reliable signal — try it first
  if (contentDisposition) {
    const cdName = parseContentDisposition(contentDisposition);
    if (cdName && !isGarbage(stripExtension(cdName))) {
      return normalizeFilename(cdName, ext);
    }
  }

  // 3. Only act if the name is actually garbage
  if (!isGarbage(cleanOriginal)) {
    return originalName;
  }

  // 4. Build a better name from available context
  const dateStr = getFormattedDate();
  const siteName = getSiteName(url);
  const cleanTitle = pageTitle ? cleanPageTitle(pageTitle, siteName) : '';

  let betterName = '';

  if (cleanTitle.length > 5) {
    betterName = `${dateStr}-${siteName ? siteName + '-' : ''}${cleanTitle}`;
  } else if (siteName.length > 2) {
    betterName = `${dateStr}-${siteName}`;
  }

  // 5. Safety check — reject suspiciously short results
  if (betterName.length < 15) {
    return originalName;
  }

  return ext ? `${betterName}.${ext}` : betterName;
}

/**
 * Clean a page title for use as a filename:
 * - Strip common site suffixes ("| Pinterest", "- YouTube", etc.)
 * - Truncate at word boundary
 * - Slugify
 */
function cleanPageTitle(title, siteName) {
  let cleaned = title;

  // Strip trailing site name patterns: "Title | Pinterest", "Title - YouTube"
  cleaned = cleaned.replace(/\s*[\|–\-—]\s*(.+)$/, (match, suffix) => {
    const suffixLower = suffix.trim().toLowerCase();
    const isSiteSuffix = TITLE_SUFFIXES.some(s => suffixLower.includes(s));
    return isSiteSuffix ? '' : match;
  });

  // Also strip if the current siteName appears at the end
  if (siteName) {
    const sitePattern = new RegExp(`\\s*[\\|–\\-—]?\\s*${siteName}\\s*$`, 'i');
    cleaned = cleaned.replace(sitePattern, '');
  }

  // Remove parenthetical quality/size tags: "(1920x1080)", "(HD)"
  cleaned = cleaned
    .replace(/\s*\(\d+x\d+\)/g, '')
    .replace(/\s*\((HD|4K|1080p|720p|Full HD)\)/gi, '');

  cleaned = cleaned.trim();

  const slug = slugify(cleaned);
  return truncateAtWord(slug, 50);
}

/**
 * Extract the meaningful site name from a URL.
 * Handles CDN subdomains like i.pinimg.com → pinterest,
 * pbs.twimg.com → twitter, etc.
 */
function getSiteName(urlStr) {
  const CDN_MAP = {
    'pinimg.com': 'pinterest',
    'twimg.com': 'twitter',
    'fbcdn.net': 'facebook',
    'cdninstagram.com': 'instagram',
    'ytimg.com': 'youtube',
    'redd.it': 'reddit',
    'redditmedia.com': 'reddit',
    'reddituploads.com': 'reddit',
    'akamaized.net': '',
    'cloudfront.net': '',
    'amazonaws.com': '',
  };

  try {
    const url = new URL(urlStr);
    const hostname = url.hostname.replace(/^www\./, '');

    for (const [cdn, name] of Object.entries(CDN_MAP)) {
      if (hostname.endsWith(cdn)) return name;
    }

    // Use the actual domain name (second-to-last segment, not TLD)
    const parts = hostname.split('.');
    const domain = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
    return domain.length > 2 ? domain : '';
  } catch {
    return '';
  }
}

function getFormattedDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function slugify(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Truncate a slug at the last hyphen before maxLen */
function truncateAtWord(slug, maxLen) {
  if (slug.length <= maxLen) return slug;
  const cut = slug.lastIndexOf('-', maxLen);
  return cut > 0 ? slug.slice(0, cut) : slug.slice(0, maxLen);
}

export function isGarbage(name) {
  if (!name || name.length === 0) return true;
  const patterns = [
    /^[0-9_-]{12,}$/,                  // 12+ digits (Facebook/Instagram timestamps)
    /^[a-f0-9]{20,}$/i,                // Long hex (S3/cloud storage)
    /^[a-zA-Z0-9]{25,}$/,              // Very long random alphanum
    /^[a-zA-Z0-9_-]{8,}-[a-zA-Z0-9_-]{4,}-[a-zA-Z0-9_-]{4,}/i, // UUID-like
    /^(img|dsc|image|photo)_?\d+$/i,   // Camera defaults: IMG_001, DSC_1234
    /^\d{3,4}x(\d{3,4})?$/,            // Pinterest size strings: "736x", "736x490"
    /^[a-f0-9]{6,}-[a-f0-9]{6,}$/i,   // Hash-dash-hash patterns
  ];
  return patterns.some(p => p.test(name));
}

export function getExtension(mimeType) {
  const mimeMap = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/svg+xml': 'svg',
    'image/avif': 'avif',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/ogg': 'ogg',
    'application/pdf': 'pdf',
    'application/zip': 'zip',
    'application/gzip': 'gz',
    'application/json': 'json',
    'application/xml': 'xml',
    'text/plain': 'txt',
    'text/csv': 'csv',
    'text/html': 'html',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'application/msword': 'doc',
    'application/vnd.ms-excel': 'xls',
  };
  return mimeType ? (mimeMap[mimeType] || '') : '';
}

// ─── Internal Helpers ─────────────────────────────────────────────────────────
function getExtFromFilename(name) {
  if (!name || !name.includes('.')) return '';
  const ext = name.split('.').pop().toLowerCase();
  return ext.length <= 5 ? ext : '';
}

function stripExtension(name) {
  if (!name) return '';
  const lastDot = name.lastIndexOf('.');
  return lastDot > 0 ? name.slice(0, lastDot) : name;
}

function normalizeFilename(name, fallbackExt) {
  const existingExt = getExtFromFilename(name);
  const base = stripExtension(name);
  const ext = existingExt || fallbackExt;
  return ext ? `${slugify(base)}.${ext}` : slugify(base);
}

function parseContentDisposition(header) {
  // RFC 5987: filename*=UTF-8''encoded-name.pdf
  const rfcMatch = header.match(/filename\*\s*=\s*(?:[^']*'[^']*'|UTF-8'')([^;]+)/i);
  if (rfcMatch) {
    try { return decodeURIComponent(rfcMatch[1].trim()); } catch {}
  }
  // Quoted: filename="name.pdf"
  const quotedMatch = header.match(/filename\s*=\s*"([^"]+)"/i);
  if (quotedMatch) return quotedMatch[1].trim();
  // Bare: filename=name.pdf
  const bareMatch = header.match(/filename\s*=\s*([^;]+)/i);
  if (bareMatch) return bareMatch[1].trim();
  return null;
}
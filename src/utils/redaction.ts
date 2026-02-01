// Redaction patterns for PHI (Protected Health Information)
const PATTERNS = {
  // Names - common name patterns (titles followed by capitalized words)
  names: /\b(Mr\.|Mrs\.|Ms\.|Dr\.|Prof\.)\s+[A-Z][a-z]+(\s+[A-Z][a-z]+)?|\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g,

  // Dates - various formats
  dates: /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}|(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s*\d{4}|\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})\b/gi,

  // IDs - SSN, MRN, patient IDs
  ids: /\b(\d{3}[-\s]?\d{2}[-\s]?\d{4}|MRN[:\s]?\d+|ID[:\s]?\d+|Patient\s*#?\s*\d+|Case\s*#?\s*\d+)\b/gi,

  // Phone numbers
  phones: /\b(\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})\b/g,

  // Email addresses
  emails: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,

  // Addresses - basic pattern
  addresses: /\b\d+\s+[A-Z][a-z]+(\s+[A-Z]?[a-z]+)*(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct)\b\.?/gi,
};

export interface RedactionResult {
  redactedText: string;
  redactionCount: {
    names: number;
    dates: number;
    ids: number;
    phones: number;
    emails: number;
    addresses: number;
    total: number;
  };
}

export const redactText = (text: string): RedactionResult => {
  let redactedText = text;
  const counts = {
    names: 0,
    dates: 0,
    ids: 0,
    phones: 0,
    emails: 0,
    addresses: 0,
    total: 0,
  };

  // Redact emails first (to avoid partial matches)
  redactedText = redactedText.replace(PATTERNS.emails, () => {
    counts.emails++;
    return '[EMAIL]';
  });

  // Redact IDs
  redactedText = redactedText.replace(PATTERNS.ids, () => {
    counts.ids++;
    return '[ID]';
  });

  // Redact phone numbers
  redactedText = redactedText.replace(PATTERNS.phones, () => {
    counts.phones++;
    return '[PHONE]';
  });

  // Redact dates
  redactedText = redactedText.replace(PATTERNS.dates, () => {
    counts.dates++;
    return '[DATE]';
  });

  // Redact addresses
  redactedText = redactedText.replace(PATTERNS.addresses, () => {
    counts.addresses++;
    return '[ADDRESS]';
  });

  // Redact names last (most likely to have false positives)
  redactedText = redactedText.replace(PATTERNS.names, () => {
    counts.names++;
    return '[NAME]';
  });

  counts.total =
    counts.names + counts.dates + counts.ids + counts.phones + counts.emails + counts.addresses;

  return { redactedText, redactionCount: counts };
};

// Sanitize text specifically for AI usage
export function sanitizeForAI(text: string): string {
  const { redactedText } = redactText(text);
  return redactedText;
}

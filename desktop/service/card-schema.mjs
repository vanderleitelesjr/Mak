// Shared by the desktop editor and service. Content is data, never executable HTML.
export const CARD_FORMAT = 'mrmak-card';
export const CARD_VERSION = 1;
export const CARD_MAX_BYTES = 1024 * 1024;
export const CARD_MAX_ITEMS = 200;
export const cardTemplates = ['gallery', 'research'];
export const cardStatuses = ['idea', 'in-progress', 'review', 'done'];
const fail = message => { throw Object.assign(new Error(message), { status: 400 }); };
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
function keys(value, allowed, label) {
  if (!object(value) || Object.keys(value).some(key => !allowed.includes(key))) fail(`${label} has unsupported fields. Check the editable card format.`);
}
function text(value, label, max, required = false) {
  if (value === undefined && !required) return;
  if (typeof value !== 'string' || value.length > max || (required && !value.trim()) || /\u0000/.test(value)) fail(`${label} must be ${required ? 'non-empty text of ' : 'text of '}up to ${max.toLocaleString('en-US')} characters.`);
}
export function localCardPath(value) {
  return typeof value === 'string' && value.length > 0 && value.length <= 500 && !/[\\:%?#\x00-\x1f]/.test(value) && value.split('/').every(part => part && !part.startsWith('.'));
}
export function cardSourceUrl(value) {
  if (typeof value !== 'string' || value.length > 2000) return undefined;
  try {
    const url = new URL(value);
    if (['https:', 'http:'].includes(url.protocol) && !url.username && !url.password) return url.href;
  } catch { /* Incomplete source URLs are normal in a live draft. */ }
  return undefined;
}
function validate(value, draft) {
  keys(value, ['format', 'version', 'template', 'title', 'summary', 'items'], 'This card');
  if (value.format !== CARD_FORMAT || value.version !== CARD_VERSION) fail('This editable card version is not supported. Update Mr. Mak before editing it.');
  if (!cardTemplates.includes(value.template)) fail('Choose the Gallery or Research template.');
  text(value.title, 'Page title', 200, !draft);
  if (typeof value.title !== 'string') fail('Enter a page title.');
  text(value.summary, 'Introduction', 20000);
  if (!Array.isArray(value.items) || value.items.length > CARD_MAX_ITEMS) fail(`A card can contain up to ${CARD_MAX_ITEMS} entries.`);
  const ids = new Set();
  for (const item of value.items) {
    keys(item, ['id', 'title', 'body', 'image', 'alt', 'prompt', 'url', 'linkLabel', 'status'], 'An entry');
    if (typeof item.id !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(item.id) || ids.has(item.id)) fail('Every entry needs a unique ID using letters, numbers, hyphens or underscores.');
    ids.add(item.id);
    text(item.title, 'Entry title', 200, !draft);
    if (typeof item.title !== 'string') fail('Enter an entry title.');
    text(item.body, 'Entry notes', 40000); text(item.prompt, 'Prompt', 40000);
    text(item.alt, 'Image description', 500); text(item.linkLabel, 'Link label', 120);
    if (item.image !== undefined && item.image !== '' && (!localCardPath(item.image) || !/\.(png|jpe?g|gif|webp)$/i.test(item.image))) fail('Images must be PNG, JPEG, WebP or GIF files inside this card folder.');
    if (item.url !== undefined && item.url !== '') {
      text(item.url, 'Source URL', 2000);
      if (!draft && !cardSourceUrl(item.url)) fail('Use a complete http:// or https:// source URL without embedded credentials.');
    }
    if (item.status !== undefined && !cardStatuses.includes(item.status)) fail('Choose a valid entry status.');
  }
  return value;
}
export const validateCard = value => validate(value, false);
// Keep incomplete form input recoverable. Only validateCard may authorize a save.
export const validateCardDraft = value => validate(value, true);
export const cardText = document => [document.title, document.summary, ...document.items.flatMap(item => [item.title, item.body, item.prompt, item.url, item.status])].filter(Boolean).join('\n\n');

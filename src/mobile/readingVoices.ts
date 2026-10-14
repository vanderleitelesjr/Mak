export const readingVoices = [{ id: 'am_michael', label: 'Michael · US man' }, { id: 'bf_emma', label: 'Emma · UK woman' }]
export const readingVoiceKey = 'mrmak.mobile.read-aloud.voice'
export const readingVoiceChanged = 'mrmak-reading-voice-changed'
let currentVoice = 'am_michael'
export function savedReadingVoice() {
  let value = currentVoice
  try { value = localStorage.getItem(readingVoiceKey) || value } catch { /* Use the current visit's choice. */ }
  return readingVoices.some(voice => voice.id === value) ? value : 'am_michael'
}
export function saveReadingVoice(value: string) {
  if (!readingVoices.some(voice => voice.id === value)) return
  currentVoice = value; try { localStorage.setItem(readingVoiceKey, value) } catch { /* Keep the choice for this visit. */ }
}

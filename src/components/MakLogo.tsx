/** Shared emoji-style mark for Workspace, Chats and the voice controls. */
export default function MakLogo({ size = 64, tone = 'pink' }: { size?: number; animated?: boolean; tone?: 'pink' | 'black' }) {
  return <img className="mak-logo" src={tone === 'black' ? '/assets/mak-nose-chats.svg' : '/assets/mak-nose.svg'} width={size} height={size} alt="" aria-hidden="true" draggable={false} style={{ display: 'block', flexShrink: 0, objectFit: 'contain' }} />
}

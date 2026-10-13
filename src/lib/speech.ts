// Озвучка английского текста встроенным синтезатором речи (на iPhone — голоса iOS).

export const speechSupported = () => typeof window !== 'undefined' && 'speechSynthesis' in window

function pickVoice(): SpeechSynthesisVoice | undefined {
  const voices = speechSynthesis.getVoices()
  const us = voices.filter((v) => v.lang.replace('_', '-').startsWith('en-US'))
  return (
    us.find((v) => /Samantha|Google US|Aria|Jenny|Zira/i.test(v.name)) ??
    us[0] ??
    voices.find((v) => v.lang.startsWith('en'))
  )
}

export function speak(text: string) {
  if (!speechSupported()) return
  const clean = text.replace(/\*\*/g, '').replace(/…/g, '').trim()
  if (!clean) return
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(clean)
  u.lang = 'en-US'
  u.rate = 0.95
  const voice = pickVoice()
  if (voice) u.voice = voice
  speechSynthesis.speak(u)
}

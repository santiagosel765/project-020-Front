export const VOICE_PREF = ["es-gt", "es-mx", "es-us", "es-es"];

export function formatVoiceLabel(v: SpeechSynthesisVoice) {
  const name = (v.name || v.voiceURI || "").trim();
  const lang = (v.lang || "").toUpperCase();
  const region = lang.includes("-") ? lang.split("-")[1] : "";
  const simple =
    name
      .replace(/^Microsoft\s+/i, "")
      .replace(/\s*-\s*Spanish.*$/i, "")
      .split(/\s+/)[0] || name;
  return region ? `${simple} (${region})` : simple;
}

export function sortVoices(voices: SpeechSynthesisVoice[]) {
  const score = (v: SpeechSynthesisVoice) => {
    const l = (v.lang || "").toLowerCase();
    const idx = VOICE_PREF.findIndex((pref) => l.startsWith(pref));
    return idx === -1 ? VOICE_PREF.length : idx;
  };

  return [...voices]
    .filter((voice) => (voice.lang || "").toLowerCase().startsWith("es"))
    .sort((a, b) => {
      const scoreA = score(a);
      const scoreB = score(b);
      if (scoreA !== scoreB) {
        return scoreA - scoreB;
      }
      return (a.name || "").localeCompare(b.name || "");
    });
}

const STORAGE_KEY = "ttsVoiceURI";

export function loadPreferredVoice(voices: SpeechSynthesisVoice[]) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return voices.find((voice) => voice.voiceURI === stored || voice.name === stored) || null;
  } catch (error) {
    return null;
  }
}

export function savePreferredVoice(voice: SpeechSynthesisVoice | null) {
  try {
    const identifier = voice ? voice.voiceURI || voice.name || "" : "";
    if (identifier) {
      localStorage.setItem(STORAGE_KEY, identifier);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (error) {
    // no-op
  }
}

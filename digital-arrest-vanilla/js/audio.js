// Audio playback with graceful fallback. No generated human voice
// recordings ship with this build (this environment cannot synthesize
// natural speech) — every dialogue line is always shown as an on-screen
// caption too, so the game is never silent of *content*. If a real .mp3
// exists at the expected path it plays; if it's missing or playback fails
// for any reason, it fails silently and gameplay continues on captions
// alone. See audio/README.md for exact expected filenames.

let currentAudio = null;
let audioCtx = null;

function pathFor(role, clipId) {
  return `audio/${role}/${clipId}.mp3`;
}

export function playLine(role, clipId) {
  try {
    if (currentAudio) currentAudio.pause();
    const audio = new Audio(pathFor(role, clipId));
    audio.preload = "auto";
    audio.volume = 0.9;
    currentAudio = audio;
    audio.play().catch(() => {
      /* missing file / autoplay block — captions already carry the content */
    });
  } catch {
    /* no-op */
  }
}

export function stopAudio() {
  if (currentAudio) currentAudio.pause();
}

/** Short synthesized UI blip (WebAudio, not a voice) for click/success/warning/ring feedback. */
export function blip(kind) {
  try {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      audioCtx = new Ctx();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const freq = kind === "success" ? 880 : kind === "warning" ? 220 : kind === "ring" ? 660 : 440;
    osc.frequency.value = freq;
    osc.type = kind === "warning" ? "sawtooth" : "sine";
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  } catch {
    /* no-op */
  }
}

/**
 * Soft chime for new in-app notifications (Web Audio — no asset file).
 * Browsers block Audio until a user gesture — we unlock on first click/keydown.
 */

let sharedCtx: AudioContext | null = null;
let unlockBound = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!sharedCtx || sharedCtx.state === "closed") {
      sharedCtx = new AudioCtx();
    }
    return sharedCtx;
  } catch {
    return null;
  }
}

/** Call once from the app shell so later notifications can play sound. */
export function unlockNotificationSound(): void {
  if (typeof window === "undefined" || unlockBound) return;
  unlockBound = true;

  const resume = () => {
    const ctx = getAudioContext();
    if (ctx?.state === "suspended") {
      void ctx.resume();
    }
  };

  document.addEventListener("pointerdown", resume, { once: true });
  document.addEventListener("keydown", resume, { once: true });
}

export function playNotificationSound() {
  if (typeof window === "undefined") return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const run = () => {
      const now = ctx.currentTime;

      const beep = (freq: number, start: number, dur: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, now + start);
        gain.gain.exponentialRampToValueAtTime(0.1, now + start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + start);
        osc.stop(now + start + dur + 0.02);
      };

      beep(880, 0, 0.12);
      beep(1174, 0.12, 0.18);
    };

    if (ctx.state === "suspended") {
      void ctx.resume().then(run).catch(() => {});
      return;
    }
    run();
  } catch {
    // Autoplay / unsupported — ignore.
  }
}

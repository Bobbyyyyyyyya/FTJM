// Web Audio API Synthesizers for Telephone Call Audio Micro-interactions
// Guaranteed to produce crisp, lag-free audio feedback without relying on external network mp3 fetches

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioContextClass();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

/**
 * Plays an authentic telephone receiver hangup sound:
 * 1. Mechanical clunk of the handset hitting the cradle
 * 2. High-frequency latch snap click
 * 3. Two short European/standard 425Hz telecom disconnect tones
 */
export function playTelephoneHangupSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // 1. Handset impact thud / clunk (140Hz -> 35Hz drop)
    const clunkOsc = ctx.createOscillator();
    const clunkGain = ctx.createGain();
    clunkOsc.type = 'triangle';
    clunkOsc.frequency.setValueAtTime(140, now);
    clunkOsc.frequency.exponentialRampToValueAtTime(32, now + 0.08);

    clunkGain.gain.setValueAtTime(0.45, now);
    clunkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    clunkOsc.connect(clunkGain);
    clunkGain.connect(ctx.destination);

    clunkOsc.start(now);
    clunkOsc.stop(now + 0.1);

    // 2. Crisp mechanical switch/latch snap (820Hz -> 90Hz)
    const snapOsc = ctx.createOscillator();
    const snapGain = ctx.createGain();
    snapOsc.type = 'sine';
    snapOsc.frequency.setValueAtTime(820, now + 0.02);
    snapOsc.frequency.exponentialRampToValueAtTime(90, now + 0.07);

    snapGain.gain.setValueAtTime(0.3, now + 0.02);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    snapOsc.connect(snapGain);
    snapGain.connect(ctx.destination);

    snapOsc.start(now + 0.02);
    snapOsc.stop(now + 0.09);

    // 3. Telecom Disconnect Cadence (Tone 1: 425Hz at +140ms)
    const tone1Osc = ctx.createOscillator();
    const tone1Gain = ctx.createGain();
    tone1Osc.type = 'sine';
    tone1Osc.frequency.setValueAtTime(425, now + 0.13);

    tone1Gain.gain.setValueAtTime(0.14, now + 0.13);
    tone1Gain.gain.linearRampToValueAtTime(0.14, now + 0.28);
    tone1Gain.gain.linearRampToValueAtTime(0.001, now + 0.31);

    tone1Osc.connect(tone1Gain);
    tone1Gain.connect(ctx.destination);

    tone1Osc.start(now + 0.13);
    tone1Osc.stop(now + 0.32);

    // 4. Telecom Disconnect Cadence (Tone 2: 425Hz at +420ms)
    const tone2Osc = ctx.createOscillator();
    const tone2Gain = ctx.createGain();
    tone2Osc.type = 'sine';
    tone2Osc.frequency.setValueAtTime(425, now + 0.42);

    tone2Gain.gain.setValueAtTime(0.14, now + 0.42);
    tone2Gain.gain.linearRampToValueAtTime(0.14, now + 0.57);
    tone2Gain.gain.linearRampToValueAtTime(0.001, now + 0.60);

    tone2Osc.connect(tone2Gain);
    tone2Gain.connect(ctx.destination);

    tone2Osc.start(now + 0.42);
    tone2Osc.stop(now + 0.61);
  } catch (err) {
    console.warn('[callSounds] Web Audio hangup sound error:', err);
  }
}

import { useEffect, useRef, useState } from "react";

export default function MusicPlayer() {
  const [playing, setPlaying] = useState(false);
  const nodesRef = useRef(null);

  const start = () => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();

    // Two seconds of soft "brown" noise, which sounds like distant waves
    const length = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    // Keep only the low, soft frequencies
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 500;

    // Master volume: starts silent and fades in gently
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, ctx.currentTime);
    master.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 4);

    // A very slow swell, about one wave every 9 seconds
    const swell = ctx.createGain();
    swell.gain.value = 0.5;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.11;
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = 0.4;
    lfo.connect(lfoDepth);
    lfoDepth.connect(swell.gain);

    noise.connect(filter);
    filter.connect(swell);
    swell.connect(master);
    master.connect(ctx.destination);

    noise.start();
    lfo.start();

    nodesRef.current = { ctx, noise, lfo, master };
  };

  const stop = () => {
    const n = nodesRef.current;
    if (!n) return;
    n.master.gain.exponentialRampToValueAtTime(0.0001, n.ctx.currentTime + 1.5);
    setTimeout(() => {
      n.noise.stop();
      n.lfo.stop();
      n.ctx.close();
    }, 1600);
    nodesRef.current = null;
  };

  const toggle = () => {
    if (playing) {
      stop();
      setPlaying(false);
    } else {
      start();
      setPlaying(true);
    }
  };

  useEffect(() => {
    return () => {
      const n = nodesRef.current;
      if (n) n.ctx.close();
    };
  }, []);

  return (
    <button type="button" className="relax-fab" onClick={toggle}>
      {playing ? "Pause ocean sound" : "Play ocean sound"}
    </button>
  );
}
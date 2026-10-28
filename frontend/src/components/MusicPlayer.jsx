import { useEffect, useRef, useState } from "react";

// Gentle C major pentatonic melody, about 66 beats per minute
const SCALE = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33];
const PATTERN = [0, 2, 4, 2, 5, 4, 2, 1, 0, 3, 4, 6, 4, 2, 1, 0];
const BEAT = 60 / 66;

export default function MusicPlayer() {
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");
  const ref = useRef(null);

  const start = () => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      setError("Sound is not supported in this browser.");
      return false;
    }
    const ctx = new AudioCtx();

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, ctx.currentTime);
    master.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 2);
    master.connect(ctx.destination);

    // Soft echo
    const delay = ctx.createDelay(2);
    delay.delayTime.value = BEAT * 0.75;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.35;
    delay.connect(feedback);
    feedback.connect(delay);
    const echoOut = ctx.createGain();
    echoOut.gain.value = 0.3;
    delay.connect(echoOut);
    echoOut.connect(master);

    const playNote = (freq, time, dur, vol) => {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      env.gain.setValueAtTime(0.0001, time);
      env.gain.exponentialRampToValueAtTime(vol, time + 0.06);
      env.gain.exponentialRampToValueAtTime(0.0001, time + dur);
      osc.connect(env);
      env.connect(master);
      env.connect(delay);
      osc.start(time);
      osc.stop(time + dur + 0.05);
    };

    let step = 0;
    let nextTime = ctx.currentTime + 0.3;
    const timer = setInterval(() => {
      while (nextTime < ctx.currentTime + 0.8) {
        const idx = PATTERN[step % PATTERN.length];
        playNote(SCALE[idx], nextTime, BEAT * 1.6, 0.5);
        if (step % 4 === 0) playNote(SCALE[0] / 2, nextTime, BEAT * 3.5, 0.25);
        nextTime += BEAT;
        step += 1;
      }
    }, 150);

    ref.current = { ctx, master, timer };
    return true;
  };

  const stop = () => {
    const r = ref.current;
    if (!r) return;
    clearInterval(r.timer);
    r.master.gain.exponentialRampToValueAtTime(0.0001, r.ctx.currentTime + 1);
    setTimeout(() => r.ctx.close(), 1200);
    ref.current = null;
  };

  const toggle = () => {
    setError("");
    if (playing) {
      stop();
      setPlaying(false);
    } else {
      try {
        if (start()) setPlaying(true);
      } catch {
        setError("The sound could not start. Click the button again.");
      }
    }
  };

  useEffect(() => {
    return () => {
      const r = ref.current;
      if (r) {
        clearInterval(r.timer);
        r.ctx.close();
      }
    };
  }, []);

  return (
    <>
      <button type="button" className="relax-fab" onClick={toggle}>
        {playing ? "❚❚ Pause melody" : "♪ Play calm melody"}
      </button>
      {error && <div className="alert error sound-error">{error}</div>}
    </>
  );
}
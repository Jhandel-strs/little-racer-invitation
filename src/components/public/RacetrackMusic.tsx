import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Music2, Volume2, VolumeX } from 'lucide-react';

export interface RacetrackMusicHandle {
  start: () => void;
}

type AudioEngine = {
  context: AudioContext;
  output: GainNode;
};

const chordNotes = [
  [293.66, 369.99, 440],
  [196, 246.94, 293.66],
  [246.94, 293.66, 369.99],
  [220, 277.18, 329.63],
];
const bassNotes = [73.42, 98, 123.47, 110];
const tempo = 104;
const stepLength = 60 / tempo / 2;

const playTone = (
  engine: AudioEngine,
  frequency: number,
  startAt: number,
  duration: number,
  level: number,
  type: OscillatorType = 'sine',
) => {
  const oscillator = engine.context.createOscillator();
  const envelope = engine.context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startAt);
  envelope.gain.setValueAtTime(0.0001, startAt);
  envelope.gain.exponentialRampToValueAtTime(level, startAt + 0.02);
  envelope.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  oscillator.connect(envelope);
  envelope.connect(engine.output);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.02);
};

const scheduleStep = (engine: AudioEngine, step: number, startAt: number) => {
  const stepInBar = step % 16;
  const bar = Math.floor(step / 16) % chordNotes.length;

  if (stepInBar === 0 || stepInBar === 8) {
    playTone(engine, bassNotes[bar], startAt, 0.24, 0.3);
    playTone(engine, 82, startAt, 0.12, 0.12);
  } else if (stepInBar === 4 || stepInBar === 12) {
    playTone(engine, bassNotes[bar], startAt, 0.2, 0.2);
  }

  if (stepInBar === 0) {
    chordNotes[bar].forEach((note) => playTone(engine, note, startAt, 1.65, 0.035));
  }

  if (stepInBar === 2 || stepInBar === 6 || stepInBar === 10 || stepInBar === 14) {
    const noteIndex = Math.floor(stepInBar / 2) % 3;
    playTone(engine, chordNotes[bar][noteIndex] * 2, startAt, 0.16, 0.1, 'triangle');
  }
};

export const RacetrackMusic = forwardRef<RacetrackMusicHandle>((_, ref) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.08);
  const [musicError, setMusicError] = useState<string | null>(null);
  const engineRef = useRef<AudioEngine | null>(null);
  const timerRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  const stepRef = useRef(0);

  const start = useCallback(() => {
    if (runningRef.current || musicError) return;

    try {
      let engine = engineRef.current;
      if (!engine) {
        const AudioContextConstructor = window.AudioContext;
        if (!AudioContextConstructor) {
          setMusicError('Audio playback is not supported in this browser.');
          return;
        }
        const context = new AudioContextConstructor();
        const output = context.createGain();
        output.gain.value = volume;
        output.connect(context.destination);
        engine = { context, output };
        engineRef.current = engine;
      }

      runningRef.current = true;
      engine.output.gain.setValueAtTime(volume, engine.context.currentTime);
      engine.context.resume().then(() => {
        if (!runningRef.current) return;
        let nextStepAt = engine.context.currentTime + 0.04;
        timerRef.current = window.setInterval(() => {
          while (nextStepAt < engine.context.currentTime + 0.12) {
            scheduleStep(engine, stepRef.current, nextStepAt);
            stepRef.current += 1;
            nextStepAt += stepLength;
          }
        }, 40);
        setIsPlaying(true);
      }).catch(() => {
        runningRef.current = false;
        setMusicError('Could not start background music. Please try again.');
      });
    } catch {
      runningRef.current = false;
      setMusicError('Could not start background music. Please try again.');
    }
  }, [musicError, volume]);

  const stop = () => {
    runningRef.current = false;
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const engine = engineRef.current;
    if (engine) {
      engine.output.gain.setValueAtTime(0, engine.context.currentTime);
      void engine.context.suspend();
    }
    setIsPlaying(false);
  };

  const togglePlayback = () => {
    if (isPlaying) {
      stop();
    } else {
      start();
    }
  };

  useImperativeHandle(ref, () => ({ start }), [start]);

  useEffect(() => () => {
    runningRef.current = false;
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    if (engineRef.current) void engineRef.current.context.close();
  }, []);

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextVolume = Number(event.target.value) / 500;
    setVolume(nextVolume);
    const engine = engineRef.current;
    if (engine) engine.output.gain.setValueAtTime(nextVolume, engine.context.currentTime);
  };

  return (
    <div className="fixed right-3 top-[calc(0.75rem+env(safe-area-inset-top))] z-40 flex items-center gap-2 rounded-full border border-white/15 bg-slate-950/85 px-3 py-2 text-white shadow-lg backdrop-blur-md">
      <button
        type="button"
        onClick={togglePlayback}
        disabled={Boolean(musicError)}
        aria-label={musicError ? 'Background music unavailable' : `${isPlaying ? 'Pause' : 'Play'} race-day background music`}
        title={musicError || `${isPlaying ? 'Pause' : 'Play'} quiet race-day instrumental`}
        className="inline-flex items-center gap-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPlaying ? <Volume2 className="h-4 w-4 text-amber-300" /> : <Music2 className="h-4 w-4 text-rose-300" />}
        <span>{musicError ? 'Music unavailable' : isPlaying ? 'Music on' : 'Race music'}</span>
      </button>
      {isPlaying && (
        <label className="flex items-center gap-1.5" title="Background music volume">
          <VolumeX className="h-3.5 w-3.5 text-slate-400" />
          <input
            type="range"
            min="0"
            max="100"
            value={volume * 500}
            onChange={handleVolumeChange}
            aria-label="Background music volume"
            className="h-1 w-14 accent-rose-400"
          />
        </label>
      )}
    </div>
  );
});

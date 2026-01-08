// ScheduledRadio.tsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';

const RADIO_URL = 'https://stream.nowyswiat.online/mp3';

interface ScheduleTimes {
  start: string;
  stop: string;
}

const SCHEDULE_KEY = 'radioSchedule';

const ScheduledRadio: React.FC = () => {
  const [scheduleTimes, setScheduleTimes] = useState<ScheduleTimes>({ start: '07:00', stop: '08:00' });
  const playerRef = useRef<AudioPlayer>(null);
  const timeoutIdsRef = useRef<number[]>([]);

  // Ładuj z localStorage
  useEffect(() => {
    const saved = localStorage.getItem(SCHEDULE_KEY);
    if (saved) {
      setScheduleTimes(JSON.parse(saved));
    }
  }, []);

  // Zapisuj do localStorage
  useEffect(() => {
    localStorage.setItem(SCHEDULE_KEY, JSON.stringify(scheduleTimes));
  }, [scheduleTimes]);

  const parseTimeToDate = useCallback((timeStr: string): Date => {
    const [h, m] = timeStr.split(':').map(Number);
    const now = new Date();
    const target = new Date();
    target.setHours(h, m, 0, 0);
    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }
    return target;
  }, []);

  const clearTimeouts = useCallback(() => {
    timeoutIdsRef.current.forEach(id => window.clearTimeout(id));
    timeoutIdsRef.current = [];
  }, []);

  // POPRAWIONE: bezpieczny dostęp do audio elementu
  const playRadio = useCallback(() => {
    const audioEl = playerRef.current?.audio.current;
    if (audioEl && typeof audioEl.play === 'function') {
      audioEl.play().catch((e: Error) => {
        console.error('Nie można uruchomić radia (autoplay blokada?):', e);
      });
    } else {
      console.error('Element audio nie jest dostępny');
    }
  }, []);

  const pauseRadio = useCallback(() => {
    const audioEl = playerRef.current?.audio.current;
    if (audioEl && typeof audioEl.pause === 'function') {
      audioEl.pause();
    }
  }, []);

  const scheduleRadio = useCallback(() => {
    clearTimeouts();

    const now = new Date();
    const startDate = parseTimeToDate(scheduleTimes.start);
    const stopDate = parseTimeToDate(scheduleTimes.stop);

    const msToStart = startDate.getTime() - now.getTime();
    const msToStop = stopDate.getTime() - now.getTime();

    console.log(`Planowanie: start za ${Math.round(msToStart/1000/60)}min, stop za ${Math.round(msToStop/1000/60)}min`);

    if (msToStart > 0) {
      const id = window.setTimeout(() => {
        playRadio();
      }, msToStart) as number;
      timeoutIdsRef.current.push(id);
    }

    if (msToStop > 0 && msToStop > msToStart) {
      const id = window.setTimeout(() => {
        pauseRadio();
      }, msToStop) as number;
      timeoutIdsRef.current.push(id);
    }
  }, [scheduleTimes, parseTimeToDate, clearTimeouts, playRadio, pauseRadio]);

  useEffect(() => {
    scheduleRadio();
  }, [scheduleRadio]);

  useEffect(() => {
    return () => clearTimeouts();
  }, [clearTimeouts]);

  return (
    <div style={{ maxWidth: '400px' }}>
      <h3>Radio Nowy Świat</h3>
      
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block' }}>
          Włączenie:
          <input
            type="time"
            value={scheduleTimes.start}
            onChange={(e) => setScheduleTimes({ ...scheduleTimes, start: e.target.value })}
            style={{ marginLeft: '0.5rem', marginTop: '0.25rem' }}
          />
        </label>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block' }}>
          Wyłączenie:
          <input
            type="time"
            value={scheduleTimes.stop}
            onChange={(e) => setScheduleTimes({ ...scheduleTimes, stop: e.target.value })}
            style={{ marginLeft: '0.5rem', marginTop: '0.25rem' }}
          />
        </label>
      </div>

      <button onClick={scheduleRadio} style={{ marginBottom: '1rem', padding: '0.5rem 1rem' }}>
        Zaplanuj odtwarzanie
      </button>

      {/* Dodatkowe przyciski testowe */}
      <div style={{ marginBottom: '1rem' }}>
        <button onClick={playRadio} style={{ marginRight: '0.5rem' }}>Test: Włącz</button>
        <button onClick={pauseRadio}>Test: Wyłącz</button>
      </div>

      <AudioPlayer
        ref={playerRef}
        src={RADIO_URL}
        autoPlayAfterSrcChange={false}
        showJumpControls={false}
        customAdditionalControls={[]}
        layout="horizontal-reverse"
        hasDefaultKeybindings={true}
        onPlay={() => console.log('Radio włączone (ręcznie lub timer)')}
        onPause={() => console.log('Radio wyłączone')}
        onError={(e) => console.error('Błąd odtwarzania:', e)}
        preload="metadata"
      />
    </div>
  );
};

export default ScheduledRadio;

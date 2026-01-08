// ScheduledRadio.tsx
import React, { useEffect, useState, useRef, useCallback } from 'react';

const RADIO_URL = 'https://stream.rcs.revma.com/4md4m0a0fs8uv';

interface ScheduleTimes {
  start: string;
  stop: string;
}

const SCHEDULE_KEY = 'radioSchedule';

const ScheduledRadio: React.FC = () => {
  const [scheduleTimes, setScheduleTimes] = useState<ScheduleTimes>({ start: '07:00', stop: '08:00' });
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
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

  const playRadio = useCallback(async () => {
    const audio = audioRef.current;
    if (audio) {
      try {
        await audio.play();
        setIsPlaying(true);
        console.log('Radio włączone');
      } catch (e) {
        console.error('Nie można włączyć radia:', e);
        setIsPlaying(false);
      }
    }
  }, []);

  const pauseRadio = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      setIsPlaying(false);
      console.log('Radio wyłączone');
    }
  }, []);

  const scheduleRadio = useCallback(() => {
    clearTimeouts();

    const now = new Date();
    const startDate = parseTimeToDate(scheduleTimes.start);
    const stopDate = parseTimeToDate(scheduleTimes.stop);

    const msToStart = startDate.getTime() - now.getTime();
    const msToStop = stopDate.getTime() - now.getTime();

    console.log(`Planowanie: start ${scheduleTimes.start} (za ${Math.round(msToStart/60000)}min), stop ${scheduleTimes.stop} (za ${Math.round(msToStop/60000)}min)`);

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

  // Obsługa zdarzeń audio
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.addEventListener('play', () => setIsPlaying(true));
      audio.addEventListener('pause', () => setIsPlaying(false));
      audio.addEventListener('ended', () => setIsPlaying(false));
      return () => {
        audio.removeEventListener('play', () => setIsPlaying(true));
        audio.removeEventListener('pause', () => setIsPlaying(false));
        audio.removeEventListener('ended', () => setIsPlaying(false));
      };
    }
  }, []);

  useEffect(() => {
    scheduleRadio();
  }, [scheduleRadio]);

  useEffect(() => {
    return () => clearTimeouts();
  }, [clearTimeouts]);

  return (
    <div style={{ maxWidth: '400px', padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h3>📻 Radio Nowy Świat</h3>
      
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontWeight: 'bold' }}>
          🕐 Włączenie:
          <input
            type="time"
            value={scheduleTimes.start}
            onChange={(e) => setScheduleTimes({ ...scheduleTimes, start: e.target.value })}
            style={{ 
              marginLeft: '0.5rem', 
              marginTop: '0.25rem',
              width: '120px',
              padding: '0.25rem'
            }}
          />
        </label>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontWeight: 'bold' }}>
          🛑 Wyłączenie:
          <input
            type="time"
            value={scheduleTimes.stop}
            onChange={(e) => setScheduleTimes({ ...scheduleTimes, stop: e.target.value })}
            style={{ 
              marginLeft: '0.5rem', 
              marginTop: '0.25rem',
              width: '120px',
              padding: '0.25rem'
            }}
          />
        </label>
      </div>

      <button 
        onClick={scheduleRadio} 
        style={{ 
          marginBottom: '1rem', 
          padding: '0.75rem 1.5rem', 
          background: '#007bff', 
          color: 'white', 
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        📅 Zaplanuj odtwarzanie
      </button>

      {/* Przyciski testowe */}
      <div style={{ marginBottom: '1rem' }}>
        <button 
          onClick={playRadio} 
          disabled={isPlaying}
          style={{ 
            marginRight: '0.5rem', 
            padding: '0.5rem 1rem',
            background: isPlaying ? '#6c757d' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ▶️ {isPlaying ? 'Gra' : 'Test: Włącz'}
        </button>
        <button 
          onClick={pauseRadio} 
          disabled={!isPlaying}
          style={{ 
            padding: '0.5rem 1rem',
            background: !isPlaying ? '#6c757d' : '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ⏸️ Wyłącz
        </button>
      </div>

      {/* Status */}
      <div style={{ marginBottom: '1rem', padding: '0.5rem', background: '#f8f9fa', borderRadius: '4px' }}>
        <strong>Status:</strong> {isPlaying ? '🎵 Gra' : '⏹️ Zatrzymane'}
      </div>

      {/* Natywne audio - ukryte */}
      <audio
        ref={audioRef}
        src={RADIO_URL}
        preload="metadata"
        style={{ width: '100%', height: '40px' }}
        controls
      />
    </div>
  );
};

export default ScheduledRadio;

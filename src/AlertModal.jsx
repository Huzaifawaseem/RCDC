import React, { useState, useEffect, useRef } from 'react';
import './AlertModal.css';
import AlertTable from './AlertTable';

function formatDateToISO(date) {
  const pad = num => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const parseTime = (baseDate, hhmm, rollNextDay = false) => {
  const [hours, minutes] = hhmm.split(':').map(Number);
  const d = new Date(baseDate);
  if (rollNextDay) d.setDate(d.getDate() + 1);
  d.setHours(hours, minutes, 0, 0);
  return d;
};

export default function AlertModal({ feeders, onClose }) {
  const [alerts, setAlerts] = useState([]);
  const [visible, setVisible] = useState(false);
  const [soundPlaying, setSoundPlaying] = useState(false);

  const audioContextRef = useRef(null);
  const audioBufferRef  = useRef(null);
  const audioSourceRef  = useRef(null);

  // 1) Load & decode the alarm sound once, and resume context immediately
  useEffect(() => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    audioContextRef.current = ctx;

    // Try to resume immediately
    ctx.resume().catch(() => { /* will succeed once user interacts */ });

    fetch('/alarm.mp3')
      .then(r => r.arrayBuffer())
      .then(buf => ctx.decodeAudioData(buf))
      .then(decoded => {
        audioBufferRef.current = decoded;
      })
      .catch(err => console.error('Failed to load alarm:', err));

    // clean up on unmount
    return () => {
      stopSound();
      if (ctx.close) ctx.close();
    };
  }, []);

  const playSound = () => {
    if (!audioBufferRef.current || soundPlaying) return;
    const src = audioContextRef.current.createBufferSource();
    src.buffer = audioBufferRef.current;
    src.loop = true;
    src.connect(audioContextRef.current.destination);
    src.start(0);
    audioSourceRef.current = src;
    setSoundPlaying(true);
  };

  const stopSound = () => {
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current.disconnect();
      audioSourceRef.current = null;
    }
    setSoundPlaying(false);
  };

  // 2) Schedule alerts and trigger modal + sound
  useEffect(() => {
    const windowBefore = 6 * 60 * 1000;
    const windowAfter  = 10 * 60 * 1000;
    const now = Date.now();
    const timers = [];

    const groupAndSort = list => {
      const groups = list.reduce((acc, a) => {
        acc[a.IBC] = acc[a.IBC] || [];
        acc[a.IBC].push(a);
        return acc;
      }, {});
      return Object.keys(groups)
        .sort()
        .flatMap(ibc => {
          const grp = groups[ibc];
          const normal = grp.filter(x => !x.on_hold)
                            .sort((a, b) => a.eventTime - b.eventTime);
          const holds  = grp.filter(x => x.on_hold)
                            .sort((a, b) => a.eventTime - b.eventTime);
          return [...normal, ...holds];
        });
    };

    feeders.forEach(f => {
      const todayIso = formatDateToISO(new Date(now));
      if (f.fromDate && todayIso < f.fromDate) return;

      const events = [];
      const offDate = parseTime(now, f.offTime, false);
      if (!f.toDate || todayIso <= f.toDate) {
        events.push({ ...f, eventType: 'OFF', eventTime: offDate });
      }

      const rollOn = f.onTime > f.offTime;
      const onDate = parseTime(now, f.onTime, rollOn);
      const onIso  = formatDateToISO(onDate);
      if (!f.toDate || onIso <= f.toDate) {
        events.push({ ...f, eventType: 'ON', eventTime: onDate });
      }

      events.forEach(ev => {
        const ts     = ev.eventTime.getTime();
        const showAt = ts - windowBefore;
        const hideAt = ts + windowAfter;

        if (showAt > now) {
          timers.push(setTimeout(() => {
            setAlerts(curr => groupAndSort([...curr, ev]));
            setVisible(true);
            playSound();
          }, showAt - now));
        } else if (hideAt > now) {
          setAlerts(curr => groupAndSort([...curr, ev]));
          setVisible(true);
          playSound();
        }

        if (hideAt > now) {
          timers.push(setTimeout(() => {
            setVisible(false);
            setAlerts([]);
            stopSound();
            onClose();
          }, hideAt - now));
        }
      });
    });

    return () => timers.forEach(clearTimeout);
  }, [feeders, onClose]);

  if (!visible) return null;

  return (
    <div className="alert-overlay">
      <div className="alert-modal">
        <h3>Upcoming Feeder Alerts</h3>
        <div className="alert-modal-actions">
          <button
            className="close-btn"
            onClick={() => { setVisible(false); stopSound(); onClose(); }}
          >
            ×
          </button>
          <button
            className="stop-sound-btn"
            onClick={stopSound}
            disabled={!soundPlaying}
          >
            Stop Sound
          </button>
        </div>
        <AlertTable alerts={alerts} />
      </div>
    </div>
  );
}

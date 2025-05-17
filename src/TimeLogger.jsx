// src/TimeLogger.jsx
import React, { useEffect, useState, useRef } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from './firebase';
import AlertModal from './AlertModal';

/**
 * TimeLogger component:
 * 1. On mount, fetches feeder times once, subtracts 6 minutes, deduplicates & sorts.
 * 2. Immediately and then every 30 seconds, checks for any times within the past 16 minutes.
 * 3. Shows AlertModal with all newly matched times passed as props, toggled by showAlert.
 */
export default function TimeLogger() {
  const [timesList, setTimesList] = useState([]);
  const [showAlert, setShowAlert] = useState(false);
  const [matchedTimes, setMatchedTimes] = useState([]);
  const alertedRef = useRef(new Set()); // track which times have already triggered

  // Helper: parse "HH:MM" into total minutes
  const toMinutes = timeStr => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  // Helper: get list of times within last 16 minutes
  const findRecentMatches = () => {
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const startMin = nowMin - 16;
    const matches = [];

    timesList.forEach(timeStr => {
      const tMin = toMinutes(timeStr);
      let inWindow = startMin >= 0
        ? tMin > startMin && tMin <= nowMin
        : tMin > (1440 + startMin) || tMin <= nowMin;

      if (inWindow && !alertedRef.current.has(timeStr)) {
        matches.push(timeStr);
        alertedRef.current.add(timeStr);
      }
    });

    return matches;
  };

  // Fetch feeder times once
  useEffect(() => {
    const feedersRef = ref(db, 'feeders');
    onValue(
      feedersRef,
      snapshot => {
        const data = snapshot.val() || {};
        const times = new Set();

        Object.values(data).forEach(feeder => {
          ['onTime', 'offTime'].forEach(key => {
            const time = feeder[key];
            if (!time) return;
            const [h, m] = time.split(':').map(Number);
            const dt = new Date();
            dt.setHours(h);
            dt.setMinutes(m - 6);

            const hh = String(dt.getHours()).padStart(2, '0');
            const mm = String(dt.getMinutes()).padStart(2, '0');
            times.add(`${hh}:${mm}`);
          });
        });

        const uniqueList = Array.from(times).sort();
        setTimesList(uniqueList);
        console.log('[TimeLogger] Unique times (-6 min):', uniqueList);

        // immediate check on load
        const initialMatches = findRecentMatches();
        if (initialMatches.length) {
          setMatchedTimes(initialMatches);
          setShowAlert(true);
        }
      },
      { onlyOnce: true }
    );
  }, []);

  // Interval check every 30s
  useEffect(() => {
    if (!timesList.length) return;
    const interval = setInterval(() => {
      const newMatches = findRecentMatches();
      if (newMatches.length) {
        setMatchedTimes(prev => [...prev, ...newMatches]);
        setShowAlert(true);
      }
    }, 5_000);

    return () => clearInterval(interval);
  }, [timesList]);

  // Close handler: hide modal and reset matches
  const handleClose = () => {
    setShowAlert(false);
    setMatchedTimes([]);
  };

  // Render modal only when showAlert is true
  return (
    <>
      {showAlert && (
        <AlertModal matchedTimes={matchedTimes} onClose={handleClose} />
      )}
    </>
  );
}

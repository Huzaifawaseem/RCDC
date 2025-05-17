// src/AlertModal.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ref, onValue } from 'firebase/database';
import { db } from './firebase';
import './TimeLogger.css'; // reuse the same styles

/**
 * AlertModal component:
 * - Receives `matchedTimes` array (times minus 6 minutes) and `onClose` callback.
 * - For each matched time, adds 6 minutes to get original, then queries Firebase
 *   for feeders where onTime or offTime matches within the window.
 * - Displays results in a table, coloring rows by on_hold or IBC.
 */
export default function AlertModal({ matchedTimes, onClose }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!matchedTimes.length) return;

    const originalTimes = matchedTimes.map(timeStr => {
      const [h, m] = timeStr.split(':').map(Number);
      const dt = new Date();
      dt.setHours(h);
      dt.setMinutes(m + 6);
      const hh = String(dt.getHours()).padStart(2, '0');
      const mm = String(dt.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    });

    const feedersRef = ref(db, 'feeders');
    const unsubscribe = onValue(feedersRef, snapshot => {
      const data = snapshot.val() || {};
      const newRows = [];

      Object.values(data).forEach(feeder => {
        const { feederName, duration, type, IBC, Grid, offTime, onTime, hold_reason, on_hold } = feeder;
        originalTimes.forEach(orig => {
          if (offTime === orig) {
            newRows.push({ feederName, Event: 'OFF', duration, type, IBC, Grid, offTime, onTime, hold_reason, on_hold });
          }
          if (onTime === orig) {
            newRows.push({ feederName, Event: 'ON', duration, type, IBC, Grid, offTime, onTime, hold_reason, on_hold });
          }
        });
      });

      setRows(newRows);
    }, { onlyOnce: true });

    return () => unsubscribe();
  }, [matchedTimes]);

  if (!rows.length) return null;

  // Determine row class based on on_hold or IBC value
  const getRowClass = row => {
    if (row.on_hold) return 'hold-row';
    switch (row.IBC) {
      case 'GADAP': return 'ibc-gadap';
      case 'JOHAR 2': return 'ibc-johar2';
      case 'JOHAR 1': return 'ibc-johar1';
      default: return '';
    }
  };

  return (
    <div className="time-logger-overlay" onClick={onClose}>
      <div className="time-logger-modal" onClick={e => e.stopPropagation()}>
        <h3>Alert Details</h3>
        <table className="time-logger-table">
          <thead>
            <tr>
              <th>Feeder Name</th>
              <th>Event</th>
              <th>Duration</th>
              <th>Type</th>
              <th>IBC</th>
              <th>Grid</th>
              <th>OFF Time</th>
              <th>ON Time</th>
              <th>Hold Reason</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className={getRowClass(row)}>
                <td>{row.feederName}</td>
                <td>{row.Event}</td>
                <td>{row.duration}</td>
                <td>{row.type}</td>
                <td>{row.IBC}</td>
                <td>{row.Grid}</td>
                <td>{row.offTime}</td>
                <td>{row.onTime}</td>
                <td>{row.hold_reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={onClose} className="time-logger-close-btn">Close</button>
      </div>
    </div>
  );
}

AlertModal.propTypes = {
  matchedTimes: PropTypes.arrayOf(PropTypes.string).isRequired,
  onClose: PropTypes.func.isRequired,
};
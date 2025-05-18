// src/AlertModal.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ref as oldRef, onValue as onOldValue } from 'firebase/database';
import { db as oldDb } from './firebase';
import { ref as newRef, onValue as onNewValue } from 'firebase/database';
import { db as newDb } from './newFirebase';
import './TimeLogger.css';
import EventButton from './EventButton';

export default function AlertModal({ matchedTimes, onClose }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!matchedTimes.length) return;

    // Prepare original time strings
    const originalTimesStr = matchedTimes.map(timeStr => {
      const [h, m] = timeStr.split(':').map(Number);
      const dt = new Date();
      dt.setHours(h);
      dt.setMinutes(m + 6);
      const hh = String(dt.getHours()).padStart(2, '0');
      const mm = String(dt.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    });

    const today = new Date().toISOString().split('T')[0];

    // Subscribe live to event logs
    const logsRef = newRef(newDb, 'eventLogs');
    const unsubscribeLogs = onNewValue(logsRef, snapshotLogs => {
      const logsData = snapshotLogs.val() || {};
      const logsArr = Object.values(logsData).filter(log => log.logDate === today);

      // Once logs arrived, subscribe to feeders
      const feedersRef = oldRef(oldDb, 'feeders');
      const unsubscribeFeeders = onOldValue(feedersRef, snapshotFeed => {
        const data = snapshotFeed.val() || {};
        const now = new Date();
        const nowMin = now.getHours() * 60 + now.getMinutes();
        const startMin = nowMin - 16;

        const filteredRows = Object.values(data).flatMap(feeder => {
          const { feederName, duration, type, IBC, Grid, offTime, onTime, hold_reason, on_hold, hold_from, hold_to } = feeder;
          return originalTimesStr.reduce((acc, timeStr) => {
            ['offTime', 'onTime'].forEach(key => {
              if (feeder[key] === timeStr) {
                const eventType = key === 'offTime' ? 'OFF' : 'ON';
                const Event = on_hold ? 'Hold' : eventType;
                const matchedLog = logsArr.find(log => {
                  if (log.feederName !== feederName || log.Event !== Event) return false;
                  const [lh, lm] = log.logTime.split(':').map(Number);
                  const logMin = lh * 60 + lm;
                  return startMin >= 0
                    ? logMin >= startMin && logMin <= nowMin
                    : logMin <= nowMin;
                });
                if (!matchedLog) {
                  acc.push({ feederName, Event, duration, type, IBC, Grid, offTime, onTime, hold_reason, on_hold, hold_from, hold_to });
                }
              }
            });
            return acc;
          }, []);
        });

        setRows(filteredRows);
      });

      // cleanup feeders listener on logs change
      return () => unsubscribeFeeders();
    });

    // cleanup logs listener
    return () => unsubscribeLogs();
  }, [matchedTimes]);

  if (!rows.length) return null;

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
        <div className="table-wrapper">
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
                  <td><EventButton row={row} /></td>
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
        </div>
        <button onClick={onClose} className="time-logger-close-btn">Close</button>
      </div>
    </div>
  );
}

AlertModal.propTypes = {
  matchedTimes: PropTypes.arrayOf(PropTypes.string).isRequired,
  onClose: PropTypes.func.isRequired,
};

// src/EventButton.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { ref as newRef, push } from 'firebase/database';
import { db as newDb } from './newFirebase'; // import new Firebase instance

/**
 * EventButton:
 * - Renders a button displaying `ON`, `OFF`, or `Hold` based on `row.Event` and `row.on_hold`.
 * - Triggers onDoubleClick (for ON/OFF) or onClick (for Hold) to log to new DB.
 * - Logs feederName, Event, current time, date, offTime, onTime, duration,
 *   IBC, Grid, type, hold_reason, hold_from, hold_to.
 */
export default function EventButton({ row }) {
  const label = row.on_hold ? 'Hold' : row.Event;

  const logEvent = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const logTime = `${hh}:${mm}:${ss}`;
    const logDate = now.toISOString().split('T')[0]; // YYYY-MM-DD

    const payload = {
      feederName: row.feederName,
      Event: row.on_hold ? 'Hold' : row.Event,
      logTime,
      logDate,
      offTime: row.offTime,
      onTime: row.onTime,
      duration: row.duration,
      IBC: row.IBC,
      Grid: row.Grid,
      type: row.type,
      hold_reason: row.hold_reason,
      hold_from: row.hold_from || null,
      hold_to: row.hold_to || null,
    };

    // push to new DB under 'eventLogs'
    const logsRef = newRef(newDb, 'eventLogs');
    push(logsRef, payload)
      .then(() => console.log('Logged event:', payload))
      .catch(err => console.error('Error logging event:', err));
  };

  // Double-click for ON/OFF, single-click for Hold
  if (row.on_hold) {
    return <button onClick={logEvent}>{label}</button>;
  }
  return <button onDoubleClick={logEvent}>{label}</button>;
}

EventButton.propTypes = {
  row: PropTypes.shape({
    feederName: PropTypes.string.isRequired,
    Event: PropTypes.string.isRequired,
    offTime: PropTypes.string.isRequired,
    onTime: PropTypes.string.isRequired,
    duration: PropTypes.string,
    IBC: PropTypes.string,
    Grid: PropTypes.string,
    type: PropTypes.string,
    hold_reason: PropTypes.string,
    hold_from: PropTypes.string,
    hold_to: PropTypes.string,
    on_hold: PropTypes.bool,
  }).isRequired,
};

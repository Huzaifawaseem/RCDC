import React, { useState, useEffect } from 'react';
import KELogo from './assets/KE_LOGO.png';
import { ref, onValue } from 'firebase/database';
import { db } from './firebase';
import './LogsPage.css';

const formatDate = date => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function LogsPage({ onBack }) {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const logsRef = ref(db, 'eventLogs');
    const unsubscribe = onValue(logsRef, snapshot => {
      const data = snapshot.val() || {};
      const arr = Object.entries(data).map(([key, val]) => ({ key, ...val }));
      // sort latest by date then time descending
      arr.sort((a, b) => {
        if (a.logDate === b.logDate) {
          return b.logTime.localeCompare(a.logTime);
        }
        return b.logDate.localeCompare(a.logDate);
      });
      setLogs(arr);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="logs-container">
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="logo-title">
            <img src={KELogo} alt="KE Logo" className="navbar-logo" />
            <span className="navbar-title">RCDC LOGS</span>
          </div>
          <div className="navbar-buttons">
            <button className="back-btn" onClick={onBack}>Go Back</button>
          </div>
        </div>
      </nav>

      <div className="navbar-buttonsss">
            <button className="back-btn" onClick={onBack}>Go Back</button>
      </div>
      <table className="logs-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Feeder Name</th>
            <th>Event</th>
            <th>Log Time</th>
            <th>Log Date</th>
            <th>Remarks</th>
            <th>Off Time</th>
            <th>On Time</th>
            <th>Duration</th>
            <th>Hold Reason</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, idx) => (
            <tr key={log.key}>
              <td>{idx + 1}</td>
              <td>{log.feederName}</td>
              <td>{log.Event}</td>
              <td>{log.logTime}</td>
              <td>{log.logDate}</td>
              <td>{log.type}</td>
              <td>{log.offTime}</td>
              <td>{log.onTime}</td>
              <td>{log.duration}</td>
              <td>{log.hold_reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

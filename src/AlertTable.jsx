/* File: src/components/AlertTable.jsx */
import React from 'react';
import './AlertTable.css';

/**
 * AlertTable: renders the alerts array as a table
 */
export default function AlertTable({ alerts }) {
  return (
    <table className="alert-table">
      <thead>
        <tr>
          <th>#</th>
          <th>IBC</th>
          <th>Name</th>
          <th>Event</th>
          <th>Time</th>
          <th>Remark</th>
        </tr>
      </thead>
      <tbody>
        {alerts.map((f, i) => (
          <tr key={f.key} className={f.on_hold ? 'hold-row' : ''}>
            <td>{i + 1}</td>
            <td>{f.IBC}</td>
            <td>{f.feederName}</td>
            <td>{f.eventType}</td>
            <td>{f.eventTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
            <td>{f.on_hold ? f.hold_reason : f.type}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

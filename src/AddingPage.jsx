// ==============================
// File: src/AddingPage.jsx
// ==============================
import React, { useState } from 'react';
import { ref, push, set } from 'firebase/database';
import { db } from './firebase';
import feedersList from './feedersList.json';
import './AddingPage.css';

const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

// helper to format a Date object to "YYYY-MM-DD" in local time
const formatDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function AddingPage({ onClose }) {
  const today = new Date();
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  // initialize state with local formatted dates
  const [fromDate, setFromDate] = useState(formatDate(today));
  const [toDate, setToDate] = useState(formatDate(lastDayOfMonth));
  const [selectedFeeder, setSelectedFeeder] = useState('');
  const [offHour, setOffHour] = useState('00');
  const [offMinute, setOffMinute] = useState('00');
  const [onHour, setOnHour] = useState('00');
  const [onMinute, setOnMinute] = useState('00');
  const [otherReason, setOtherReason] = useState('');

  const formatTime = (hour, minute) => `${hour}:${minute}`;

  const calcDuration = (offH, offM, onH, onM) => {
    const offTotal = parseInt(offH, 10) * 60 + parseInt(offM, 10);
    const onTotal = parseInt(onH, 10) * 60 + parseInt(onM, 10);
    let diff = onTotal - offTotal;
    if (diff < 0) diff += 24 * 60;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h}h ${m}min`;
  };

  const handleAdd = (type) => {
    const feederObj = feedersList.find(f => f.name === selectedFeeder);
    if (!feederObj) {
      alert('Please select a valid feeder from the list');
      return;
    }

    const offTime = formatTime(offHour, offMinute);
    const onTime = formatTime(onHour, onMinute);
    const duration = calcDuration(offHour, offMinute, onHour, onMinute);
    const entryRef = push(ref(db, 'feeders'));

    set(entryRef, {
      feederName: feederObj.name,
      IBC: feederObj.ibc,
      Grid: feederObj.grid,
      fromDate,
      toDate,
      offTime,
      onTime,
      duration,
      type,
      on_hold: false,
      hold_reason: 'none'
    })
    .then(() => alert(`Entry added as "${type}"! Duration: ${duration}`))
    .catch(err => console.error(err));
  };

  const handleOther = () => {
    if (!otherReason.trim()) {
      alert('Please enter a reason');
      return;
    }
    handleAdd(otherReason);
  };

  return (
    <div className="card">
      <button className="close-x" onClick={onClose}>×</button>
      <h1 className="title">Feeder Scheduler</h1>

      <div className="date-group">
        <div className="date-field">
          <label className="label"
          style={{
            fontWeight: 'bold'
          }}>FROM</label>
          <input
            type="date"
            className="date-select"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            style={{
              border: '2px solid #000000',
              fontWeight: 'bold'
            }}
          />
        </div>
        <div className="date-field">
          <label className="label"
          style={{
            fontWeight: 'bold'
          }}>TO</label>
          <input
            type="date"
            className="date-select"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            style={{
              border: '2px solid #000000',
              fontWeight: 'bold'
            }}
          />
        </div>
      </div>

      <label className="label">Enter Feeder Name</label>
      <input
        type="text"
        className="select"
        list="feeders"
        placeholder="Start typing..."
        value={selectedFeeder}
        onChange={e => setSelectedFeeder(e.target.value)}
      />
      <datalist id="feeders">
        {feedersList.map(f => (
          <option key={f.name} value={f.name} />
        ))}
      </datalist>

      <div className="time-select-group">
        <div className="time-group">
          <label className="label">OFF Time</label>
          <div className="inline-selects">
            <select value={offHour} onChange={e => setOffHour(e.target.value)}>
              {hours.map(h => <option key={h}>{h}</option>)}
            </select>
            <span className="colon">:</span>
            <select value={offMinute} onChange={e => setOffMinute(e.target.value)}>
              {minutes.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div className="time-group">
          <label className="label">ON Time</label>
          <div className="inline-selects">
            <select value={onHour} onChange={e => setOnHour(e.target.value)}>
              {hours.map(h => <option key={h}>{h}</option>)}
            </select>
            <span className="colon">:</span>
            <select value={onMinute} onChange={e => setOnMinute(e.target.value)}>
              {minutes.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="button-groups" >
        <button className="btn btn-commercial" onClick={() => handleAdd('Commercial DC')}>ADD AS COMMERCIAL DC</button>
        <button className="btn btn-adjustment" onClick={() => handleAdd('Adjustment')}>ADD AS ADJUSTMENT</button>
        <button className="btn btn-cdo" onClick={() => handleAdd('CDO Priority')}>ADD AS CDO PRIORITY</button>
      </div>

      <label className="label">Other Reason</label>
      <input
        type="text"
        className="textarea"
        placeholder="Enter custom reason..."
        value={otherReason}
        onChange={e => setOtherReason(e.target.value)}
      />
      <button className="btn btn-other" onClick={handleOther}>ADD AS OTHER REASON</button>
    </div>
  );
}

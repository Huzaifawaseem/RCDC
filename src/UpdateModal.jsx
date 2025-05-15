// File: src/UpdateModal.jsx
import React, { useState, useEffect } from 'react';
import { ref, update, remove } from 'firebase/database';
import { db } from './firebase';
import './UpdateModal.css';

export default function UpdateModal({ feeder, onClose }) {
  const feederRef = ref(db, `feeders/${feeder.key}`);

  // state for editing DC dates
  const [editingDates, setEditingDates] = useState(false);
  const [fromDate, setFromDate] = useState(feeder.fromDate || '');
  const [toDate, setToDate] = useState(feeder.toDate || '');

  // state for hold flow
  const [selectedReason, setSelectedReason] = useState(null);
  const [durationMode, setDurationMode] = useState(false);
  const [holdFrom, setHoldFrom] = useState('');
  const [holdTo, setHoldTo] = useState('');

  // state for custom reason
  const [otherReason, setOtherReason] = useState('');

  useEffect(() => {
    setFromDate(feeder.fromDate || '');
    setToDate(feeder.toDate || '');
  }, [feeder]);

  const handleDelete = () => {
    remove(feederRef)
      .then(() => { alert('Feeder entry deleted'); onClose(); })
      .catch(err => console.error(err));
  };

  const commitHold = (from, to, reason) => {
    update(feederRef, {
      on_hold: true,
      hold_reason: reason || selectedReason,
      hold_from: from,
      hold_to: to,
    })
      .then(() => { alert(`Feeder held: ${reason || selectedReason}`); onClose(); })
      .catch(err => console.error(err));
  };

  const handleUnHold = () => {
    update(feederRef, {
      on_hold: false,
      hold_reason: 'none',
      hold_from: null,
      hold_to: null,
    })
      .then(() => { alert('Feeder unheld'); onClose(); })
      .catch(err => console.error(err));
  };

  const handleReasonClick = (reason) => {
    setSelectedReason(reason);
  };

  const handleSetDuration = () => {
    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    setHoldFrom(today);
    setHoldTo(tomorrow);
    setDurationMode(true);
  };

  const handleSaveDuration = () => {
    commitHold(holdFrom, holdTo);
  };

  const handleTillInstructions = () => {
    commitHold(null, null);
  };

  const handleOtherInitiate = () => {
    if (!otherReason.trim()) {
      alert('Please enter a reason');
      return;
    }
    setSelectedReason(otherReason.trim());
  };

  return (
    <div className="update-modal">
      <button className="close-x" onClick={onClose}>×</button>
      <h3>Update Feeder: {feeder.feederName}</h3>

      {/* DC date editing UI */}
      {editingDates && !selectedReason && (
        <div className="date-group">
          <div className="date-field">
            <label>FROM</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          </div>
          <div className="date-field">
            <label>TO</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
          </div>
          <button className="update-date-btn" onClick={() => {
            update(feederRef, { fromDate, toDate })
              .then(() => { alert(`Dates updated: FROM ${fromDate} TO ${toDate}`); setEditingDates(false); })
              .catch(err => console.error(err));
          }}>UPDATE</button>
        </div>
      )}

      {/* Main button group if not in hold flow and not editing DC dates */}
      {!editingDates && !selectedReason && (
        <div className="button-group">
          <button onClick={() => handleReasonClick('HOLD DUE TO MCF')}>HOLD DUE TO MCF</button>
          <button onClick={() => handleReasonClick('HOLD DUE TO HTLCF')}>HOLD DUE TO HTLCF</button>
          <button onClick={() => handleReasonClick('HOLD DUE TO IN OUTAGE')}>HOLD DUE TO IN OUTAGE</button>
          <button onClick={() => handleReasonClick('HOLD BY GM')}>HOLD BY GM</button>
          <button onClick={() => handleReasonClick('HOLD ON COMMERCIAL REQ')}>HOLD ON COMMERCIAL REQ</button>
          {feeder.on_hold && <button className="unhold-btn" onClick={handleUnHold}
          style={{
            backgroundColor: '#2cae00'
          }}>UN HOLD</button>}
          <button
            className="change-date-btn"
            onClick={() => setEditingDates(true)}
            style={{
              backgroundColor: '#fbbf24'
            }}
          >
            CHANGE DC START & END DATE
          </button>
          <button className="delete-btn" onClick={handleDelete}
          style={{
            backgroundColor: '#e40303'
          }}>DELETE</button>
          <input
            type="text"
            className="other-input"
            placeholder="Enter other reason"
            value={otherReason}
            onChange={e => setOtherReason(e.target.value)}
          />
          <button className="other-btn" onClick={handleOtherInitiate}>HOLD FOR OTHER REASON</button>
        </div>
      )}

      {/* Hold flow: choose mode */}
      {selectedReason && !durationMode && (
        <div className="button-group">
          <button onClick={handleSetDuration}>Set Hold Duration</button>
          <button onClick={handleTillInstructions}>HOLD TILL FURTHER INSTRUCTIONS</button>
        </div>
      )}

      {/* Hold date pickers */}
      {selectedReason && durationMode && (
        <div className="date-group">
          <div className="date-field">
            <label>FROM</label>
            <input type="date" value={holdFrom} onChange={e => setHoldFrom(e.target.value)} />
          </div>
          <div className="date-field">
            <label>TO</label>
            <input type="date" value={holdTo} onChange={e => setHoldTo(e.target.value)} />
          </div>
          <button className="update-date-btn" onClick={handleSaveDuration}>SAVE</button>
        </div>
      )}
    </div>
  );
}

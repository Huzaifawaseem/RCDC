import React, { useState } from 'react';
import './DeleteModal.css';

export default function DeleteModal({ onConfirm, onCancel }) {
  const [password, setPassword] = useState('');

  const handleEnter = () => {
    if (password === 'delete') {
      onConfirm();
    } else {
      alert('Wrong password');
      setPassword('');
    }
  };

  return (
    <div className="delete-modal">
      <h3 className="title">Confirm Deletion</h3>
      <p>Enter password to delete all entries:</p>
      <input
        type="password"
        className="delete-input"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Password"
      />
      <div className="delete-buttons">
        <button className="btn-enter" onClick={handleEnter}>ENTER</button>
        <button className="btn-cancel" onClick={onCancel}>CANCEL</button>
      </div>
    </div>
  );
}
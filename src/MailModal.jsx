/* File: src/MailModal.jsx */
import React, { useState, useEffect } from 'react';
import { ref, push, onValue, remove, update } from 'firebase/database';
import PropTypes from 'prop-types';
import { db } from './firebase';
import './MailModal.css';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function MailModal({ onClose }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [mails, setMails] = useState([]);

  // Fetch existing mails
  useEffect(() => {
    const mailsRef = ref(db, 'mails');
    return onValue(mailsRef, snapshot => {
      const data = snapshot.val() || {};
      const arr = Object.entries(data).map(([key, val]) => ({ key, ...val }));
      setMails(arr);
    });
  }, []);

  const handleAdd = () => {
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }
    const mailsRef = ref(db, 'mails');
    push(mailsRef, { address: email.trim(), active: true })
      .then(() => {
        setEmail('');
        setError('');
      })
      .catch(console.error);
  };

  const toggleActive = (key, current) => {
    const itemRef = ref(db, `mails/${key}`);
    update(itemRef, { active: !current }).catch(console.error);
  };

  const handleDelete = key => {
    const itemRef = ref(db, `mails/${key}`);
    remove(itemRef).catch(console.error);
  };

  return (
    <div className="mail-modal-overlay">
      <div className="mail-modal">
        <button className="close-btn" onClick={onClose}>×</button>
        <h2>Add & Manage Emails</h2>
        <div className="input-group">
          <input
            type="email"
            placeholder="Enter email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <button onClick={handleAdd}>Save</button>
        </div>
        {error && <div className="error-text">{error}</div>}
        <ul className="mail-list">
          {mails.map(mail => (
            <li key={mail.key} className="mail-item">
              <span className={`address ${mail.active ? '' : 'inactive'}`}>{mail.address}</span>
              <div className="actions">
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={mail.active}
                    onChange={() => toggleActive(mail.key, mail.active)}
                  />
                  <span className="slider" />
                </label>
                <button className="delete-btn" onDoubleClick={() => handleDelete(mail.key)}>🗑️</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

MailModal.propTypes = {
  onClose: PropTypes.func.isRequired,
};

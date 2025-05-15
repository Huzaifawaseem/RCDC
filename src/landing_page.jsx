/* File: src/LandingPage.jsx */
import React, { useState, useEffect } from 'react';
import KELogo from './assets/KE_LOGO.png';
import { ref, onValue, remove, update } from 'firebase/database';
import { db } from './firebase';
import AddingPage from './AddingPage';
import DeleteModal from './DeleteModal';
import UpdateModal from './UpdateModal';
import SearchBar from './SearchBar';
import AlertModal from './AlertModal';
import './LandingPage.css';

// helper to format Date to YYYY-MM-DD
const formatDate = date => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function LandingPage() {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showAlert, setShowAlert] = useState(true);
  const [feeders, setFeeders] = useState([]);
  const [selectedFeeder, setSelectedFeeder] = useState(null);
  const [filter, setFilter] = useState('');

  const ibcClassMap = {
    'GADAP': 'ibc-gadap',
    'JOHAR 1': 'ibc-johar1',
    'JOHAR 2': 'ibc-johar2',
  };

  const todayStr = formatDate(new Date());

  // Fetch feeders and sort by offTime
  useEffect(() => {
    const feedersRef = ref(db, 'feeders');
    const unsubscribe = onValue(feedersRef, snapshot => {
      const data = snapshot.val() || {};
      const arr = Object.entries(data).map(([key, val]) => ({ key, ...val }));
      arr.sort((a, b) => {
        const [ah, am] = a.offTime.split(':').map(Number);
        const [bh, bm] = b.offTime.split(':').map(Number);
        return ah * 60 + am - (bh * 60 + bm);
      });
      setFeeders(arr);
      setShowAlert(true);
    });
    return () => unsubscribe();
  }, []);

  // Auto-release holds when expired
  useEffect(() => {
    feeders.forEach(f => {
      if (f.on_hold && f.hold_to && todayStr > f.hold_to) {
        update(ref(db, `feeders/${f.key}`), {
          on_hold: false,
          hold_reason: 'none',
          hold_from: null,
          hold_to: null,
        }).catch(console.error);
      }
    });
  }, [feeders, todayStr]);

  const handleSearch = selected => setFilter(selected);
  const handleDeleteConfirm = () => {
    remove(ref(db, 'feeders'))
      .then(() => { alert('All entries deleted.'); setFeeders([]); setShowDeleteModal(false); })
      .catch(console.error);
  };
  const handleRowClick = f => { setSelectedFeeder(f); setShowUpdateModal(true); };

  const visibleFeeders = feeders.filter(f => {
    if (!filter) return true;
    switch (filter) {
      case 'JOHAR 1': case 'JOHAR 2': case 'GADAP': return f.IBC === filter;
      case 'ON HOLD': return f.on_hold === true;
      case 'Commercial DC': case 'Adjustment': case 'CDO Priority': return f.type === filter;
      default: return true;
    }
  });

  return (
    <div className="landing-container">
      {/* Fixed Navbar */}
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="logo-title">
            <img src={KELogo} alt="KE Logo" className="navbar-logo" />
            <span className="navbar-title">RCDC SCHEDULER</span>
          </div>
          <div className="navbar-buttons">
            <button className="delete-list-btn" onClick={() => setShowDeleteModal(true)}>DELETE COMPLETE LIST</button>
            <button className="add-feeder-btn" onClick={() => setShowModal(true)}>Add DC Feeder</button>
          </div>
        </div>
      </nav>

      {/* Search Bar */}
      <SearchBar options={[
        { value: 'JOHAR 1', label: 'JOHAR 1' },
        { value: 'JOHAR 2', label: 'JOHAR 2' },
        { value: 'GADAP', label: 'GADAP' },
        { value: 'ON HOLD', label: 'On Hold' },
        { value: 'Commercial DC', label: 'Commercial DC' },
        { value: 'Adjustment', label: 'Adjustment' },
        { value: 'CDO Priority', label: 'CDO Priority' },
      ]} onSearch={handleSearch} />

      {showModal && <div className="modal-overlay"><AddingPage onClose={() => setShowModal(false)} /></div>}
      {showDeleteModal && <div className="modal-overlay"><DeleteModal onConfirm={handleDeleteConfirm} onCancel={() => setShowDeleteModal(false)} /></div>}
      {showUpdateModal && selectedFeeder && <div className="modal-overlay"><UpdateModal feeder={selectedFeeder} onClose={() => { setShowUpdateModal(false); setSelectedFeeder(null); }} /></div>}
      {showAlert && <AlertModal feeders={feeders} onClose={() => setShowAlert(false)} />}

      <text className="feeder-title">RCDC Feeder List</text>
      <table className="feeder-table">
        <thead>
          <tr><th>#</th><th>Name</th><th>Remarks</th><th>Duration</th><th>OFF Time</th><th>ON Time</th><th>Action</th></tr>
        </thead>
        <tbody>
          {visibleFeeders.map((f, i) => {
            const fromDC = f.fromDate || '';
            const toDC = f.toDate || '';
            let extraRemark = '';
            let dateClass = '';
            if (todayStr < fromDC) { extraRemark = 'Start Soon'; dateClass = 'on-hold-row'; }
            else if (todayStr > toDC) { extraRemark = 'Expired'; dateClass = 'on-hold-row'; }

            const hasDuration = !!(f.hold_from && f.hold_to);
            const inDuration = f.on_hold && hasDuration && todayStr >= f.hold_from && todayStr <= f.hold_to;
            const indefinite = f.on_hold && !hasDuration;

            const showRemark = f.on_hold && (!hasDuration || todayStr <= f.hold_to);
            const highlight = inDuration || indefinite;
            const rowClass = `${ibcClassMap[f.IBC] || ''} ${dateClass} ${highlight ? 'on-hold-row' : ''}`.trim();

            return (
              <tr key={f.key} className={`feeder-row ${rowClass}`}>
                <td>{i + 1}</td>
                <td>
                  <div>{f.feederName}</div>
                  {showRemark && (
                    <div className="hold-reason">
                      {f.hold_reason}{hasDuration ? ` FROM ${f.hold_from} TO ${f.hold_to}` : ''}
                    </div>
                  )}
                </td>
                <td>
                  <div>{f.type}</div>
                  {extraRemark && <div className="hold-reason">{extraRemark}</div>}
                </td>
                <td>{f.duration}</td>
                <td>{f.offTime}</td>
                <td>{f.onTime}</td>
                <td><button className="update-btn" onClick={() => handleRowClick(f)}>Update</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

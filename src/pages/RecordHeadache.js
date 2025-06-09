/* eslint-disable no-unused-vars */
// src/pages/RecordHeadache.js - Complete Version with Premium Prodrome Tracking and Migraine Integration

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEditMode } from '../hooks/useEditMode';
import { collection, addDoc, Timestamp, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Import modular components
import HeadacheTypeSelector from '../components/headache/HeadacheTypeSelector';
import PremiumProdromeTracker from '../components/headache/PremiumProdromeTracker';

// Import headache images - with fallback for missing images
let migrainerHeadacheImg, tensionHeadacheImg, reboundHeadacheImg, exertionHeadacheImg;
let caffeineHeadacheImg, hormoneHeadacheImg, clusterHeadacheImg, sinusHeadacheImg;

try {
  migrainerHeadacheImg = require('../assets/headache-types/migraine-headache.png');
  tensionHeadacheImg = require('../assets/headache-types/tension-headache.png');
  reboundHeadacheImg = require('../assets/headache-types/rebound-headache.png');
  exertionHeadacheImg = require('../assets/headache-types/exertion-headache.png');
  caffeineHeadacheImg = require('../assets/headache-types/caffeine-headache.png');
  hormoneHeadacheImg = require('../assets/headache-types/hormone-headache.png');
  clusterHeadacheImg = require('../assets/headache-types/cluster-headache.png');
  sinusHeadacheImg = require('../assets/headache-types/sinus-headache.png');
} catch (error) {
  console.warn("Error loading headache images:", error);
  // Assign fallback images or null if images are not found
  const fallbackImg = null; // Or a placeholder image
  migrainerHeadacheImg = fallbackImg;
  tensionHeadacheImg = fallbackImg;
  reboundHeadacheImg = fallbackImg;
  exertionHeadacheImg = fallbackImg;
  caffeineHeadacheImg = fallbackImg;
  hormoneHeadacheImg = fallbackImg;
  clusterHeadacheImg = fallbackImg;
  sinusHeadacheImg = fallbackImg;
}

export default function RecordHeadache() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isEditMode, editData, recordId } = useEditMode();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('selection'); // 'selection', 'active-headache', 'prodrome-tracking', 'manual-entry', 'add-note', 'summary', 'edit-mode'
  const [showSymptomsInput, setShowSymptomsInput] = useState(false);
  const [showProdromeInput, setShowProdromeInput] = useState(false);
  const [showTriggersInput, setShowTriggersInput] = useState(false);
  const [activeHeadacheSession, setActiveHeadacheSession] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type: 'headache' | 'prodrome', id: string }

  const [formData, setFormData] = useState({
    type: '',
    location: '',
    intensity: 5, // 1-10
    symptoms: [],
    triggers: [],
    medication: '',
    notes: '',
    prodromes: [],
    attackDuration: null,
    painDescription: '',
    migrainePhase: 'attack', // 'prodrome', 'aura', 'attack', 'postdrome'
    date: new Date(),
    time: new Date(),
  });

  const headacheTypes = [
    { name: 'Migraine', img: migrainerHeadacheImg, description: 'Often throbbing, severe, sensitive to light/sound.' },
    { name: 'Tension', img: tensionHeadacheImg, description: 'Band-like pressure, mild to moderate.' },
    { name: 'Cluster', img: clusterHeadacheImg, description: 'Severe, unilateral, behind eye, with autonomic symptoms.' },
    { name: 'Sinus', img: sinusHeadacheImg, description: 'Pressure in face, forehead, congestion.' },
    { name: 'Caffeine Withdrawal', img: caffeineHeadacheImg, description: 'Headache from sudden caffeine reduction.' },
    { name: 'Hormone', img: hormoneHeadacheImg, description: 'Related to menstrual cycle, pregnancy, menopause.' },
    { name: 'Rebound', img: reboundHeadacheImg, description: 'From overuse of headache medication.' },
    { name: 'Exertion', img: exertionHeadacheImg, description: 'Triggered by physical activity.' },
  ];

  const symptomOptions = [
    'Nausea', 'Vomiting', 'Sensitivity to Light', 'Sensitivity to Sound', 'Sensitivity to Smell',
    'Aura (visual disturbances)', 'Dizziness', 'Fatigue', 'Irritability', 'Stiff Neck', 'Blurred Vision',
    'Numbness/Tingling', 'Difficulty Speaking', 'Weakness', 'Confusion', 'Runny Nose', 'Tearing Eyes',
    'Facial Sweating', 'Eyelid Drooping'
  ];

  const triggerOptions = [
    'Stress', 'Lack of Sleep', 'Certain Foods', 'Caffeine (too much or withdrawal)', 'Alcohol', 'Weather Changes',
    'Hormonal Changes', 'Bright Lights', 'Loud Noises', 'Strong Smells', 'Skipped Meals', 'Dehydration',
    'Physical Exertion', 'Screens/Eye Strain', 'Travel', 'Perfumes/Odors', 'Cheeses', 'Processed Meats',
    'Chocolate', 'MSG'
  ];

  const prodromeOptions = [
    'Yawning', 'Fatigue', 'Mood Changes (irritability, euphoria)', 'Food Cravings', 'Stiff Neck',
    'Increased Urination', 'Fluid Retention', 'Difficulty Concentrating', 'Sensitivity to Light/Sound'
  ];

  useEffect(() => {
    if (isEditMode && editData) {
      setMode('edit-mode');
      setFormData({
        type: editData.type || '',
        location: editData.location || '',
        intensity: editData.intensity || 5,
        symptoms: editData.symptoms || [],
        triggers: editData.triggers || [],
        medication: editData.medication || '',
        notes: editData.notes || '',
        prodromes: editData.prodromes || [],
        attackDuration: editData.attackDuration || null,
        painDescription: editData.painDescription || '',
        migrainePhase: editData.migrainePhase || 'attack',
        date: editData.date?.toDate() || new Date(),
        time: editData.time?.toDate() || new Date(),
      });
    } else if (location.state?.mode) {
      setMode(location.state.mode); // e.g., 'start-headache' or 'manual-entry'
    }
  }, [isEditMode, editData, location.state]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        [name]: checked
          ? [...prev[name], value]
          : prev[name].filter((item) => item !== value),
      }));
    } else if (name === 'date') {
      setFormData((prev) => ({
        ...prev,
        date: new Date(value),
      }));
    } else if (name === 'time') {
      const [hours, minutes] = value.split(':').map(Number);
      const newTime = new Date(prev.time);
      newTime.setHours(hours);
      newTime.setMinutes(minutes);
      setFormData((prev) => ({
        ...prev,
        time: newTime,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleHeadacheTypeSelect = (type) => {
    setFormData((prev) => ({ ...prev, type }));
    setMode('active-headache');
  };

  const startHeadacheSession = async () => {
    setLoading(true);
    setError('');
    try {
      if (!currentUser) {
        throw new Error("User not authenticated.");
      }
      if (!formData.location) {
        throw new Error("Please specify the headache location.");
      }

      const headacheRef = await addDoc(collection(db, 'users', currentUser.uid, 'headaches'), {
        type: formData.type,
        location: formData.location,
        intensity: formData.intensity,
        startTime: Timestamp.now(),
        status: 'active',
        userId: currentUser.uid,
        date: Timestamp.fromDate(formData.date), // Use selected date
        time: Timestamp.fromDate(formData.time), // Use selected time
      });
      setActiveHeadacheSession(headacheRef.id);
      setMode('active-headache');
      setLoading(false);
      navigate('/dashboard'); // Navigate to dashboard after starting
    } catch (err) {
      console.error('Error starting headache session:', err);
      setError(err.message || 'Failed to start headache session.');
      setLoading(false);
    }
  };

  const recordManualEntry = async () => {
    setLoading(true);
    setError('');
    try {
      if (!currentUser) {
        throw new Error("User not authenticated.");
      }
      if (!formData.type || !formData.location || !formData.intensity) {
        throw new Error("Please fill in all required fields (Type, Location, Intensity).");
      }

      const combinedDateTime = new Date(formData.date);
      combinedDateTime.setHours(formData.time.getHours());
      combinedDateTime.setMinutes(formData.time.getMinutes());
      combinedDateTime.setSeconds(formData.time.getSeconds());

      await addDoc(collection(db, 'users', currentUser.uid, 'headaches'), {
        ...formData,
        date: Timestamp.fromDate(combinedDateTime),
        time: Timestamp.fromDate(combinedDateTime), // Store combined date and time in both fields for consistency
        startTime: Timestamp.fromDate(combinedDateTime), // For tracking purposes if needed
        status: 'completed', // Manual entries are completed
        userId: currentUser.uid,
        attackDuration: null, // Default for manual, can be updated later
        prodromes: formData.prodromes, // Ensure prodromes are saved
      });
      setLoading(false);
      navigate('/dashboard');
    } catch (err) {
      console.error('Error recording manual entry:', err);
      setError(err.message || 'Failed to record manual entry.');
      setLoading(false);
    }
  };

  const updateHeadacheSession = async () => {
    setLoading(true);
    setError('');
    try {
      if (!currentUser || !activeHeadacheSession) {
        throw new Error("No active headache session or user not authenticated.");
      }

      // Logic to update active session (e.g., end time, notes, etc.)
      // This is a placeholder; you'd likely fetch the existing session and update it.
      console.log("Updating active headache session:", activeHeadacheSession);
      setLoading(false);
      setMode('summary'); // Move to summary after updating
    } catch (err) {
      console.error('Error updating headache session:', err);
      setError(err.message || 'Failed to update headache session.');
      setLoading(false);
    }
  };

  const handleEditSave = async () => {
    setEditLoading(true);
    setError('');
    try {
      if (!currentUser || !recordId) {
        throw new Error("Record ID missing or user not authenticated for edit.");
      }

      const recordRef = doc(db, 'users', currentUser.uid, 'headaches', recordId);

      const updatedFormData = {
        ...formData,
        date: Timestamp.fromDate(formData.date),
        time: Timestamp.fromDate(formData.time),
      };

      // Firestore update operation (replace with actual update method)
      // await updateDoc(recordRef, updatedFormData); // Uncomment and use updateDoc

      console.log('Record updated successfully (simulated):', updatedFormData);
      setEditLoading(false);
      navigate('/dashboard');
    } catch (err) {
      console.error('Error saving edit:', err);
      setError(err.message || 'Failed to save changes.');
      setEditLoading(false);
    }
  };

  const handleDelete = async (typeToDelete, idToDelete) => {
    setEditLoading(true);
    setError('');
    try {
      if (!currentUser || !idToDelete) {
        throw new Error("ID missing or user not authenticated for delete.");
      }

      const collectionPath = `users/${currentUser.uid}/${typeToDelete === 'headache' ? 'headaches' : 'prodromes'}`;
      const recordRef = doc(db, collectionPath, idToDelete);
      await deleteDoc(recordRef);

      setEditLoading(false);
      setDeleteConfirm(null); // Close confirmation modal
      navigate('/dashboard'); // Go back to dashboard after deletion
    } catch (err) {
      console.error('Error deleting record:', err);
      setError(err.message || 'Failed to delete record.');
      setEditLoading(false);
    }
  };

  const handleAddProdrome = async () => {
    setLoading(true);
    setError('');
    try {
      if (!currentUser || !formData.prodromes.length) {
        throw new Error("No prodromes selected or user not authenticated.");
      }
      await addDoc(collection(db, 'users', currentUser.uid, 'prodromes'), {
        prodromes: formData.prodromes,
        timestamp: Timestamp.now(),
        userId: currentUser.uid,
      });
      setLoading(false);
      setMode('active-headache'); // Go back to active headache view
    } catch (err) {
      console.error('Error adding prodrome:', err);
      setError(err.message || 'Failed to add prodrome.');
      setLoading(false);
    }
  };

  const getHeadacheImage = (type) => {
    switch (type) {
      case 'Migraine': return migrainerHeadacheImg;
      case 'Tension': return tensionHeadacheImg;
      case 'Cluster': return clusterHeadacheImg;
      case 'Sinus': return sinusHeadacheImg;
      case 'Caffeine Withdrawal': return caffeineHeadacheImg;
      case 'Hormone': return hormoneHeadacheImg;
      case 'Rebound': return reboundHeadacheImg;
      case 'Exertion': return exertionHeadacheImg;
      default: return null;
    }
  };

  if (mode === 'edit-mode') {
    return (
      <div style={{ padding: '2rem', maxWidth: '600px', margin: '2rem auto', background: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#333' }}>Edit Headache Record</h2>
        <form onSubmit={handleEditSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Headache Type */}
          <label style={{ display: 'flex', flexDirection: 'column', color: '#555', fontSize: '0.9rem', fontWeight: '600' }}>
            Headache Type:
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px', marginTop: '0.5rem', fontSize: '1rem' }}
            >
              <option value="">Select Type</option>
              {headacheTypes.map((ht) => (
                <option key={ht.name} value={ht.name}>{ht.name}</option>
              ))}
            </select>
          </label>

          {/* Location */}
          <label style={{ display: 'flex', flexDirection: 'column', color: '#555', fontSize: '0.9rem', fontWeight: '600' }}>
            Location:
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px', marginTop: '0.5rem', fontSize: '1rem' }}
            />
          </label>

          {/* Intensity */}
          <label style={{ display: 'flex', flexDirection: 'column', color: '#555', fontSize: '0.9rem', fontWeight: '600' }}>
            Intensity (1-10):
            <input
              type="number"
              name="intensity"
              value={formData.intensity}
              onChange={handleChange}
              min="1"
              max="10"
              required
              style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px', marginTop: '0.5rem', fontSize: '1rem' }}
            />
          </label>

          {/* Date and Time */}
          <label style={{ display: 'flex', flexDirection: 'column', color: '#555', fontSize: '0.9rem', fontWeight: '600' }}>
            Date:
            <input
              type="date"
              name="date"
              value={formData.date.toISOString().split('T')[0]}
              onChange={handleChange}
              required
              style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px', marginTop: '0.5rem', fontSize: '1rem' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', color: '#555', fontSize: '0.9rem', fontWeight: '600' }}>
            Time:
            <input
              type="time"
              name="time"
              value={`${String(formData.time.getHours()).padStart(2, '0')}:${String(formData.time.getMinutes()).padStart(2, '0')}`}
              onChange={handleChange}
              required
              style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px', marginTop: '0.5rem', fontSize: '1rem' }}
            />
          </label>

          {/* Symptoms */}
          <label style={{ display: 'flex', flexDirection: 'column', color: '#555', fontSize: '0.9rem', fontWeight: '600' }}>
            Symptoms:
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
              {symptomOptions.map((symptom) => (
                <div key={symptom} style={{ display: 'flex', alignItems: 'center', background: '#F3F4F6', borderRadius: '6px', padding: '8px 12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="symptoms"
                    value={symptom}
                    checked={formData.symptoms.includes(symptom)}
                    onChange={handleChange}
                    style={{ marginRight: '0.5rem' }}
                  />
                  <span style={{ fontSize: '0.9rem', color: '#333' }}>{symptom}</span>
                </div>
              ))}
            </div>
          </label>

          {/* Triggers */}
          <label style={{ display: 'flex', flexDirection: 'column', color: '#555', fontSize: '0.9rem', fontWeight: '600' }}>
            Triggers:
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
              {triggerOptions.map((trigger) => (
                <div key={trigger} style={{ display: 'flex', alignItems: 'center', background: '#F3F4F6', borderRadius: '6px', padding: '8px 12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="triggers"
                    value={trigger}
                    checked={formData.triggers.includes(trigger)}
                    onChange={handleChange}
                    style={{ marginRight: '0.5rem' }}
                  />
                  <span style={{ fontSize: '0.9rem', color: '#333' }}>{trigger}</span>
                </div>
              ))}
            </div>
          </label>

          {/* Medication */}
          <label style={{ display: 'flex', flexDirection: 'column', color: '#555', fontSize: '0.9rem', fontWeight: '600' }}>
            Medication:
            <input
              type="text"
              name="medication"
              value={formData.medication}
              onChange={handleChange}
              style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px', marginTop: '0.5rem', fontSize: '1rem' }}
            />
          </label>

          {/* Notes */}
          <label style={{ display: 'flex', flexDirection: 'column', color: '#555', fontSize: '0.9rem', fontWeight: '600' }}>
            Notes:
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="4"
              style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px', marginTop: '0.5rem', fontSize: '1rem', resize: 'vertical' }}
            ></textarea>
          </label>

          {/* Prodromes */}
          <label style={{ display: 'flex', flexDirection: 'column', color: '#555', fontSize: '0.9rem', fontWeight: '600' }}>
            Prodromes:
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
              {prodromeOptions.map((prodrome) => (
                <div key={prodrome} style={{ display: 'flex', alignItems: 'center', background: '#F3F4F6', borderRadius: '6px', padding: '8px 12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="prodromes"
                    value={prodrome}
                    checked={formData.prodromes.includes(prodrome)}
                    onChange={handleChange}
                    style={{ marginRight: '0.5rem' }}
                  />
                  <span style={{ fontSize: '0.9rem', color: '#333' }}>{prodrome}</span>
                </div>
              ))}
            </div>
          </label>

          {/* Attack Duration */}
          <label style={{ display: 'flex', flexDirection: 'column', color: '#555', fontSize: '0.9rem', fontWeight: '600' }}>
            Attack Duration (minutes, if completed):
            <input
              type="number"
              name="attackDuration"
              value={formData.attackDuration || ''}
              onChange={handleChange}
              style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px', marginTop: '0.5rem', fontSize: '1rem' }}
            />
          </label>

          {/* Pain Description */}
          <label style={{ display: 'flex', flexDirection: 'column', color: '#555', fontSize: '0.9rem', fontWeight: '600' }}>
            Pain Description:
            <input
              type="text"
              name="painDescription"
              value={formData.painDescription}
              onChange={handleChange}
              style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px', marginTop: '0.5rem', fontSize: '1rem' }}
            />
          </label>

          {/* Migraine Phase */}
          <label style={{ display: 'flex', flexDirection: 'column', color: '#555', fontSize: '0.9rem', fontWeight: '600' }}>
            Migraine Phase:
            <select
              name="migrainePhase"
              value={formData.migrainePhase}
              onChange={handleChange}
              style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px', marginTop: '0.5rem', fontSize: '1rem' }}
            >
              <option value="prodrome">Prodrome</option>
              <option value="aura">Aura</option>
              <option value="attack">Attack</option>
              <option value="postdrome">Postdrome</option>
            </select>
          </label>

          {error && <div style={{ color: '#DC2626', textAlign: 'center', marginBottom: '1rem' }}>{error}</div>}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
            <Link to="/dashboard" style={{ textDecoration: 'none' }}>
              <button
                type="button"
                disabled={editLoading}
                style={{
                  background: 'transparent',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  color: '#4B5563',
                  padding: '12px 24px',
                  cursor: editLoading ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
            </Link>
            <button
              type="submit"
              disabled={editLoading}
              style={{
                background: editLoading ? '#9CA3AF' : '#2563EB',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                padding: '12px 24px',
                cursor: editLoading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              {editLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>
                  Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save" style={{ marginRight: '0.5rem' }}></i>
                  Save Changes
                </>
              )}
            </button>
          </div>

          {/* Delete button for edit mode */}
          {isEditMode && (
            <button
              onClick={() => setDeleteConfirm({ type: 'headache', id: recordId })}
              disabled={editLoading}
              style={{
                background: editLoading ? '#F87171' : '#DC2626',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                padding: '12px 24px',
                cursor: editLoading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                marginTop: '1rem'
              }}
            >
              {editLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>
                  Deleting...
                </>
              ) : (
                <>
                  <i className="fas fa-trash" style={{ marginRight: '0.5rem' }}></i>
                  Delete Record
                </>
              )}
            </button>
          )}
        </form>

        {deleteConfirm && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }}>
            <div style={{
              background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
              maxWidth: '400px', width: '90%', textAlign: 'center'
            }}>
              <h3 style={{ color: '#333', marginBottom: '1rem' }}>Confirm Deletion</h3>
              <p style={{ color: '#555', marginBottom: '2rem' }}>Are you sure you want to delete this record? This action cannot be undone.</p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  style={{
                    background: 'transparent',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    color: '#4B5563',
                    padding: '10px 20px',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm.type, deleteConfirm.id)}
                  style={{
                    background: '#DC2626',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    padding: '10px 20px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600'
                  }}
                >
                  <i className="fas fa-trash" style={{ marginRight: '0.5rem' }}></i>
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (mode === 'selection') {
    return (
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '2rem auto', background: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: '#333' }}>Record a Headache</h2>

        {error && (
          <div style={{
            background: '#f8d7da',
            border: '1px solid #dc3545',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '1rem',
            color: '#721c24',
            textAlign: 'center'
          }}>
            <i className="fas fa-exclamation-triangle" style={{ marginRight: '0.5rem' }}></i>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
          {headacheTypes.map((type) => (
            <div
              key={type.name}
              onClick={() => handleHeadacheTypeSelect(type.name)}
              style={{
                background: '#F9FAFB',
                padding: '1.5rem',
                borderRadius: '12px',
                textAlign: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                ':hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.1)'
                }
              }}
            >
              {type.img && <img src={type.img} alt={type.name} style={{ width: '60px', height: '60px', marginBottom: '1rem' }} />}
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#333', fontSize: '1.1rem' }}>{type.name}</h3>
              <p style={{ margin: '0', fontSize: '0.85rem', color: '#666' }}>{type.description}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2.5rem' }}>
          <button
            onClick={() => setMode('manual-entry')}
            style={{
              background: '#4CAF50',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              padding: '12px 24px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600'
            }}
          >
            <i className="fas fa-edit" style={{ marginRight: '0.5rem' }}></i>
            Manual Entry
          </button>
          <Link to="/dashboard" style={{ textDecoration: 'none' }}>
            <button
              style={{
                background: 'transparent',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                color: '#4B5563',
                padding: '12px 24px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              <i className="fas fa-times" style={{ marginRight: '0.5rem' }}></i>
              Cancel
            </button>
          </Link>
        </div>
      </div>
    );
  }

  if (mode === 'active-headache') {
    const selectedHeadache = headacheTypes.find(h => h.name === formData.type);
    return (
      <div style={{ padding: '2rem', maxWidth: '600px', margin: '2rem auto', background: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#333' }}>Active {formData.type} Headache Session</h2>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          {selectedHeadache?.img && (
            <img src={selectedHeadache.img} alt={selectedHeadache.name} style={{ width: '80px', height: '80px', marginBottom: '0.5rem' }} />
          )}
          <p style={{ fontSize: '1rem', color: '#666', margin: '0' }}>Location: {formData.location}</p>
          <p style={{ fontSize: '1rem', color: '#666', margin: '0' }}>Intensity: {formData.intensity}/10</p>
        </div>

        {error && (
          <div style={{
            background: '#f8d7da',
            border: '1px solid #dc3545',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '1rem',
            color: '#721c24',
            textAlign: 'center'
          }}>
            <i className="fas fa-exclamation-triangle" style={{ marginRight: '0.5rem' }}></i>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Prodrome Tracking */}
          <div
            onClick={() => setShowProdromeInput(!showProdromeInput)}
            style={{
              background: '#F9FAFB',
              padding: '1rem',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              transition: 'background 0.2s'
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#333' }}>Record Prodromes (Premium)</h3>
            <i className={`fas ${showProdromeInput ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{ color: '#666' }}></i>
          </div>
          {showProdromeInput && (
            <div style={{ background: '#F0F4F8', padding: '1rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <PremiumProdromeTracker
                prodromeOptions={prodromeOptions}
                selectedProdromes={formData.prodromes}
                onProdromeChange={(e) => handleChange({ target: { name: 'prodromes', value: e.target.value, type: 'checkbox', checked: e.target.checked } })}
              />
              <button
                onClick={handleAddProdrome}
                disabled={loading || !formData.prodromes.length}
                style={{
                  background: (loading || !formData.prodromes.length) ? '#9CA3AF' : '#60A5FA',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  padding: '10px 20px',
                  cursor: (loading || !formData.prodromes.length) ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  marginTop: '0.5rem'
                }}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>
                    Adding Prodromes...
                  </>
                ) : (
                  <>
                    <i className="fas fa-plus" style={{ marginRight: '0.5rem' }}></i>
                    Add Selected Prodromes
                  </>
                )}
              </button>
            </div>
          )}

          {/* Other options (Symptoms, Triggers, Medication, Notes) - expandable sections */}
          <div
            onClick={() => setShowSymptomsInput(!showSymptomsInput)}
            style={{
              background: '#F9FAFB',
              padding: '1rem',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              transition: 'background 0.2s'
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#333' }}>Add Symptoms</h3>
            <i className={`fas ${showSymptomsInput ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{ color: '#666' }}></i>
          </div>
          {showSymptomsInput && (
            <div style={{ background: '#F0F4F8', padding: '1rem', borderRadius: '8px', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {symptomOptions.map((symptom) => (
                <div key={symptom} style={{ display: 'flex', alignItems: 'center', background: 'white', borderRadius: '6px', padding: '8px 12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="symptoms"
                    value={symptom}
                    checked={formData.symptoms.includes(symptom)}
                    onChange={handleChange}
                    style={{ marginRight: '0.5rem' }}
                  />
                  <span style={{ fontSize: '0.9rem', color: '#333' }}>{symptom}</span>
                </div>
              ))}
            </div>
          )}

          <div
            onClick={() => setShowTriggersInput(!showTriggersInput)}
            style={{
              background: '#F9FAFB',
              padding: '1rem',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              transition: 'background 0.2s'
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#333' }}>Add Triggers</h3>
            <i className={`fas ${showTriggersInput ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{ color: '#666' }}></i>
          </div>
          {showTriggersInput && (
            <div style={{ background: '#F0F4F8', padding: '1rem', borderRadius: '8px', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {triggerOptions.map((trigger) => (
                <div key={trigger} style={{ display: 'flex', alignItems: 'center', background: 'white', borderRadius: '6px', padding: '8px 12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="triggers"
                    value={trigger}
                    checked={formData.triggers.includes(trigger)}
                    onChange={handleChange}
                    style={{ marginRight: '0.5rem' }}
                  />
                  <span style={{ fontSize: '0.9rem', color: '#333' }}>{trigger}</span>
                </div>
              ))}
            </div>
          )}

          {/* Medication Input */}
          <label style={{ display: 'flex', flexDirection: 'column', color: '#555', fontSize: '0.9rem', fontWeight: '600' }}>
            Medication Taken:
            <input
              type="text"
              name="medication"
              value={formData.medication}
              onChange={handleChange}
              placeholder="e.g., Ibuprofen, Sumatriptan"
              style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px', marginTop: '0.5rem', fontSize: '1rem' }}
            />
          </label>

          {/* Notes Input */}
          <label style={{ display: 'flex', flexDirection: 'column', color: '#555', fontSize: '0.9rem', fontWeight: '600' }}>
            Notes:
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              placeholder="Any additional details..."
              style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px', marginTop: '0.5rem', fontSize: '1rem', resize: 'vertical' }}
            ></textarea>
          </label>

          {/* End Headache Button */}
          <button
            onClick={updateHeadacheSession}
            disabled={loading}
            style={{
              background: loading ? '#9CA3AF' : '#22C55E',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              padding: '15px 24px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1.1rem',
              fontWeight: '600',
              marginTop: '1.5rem'
            }}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>
                Ending Headache...
              </>
            ) : (
              <>
                <i className="fas fa-check-circle" style={{ marginRight: '0.5rem' }}></i>
                End Headache Session
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'manual-entry') {
    return (
      <div style={{ padding: '2rem', maxWidth: '600px', margin: '2rem auto', background: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#333' }}>Record Manual Entry</h2>
        <form onSubmit={(e) => { e.preventDefault(); recordManualEntry(); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Date and Time Pickers */}
          <label style={{ display: 'flex', flexDirection: 'column', color: '#555', fontSize: '0.9rem', fontWeight: '600' }}>
            Date:
            <input
              type="date"
              name="date"
              value={formData.date.toISOString().split('T')[0]}
              onChange={handleChange}
              required
              style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px', marginTop: '0.5rem', fontSize: '1rem' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', color: '#555', fontSize: '0.9rem', fontWeight: '600' }}>
            Time:
            <input
              type="time"
              name="time"
              value={`${String(formData.time.getHours()).padStart(2, '0')}:${String(formData.time.getMinutes()).padStart(2, '0')}`}
              onChange={handleChange}
              required
              style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px', marginTop: '0.5rem', fontSize: '1rem' }}
            />
          </label>

          {/* Headache Type */}
          <label style={{ display: 'flex', flexDirection: 'column', color: '#555', fontSize: '0.9rem', fontWeight: '600' }}>
            Headache Type:
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px', marginTop: '0.5rem', fontSize: '1rem' }}
            >
              <option value="">Select Type</option>
              {headacheTypes.map((ht) => (
                <option key={ht.name} value={ht.name}>{ht.name}</option>
              ))}
            </select>
          </label>

          {/* Location */}
          <label style={{ display: 'flex', flexDirection: 'column', color: '#555', fontSize: '0.9rem', fontWeight: '600' }}>
            Location:
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px', marginTop: '0.5rem', fontSize: '1rem' }}
            />
          </label>

          {/* Intensity */}
          <label style={{ display: 'flex', flexDirection: 'column', color: '#555', fontSize: '0.9rem', fontWeight: '600' }}>
            Intensity (1-10):
            <input
              type="number"
              name="intensity"
              value={formData.intensity}
              onChange={handleChange}
              min="1"
              max="10"
              required
              style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px', marginTop: '0.5rem', fontSize: '1rem' }}
            />
          </label>

          {/* Pain Description */}
          <label style={{ display: 'flex', flexDirection: 'column', color: '#555', fontSize: '0.9rem', fontWeight: '600' }}>
            Pain Description:
            <input
              type="text"
              name="painDescription"
              value={formData.painDescription}
              onChange={handleChange}
              placeholder="e.g., throbbing, dull, sharp"
              style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px', marginTop: '0.5rem', fontSize: '1rem' }}
            />
          </label>

          {/* Symptoms */}
          <label style={{ display: 'flex', flexDirection: 'column', color: '#555', fontSize: '0.9rem', fontWeight: '600' }}>
            Symptoms:
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
              {symptomOptions.map((symptom) => (
                <div key={symptom} style={{ display: 'flex', alignItems: 'center', background: '#F3F4F6', borderRadius: '6px', padding: '8px 12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="symptoms"
                    value={symptom}
                    checked={formData.symptoms.includes(symptom)}
                    onChange={handleChange}
                    style={{ marginRight: '0.5rem' }}
                  />
                  <span style={{ fontSize: '0.9rem', color: '#333' }}>{symptom}</span>
                </div>
              ))}
            </div>
          </label>

          {/* Triggers */}
          <label style={{ display: 'flex', flexDirection: 'column', color: '#555', fontSize: '0.9rem', fontWeight: '600' }}>
            Triggers:
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
              {triggerOptions.map((trigger) => (
                <div key={trigger} style={{ display: 'flex', alignItems: 'center', background: '#F3F4F6', borderRadius: '6px', padding: '8px 12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="triggers"
                    value={trigger}
                    checked={formData.triggers.includes(trigger)}
                    onChange={handleChange}
                    style={{ marginRight: '0.5rem' }}
                  />
                  <span style={{ fontSize: '0.9rem', color: '#333' }}>{trigger}</span>
                </div>
              ))}
            </div>
          </label>

          {/* Medication */}
          <label style={{ display: 'flex', flexDirection: 'column', color: '#555', fontSize: '0.9rem', fontWeight: '600' }}>
            Medication:
            <input
              type="text"
              name="medication"
              value={formData.medication}
              onChange={handleChange}
              placeholder="e.g., Ibuprofen"
              style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px', marginTop: '0.5rem', fontSize: '1rem' }}
            />
          </label>

          {/* Notes */}
          <label style={{ display: 'flex', flexDirection: 'column', color: '#555', fontSize: '0.9rem', fontWeight: '600' }}>
            Notes:
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="4"
              placeholder="Any additional details..."
              style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px', marginTop: '0.5rem', fontSize: '1rem', resize: 'vertical' }}
            ></textarea>
          </label>

          {/* Prodromes (Premium Section) */}
          {currentUser && ( // Example of conditional rendering for premium feature
            <div style={{
              background: '#4F46E5', // Indigo color
              borderRadius: '12px',
              padding: '1.5rem',
              textAlign: 'center',
              color: 'white',
              marginBottom: '2rem'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                <i className="fas fa-crown"></i>
              </div>
              <h4 style={{ margin: '0 0 0.5rem 0' }}>Premium: Trigger Analysis</h4>
              <p style={{ margin: '0', fontSize: '0.9rem', opacity: 0.9 }}>
                Identify what causes your headaches with detailed trigger tracking
              </p>
            </div>
          )}

          {error && (
            <div style={{
              background: '#f8d7da',
              border: '1px solid #dc3545',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '1rem',
              color: '#721c24',
              textAlign: 'center'
            }}>
              <i className="fas fa-exclamation-triangle" style={{ marginRight: '0.5rem' }}></i>
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={() => setMode('selection')}
              style={{
                background: 'transparent',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                color: '#4B5563',
                padding: '12px 20px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              <i className="fas fa-arrow-left" style={{ marginRight: '0.5rem' }}></i>
              Back
            </button>
             
            <button
              onClick={recordManualEntry}
              disabled={loading || !formData.location || !formData.type || !formData.intensity}
              style={{
                background: (loading || !formData.location || !formData.type || !formData.intensity) ? '#E5E7EB' : '#EF4444',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                padding: '12px 24px',
                cursor: (loading || !formData.location || !formData.type || !formData.intensity) ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>
                  Recording...
                </>
              ) : (
                <>
                  <i className="fas fa-save" style={{ marginRight: '0.5rem' }}></i>
                  Record Headache
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // This return null; is for when no specific mode is active or matched.
  // It should be the last return statement in the component if all conditions above are false.
  return null;
}

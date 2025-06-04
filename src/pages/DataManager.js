// src/pages/DataManager.js - Comprehensive Data Management Interface
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, orderBy, limit, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import StatusMessages from '../components/common/StatusMessages';

export default function DataManager() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('headaches');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const dataTypes = [
    { 
      id: 'headaches', 
      name: 'Headaches', 
      icon: 'fas fa-head-side-virus', 
      color: '#DC2626',
      route: '/record-headache'
    },
    { 
      id: 'sleep', 
      name: 'Sleep', 
      icon: 'fas fa-bed', 
      color: '#3B82F6',
      route: '/record-sleep'
    },
    { 
      id: 'stress', 
      name: 'Stress', 
      icon: 'fas fa-brain', 
      color: '#F59E0B',
      route: '/record-stress'
    },
    { 
      id: 'medications', 
      name: 'Medications', 
      icon: 'fas fa-pills', 
      color: '#059669',
      route: '/record-medication'
    },
    { 
      id: 'exercise', 
      name: 'Exercise', 
      icon: 'fas fa-dumbbell', 
      color: '#8B5CF6',
      route: '/record-exercise'
    },
    { 
      id: 'nutrition', 
      name: 'Nutrition', 
      icon: 'fas fa-apple-alt', 
      color: '#EF4444',
      route: '/record-nutrition'
    }
  ];

  const fetchData = async (dataType) => {
    if (!currentUser) return;
    
    setLoading(true);
    setError('');
    
    try {
      const dataQuery = query(
        collection(db, 'users', currentUser.uid, dataType),
        orderBy('createdAt', 'desc'),
        limit(50) // Limit to recent 50 entries
      );
      
      const snapshot = await getDocs(dataQuery);
      const entries = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      
      setData(prev => ({ ...prev, [dataType]: entries }));
    } catch (err) {
      console.error(`Error fetching ${dataType}:`, err);
      setError(`Failed to load ${dataType} data`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab, currentUser]);

  const handleEdit = (item, dataType) => {
    const route = dataTypes.find(dt => dt.id === dataType)?.route;
    if (route) {
      navigate(`${route}?mode=edit&id=${item.id}&date=${item.date || ''}`);
    }
  };

  const handleDelete = async (itemId, dataType) => {
    if (!currentUser) return;
    
    setLoading(true);
    setError('');
    
    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, dataType, itemId));
      setStatusMessage('Entry deleted successfully!');
      
      // Refresh data
      await fetchData(dataType);
      
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err) {
      console.error('Error deleting entry:', err);
      setError('Failed to delete entry');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!currentUser || selectedItems.length === 0) return;
    
    setLoading(true);
    setError('');
    
    try {
      const deletePromises = selectedItems.map(itemId => 
        deleteDoc(doc(db, 'users', currentUser.uid, activeTab, itemId))
      );
      
      await Promise.all(deletePromises);
      setStatusMessage(`${selectedItems.length} entries deleted successfully!`);
      setSelectedItems([]);
      setShowDeleteConfirm(false);
      
      // Refresh data
      await fetchData(activeTab);
      
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err) {
      console.error('Error bulk deleting:', err);
      setError('Failed to delete selected entries');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectItem = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    const currentData = data[activeTab] || [];
    if (selectedItems.length === currentData.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(currentData.map(item => item.id));
    }
  };

  const formatEntryDisplay = (item, dataType) => {
    const date = item.date || (item.createdAt?.toDate ? item.createdAt.toDate().toISOString().split('T')[0] : 'Unknown');
    const time = item.time || (item.createdAt?.toDate ? item.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');
    
    switch (dataType) {
      case 'headaches':
        return {
          primary: `${item.location || 'Unknown type'}`,
          secondary: `Pain: ${item.painLevel || 0}/10`,
          tertiary: item.duration ? `Duration: ${Math.round(item.duration / 60)}h` : ''
        };
      case 'sleep':
        return {
          primary: `Sleep Quality: ${item.sleepQuality || 0}/10`,
          secondary: `${item.hoursSlept || 0} hours`,
          tertiary: `${item.bedTime || ''} - ${item.wakeTime || ''}`
        };
      case 'stress':
        return {
          primary: `Stress Level: ${item.stressLevel || 0}/10`,
          secondary: item.mood || 'No mood recorded',
          tertiary: item.context || ''
        };
      case 'medications':
        return {
          primary: item.medicationName || 'Unknown medication',
          secondary: `${item.dosage || ''} ${item.dosageUnit || ''}`,
          tertiary: `Effectiveness: ${item.effectiveness || 0}/10`
        };
      case 'exercise':
        return {
          primary: item.exerciseType || 'Unknown exercise',
          secondary: `${item.duration || 0} min, ${item.intensity || ''}`,
          tertiary: ''
        };
      case 'nutrition':
        return {
          primary: `Hydration: ${item.hydrationLevel || 0}/10`,
          secondary: item.skippedMeals ? 'Skipped meals' : 'Regular meals',
          tertiary: item.inflammationScore ? `Inflammation: ${item.inflammationScore}` : ''
        };
      default:
        return { primary: 'Unknown entry', secondary: '', tertiary: '' };
    }
  };

  const currentDataType = dataTypes.find(dt => dt.id === activeTab);
  const currentData = data[activeTab] || [];

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F9FAFB',
      color: '#000000',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Font Awesome CSS */}
      <link 
        rel="stylesheet" 
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
        integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" 
        crossOrigin="anonymous" 
        referrerPolicy="no-referrer" 
      />

      <div style={{ padding: '1rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
            background: '#FFFFFF',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <div>
              <h1 style={{
                margin: '0 0 0.5rem 0',
                fontSize: '1.8rem',
                fontWeight: 'bold',
                color: '#1E3A8A'
              }}>
                <i className="fas fa-database" style={{ marginRight: '0.5rem' }}></i>
                Data Manager
              </h1>
              <p style={{ margin: 0, color: '#6B7280', fontSize: '1rem' }}>
                View, edit, and manage all your health tracking data
              </p>
            </div>
            <Link
              to="/dashboard"
              style={{
                background: '#4682B4',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 20px',
                textDecoration: 'none',
                fontSize: '1rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <i className="fas fa-arrow-left"></i>
              Back to Dashboard
            </Link>
          </div>

          {/* Status Messages */}
          <StatusMessages 
            error={error} 
            statusMessage={statusMessage}
            onClear={() => {
              setError('');
              setStatusMessage('');
            }}
          />

          {/* Data Type Tabs */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '2rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '0.5rem'
            }}>
              {dataTypes.map(dataType => (
                <button
                  key={dataType.id}
                  onClick={() => {
                    setActiveTab(dataType.id);
                    setSelectedItems([]);
                  }}
                  style={{
                    padding: '1rem',
                    background: activeTab === dataType.id 
                      ? dataType.color 
                      : '#F3F4F6',
                    color: activeTab === dataType.id ? 'white' : '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'center',
                    fontSize: '0.9rem',
                    fontWeight: '600'
                  }}
                >
                  <i className={dataType.icon} style={{ marginRight: '0.5rem' }}></i>
                  {dataType.name}
                  <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.25rem' }}>
                    {currentData.length || 0} entries
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ color: '#374151', fontWeight: '600' }}>
                {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  background: '#DC2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}
              >
                <i className="fas fa-trash" style={{ marginRight: '0.5rem' }}></i>
                Delete Selected
              </button>
            </div>
          )}

          {/* Data List */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            overflow: 'hidden'
          }}>
            {/* List Header */}
            <div style={{
              background: currentDataType?.color || '#4682B4',
              color: 'white',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={currentData.length > 0 && selectedItems.length === currentData.length}
                    onChange={handleSelectAll}
                    style={{ transform: 'scale(1.2)' }}
                  />
                  Select All
                </label>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '600' }}>
                  <i className={currentDataType?.icon} style={{ marginRight: '0.5rem' }}></i>
                  {currentDataType?.name} ({currentData.length})
                </h3>
              </div>
              <Link
                to={`${currentDataType?.route}?mode=manual-entry`}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}
              >
                <i className="fas fa-plus" style={{ marginRight: '0.5rem' }}></i>
                Add New
              </Link>
            </div>

            {/* Loading State */}
            {loading && (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#9CA3AF' }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '1rem' }}></i>
                <div>Loading {currentDataType?.name.toLowerCase()}...</div>
              </div>
            )}

            {/* Empty State */}
            {!loading && currentData.length === 0 && (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#9CA3AF' }}>
                <i className={currentDataType?.icon} style={{ fontSize: '3rem', marginBottom: '1rem' }}></i>
                <h3 style={{ margin: '0 0 1rem 0', color: '#374151' }}>
              Delete {selectedItems.length} Item{selectedItems.length > 1 ? 's' : ''}?
            </h3>
            <p style={{ margin: '0 0 2rem 0', color: '#6B7280' }}>
              This action cannot be undone. Are you sure you want to delete the selected {currentDataType?.name.toLowerCase()}?
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  background: '#F3F4F6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={loading}
                style={{
                  background: loading ? '#F87171' : '#DC2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>
                    Deleting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-trash" style={{ marginRight: '0.5rem' }}></i>
                    Delete {selectedItems.length} Item{selectedItems.length > 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
                  No {currentDataType?.name.toLowerCase()} recorded yet
                </h3>
                <p style={{ margin: '0 0 2rem 0' }}>
                  Start tracking your {currentDataType?.name.toLowerCase()} to see data here
                </p>
                <Link
                  to={`${currentDataType?.route}?mode=manual-entry`}
                  style={{
                    background: currentDataType?.color,
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    textDecoration: 'none',
                    fontSize: '1rem',
                    fontWeight: '600'
                  }}
                >
                  <i className="fas fa-plus" style={{ marginRight: '0.5rem' }}></i>
                  Add First Entry
                </Link>
              </div>
            )}

            {/* Data Entries */}
            {!loading && currentData.length > 0 && (
              <div>
                {currentData.map((item, index) => {
                  const displayInfo = formatEntryDisplay(item, activeTab);
                  const date = item.date || (item.createdAt?.toDate ? item.createdAt.toDate().toISOString().split('T')[0] : 'Unknown');
                  const time = item.time || (item.createdAt?.toDate ? item.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');
                  
                  return (
                    <div
                      key={item.id}
                      style={{
                        padding: '1rem',
                        borderBottom: index < currentData.length - 1 ? '1px solid #E5E7EB' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        transition: 'background 0.2s ease',
                        background: selectedItems.includes(item.id) ? 'rgba(70, 130, 180, 0.05)' : 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        if (!selectedItems.includes(item.id)) {
                          e.target.style.background = '#F9FAFB';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!selectedItems.includes(item.id)) {
                          e.target.style.background = 'transparent';
                        }
                      }}
                    >
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => handleSelectItem(item.id)}
                        style={{ transform: 'scale(1.2)' }}
                      />

                      {/* Date/Time */}
                      <div style={{ minWidth: '120px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#374151' }}>
                          {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>
                          {time}
                        </div>
                      </div>

                      {/* Entry Details */}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '1rem', fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>
                          {displayInfo.primary}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#6B7280', marginBottom: '0.25rem' }}>
                          {displayInfo.secondary}
                        </div>
                        {displayInfo.tertiary && (
                          <div style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>
                            {displayInfo.tertiary}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleEdit(item, activeTab)}
                          style={{
                            background: '#4682B4',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '8px 12px',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, activeTab)}
                          style={{
                            background: '#DC2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '8px 12px',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', color: '#DC2626', marginBottom: '1rem' }}>
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <h3 style={{ margin: '0 0 1rem 0', color: '#374151' }}></h3>

// src/pages/HeadacheList.js - Complete headache management interface

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export default function HeadacheList() {
  const { currentUser } = useAuth();
  
  // State management
  const [headaches, setHeadaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterType, setFilterType] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');

  // Headache type mapping for display
  const headacheTypeLabels = {
    'migraine': 'Migraine',
    'tension': 'Tension',
    'cluster': 'Cluster',
    'sinus': 'Sinus',
    'caffeine': 'Caffeine',
    'hormone': 'Hormone',
    'rebound': 'Medication Overuse',
    'exertion': 'Exertion'
  };

  // Helper functions
  const getPainLevelColor = (level) => {
    if (level <= 3) return '#28a745';
    if (level <= 6) return '#ffc107';
    if (level <= 8) return '#fd7e14';
    return '#dc3545';
  };

  const getPainLevelText = (level) => {
    if (level <= 2) return 'Mild';
    if (level <= 4) return 'Moderate';
    if (level <= 6) return 'Strong';
    if (level <= 8) return 'Severe';
    return 'Extreme';
  };

  const formatDuration = (duration) => {
    if (!duration || duration === 0) return 'Manual Entry';
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Load headaches from Firestore
  const loadHeadaches = React.useCallback(async () => {
    if (!currentUser) return;

    setLoading(true);
    setError('');

    try {
      const headachesQuery = query(
        collection(db, 'users', currentUser.uid, 'headaches'),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(headachesQuery);
      const headacheData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setHeadaches(headacheData);
    } catch (error) {
      console.error('Error loading headaches:', error);
      setError('Failed to load headache records. Please try again.');
    }

    setLoading(false);
  }, [currentUser]);

  // Delete headache record
  const handleDelete = async (headacheId) => {
    if (!currentUser) return;

    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'headaches', headacheId));
      setHeadaches(prev => prev.filter(h => h.id !== headacheId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting headache:', error);
      setError('Failed to delete headache. Please try again.');
    }
  };

  // Filter and sort headaches
  const getFilteredAndSortedHeadaches = () => {
    let filtered = headaches;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(headache => 
        headacheTypeLabels[headache.location]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        headache.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(headache => headache.location === filterType);
    }

    // Filter by month
    if (selectedMonth !== 'all') {
      filtered = filtered.filter(headache => {
        const headacheDate = headache.startTime?.toDate() || new Date(headache.date);
        const monthYear = `${headacheDate.getFullYear()}-${String(headacheDate.getMonth() + 1).padStart(2, '0')}`;
        return monthYear === selectedMonth;
      });
    }

    // Sort headaches
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'date':
          aValue = a.startTime?.toDate() || new Date(a.date);
          bValue = b.startTime?.toDate() || new Date(b.date);
          break;
        case 'painLevel':
          aValue = a.painLevel;
          bValue = b.painLevel;
          break;
        case 'duration':
          aValue = a.duration || 0;
          bValue = b.duration || 0;
          break;
        case 'type':
          aValue = headacheTypeLabels[a.location] || '';
          bValue = headacheTypeLabels[b.location] || '';
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  };

  // Get unique months for filter
  const getAvailableMonths = () => {
    const months = new Set();
    headaches.forEach(headache => {
      const date = headache.startTime?.toDate() || new Date(headache.date);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.add(monthYear);
    });
    return Array.from(months).sort().reverse();
  };

  // Load data on component mount
  useEffect(() => {
    loadHeadaches();
  }, [loadHeadaches]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#F8FAFC',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{ textAlign: 'center', color: '#6B7280' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>
            <i className="fas fa-spinner fa-spin"></i>
          </div>
          <div>Loading headache records...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F8FAFC',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <link 
        rel="stylesheet" 
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
        integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" 
        crossOrigin="anonymous" 
        referrerPolicy="no-referrer" 
      />

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h1 style={{
              margin: 0,
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#1E3A8A'
            }}>
              <i className="fas fa-list" style={{ marginRight: '0.5rem' }}></i>
              Headache Records
            </h1>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Link
                to="/record-headache"
                style={{
                  background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  padding: '12px 20px',
                  textDecoration: 'none',
                  fontSize: '1rem',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center'
                }}
              >
                <i className="fas fa-plus" style={{ marginRight: '0.5rem' }}></i>
                New Headache
              </Link>
              
              <Link
                to="/dashboard"
                style={{
                  background: 'transparent',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  color: '#6B7280',
                  padding: '12px 20px',
                  textDecoration: 'none',
                  fontSize: '1rem',
                  display: 'inline-flex',
                  alignItems: 'center'
                }}
              >
                <i className="fas fa-arrow-left" style={{ marginRight: '0.5rem' }}></i>
                Dashboard
              </Link>
            </div>
          </div>

          <p style={{ color: '#6B7280', fontSize: '1.1rem', margin: 0 }}>
            View, edit, and manage all your headache records
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{
            background: '#f8d7da',
            border: '1px solid #dc3545',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '2rem',
            color: '#721c24',
            textAlign: 'center'
          }}>
            <i className="fas fa-exclamation-triangle" style={{ marginRight: '0.5rem' }}></i>
            {error}
          </div>
        )}

        {/* Controls */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            alignItems: 'end'
          }}>
            {/* Search */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                Search Records
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search by type or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 40px',
                    borderRadius: '6px',
                    border: '1px solid #D1D5DB',
                    fontSize: '1rem'
                  }}
                />
                <i className="fas fa-search" style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9CA3AF'
                }}></i>
              </div>
            </div>

            {/* Filter by Type */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                Filter by Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #D1D5DB',
                  fontSize: '1rem'
                }}
              >
                <option value="all">All Types</option>
                {Object.entries(headacheTypeLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {/* Filter by Month */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                Filter by Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #D1D5DB',
                  fontSize: '1rem'
                }}
              >
                <option value="all">All Months</option>
                {getAvailableMonths().map(month => {
                  const [year, monthNum] = month.split('-');
                  const monthName = new Date(year, monthNum - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                  return (
                    <option key={month} value={month}>{monthName}</option>
                  );
                })}
              </select>
            </div>

            {/* Sort Controls */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                Sort By
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #D1D5DB',
                    fontSize: '1rem'
                  }}
                >
                  <option value="date">Date</option>
                  <option value="painLevel">Pain Level</option>
                  <option value="duration">Duration</option>
                  <option value="type">Type</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #D1D5DB',
                    background: '#F9FAFB',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Summary */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3B82F6' }}>
              {getFilteredAndSortedHeadaches().length}
            </div>
            <div style={{ color: '#6B7280', fontSize: '0.9rem' }}>Total Records</div>
          </div>

          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#EF4444' }}>
              {getFilteredAndSortedHeadaches().length > 0 
                ? Math.round(getFilteredAndSortedHeadaches().reduce((sum, h) => sum + h.painLevel, 0) / getFilteredAndSortedHeadaches().length)
                : 0}
            </div>
            <div style={{ color: '#6B7280', fontSize: '0.9rem' }}>Avg Pain Level</div>
          </div>

          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10B981' }}>
              {getFilteredAndSortedHeadaches().filter(h => h.duration > 0).length > 0
                ? Math.round(getFilteredAndSortedHeadaches().filter(h => h.duration > 0).reduce((sum, h) => sum + h.duration, 0) / getFilteredAndSortedHeadaches().filter(h => h.duration > 0).length)
                : 0}m
            </div>
            <div style={{ color: '#6B7280', fontSize: '0.9rem' }}>Avg Duration</div>
          </div>

          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#F59E0B' }}>
              {(() => {
                const types = getFilteredAndSortedHeadaches().map(h => h.location);
                const mostCommon = types.reduce((a, b, i, arr) => 
                  arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
                );
                return headacheTypeLabels[mostCommon] || 'N/A';
              })()}
            </div>
            <div style={{ color: '#6B7280', fontSize: '0.9rem' }}>Most Common</div>
          </div>
        </div>

        {/* Headache Records Table */}
        {getFilteredAndSortedHeadaches().length === 0 ? (
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            padding: '3rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', color: '#D1D5DB', marginBottom: '1rem' }}>
              <i className="fas fa-calendar-times"></i>
            </div>
            <h3 style={{ color: '#6B7280', marginBottom: '1rem' }}>No headache records found</h3>
            <p style={{ color: '#9CA3AF', marginBottom: '2rem' }}>
              {searchTerm || filterType !== 'all' || selectedMonth !== 'all' 
                ? 'Try adjusting your filters or search terms.'
                : 'Start tracking your headaches to see them here.'
              }
            </p>
            <Link
              to="/record-headache"
              style={{
                background: '#3B82F6',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                padding: '12px 24px',
                textDecoration: 'none',
                fontSize: '1rem',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center'
              }}
            >
              <i className="fas fa-plus" style={{ marginRight: '0.5rem' }}></i>
              Record Your First Headache
            </Link>
          </div>
        ) : (
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            {/* Table Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '120px 150px 100px 120px 120px 150px 120px',
              background: '#F9FAFB',
              padding: '1rem',
              borderBottom: '1px solid #E5E7EB',
              fontWeight: '600',
              color: '#374151',
              fontSize: '0.9rem'
            }}>
              <div>Date</div>
              <div>Type</div>
              <div>Pain Level</div>
              <div>Duration</div>
              <div>Time</div>
              <div>Notes</div>
              <div>Actions</div>
            </div>

            {/* Table Rows */}
            {getFilteredAndSortedHeadaches().map((headache, index) => (
              <div
                key={headache.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 150px 100px 120px 120px 150px 120px',
                  padding: '1rem',
                  borderBottom: index < getFilteredAndSortedHeadaches().length - 1 ? '1px solid #F3F4F6' : 'none',
                  alignItems: 'center',
                  fontSize: '0.9rem'
                }}
              >
                {/* Date */}
                <div style={{ color: '#374151', fontWeight: '500' }}>
                  {formatDate(headache.startTime || headache.date)}
                </div>

                {/* Type */}
                <div style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  color: '#1E40AF',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  display: 'inline-block'
                }}>
                  {headacheTypeLabels[headache.location] || headache.location}
                </div>

                {/* Pain Level */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    background: getPainLevelColor(headache.painLevel),
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    minWidth: '40px',
                    textAlign: 'center'
                  }}>
                    {headache.painLevel}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                    {getPainLevelText(headache.painLevel)}
                  </div>
                </div>

                {/* Duration */}
                <div style={{ color: '#374151' }}>
                  {formatDuration(headache.duration)}
                </div>

                {/* Time */}
                <div style={{ color: '#6B7280', fontSize: '0.85rem' }}>
                  {formatTime(headache.startTime)}
                </div>

                {/* Notes */}
                <div style={{
                  color: '#6B7280',
                  fontSize: '0.8rem',
                  maxWidth: '150px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {headache.notes || 'No notes'}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link
                    to={`/record-headache?mode=manual-entry&editId=${headache.id}`}
                    style={{
                      background: '#3B82F6',
                      border: 'none',
                      borderRadius: '4px',
                      color: 'white',
                      padding: '6px 8px',
                      textDecoration: 'none',
                      fontSize: '0.8rem',
                      display: 'inline-flex',
                      alignItems: 'center'
                    }}
                    title="Edit headache"
                  >
                    <i className="fas fa-edit"></i>
                  </Link>
                  
                  <button
                    onClick={() => setDeleteConfirm(headache.id)}
                    style={{
                      background: '#DC2626',
                      border: 'none',
                      borderRadius: '4px',
                      color: 'white',
                      padding: '6px 8px',
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                    title="Delete headache"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
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
              width: '90%'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '3rem', color: '#DC2626', marginBottom: '1rem' }}>
                  <i className="fas fa-exclamation-triangle"></i>
                </div>
                <h3 style={{ color: '#DC2626', marginBottom: '0.5rem' }}>Delete Headache Record</h3>
                <p style={{ color: '#6B7280', margin: 0 }}>
                  Are you sure you want to delete this headache record? This action cannot be undone.
                </p>
              </div>
              
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
                  onClick={() => handleDelete(deleteConfirm)}
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
    </div>
  );
}

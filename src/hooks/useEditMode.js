// src/hooks/useEditMode.js - Universal Edit Hook for All Components
import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export function useEditMode(collectionName) {
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [editDocId, setEditDocId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  // Parse URL parameters on mount
 useEffect(() => {
  const urlParams = new URLSearchParams(location.search);
  const mode = urlParams.get('mode');
  const id = urlParams.get('id') || urlParams.get('editId'); // Check both formats
  
  if ((mode === 'edit' || mode === 'manual-entry') && id) {
    setIsEditMode(true);
    setEditDocId(id);
  }
}, [location.search]);

  // Load existing document data for editing
  const loadExistingData = useCallback(async () => {
    if (!currentUser || !editDocId || !isEditMode) return null;
    
    setLoading(true);
    setError('');
    
    try {
      const docRef = doc(db, 'users', currentUser.uid, collectionName, editDocId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() };
        return data;
      } else {
        setError('Document not found');
        return null;
      }
    } catch (err) {
      console.error('Error loading document:', err);
      setError('Failed to load data for editing');
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentUser, editDocId, isEditMode, collectionName]);

  // Update existing document
  const updateRecord = useCallback(async (updatedData) => {
    if (!currentUser || !editDocId) {
      setError('Missing required data for update');
      return false;
    }

    setLoading(true);
    setError('');
    
    try {
      const docRef = doc(db, 'users', currentUser.uid, collectionName, editDocId);
      
      // Remove id from update data and add updatedAt timestamp
      const { id, ...dataToUpdate } = updatedData;
      const updatePayload = {
        ...dataToUpdate,
        updatedAt: new Date()
      };
      
      await updateDoc(docRef, updatePayload);
      
      setStatusMessage('Record updated successfully!');
      setTimeout(() => setStatusMessage(''), 3000);
      
      return true;
    } catch (err) {
      console.error('Error updating document:', err);
      setError('Failed to update record');
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentUser, editDocId, collectionName]);

  // Delete document
  const deleteRecord = useCallback(async () => {
    if (!currentUser || !editDocId) {
      setError('Missing required data for deletion');
      return false;
    }

    setLoading(true);
    setError('');
    
    try {
      const docRef = doc(db, 'users', currentUser.uid, collectionName, editDocId);
      await deleteDoc(docRef);
      
      setStatusMessage('Record deleted successfully!');
      setTimeout(() => {
        setStatusMessage('');
        navigate('/dashboard');
      }, 1500);
      
      return true;
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('Failed to delete record');
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentUser, editDocId, collectionName, navigate]);

  // Navigate to edit mode for a specific document
  const navigateToEdit = useCallback((docId, basePath) => {
    const editUrl = `${basePath}?mode=edit&id=${docId}`;
    navigate(editUrl);
  }, [navigate]);

  // Clear any status messages
  const clearMessages = useCallback(() => {
    setError('');
    setStatusMessage('');
  }, []);

  return {
    isEditMode,
    editDocId,
    loading,
    error,
    statusMessage,
    loadExistingData,
    updateRecord,
    deleteRecord,
    navigateToEdit,
    clearMessages
  };
}

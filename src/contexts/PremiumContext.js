import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const PremiumContext = createContext();

export function usePremium() {
  return useContext(PremiumContext);
}

export function PremiumProvider({ children }) {
  const { currentUser } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [premiumSource, setPremiumSource] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check premium status when user changes
  useEffect(() => {
    async function checkPremiumStatus() {
      if (!currentUser) {
        setIsPremium(false);
        setPremiumSource(null);
        setLoading(false);
        return;
      }

      try {
        // Check Firebase user profile for premium status
        const userDocRef = doc(db, 'users', currentUser.uid, 'profile', 'settings');
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          setIsPremium(data.isPremium || false);
          setPremiumSource(data.premiumSource || null);
        } else {
          // Check localStorage as fallback
          const storedPremium = localStorage.getItem('hjPremium');
          const storedSource = localStorage.getItem('hjPremiumSource');
          if (storedPremium === 'true') {
            setIsPremium(true);
            setPremiumSource(storedSource);
          }
        }
      } catch (error) {
        console.error('Error checking premium status:', error);
      }
      
      setLoading(false);
    }

    checkPremiumStatus();
  }, [currentUser]);

  // Activate premium
  const activatePremium = async (source = 'curemigraine', email = null) => {
    setIsPremium(true);
    setPremiumSource(source);
    
    // Store in localStorage
    localStorage.setItem('hjPremium', 'true');
    localStorage.setItem('hjPremiumSource', source);
    if (email) {
      localStorage.setItem('hjPremiumEmail', email);
    }
    
    // Store in Firebase if user is logged in
    if (currentUser) {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid, 'profile', 'settings');
        await setDoc(userDocRef, {
          isPremium: true,
          premiumSource: source,
          premiumEmail: email,
          premiumActivatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (error) {
        console.error('Error saving premium status:', error);
      }
    }
  };

  // Deactivate premium
  const deactivatePremium = async () => {
    setIsPremium(false);
    setPremiumSource(null);
    localStorage.removeItem('hjPremium');
    localStorage.removeItem('hjPremiumSource');
    localStorage.removeItem('hjPremiumEmail');
    
    if (currentUser) {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid, 'profile', 'settings');
        await setDoc(userDocRef, {
          isPremium: false,
          premiumSource: null
        }, { merge: true });
      } catch (error) {
        console.error('Error removing premium status:', error);
      }
    }
  };

  const value = {
    isPremium,
    premiumSource,
    loading,
    activatePremium,
    deactivatePremium
  };

  return (
    <PremiumContext.Provider value={value}>
      {children}
    </PremiumContext.Provider>
  );
}

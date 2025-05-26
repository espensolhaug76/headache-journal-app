import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function usePremium() {
  const { currentUser } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPremiumStatus = async () => {
      if (!currentUser) {
        setIsPremium(false);
        setLoading(false);
        return;
      }

      try {
        // DEVELOPMENT MODE: Everyone gets premium features
        setIsPremium(true);
        
        // PRODUCTION MODE (activate later):
        // const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        // const userData = userDoc.data();
        // setIsPremium(userData?.subscription?.status === 'active' || false);
        
      } catch (error) {
        console.error('Error checking premium status:', error);
        setIsPremium(false);
      }
      
      setLoading(false);
    };

    checkPremiumStatus();
  }, [currentUser]);

  return { isPremium, loading };
}
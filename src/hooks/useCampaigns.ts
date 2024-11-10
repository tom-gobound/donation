import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  where, 
  DocumentData, 
  FirestoreError,
  onSnapshot,
  QuerySnapshot,
  getDocs,
  limit,
  Query
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Campaign } from '../types';
import { toast } from 'react-hot-toast';

export function useCampaigns(userId: string | null) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (!userId) {
      setCampaigns([]);
      setLoading(false);
      return;
    }

    let unsubscribeOwned: (() => void) | undefined;
    let unsubscribeFacilitated: (() => void) | undefined;

    const fetchCampaigns = async () => {
      try {
        const campaignsRef = collection(db, 'campaigns');
        
        // Query for owned campaigns
        const ownedQuery = query(
          campaignsRef,
          where('ownerId', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(50)
        );

        // Query for facilitated campaigns
        const facilitatedQuery = query(
          campaignsRef,
          where('facilitatorIds', 'array-contains', userId),
          orderBy('createdAt', 'desc'),
          limit(50)
        );

        // Set up real-time listeners for both queries
        unsubscribeOwned = onSnapshot(
          ownedQuery,
          {
            next: (ownedSnapshot) => handleSnapshot(ownedSnapshot, 'owned'),
            error: handleError
          }
        );

        unsubscribeFacilitated = onSnapshot(
          facilitatedQuery,
          {
            next: (facilitatedSnapshot) => handleSnapshot(facilitatedSnapshot, 'facilitated'),
            error: handleError
          }
        );

      } catch (err) {
        console.error('Error setting up campaign listeners:', err);
        setError(err as FirestoreError);
        setLoading(false);
        toast.error('Unable to load campaigns. Please try again.');
      }
    };

    const handleSnapshot = (
      snapshot: QuerySnapshot<DocumentData>,
      type: 'owned' | 'facilitated'
    ) => {
      const campaignData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt)
      })) as Campaign[];

      // Merge campaigns and remove duplicates
      setCampaigns(prevCampaigns => {
        const existingIds = new Set(prevCampaigns.map(c => c.id));
        const newCampaigns = campaignData.filter(c => !existingIds.has(c.id));
        return [...prevCampaigns, ...newCampaigns].sort((a, b) => 
          b.createdAt.getTime() - a.createdAt.getTime()
        );
      });

      setError(null);
      setLoading(false);
    };

    const handleError = (err: FirestoreError) => {
      console.error('Error loading campaigns:', err);
      setError(err);
      setLoading(false);
      
      if (!err.message.includes('cancel')) {
        toast.error('Unable to load campaigns. Please try again.');
      }
    };

    fetchCampaigns();

    return () => {
      if (unsubscribeOwned) {
        unsubscribeOwned();
      }
      if (unsubscribeFacilitated) {
        unsubscribeFacilitated();
      }
    };
  }, [userId]);

  return { campaigns, loading, error };
}
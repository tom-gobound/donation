import { useState, useEffect } from 'react';
import { 
  Query, 
  onSnapshot, 
  DocumentData,
  FirestoreError
} from 'firebase/firestore';
import { toast } from 'react-hot-toast';

export function useFirestoreQuery<T = DocumentData>(query: Query) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    setLoading(true);

    const unsubscribe = onSnapshot(
      query,
      {
        next: (snapshot) => {
          const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
          setData(results);
          setLoading(false);
          setError(null);
        },
        error: (err: FirestoreError) => {
          console.error('Firestore query error:', err);
          setError(err);
          toast.error('Error loading data. Please try again.');
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, [query]);

  return { data, loading, error };
}
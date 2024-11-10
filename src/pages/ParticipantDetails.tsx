import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, doc, getDoc, onSnapshot, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import AddGuardianForm from '../components/AddGuardianForm';
import AddDonorForm from '../components/AddDonorForm';
import GuardianList from '../components/GuardianList';
import DonorList from '../components/DonorList';
import { toast } from 'react-hot-toast';

interface Participant {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  campaignId: string;
}

export default function ParticipantDetails() {
  const { participantId } = useParams<{ participantId: string }>();
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!participantId) return;

    const fetchParticipant = async () => {
      try {
        const participantRef = doc(db, 'participants', participantId);
        const participantSnap = await getDoc(participantRef);
        
        if (participantSnap.exists()) {
          setParticipant({ id: participantSnap.id, ...participantSnap.data() } as Participant);
        } else {
          toast.error('Participant not found');
        }
      } catch (error) {
        console.error('Error fetching participant:', error);
        toast.error('Error loading participant details');
      } finally {
        setLoading(false);
      }
    };

    fetchParticipant();
  }, [participantId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  if (!participant) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900">Participant not found</h2>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {participant.firstName} {participant.lastName}
          </h2>
          <p className="text-gray-600">{participant.phoneNumber}</p>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Parents/Guardians</h3>
              <GuardianList 
                participantId={participantId} 
                campaignId={participant.campaignId} 
              />
              <div className="mt-4">
                <AddGuardianForm 
                  participantId={participantId} 
                  campaignId={participant.campaignId}
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Donors</h3>
              <DonorList 
                participantId={participantId} 
                campaignId={participant.campaignId}
              />
              <div className="mt-4">
                <AddDonorForm 
                  participantId={participantId} 
                  campaignId={participant.campaignId}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
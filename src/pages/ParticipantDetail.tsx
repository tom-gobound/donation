import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, onSnapshot, query, getDocs, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Participant, Guardian, Donor, Campaign } from '../types';
import GuardianList from '../components/GuardianList';
import DonorList from '../components/DonorList';
import AddGuardianForm from '../components/AddGuardianForm';
import AddDonorForm from '../components/AddDonorForm';
import { User, Phone, Link as LinkIcon, Copy, Loader, Users, Target, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import IdentitySelector from '../components/IdentitySelector';

interface Identity {
  type: string;
  firstName: string;
  lastName: string;
}

export default function ParticipantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [hasMessagedGuardians, setHasMessagedGuardians] = useState(false);
  const [hasSkippedGuardians, setHasSkippedGuardians] = useState(false);
  const [identity, setIdentity] = useState<Identity | null>(() => {
    const saved = localStorage.getItem(`identity_${id}`);
    return saved ? JSON.parse(saved) : null;
  });

  const shareableUrl = `${window.location.origin}/?participantId=${id}`;
  const isOwner = currentUser?.uid === campaign?.ownerId;
  const isFacilitator = campaign?.facilitatorIds?.includes(currentUser?.uid);
  const isAuthorized = isOwner || isFacilitator;

  const logAccess = async (identity: Identity) => {
    if (!id || !campaignId) return;

    try {
      const accessRef = collection(db, `campaigns/${campaignId}/participants/${id}/accesses`);
      await addDoc(accessRef, {
        type: identity.type,
        firstName: identity.firstName,
        lastName: identity.lastName,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error logging access:', error);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareableUrl);
      toast.success('URL copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy URL');
    }
  };

  useEffect(() => {
    if (!id) return;

    const fetchParticipant = async () => {
      setLoading(true);
      setError(null);

      try {
        const campaignsRef = collection(db, 'campaigns');
        const campaignsSnapshot = await getDocs(campaignsRef);
        
        for (const campaignDoc of campaignsSnapshot.docs) {
          const participantRef = doc(db, `campaigns/${campaignDoc.id}/participants/${id}`);
          const participantSnap = await getDoc(participantRef);
          
          if (participantSnap.exists()) {
            const participantData = {
              id: participantSnap.id,
              ...participantSnap.data(),
              hasMessagedGuardians: participantSnap.data().hasMessagedGuardians || false,
              hasSkippedGuardians: participantSnap.data().hasSkippedGuardians || false
            } as Participant;
            
            setParticipant(participantData);
            setHasMessagedGuardians(participantData.hasMessagedGuardians || false);
            setHasSkippedGuardians(participantData.hasSkippedGuardians || false);
            setCampaignId(campaignDoc.id);
            const campaignData = campaignDoc.data() as Campaign;
            setCampaign(campaignData);
            
            document.title = `${participantData.firstName} ${participantData.lastName} - ${campaignData.name}`;
            
            // Set up listeners for guardians and donors
            const guardiansRef = collection(db, `campaigns/${campaignDoc.id}/participants/${id}/guardians`);
            const donorsRef = collection(db, `campaigns/${campaignDoc.id}/participants/${id}/donors`);

            const unsubGuardians = onSnapshot(query(guardiansRef), (snapshot) => {
              setGuardians(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Guardian[]);
            });

            const unsubDonors = onSnapshot(query(donorsRef), (snapshot) => {
              setDonors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Donor[]);
            });

            setLoading(false);
            return () => {
              unsubGuardians();
              unsubDonors();
              document.title = 'Campaign Manager';
            };
          }
        }

        setError('Participant not found');
        setLoading(false);
      } catch (error) {
        console.error('Error fetching participant:', error);
        setError('Failed to load participant data. Please try again.');
        setLoading(false);
      }
    };

    fetchParticipant();
  }, [id, currentUser]);

  const handleIdentitySelect = async (selectedIdentity: Identity) => {
    setIdentity(selectedIdentity);
    localStorage.setItem(`identity_${id}`, JSON.stringify(selectedIdentity));
    await logAccess(selectedIdentity);
  };

  const handleSkipGuardians = async () => {
    if (!id || !campaignId) return;

    try {
      const participantRef = doc(db, `campaigns/${campaignId}/participants/${id}`);
      await updateDoc(participantRef, {
        hasSkippedGuardians: true
      });
      setHasSkippedGuardians(true);
      toast.success('Proceeding without guardians');
    } catch (error) {
      console.error('Error updating participant:', error);
      toast.error('Failed to update preferences');
    }
  };

  const handleGuardianMessaged = async () => {
    if (!id || !campaignId) return;

    try {
      const participantRef = doc(db, `campaigns/${campaignId}/participants/${id}`);
      await updateDoc(participantRef, {
        hasMessagedGuardians: true
      });
      setHasMessagedGuardians(true);
      toast.success('Great! You can now start adding donors');
    } catch (error) {
      console.error('Error updating participant:', error);
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader className="h-8 w-8 text-rose-500 animate-spin" />
      </div>
    );
  }

  if (error || !participant || !campaignId) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">{error || 'Participant not found'}</p>
        </div>
      </div>
    );
  }

  // If not authenticated and no identity selected, show identity selector
  if (!currentUser && !identity) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <IdentitySelector
          participant={participant}
          guardians={guardians}
          onSelect={handleIdentitySelect}
        />
      </div>
    );
  }

  const canAddDonors = hasMessagedGuardians || hasSkippedGuardians;
  const showGuardianSection = !hasMessagedGuardians && !hasSkippedGuardians;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {isAuthorized && (
        <button
          onClick={() => navigate(`/campaigns/${campaignId}`)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back to Campaign
        </button>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-rose-100 rounded-full p-3">
            <User className="h-8 w-8 text-rose-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {participant.firstName} {participant.lastName}
            </h1>
            <div className="flex items-center text-gray-600 mt-1">
              <Phone className="h-4 w-4 mr-2" />
              {participant.phoneNumber}
            </div>
          </div>
        </div>
      </div>

      {showGuardianSection ? (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="text-center mb-8">
            <Users className="h-12 w-12 text-rose-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              First Step: Add Parents/Guardians
            </h2>
            <p className="text-gray-600">
              Start by adding your parents or guardians who can help identify potential donors.
              You can send them a message asking for help in creating your donor list.
            </p>
          </div>

          <div className="space-y-8">
            <GuardianList 
              participantId={id}
              campaignId={campaignId}
            />

            <AddGuardianForm 
              participantId={id} 
              campaignId={campaignId} 
            />

            <div className="border-t pt-6 space-y-4">
              <p className="text-gray-700 font-medium text-center">Ready to proceed?</p>
              <div className="flex justify-center space-x-4">
                {guardians.length > 0 && (
                  <button
                    onClick={handleGuardianMessaged}
                    className="flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                  >
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    Yes, I've messaged them
                  </button>
                )}
                <button
                  onClick={handleSkipGuardians}
                  className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  <XCircle className="h-5 w-5 mr-2" />
                  Skip this step
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {donors.length < (campaign?.targetDonorCount || 10) && (
            <div className="bg-gradient-to-r from-rose-500 to-pink-500 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Time to Collect Donors!</h2>
                  <p className="text-rose-100">
                    You've added {donors.length} out of {campaign?.targetDonorCount || 10} target donors
                  </p>
                </div>
                <div className="text-4xl font-bold">
                  {Math.round((donors.length / (campaign?.targetDonorCount || 10)) * 100)}%
                </div>
              </div>
              <div className="mt-4 bg-white/20 rounded-full h-2">
                <div 
                  className="bg-white rounded-full h-2 transition-all duration-500"
                  style={{ width: `${Math.min(100, (donors.length / (campaign?.targetDonorCount || 10)) * 100)}%` }}
                />
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Add New Donors
                </h2>
                <AddDonorForm 
                  participantId={id}
                  campaignId={campaignId}
                  identity={identity}
                />
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <DonorList 
                  participantId={id}
                  campaignId={campaignId}
                />
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Parents/Guardians
                </h2>
                <GuardianList 
                  participantId={id}
                  campaignId={campaignId}
                />
                <div className="mt-6">
                  <AddGuardianForm 
                    participantId={id} 
                    campaignId={campaignId} 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <LinkIcon className="h-5 w-5 mr-2 text-gray-500" />
          Direct Access URL
        </h3>
        <div className="flex items-center gap-4">
          <code className="flex-1 bg-gray-50 p-3 rounded text-sm text-gray-700 break-all">
            {shareableUrl}
          </code>
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            <Copy className="h-4 w-4" />
            <span>Copy</span>
          </button>
        </div>
      </div>
    </div>
  );
}
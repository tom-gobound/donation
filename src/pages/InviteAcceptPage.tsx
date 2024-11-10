import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc, updateDoc, runTransaction } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { UserCheck, Loader, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InviteAcceptPage() {
  const { campaignId, inviteId } = useParams<{ campaignId: string; inviteId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, loading: authLoading } = useAuth();
  const [invite, setInvite] = useState<any>(null);
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvite = async () => {
      if (!inviteId || !campaignId) {
        setError('Invalid invitation link');
        setLoading(false);
        return;
      }

      try {
        // Fetch invite document
        const inviteRef = doc(db, `campaigns/${campaignId}/invites/${inviteId}`);
        const inviteDoc = await getDoc(inviteRef);
        
        if (!inviteDoc.exists()) {
          console.error('Invite not found:', { campaignId, inviteId });
          setError('Invitation not found');
          setLoading(false);
          return;
        }

        const inviteData = inviteDoc.data();
        
        // Check if invite is already processed
        if (inviteData.status !== 'pending') {
          setError('This invitation has already been processed');
          setLoading(false);
          return;
        }

        setInvite(inviteData);

        // Fetch campaign details
        const campaignDoc = await getDoc(doc(db, 'campaigns', campaignId));
        if (!campaignDoc.exists()) {
          setError('Campaign not found');
          setLoading(false);
          return;
        }

        setCampaign({ id: campaignId, ...campaignDoc.data() });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching invite:', error);
        setError('Failed to load invitation. Please try again.');
        setLoading(false);
      }
    };

    fetchInvite();
  }, [inviteId, campaignId]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !currentUser && invite) {
      const returnUrl = `/invites/${campaignId}/${inviteId}`;
      navigate('/login', { 
        state: { from: { pathname: returnUrl } },
        replace: true 
      });
    }
  }, [authLoading, currentUser, inviteId, campaignId, navigate, invite]);

  const handleAccept = async () => {
    if (!currentUser || !invite || !campaign || !campaignId || !inviteId) return;

    setProcessing(true);
    try {
      await runTransaction(db, async (transaction) => {
        // Get fresh copies of the documents
        const inviteRef = doc(db, `campaigns/${campaignId}/invites/${inviteId}`);
        const campaignRef = doc(db, `campaigns/${campaignId}`);
        
        const inviteDoc = await transaction.get(inviteRef);
        const campaignDoc = await transaction.get(campaignRef);

        if (!inviteDoc.exists()) {
          throw new Error('Invitation not found');
        }

        if (!campaignDoc.exists()) {
          throw new Error('Campaign not found');
        }

        const currentInvite = inviteDoc.data();
        const currentCampaign = campaignDoc.data();
        
        // Double-check invite status
        if (currentInvite.status !== 'pending') {
          throw new Error('Invitation is no longer valid');
        }

        if (invite.role === 'owner') {
          // Transfer ownership
          transaction.update(campaignRef, {
            previousOwnerId: currentCampaign.ownerId,
            ownerId: currentUser.uid,
            inviteId: inviteId, // Include inviteId for permission check
            updatedAt: new Date()
          });
        } else {
          // Add as facilitator
          const currentFacilitators = currentCampaign.facilitatorIds || [];
          if (!currentFacilitators.includes(currentUser.uid)) {
            transaction.update(campaignRef, {
              facilitatorIds: [...currentFacilitators, currentUser.uid],
              inviteId: inviteId, // Include inviteId for permission check
              updatedAt: new Date()
            });
          }
        }

        // Mark invitation as accepted
        transaction.update(inviteRef, {
          status: 'accepted',
          acceptedAt: new Date(),
          acceptedBy: currentUser.uid
        });
      });

      toast.success('Invitation accepted successfully');
      navigate(`/campaigns/${campaignId}`);
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to accept invitation');
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!currentUser || !invite || !campaignId || !inviteId) return;

    setProcessing(true);
    try {
      const inviteRef = doc(db, `campaigns/${campaignId}/invites/${inviteId}`);
      await updateDoc(inviteRef, {
        status: 'declined',
        declinedAt: new Date(),
        declinedBy: currentUser.uid
      });

      toast.success('Invitation declined');
      navigate('/campaigns');
    } catch (error) {
      console.error('Error declining invitation:', error);
      toast.error('Failed to decline invitation');
      setProcessing(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader className="h-8 w-8 text-rose-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="bg-red-50 rounded-lg p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-red-700 mb-2">
            {error}
          </h2>
          <button
            onClick={() => navigate('/campaigns')}
            className="mt-4 text-red-600 hover:text-red-700"
          >
            Return to Campaigns
          </button>
        </div>
      </div>
    );
  }

  if (!invite || !campaign) return null;

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <UserCheck className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Campaign Invitation
          </h1>
          <p className="text-gray-600">
            You've been invited to manage the following campaign:
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-gray-900 mb-1">
            {campaign.name}
          </h2>
          <p className="text-gray-600 text-sm mb-2">
            {campaign.organizationName}
          </p>
          <p className="text-sm text-gray-500">
            Role: <span className="font-medium capitalize">{invite.role}</span>
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleAccept}
            disabled={processing}
            className="w-full py-2 px-4 bg-rose-500 text-white rounded-md hover:bg-rose-600 disabled:opacity-50"
          >
            {processing ? 'Processing...' : 'Accept Invitation'}
          </button>
          <button
            onClick={handleDecline}
            disabled={processing}
            className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
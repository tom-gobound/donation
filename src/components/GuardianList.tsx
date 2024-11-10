import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'react-hot-toast';
import { User, MessageCircle, X } from 'lucide-react';
import MessagingInstructionsModal from './MessagingInstructionsModal';

interface Guardian {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

interface GuardianListProps {
  participantId: string;
  campaignId: string;
}

interface Campaign {
  templateMessageToGuardians: string;
  ownerTitle: string;
  targetDonorCount: number;
}

interface Participant {
  firstName: string;
  lastName: string;
}

export default function GuardianList({ participantId, campaignId }: GuardianListProps) {
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);
  const [messageUrl, setMessageUrl] = useState('');
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);

  useEffect(() => {
    const guardiansRef = collection(db, `campaigns/${campaignId}/participants/${participantId}/guardians`);
    const q = query(guardiansRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const guardiansList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Guardian[];
        setGuardians(guardiansList);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching guardians:', error);
        toast.error('Error loading guardians');
        setLoading(false);
      }
    );

    // Fetch campaign and participant data
    const fetchData = async () => {
      try {
        const [campaignDoc, participantDoc] = await Promise.all([
          getDoc(doc(db, 'campaigns', campaignId)),
          getDoc(doc(db, `campaigns/${campaignId}/participants/${participantId}`))
        ]);

        if (campaignDoc.exists()) {
          setCampaign(campaignDoc.data() as Campaign);
        }
        if (participantDoc.exists()) {
          setParticipant(participantDoc.data() as Participant);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
    return () => unsubscribe();
  }, [campaignId, participantId]);

  const formatMessage = () => {
    if (!campaign || !participant) return '';

    const participantDetailUrl = `${window.location.origin}/participants/${participantId}`;
    
    return campaign.templateMessageToGuardians
      .replace(/{ownerTitle}/g, campaign.ownerTitle)
      .replace(/{targetDonorCount}/g, campaign.targetDonorCount.toString())
      .replace(/{participantName}/g, `${participant.firstName} ${participant.lastName}`)
      .replace(/{organizationName}/g, campaign.organizationName)
      + `\n\nYou can add potential donors here: ${participantDetailUrl}`;
  };

  const handleMessageClick = () => {
    if (guardians.length === 0) {
      toast.error('No guardians available to message');
      return;
    }

    if (!campaign || !participant) {
      toast.error('Unable to load campaign information');
      return;
    }

    const phoneNumbers = guardians.map(g => g.phoneNumber).join(',');
    const message = formatMessage();
    const encodedMessage = encodeURIComponent(message);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    const smsUrl = isIOS
      ? `sms://open?addresses=${phoneNumbers}&body=${encodedMessage}`
      : `sms:${phoneNumbers}?body=${encodedMessage}`;

    // Check if we're on a mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      setMessageUrl(smsUrl);
      setShowInstructions(true);
    } else {
      // For desktop browsers, show a toast with instructions
      toast((t) => (
        <div>
          <p className="font-medium mb-2">To message guardians:</p>
          <ol className="list-decimal ml-4 space-y-1">
            <li>Open your phone's messaging app</li>
            <li>Create a new group message</li>
            <li>Add these phone numbers: {guardians.map(g => g.phoneNumber).join(', ')}</li>
            <li>Copy and paste this message:</li>
          </ol>
          <pre className="mt-2 p-2 bg-gray-100 rounded text-sm whitespace-pre-wrap">
            {formatMessage()}
          </pre>
          <button
            onClick={() => navigator.clipboard.writeText(formatMessage())}
            className="mt-2 px-3 py-1 bg-rose-500 text-white rounded-md text-sm"
          >
            Copy Message
          </button>
        </div>
      ), {
        duration: 10000,
        style: {
          maxWidth: '500px'
        }
      });
    }
  };

  const handleContinueToMessages = () => {
    setShowInstructions(false);
    window.location.href = messageUrl;
  };

  if (loading) {
    return <div className="animate-pulse">Loading guardians...</div>;
  }

  return (
    <>
      <div className="space-y-4">
        {guardians.length > 0 && (
          <button
            onClick={handleMessageClick}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600 transition-colors mb-4"
          >
            <MessageCircle className="h-5 w-5" />
            <span>Message Parents/Guardians</span>
          </button>
        )}

        <div className="divide-y divide-gray-200">
          {guardians.map((guardian) => (
            <div key={guardian.id} className="py-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">
                    {guardian.firstName} {guardian.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{guardian.phoneNumber}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {guardians.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            <User className="h-8 w-8 mx-auto mb-2" />
            <p>No guardians added yet</p>
          </div>
        )}
      </div>

      <MessagingInstructionsModal
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
        onContinue={handleContinueToMessages}
      />
    </>
  );
}
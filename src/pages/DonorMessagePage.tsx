import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { MessageCircle, ArrowLeft, Check, Loader } from 'lucide-react';
import MessagingInstructionsModal from '../components/MessagingInstructionsModal';
import toast from 'react-hot-toast';
import { Campaign, Participant } from '../types';

export default function DonorMessagePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showInstructions, setShowInstructions] = useState(false);
  const [messageUrl, setMessageUrl] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const { donor, messageId, message, campaignId, participantId } = location.state;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [campaignDoc, participantDoc] = await Promise.all([
          getDoc(doc(db, 'campaigns', campaignId)),
          getDoc(doc(db, `campaigns/${campaignId}/participants/${participantId}`))
        ]);

        if (campaignDoc.exists() && participantDoc.exists()) {
          setCampaign(campaignDoc.data() as Campaign);
          setParticipant(participantDoc.data() as Participant);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load message data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [campaignId, participantId]);

  const formatMessage = () => {
    if (!campaign || !participant) return message;

    return message
      .replace(/{donorFirstName}/g, donor.firstName)
      .replace(/{donorLastName}/g, donor.lastName)
      .replace(/{participantFirstName}/g, participant.firstName)
      .replace(/{participantLastName}/g, participant.lastName)
      .replace(/{participantName}/g, `${participant.firstName} ${participant.lastName}`)
      .replace(/{organizationName}/g, campaign.organizationName || '')
      .replace(/{ownerTitle}/g, campaign.ownerTitle || '')
      .replace(/{donationUrl}/g, campaign.donationUrl || '');
  };

  const handleSendMessage = () => {
    const formattedMessage = formatMessage();
    const encodedMessage = encodeURIComponent(formattedMessage);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    const smsUrl = isIOS
      ? `sms://open?addresses=${donor.phoneNumber}&body=${encodedMessage}`
      : `sms:${donor.phoneNumber}?body=${encodedMessage}`;

    // Check if we're on a mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      setMessageUrl(smsUrl);
      setShowInstructions(true);
    } else {
      // For desktop browsers, show a toast with instructions
      toast((t) => (
        <div>
          <p className="font-medium mb-2">To message this donor:</p>
          <ol className="list-decimal ml-4 space-y-1">
            <li>Open your phone's messaging app</li>
            <li>Create a new message to: {donor.phoneNumber}</li>
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

  const handleConfirmSent = async () => {
    try {
      const donorRef = doc(db, `campaigns/${campaignId}/participants/${participantId}/donors/${donor.id}`);
      await updateDoc(donorRef, {
        [`messageStatuses.${messageId}`]: {
          sent: true,
          sentAt: new Date().toISOString()
        }
      });
      toast.success('Message marked as sent');
      navigate(`/participants/${participantId}`);
    } catch (error) {
      console.error('Error updating message status:', error);
      toast.error('Failed to update message status');
    }
  };

  const handleContinueToMessages = () => {
    setShowInstructions(false);
    window.location.href = messageUrl;
    setShowConfirmation(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader className="h-8 w-8 text-rose-500 animate-spin" />
      </div>
    );
  }

  if (!campaign || !participant) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 text-center">
        <p className="text-gray-600">Unable to load message data</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-rose-600 hover:text-rose-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-5 w-5 mr-1" />
        Back to Donor List
      </button>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <MessageCircle className="h-12 w-12 text-rose-500 mx-auto mb-2" />
          <h1 className="text-2xl font-bold text-gray-900">
            Message to {donor.firstName} {donor.lastName}
          </h1>
          <p className="text-gray-600 mt-2">{donor.phoneNumber}</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h2 className="text-sm font-medium text-gray-700 mb-2">Message Preview:</h2>
          <p className="text-gray-800 whitespace-pre-wrap">{formatMessage()}</p>
        </div>

        {!showConfirmation ? (
          <button
            onClick={handleSendMessage}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-rose-500 text-white rounded-md hover:bg-rose-600 transition-colors"
          >
            <MessageCircle className="h-5 w-5" />
            <span>Send Message</span>
          </button>
        ) : (
          <button
            onClick={handleConfirmSent}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
          >
            <Check className="h-5 w-5" />
            <span>Mark Message as Sent</span>
          </button>
        )}
      </div>

      <MessagingInstructionsModal
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
        onContinue={handleContinueToMessages}
      />
    </div>
  );
}
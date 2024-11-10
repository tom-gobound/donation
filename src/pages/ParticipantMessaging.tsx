import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, query, setDoc, addDoc, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, MessageCircle, Save, Users, Clock, History, X } from 'lucide-react';
import toast from 'react-hot-toast';
import MessagingInstructionsModal from '../components/MessagingInstructionsModal';

interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  hasMessagedGuardians?: boolean;
  hasSkippedGuardians?: boolean;
}

interface MessageHistory {
  id: string;
  sentAt: string;
  sentBy: string;
  message: string;
}

const DEFAULT_MESSAGE = {
  owner: `Hi {participantFirstName}, this is {ownerTitle}. Please help us with the {organizationName} fundraiser by adding potential donors to your list. We would like to You can also invite your parents/guardians to help create the list. Click the link below to get started:\n\n{participantUrl}`,
  facilitator: `Hi {participantFirstName}, this is {userFirstName} {userLastName} helping {ownerTitle} with the {organizationName} fundraiser. Please help us by adding potential donors to your list. You can also invite your parents/guardians to help create the list. Click the link below to get started:\n\n{participantUrl}`
};

export default function ParticipantMessaging() {
  const { campaignId } = useParams();
  const { currentUser } = useAuth();
  const [campaign, setCampaign] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messageTemplate, setMessageTemplate] = useState('');
  const [userRole, setUserRole] = useState<'owner' | 'facilitator'>('owner');
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [messageUrl, setMessageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [messageHistory, setMessageHistory] = useState<MessageHistory[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!campaignId || !currentUser) return;

      try {
        // Fetch campaign details
        const campaignDoc = await getDoc(doc(db, 'campaigns', campaignId));
        if (!campaignDoc.exists()) {
          toast.error('Campaign not found');
          return;
        }
        const campaignData = campaignDoc.data();
        setCampaign(campaignData);

        // Fetch user profile
        const userProfileDoc = await getDoc(doc(db, 'userProfiles', currentUser.uid));
        if (userProfileDoc.exists()) {
          setUserProfile(userProfileDoc.data());
        }

        // Determine user role
        const role = campaignData.ownerId === currentUser.uid ? 'owner' : 'facilitator';
        setUserRole(role);

        // Fetch user-specific message template or set default based on role
        const templateDoc = await getDoc(
          doc(db, `campaigns/${campaignId}/messageTemplates/${currentUser.uid}/participant/default`)
        );
        
        if (templateDoc.exists()) {
          setMessageTemplate(templateDoc.data().content);
        } else {
          setMessageTemplate(DEFAULT_MESSAGE[role]);
        }

        // Fetch all participants
        const participantsRef = collection(db, `campaigns/${campaignId}/participants`);
        const participantsSnap = await getDocs(query(participantsRef));
        const participantsList = participantsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Participant[];
        
        setParticipants(participantsList);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [campaignId, currentUser]);

  const handleSaveTemplate = async () => {
    if (!currentUser || !campaignId) return;

    setIsSaving(true);
    try {
      await setDoc(
        doc(db, `campaigns/${campaignId}/messageTemplates/${currentUser.uid}/participant/default`), 
        {
          content: messageTemplate,
          type: 'participant',
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser.uid
        }
      );
      toast.success('Template saved successfully');
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  const formatMessage = (participant: Participant) => {
    if (!campaign || !currentUser) return '';

    const participantUrl = `${window.location.origin}/participants/${participant.id}`;
    let message = messageTemplate
      .replace(/{participantFirstName}/g, participant.firstName)
      .replace(/{participantLastName}/g, participant.lastName)
      .replace(/{ownerTitle}/g, campaign.ownerTitle)
      .replace(/{organizationName}/g, campaign.organizationName)
      .replace(/{participantUrl}/g, participantUrl);

    // Add user name for facilitator messages
    if (userRole === 'facilitator' && userProfile) {
      message = message
        .replace(/{userFirstName}/g, userProfile.firstName || '')
        .replace(/{userLastName}/g, userProfile.lastName || '');
    }

    return message;
  };

  const loadMessageHistory = async (participant: Participant) => {
    if (!campaignId || !currentUser) return;

    try {
      const messagesRef = collection(
        db, 
        `campaigns/${campaignId}/participants/${participant.id}/messages`
      );
      const messagesQuery = query(messagesRef, orderBy('sentAt', 'desc'));
      const messagesSnap = await getDocs(messagesQuery);
      
      setMessageHistory(messagesSnap.docs
        .filter(doc => doc.data().sentBy === currentUser.uid)
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as MessageHistory[]);
    } catch (error) {
      console.error('Error loading message history:', error);
      toast.error('Failed to load message history');
    }
  };

  const handleViewHistory = async (participant: Participant) => {
    setSelectedParticipant(participant);
    await loadMessageHistory(participant);
    setShowHistory(true);
  };

  const handleSendMessage = async (participant: Participant) => {
    if (!currentUser || !campaignId) return;

    const message = formatMessage(participant);
    const encodedMessage = encodeURIComponent(message);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    const smsUrl = isIOS
      ? `sms://open?addresses=${participant.phoneNumber}&body=${encodedMessage}`
      : `sms:${participant.phoneNumber}?body=${encodedMessage}`;

    // Log the message
    try {
      await addDoc(
        collection(db, `campaigns/${campaignId}/participants/${participant.id}/messages`),
        {
          message,
          sentAt: new Date().toISOString(),
          sentBy: currentUser.uid
        }
      );

      // Refresh message history if this is the selected participant
      if (selectedParticipant?.id === participant.id) {
        await loadMessageHistory(participant);
      }
    } catch (error) {
      console.error('Error logging message:', error);
      toast.error('Failed to log message');
      return;
    }

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      setMessageUrl(smsUrl);
      setShowInstructions(true);
    } else {
      toast((t) => (
        <div>
          <p className="font-medium mb-2">To message {participant.firstName}:</p>
          <ol className="list-decimal ml-4 space-y-1">
            <li>Open your messaging app</li>
            <li>Create a new message to: {participant.phoneNumber}</li>
            <li>Copy and paste this message:</li>
          </ol>
          <pre className="mt-2 p-2 bg-gray-100 rounded text-sm whitespace-pre-wrap">
            {message}
          </pre>
          <button
            onClick={() => navigator.clipboard.writeText(message)}
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-0 py-8">
      <Link
        to={`/campaigns/${campaignId}`}
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to Campaign
      </Link>

      <div className="bg-white rounded-lg shadow-md p-2 mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Message Participants</h1>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message Template
          </label>
          <textarea
            value={messageTemplate}
            onChange={(e) => setMessageTemplate(e.target.value)}
            rows={4}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
          />
          <p className="mt-2 text-sm text-gray-500">
            Available variables: {'{participantFirstName}'}, {'{ownerTitle}'}, {'{organizationName}'}
            {userRole === 'facilitator' && <>, {'{userFirstName}'}, {'{userLastName}'}</>}
          </p>
          <div className="mt-4">
            <button
              onClick={handleSaveTemplate}
              disabled={isSaving}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? 'Saving...' : 'Save Template Message'}</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {participants.map((participant) => (
            <div
              key={participant.id}
              className="bg-white p-4 rounded-lg shadow-sm border"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {participant.firstName} {participant.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{participant.phoneNumber}</p>
                  <div className="mt-1 text-xs text-gray-500">
                    {participant.hasMessagedGuardians ? (
                      <span className="text-green-600">Has messaged guardians</span>
                    ) : participant.hasSkippedGuardians ? (
                      <span className="text-yellow-600">Skipped guardian step</span>
                    ) : (
                      <span className="text-gray-500">Hasn't started yet</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleViewHistory(participant)}
                    className="flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-md hover:bg-gray-200 transition-colors"
                  >
                    <History className="h-4 w-4" />
                    <span>History</span>
                  </button>
                  <button
                    onClick={() => handleSendMessage(participant)}
                    className="flex items-center space-x-1 px-3 py-1 bg-rose-500 text-white text-sm rounded-md hover:bg-rose-600 transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Send</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {participants.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-gray-500">No participants found</p>
            </div>
          )}
        </div>
      </div>

      {/* Message History Modal */}
      {showHistory && selectedParticipant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Message History - {selectedParticipant.firstName} {selectedParticipant.lastName}
              </h2>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {messageHistory.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {messageHistory.map((message) => (
                    <div key={message.id} className="py-4">
                      <p className="text-sm text-gray-500 mb-2">
                        Sent on {new Date(message.sentAt).toLocaleString()}
                      </p>
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {message.message}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No messages sent yet
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <MessagingInstructionsModal
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
        onContinue={() => {
          window.location.href = messageUrl;
          setShowInstructions(false);
        }}
      />
    </div>
  );
}
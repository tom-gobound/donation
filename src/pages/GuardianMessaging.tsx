import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, query, setDoc, addDoc, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, MessageCircle, Save, Users, Clock, History, X } from 'lucide-react';
import toast from 'react-hot-toast';
import MessagingInstructionsModal from '../components/MessagingInstructionsModal';

interface Guardian {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  participantId: string;
  participantName: string;
  participantFirstName: string;
  participantLastName: string;
  lastMessageSent?: string;
}

interface MessageHistory {
  id: string;
  sentAt: string;
  sentBy: string;
  message: string;
}

interface ParticipantGroup {
  participantName: string;
  participantId: string;
  guardians: Guardian[];
}

const DEFAULT_MESSAGE = {
  owner: `Hi {guardianFirstName} this is {ownerTitle} and I am running a donation campaign for the {organizationName} and would like you to help {participantFirstName} enter a list of potential donors. Please click the link below to help. Thanks!`,
  facilitator: `Hi {guardianFirstName}, this is {userFirstName} {userLastName} and I am helping {ownerTitle} with their {organizationName} donation campaign. We would like you to help {participantFirstName} enter a list of potential donors. Please click the link below to help. Thanks!`
};

export default function GuardianMessaging() {
  const { campaignId } = useParams();
  const { currentUser } = useAuth();
  const [campaign, setCampaign] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [messageTemplate, setMessageTemplate] = useState('');
  const [userRole, setUserRole] = useState<'owner' | 'facilitator'>('owner');
  const [selectedGuardian, setSelectedGuardian] = useState<Guardian | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [messageUrl, setMessageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [messageHistory, setMessageHistory] = useState<MessageHistory[]>([]);

  // Group guardians by participant
  const groupedGuardians = guardians.reduce((groups: ParticipantGroup[], guardian) => {
    const existingGroup = groups.find(g => g.participantId === guardian.participantId);
    if (existingGroup) {
      existingGroup.guardians.push(guardian);
    } else {
      groups.push({
        participantName: guardian.participantName,
        participantId: guardian.participantId,
        guardians: [guardian]
      });
    }
    return groups;
  }, []);

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
          doc(db, `campaigns/${campaignId}/messageTemplates/${currentUser.uid}/guardian/default`)
        );
        
        if (templateDoc.exists()) {
          setMessageTemplate(templateDoc.data().content);
        } else {
          setMessageTemplate(DEFAULT_MESSAGE[role]);
        }

        // Fetch all participants and their guardians
        const participantsRef = collection(db, `campaigns/${campaignId}/participants`);
        const participantsSnap = await getDocs(query(participantsRef));
        
        const guardiansPromises = participantsSnap.docs.map(async (participantDoc) => {
          const participantData = participantDoc.data();
          const guardiansRef = collection(db, `campaigns/${campaignId}/participants/${participantDoc.id}/guardians`);
          const guardiansSnap = await getDocs(query(guardiansRef));
          
          return Promise.all(guardiansSnap.docs.map(async (guardianDoc) => {
            // Get last message sent by this user
            const messagesRef = collection(db, `campaigns/${campaignId}/participants/${participantDoc.id}/guardians/${guardianDoc.id}/messages`);
            const messagesQuery = query(messagesRef, orderBy('sentAt', 'desc'));
            const messagesSnap = await getDocs(messagesQuery);
            const lastMessage = messagesSnap.docs.find(doc => doc.data().sentBy === currentUser.uid)?.data().sentAt;

            return {
              id: guardianDoc.id,
              ...guardianDoc.data(),
              participantId: participantDoc.id,
              participantName: `${participantData.firstName} ${participantData.lastName}`,
              participantFirstName: participantData.firstName,
              participantLastName: participantData.lastName,
              lastMessageSent: lastMessage
            };
          }));
        });

        const allGuardians = (await Promise.all(guardiansPromises)).flat();
        setGuardians(allGuardians as Guardian[]);
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
        doc(db, `campaigns/${campaignId}/messageTemplates/${currentUser.uid}/guardian/default`), 
        {
          content: messageTemplate,
          type: 'guardian',
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

  const formatMessage = (guardian: Guardian) => {
    if (!campaign || !currentUser) return '';

    let message = messageTemplate
      .replace(/{guardianFirstName}/g, guardian.firstName)
      .replace(/{ownerTitle}/g, campaign.ownerTitle)
      .replace(/{organizationName}/g, campaign.organizationName)
      .replace(/{participantFirstName}/g, guardian.participantFirstName)
      .replace(/{participantLastName}/g, guardian.participantLastName);

    // Add user name for facilitator messages
    if (userRole === 'facilitator' && userProfile) {
      message = message
        .replace(/{userFirstName}/g, userProfile.firstName || '')
        .replace(/{userLastName}/g, userProfile.lastName || '');
    }

    const participantDetailUrl = `${window.location.origin}/participants/${guardian.participantId}`;
    return message + `\n\n${participantDetailUrl}`;
  };

  const loadMessageHistory = async (guardian: Guardian) => {
    if (!campaignId || !currentUser) return;

    try {
      const messagesRef = collection(
        db, 
        `campaigns/${campaignId}/participants/${guardian.participantId}/guardians/${guardian.id}/messages`
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

  const handleViewHistory = async (guardian: Guardian) => {
    setSelectedGuardian(guardian);
    await loadMessageHistory(guardian);
    setShowHistory(true);
  };

  const handleSendMessage = async (guardian: Guardian) => {
    if (!currentUser || !campaignId) return;

    const message = formatMessage(guardian);
    const encodedMessage = encodeURIComponent(message);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    const smsUrl = isIOS
      ? `sms://open?addresses=${guardian.phoneNumber}&body=${encodedMessage}`
      : `sms:${guardian.phoneNumber}?body=${encodedMessage}`;

    // Log the message
    try {
      await addDoc(
        collection(db, `campaigns/${campaignId}/participants/${guardian.participantId}/guardians/${guardian.id}/messages`),
        {
          message,
          sentAt: new Date().toISOString(),
          sentBy: currentUser.uid
        }
      );

      // Update guardian's last message sent time in the UI
      setGuardians(guardians.map(g => 
        g.id === guardian.id 
          ? { ...g, lastMessageSent: new Date().toISOString() }
          : g
      ));

      // Refresh message history if this is the selected guardian
      if (selectedGuardian?.id === guardian.id) {
        await loadMessageHistory(guardian);
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
          <p className="font-medium mb-2">To message {guardian.firstName}:</p>
          <ol className="list-decimal ml-4 space-y-1">
            <li>Open your messaging app</li>
            <li>Create a new message to: {guardian.phoneNumber}</li>
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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Message Parents/Guardians</h1>

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
            Available variables: {'{guardianFirstName}'}, {'{ownerTitle}'}, {'{organizationName}'}, 
            {'{participantFirstName}'}, {'{participantLastName}'}
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

        <div className="space-y-6">
          {groupedGuardians.map((group) => (
            <div key={group.participantId} className="bg-gray-50 rounded-lg p-2">
              <h3 className="font-medium text-gray-900 mb-3">
                {group.participantName}
              </h3>
              <div className="space-y-3">
                {group.guardians.map((guardian) => (
                  <div
                    key={guardian.id}
                    className="bg-white p-3 rounded-lg shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {guardian.firstName} {guardian.lastName}
                        </p>
                        {guardian.lastMessageSent && (
                          <p className="text-xs text-gray-500 mt-1">
                            <Clock className="h-3 w-3 inline mr-1" />
                            Last messaged: {new Date(guardian.lastMessageSent).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewHistory(guardian)}
                          className="flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-md hover:bg-gray-200 transition-colors"
                        >
                          <History className="h-4 w-4" />
                          <span>History</span>
                        </button>
                        <button
                          onClick={() => handleSendMessage(guardian)}
                          className="flex items-center space-x-1 px-3 py-1 bg-rose-500 text-white text-sm rounded-md hover:bg-rose-600 transition-colors"
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span>Send</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {groupedGuardians.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-gray-500">No guardians found</p>
            </div>
          )}
        </div>
      </div>

      {/* Message History Modal */}
      {showHistory && selectedGuardian && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Message History - {selectedGuardian.firstName} {selectedGuardian.lastName}
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
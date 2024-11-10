import React, { useState } from 'react';
import { X, Send, Users, UserCog, MessageCircle } from 'lucide-react';
import { addDoc, collection, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import MessagingInstructionsModal from './MessagingInstructionsModal';

interface Props {
  campaignId: string;
  campaignName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function InviteUserModal({ campaignId, campaignName, isOpen, onClose }: Props) {
  const { currentUser } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<'owner' | 'facilitator'>('facilitator');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMessagingModal, setShowMessagingModal] = useState(false);
  const [messageUrl, setMessageUrl] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSubmitting(true);
    try {
      // Get user's profile for the invitation message
      const userProfileDoc = await getDoc(doc(db, 'userProfiles', currentUser.uid));
      const userProfile = userProfileDoc.data();
      const inviterName = userProfile ? 
        `${userProfile.firstName} ${userProfile.lastName}` : 
        currentUser.email?.split('@')[0] || 'Someone';

      const inviteDoc = await addDoc(collection(db, `campaigns/${campaignId}/invites`), {
        firstName,
        lastName,
        phoneNumber,
        role,
        status: 'pending',
        createdAt: new Date(),
        createdBy: currentUser.uid
      });

      const inviteUrl = `${window.location.origin}/invites/${campaignId}/${inviteDoc.id}`;
      const message = `${inviterName} is inviting you to manage ${campaignName}. Click the following link to accept the invitation:\n\n${inviteUrl}`;
      
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const encodedMessage = encodeURIComponent(message);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      const smsUrl = isIOS
        ? `sms://open?addresses=${phoneNumber}&body=${encodedMessage}`
        : `sms:${phoneNumber}?body=${encodedMessage}`;

      if (isMobile) {
        setMessageUrl(smsUrl);
        setShowMessagingModal(true);
      } else {
        toast((t) => (
          <div>
            <p className="font-medium mb-2">To invite {firstName}:</p>
            <ol className="list-decimal ml-4 space-y-1">
              <li>Open your messaging app</li>
              <li>Create a new message to: {phoneNumber}</li>
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

      setFirstName('');
      setLastName('');
      setPhoneNumber('');
      if (!isMobile) {
        onClose();
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error('Failed to send invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinueToMessages = () => {
    window.location.href = messageUrl;
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Invite User</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
              />
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                type="tel"
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole('owner')}
                  className={`flex flex-col items-center p-4 rounded-lg border ${
                    role === 'owner' 
                      ? 'border-rose-500 bg-rose-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Users className={`h-6 w-6 ${role === 'owner' ? 'text-rose-500' : 'text-gray-400'}`} />
                  <span className={`mt-1 text-sm ${role === 'owner' ? 'text-rose-700' : 'text-gray-600'}`}>
                    Owner
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('facilitator')}
                  className={`flex flex-col items-center p-4 rounded-lg border ${
                    role === 'facilitator' 
                      ? 'border-rose-500 bg-rose-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <UserCog className={`h-6 w-6 ${role === 'facilitator' ? 'text-rose-500' : 'text-gray-400'}`} />
                  <span className={`mt-1 text-sm ${role === 'facilitator' ? 'text-rose-700' : 'text-gray-600'}`}>
                    Facilitator
                  </span>
                </button>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600 disabled:opacity-50"
              >
                <MessageCircle className="h-4 w-4" />
                <span>{isSubmitting ? 'Sending...' : 'Send Invitation'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <MessagingInstructionsModal
        isOpen={showMessagingModal}
        onClose={() => setShowMessagingModal(false)}
        onContinue={handleContinueToMessages}
      />
    </>
  );
}
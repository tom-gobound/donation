import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Eye, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import MessagePreview from './MessagePreview';
import DonorMessageList from './DonorMessageList';

interface Props {
  userRole: 'owner' | 'facilitator';
}

export default function CreateCampaignForm({ userRole }: Props) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewType, setPreviewType] = useState<'guardian' | 'donor' | null>(null);
  const [previewMessageId, setPreviewMessageId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    organizationName: '',
    description: '',
    ownerTitle: '',
    targetDonorCount: 10,
    donationUrl: '',
    templateMessageToGuardians: getDefaultGuardianMessage(),
    donorMessages: [
      {
        id: '1',
        order: 1,
        content: getDefaultInitialMessage(),
        isActive: true
      },
      {
        id: '2',
        order: 2,
        content: getDefaultFollowUpMessage(),
        isActive: false
      }
    ]
  });

  function getDefaultGuardianMessage() {
    return `Hi, {ownerTitle} has asked us to get {targetDonorCount} potential donors for the {organizationName} fundraiser. Can you help me make a list of family members or friends who might want to donate?`;
  }

  function getDefaultInitialMessage() {
    return `Hi {donorFirstName}, this is {participantFirstName} {participantLastName} and I'm participating in the {organizationName} fundraiser. Would you consider making a donation to support our program? You can learn more and donate here:\n\n{donationUrl}`;
  }

  function getDefaultFollowUpMessage() {
    return `Hi {donorFirstName}, this is {participantFirstName} {participantLastName} and I'm following up about the {organizationName} fundraiser. I noticed you haven't had a chance to donate yet. Any amount would help us reach our goal. Here's the link again:\n\n{donationUrl}`;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSubmitting(true);
    try {
      const campaignData = {
        ...formData,
        ownerId: userRole === 'owner' ? currentUser.uid : null,
        facilitatorIds: userRole === 'facilitator' ? [currentUser.uid] : [],
        createdAt: new Date(),
        createdBy: {
          id: currentUser.uid,
          role: userRole
        }
      };

      const campaignsRef = collection(db, 'campaigns');
      const docRef = await addDoc(campaignsRef, campaignData);
      
      toast.success('Campaign created successfully');
      navigate(`/campaigns/${docRef.id}`);
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign');
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleActivateMessage = async (messageId: string) => {
    setFormData(prev => ({
      ...prev,
      donorMessages: prev.donorMessages.map(msg => ({
        ...msg,
        isActive: msg.id === messageId
      }))
    }));
  };

  const handleUpdateMessage = async (messageId: string, content: string) => {
    setFormData(prev => ({
      ...prev,
      donorMessages: prev.donorMessages.map(msg =>
        msg.id === messageId ? { ...msg, content } : msg
      )
    }));
  };

  const handleDeleteMessage = async (messageId: string) => {
    setFormData(prev => ({
      ...prev,
      donorMessages: prev.donorMessages
        .filter(msg => msg.id !== messageId)
        .map((msg, index) => ({
          ...msg,
          order: index + 1
        }))
    }));
  };

  const handleAddMessage = () => {
    setFormData(prev => ({
      ...prev,
      donorMessages: [
        ...prev.donorMessages,
        {
          id: Date.now().toString(),
          order: prev.donorMessages.length + 1,
          content: getDefaultInitialMessage(),
          isActive: false
        }
      ]
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Campaign Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
          placeholder="e.g., Spring Band Fundraiser"
        />
      </div>

      <div>
        <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700">
          Organization Name
        </label>
        <input
          type="text"
          id="organizationName"
          name="organizationName"
          value={formData.organizationName}
          onChange={handleInputChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
          placeholder="e.g., Lincoln High School Band"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Campaign Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          required
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
        />
      </div>

      <div>
        <label htmlFor="ownerTitle" className="block text-sm font-medium text-gray-700">
          Your Title
        </label>
        <input
          type="text"
          id="ownerTitle"
          name="ownerTitle"
          value={formData.ownerTitle}
          onChange={handleInputChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
          placeholder="e.g., Coach Smith, Mrs. Williams, Dr. Johnson"
        />
      </div>

      <div>
        <label htmlFor="targetDonorCount" className="block text-sm font-medium text-gray-700">
          Target Donors per Participant
        </label>
        <input
          type="number"
          id="targetDonorCount"
          name="targetDonorCount"
          value={formData.targetDonorCount}
          onChange={handleInputChange}
          required
          min="1"
          max="100"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
        />
      </div>

      <div>
        <label htmlFor="donationUrl" className="block text-sm font-medium text-gray-700">
          Donation URL
        </label>
        <input
          type="url"
          id="donationUrl"
          name="donationUrl"
          value={formData.donationUrl}
          onChange={handleInputChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
          placeholder="https://..."
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="templateMessageToGuardians" className="block text-sm font-medium text-gray-700">
          Default Message to Parents/Guardians
        </label>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Available variables: {'{ownerTitle}'}, {'{targetDonorCount}'}
          </p>
          <button
            type="button"
            onClick={() => setPreviewType('guardian')}
            className="inline-flex items-center text-sm text-rose-600 hover:text-rose-700"
          >
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </button>
        </div>
        <textarea
          id="templateMessageToGuardians"
          name="templateMessageToGuardians"
          value={formData.templateMessageToGuardians}
          onChange={handleInputChange}
          required
          rows={4}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Donor Messages
        </label>
        <p className="text-sm text-gray-500">
          Available variables: {'{donorFirstName}'}, {'{organizationName}'}, {'{donationUrl}'}
        </p>
        <DonorMessageList
          messages={formData.donorMessages}
          onActivate={handleActivateMessage}
          onEdit={(message) => {
            setPreviewMessageId(message.id);
            setPreviewType('donor');
          }}
          onDelete={handleDeleteMessage}
          onAdd={handleAddMessage}
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => navigate('/campaigns')}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center space-x-2 px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>{isSubmitting ? 'Creating...' : 'Create Campaign'}</span>
        </button>
      </div>

      {previewType && (
        <MessagePreview
          message={
            previewType === 'guardian'
              ? formData.templateMessageToGuardians
              : formData.donorMessages.find(m => m.id === previewMessageId)?.content || ''
          }
          organizationName={formData.organizationName}
          ownerTitle={formData.ownerTitle}
          targetDonorCount={formData.targetDonorCount}
          donationUrl={formData.donationUrl}
          isOpen={!!previewType}
          onClose={() => {
            setPreviewType(null);
            setPreviewMessageId(null);
          }}
          type={previewType}
          previewTitle={previewType === 'guardian' ? 'Guardian Message' : 'Donor Message'}
        />
      )}
    </form>
  );
}
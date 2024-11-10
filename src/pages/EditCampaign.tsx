import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Save, Loader, MessageCircle, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { Campaign, DonorMessage } from '../types';
import DonorMessageList from '../components/DonorMessageList';
import EditMessageModal from '../components/EditMessageModal';

export default function EditCampaign() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [ownerTitle, setOwnerTitle] = useState('');
  const [targetDonorCount, setTargetDonorCount] = useState(10);
  const [templateMessageToGuardians, setTemplateMessageToGuardians] = useState('');
  const [donorMessages, setDonorMessages] = useState<DonorMessage[]>([]);
  const [editingMessage, setEditingMessage] = useState<DonorMessage | null>(null);

  useEffect(() => {
    async function fetchCampaign() {
      if (!id) return;

      try {
        const campaignDoc = await getDoc(doc(db, 'campaigns', id));
        if (!campaignDoc.exists()) {
          toast.error('Campaign not found');
          navigate('/campaigns');
          return;
        }

        const campaignData = {
          id: campaignDoc.id,
          ...campaignDoc.data()
        } as Campaign;

        // Check if user is authorized (owner or facilitator)
        const isAuthorized = campaignData.ownerId === currentUser?.uid || 
                           campaignData.facilitatorIds?.includes(currentUser?.uid);

        if (!isAuthorized) {
          toast.error('You do not have permission to edit this campaign');
          navigate('/campaigns');
          return;
        }

        setCampaign(campaignData);
        setName(campaignData.name);
        setDescription(campaignData.description);
        setOrganizationName(campaignData.organizationName || '');
        setOwnerTitle(campaignData.ownerTitle || '');
        setTargetDonorCount(campaignData.targetDonorCount || 10);
        setTemplateMessageToGuardians(campaignData.templateMessageToGuardians || '');
        setDonorMessages(campaignData.donorMessages || []);
      } catch (error) {
        console.error('Error fetching campaign:', error);
        toast.error('Failed to load campaign');
        navigate('/campaigns');
      } finally {
        setLoading(false);
      }
    }

    fetchCampaign();
  }, [id, navigate, currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !campaign) return;

    setSaving(true);
    try {
      const campaignRef = doc(db, 'campaigns', id);
      await updateDoc(campaignRef, {
        name,
        description,
        organizationName,
        ownerTitle,
        targetDonorCount,
        templateMessageToGuardians,
        updatedAt: new Date()
      });

      toast.success('Campaign updated successfully');
      navigate(`/campaigns/${id}`);
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast.error('Failed to update campaign');
    } finally {
      setSaving(false);
    }
  };

  const handleAddMessage = async () => {
    if (!id) return;

    const newMessage: DonorMessage = {
      id: Date.now().toString(),
      order: donorMessages.length + 1,
      content: 'Hi {donorFirstName}, ',
      isActive: false
    };

    try {
      const campaignRef = doc(db, 'campaigns', id);
      await updateDoc(campaignRef, {
        donorMessages: arrayUnion(newMessage)
      });
      setDonorMessages([...donorMessages, newMessage]);
      toast.success('New message added');
    } catch (error) {
      console.error('Error adding message:', error);
      toast.error('Failed to add message');
    }
  };

  const handleActivateMessage = async (messageId: string) => {
    if (!id) return;

    const updatedMessages = donorMessages.map(msg => ({
      ...msg,
      isActive: msg.id === messageId
    }));

    try {
      const campaignRef = doc(db, 'campaigns', id);
      await updateDoc(campaignRef, {
        donorMessages: updatedMessages
      });
      setDonorMessages(updatedMessages);
    } catch (error) {
      console.error('Error activating message:', error);
      throw error;
    }
  };

  const handleUpdateMessage = async (content: string) => {
    if (!id || !editingMessage) return;

    const updatedMessages = donorMessages.map(msg =>
      msg.id === editingMessage.id ? { ...msg, content } : msg
    );

    try {
      const campaignRef = doc(db, 'campaigns', id);
      await updateDoc(campaignRef, {
        donorMessages: updatedMessages
      });
      setDonorMessages(updatedMessages);
      toast.success('Message updated successfully');
    } catch (error) {
      console.error('Error updating message:', error);
      throw error;
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!id) return;

    const messageToDelete = donorMessages.find(msg => msg.id === messageId);
    if (!messageToDelete) return;

    try {
      const campaignRef = doc(db, 'campaigns', id);
      await updateDoc(campaignRef, {
        donorMessages: arrayRemove(messageToDelete)
      });
      
      // Update order of remaining messages
      const remainingMessages = donorMessages
        .filter(msg => msg.id !== messageId)
        .map((msg, index) => ({
          ...msg,
          order: index + 1
        }));
      
      await updateDoc(campaignRef, {
        donorMessages: remainingMessages
      });
      
      setDonorMessages(remainingMessages);
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader className="h-8 w-8 text-rose-500 animate-spin" />
      </div>
    );
  }

  if (!campaign) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Campaign</h1>
      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Campaign Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
              />
            </div>

            <div>
              <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700">
                Organization Name
              </label>
              <input
                type="text"
                id="organizationName"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
                placeholder="e.g., Lincoln High School Band"
              />
              <p className="mt-1 text-sm text-gray-500">
                This name will be used in messages to donors
              </p>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
              />
            </div>

            <div>
              <label htmlFor="ownerTitle" className="block text-sm font-medium text-gray-700">
                Campaign Owner Title
              </label>
              <input
                type="text"
                id="ownerTitle"
                value={ownerTitle}
                onChange={(e) => setOwnerTitle(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
                placeholder="e.g., Coach Smith, Mrs. Williams, Dr. Johnson"
              />
              <p className="mt-1 text-sm text-gray-500">
                This is how participants will refer to you when reaching out to donors
              </p>
            </div>

            <div>
              <label htmlFor="targetDonorCount" className="block text-sm font-medium text-gray-700">
                Target Number of Donors per Participant
              </label>
              <input
                type="number"
                id="targetDonorCount"
                value={targetDonorCount}
                onChange={(e) => setTargetDonorCount(parseInt(e.target.value, 10))}
                required
                min="1"
                max="100"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                The number of potential donors each participant should aim to collect
              </p>
            </div>

            <div>
              <label htmlFor="templateMessageToGuardians" className="block text-sm font-medium text-gray-700">
                Default Message to Parents/Guardians
              </label>
              <textarea
                id="templateMessageToGuardians"
                value={templateMessageToGuardians}
                onChange={(e) => setTemplateMessageToGuardians(e.target.value)}
                required
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Available variables: {'{campaignName}'}, {'{ownerTitle}'}, {'{participantName}'}, {'{targetDonorCount}'}
                <br />When participants send a message to their parents/guardians to help get a list of potential donors, this is the default message they will send.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate(`/campaigns/${id}`)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5 text-gray-500" />
              <h2 className="text-lg font-semibold">Donor Messages</h2>
            </div>
            <button
              onClick={handleAddMessage}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Message</span>
            </button>
          </div>

          <DonorMessageList
            messages={donorMessages}
            onActivate={handleActivateMessage}
            onEdit={setEditingMessage}
            onDelete={handleDeleteMessage}
          />
        </div>
      </div>

      {editingMessage && (
        <EditMessageModal
          message={editingMessage}
          onSave={handleUpdateMessage}
          onClose={() => setEditingMessage(null)}
        />
      )}
    </div>
  );
}
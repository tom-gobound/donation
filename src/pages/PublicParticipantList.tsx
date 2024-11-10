import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, getDocs, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserPlus, Search, X, QrCode } from 'lucide-react';
import QRCode from 'qrcode.react';
import toast from 'react-hot-toast';

interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

interface Campaign {
  name: string;
  organizationName: string;
}

export default function PublicParticipantList() {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: ''
  });

  const currentUrl = window.location.href;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const campaignDoc = await getDoc(doc(db, 'campaigns', campaignId!));
        if (!campaignDoc.exists()) {
          toast.error('Campaign not found');
          return;
        }
        setCampaign(campaignDoc.data() as Campaign);

        const participantsRef = collection(db, `campaigns/${campaignId}/participants`);
        const participantsSnap = await getDocs(query(participantsRef));
        const participantsList = participantsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Participant[];
        setParticipants(participantsList);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Error loading participants');
      } finally {
        setLoading(false);
      }
    };

    if (campaignId) {
      fetchData();
    }
  }, [campaignId]);

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignId) return;

    try {
      const participantsRef = collection(db, `campaigns/${campaignId}/participants`);
      const docRef = await addDoc(participantsRef, {
        ...formData,
        campaignId,
        createdAt: new Date().toISOString()
      });

      toast.success('Successfully added! Redirecting to your page...');
      setShowAddForm(false);
      navigate(`/participants/${docRef.id}`);
    } catch (error) {
      console.error('Error adding participant:', error);
      toast.error('Failed to add participant');
    }
  };

  const filteredParticipants = participants.filter(p => 
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{campaign?.name}</h1>
            <p className="text-gray-600">{campaign?.organizationName}</p>
          </div>
          <button
            onClick={() => setShowQR(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            <QrCode className="h-4 w-4" />
            <span>Show QR Code</span>
          </button>
        </div>

        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search participants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
            />
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600 transition-colors"
          >
            <UserPlus className="h-5 w-5" />
            <span>Add Yourself</span>
          </button>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredParticipants.map((participant) => (
            <button
              key={participant.id}
              onClick={() => navigate(`/participants/${participant.id}`)}
              className="w-full py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="text-left">
                <h3 className="text-lg font-medium text-gray-900">
                  {participant.firstName} {participant.lastName}
                </h3>
              </div>
            </button>
          ))}
        </div>

        {filteredParticipants.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No participants found</p>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Scan to View Participants</h2>
              <button onClick={() => setShowQR(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex justify-center mb-4">
              <QRCode value={currentUrl} size={256} />
            </div>
            <p className="text-center text-gray-600 text-sm">
              Scan this QR code to open the participant list on another device
            </p>
          </div>
        </div>
      )}

      {/* Add Participant Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add Yourself as Participant</h2>
              <button onClick={() => setShowAddForm(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddParticipant} className="space-y-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
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
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
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
                  required
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600"
                >
                  Add & Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
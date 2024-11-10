import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Participant } from '../types';
import ParticipantList from '../components/ParticipantList';
import AddParticipantForm from '../components/AddParticipantForm';
import ParticipantImport from '../components/ParticipantImport';
import InviteUserModal from '../components/InviteUserModal';
import {
  User,
  Phone,
  Link as LinkIcon,
  Copy,
  Loader,
  Users,
  Target,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Edit2,
  BarChart,
  Heart,
  MoreVertical,
  ChevronDown,
  MessageCircle,
  ClipboardList,
  Shield,
  ShieldCheck,
  Menu,
  X,
  UserPlus
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [campaign, setCampaign] = useState<any>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [ownerProfile, setOwnerProfile] = useState<any>(null);
  const [facilitatorProfiles, setFacilitatorProfiles] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isOwner = currentUser?.uid === campaign?.ownerId;
  const isFacilitator = campaign?.facilitatorIds?.includes(currentUser?.uid);
  const isAuthorized = isOwner || isFacilitator;

  const fetchParticipants = async () => {
    if (!id) return [];

    try {
      const participantsRef = collection(db, `campaigns/${id}/participants`);
      const participantsSnap = await getDocs(query(participantsRef));
      const participantsData = participantsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Participant[];
      setParticipants(participantsData);
      return participantsData;
    } catch (error) {
      console.error('Error fetching participants:', error);
      return [];
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError('Invalid campaign ID');
        setLoading(false);
        return;
      }

      try {
        // Get campaign document
        const campaignDoc = await getDoc(doc(db, 'campaigns', id));
        
        if (!campaignDoc.exists()) {
          setError('Campaign not found');
          setLoading(false);
          return;
        }

        const campaignData = {
          id: campaignDoc.id,
          ...campaignDoc.data()
        };

        // Check authorization if user is logged in
        if (currentUser) {
          const isOwner = campaignData.ownerId === currentUser.uid;
          const isFacilitator = Array.isArray(campaignData.facilitatorIds) && 
                              campaignData.facilitatorIds.includes(currentUser.uid);

          if (!isOwner && !isFacilitator) {
            setError('You do not have permission to view this campaign');
            setLoading(false);
            return;
          }
        }
        
        document.title = campaignData.name;
        setCampaign(campaignData);

        // Fetch owner profile if it exists
        if (campaignData.ownerId) {
          try {
            const ownerDoc = await getDoc(doc(db, 'userProfiles', campaignData.ownerId));
            if (ownerDoc.exists()) {
              setOwnerProfile(ownerDoc.data());
            }
          } catch (error) {
            console.error('Error fetching owner profile:', error);
          }
        }

        // Fetch facilitator profiles if they exist
        if (campaignData.facilitatorIds?.length > 0) {
          try {
            const facilitatorProfiles = await Promise.all(
              campaignData.facilitatorIds.map(async (facilitatorId: string) => {
                const facilitatorDoc = await getDoc(doc(db, 'userProfiles', facilitatorId));
                return facilitatorDoc.exists() ? facilitatorDoc.data() : null;
              })
            );
            setFacilitatorProfiles(facilitatorProfiles.filter(Boolean));
          } catch (error) {
            console.error('Error fetching facilitator profiles:', error);
          }
        }

        await fetchParticipants();
      } catch (error) {
        console.error('Error fetching campaign:', error);
        setError('Failed to load campaign data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      document.title = 'Campaign Manager';
    };
  }, [id, currentUser]);

  // Handle clicking outside of dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">{error || 'Campaign not found'}</p>
          <Link to="/campaigns" className="mt-4 text-rose-600 hover:text-rose-700 inline-block">
            Return to Campaigns
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {isAuthorized && (
        <Link
          to="/campaigns"
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back to Campaigns
        </Link>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {campaign.name}
                </h1>
                <div className="mt-1 text-sm text-gray-500">
                  {ownerProfile && (
                    <div>Owner: {ownerProfile.firstName} {ownerProfile.lastName}</div>
                  )}
                  {facilitatorProfiles.length > 0 && (
                    <div>
                      Facilitators: {facilitatorProfiles.map((profile, index) => (
                        <span key={index}>
                          {profile.firstName} {profile.lastName}
                          {index < facilitatorProfiles.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="md:hidden">
                <button
                  onClick={() => setShowMobileMenu(true)}
                  className="p-2 hover:bg-gray-100 rounded-md"
                >
                  <Menu className="h-6 w-6 text-gray-500" />
                </button>
              </div>
            </div>
            <p className="text-gray-600 mt-2">{campaign.description}</p>
          </div>
          {isAuthorized && (
            <div className="hidden md:flex flex-col sm:flex-row gap-2">
              <Link
                to={`/campaigns/${id}/edit`}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                <Edit2 className="h-4 w-4" />
                <span>Edit Campaign</span>
              </Link>
              
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  <MoreVertical className="h-4 w-4" />
                  <span>More Actions</span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-10 py-1">
                    <Link
                      to={`/campaigns/${id}/progress`}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <BarChart className="h-4 w-4 mr-2" />
                      View Progress
                    </Link>
                    <Link
                      to={`/campaigns/${id}/participants-message`}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Message Participants
                    </Link>
                    <Link
                      to={`/campaigns/${id}/guardians`}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Message Guardians
                    </Link>
                    <Link
                      to={`/campaigns/${id}/donors`}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Heart className="h-4 w-4 mr-2" />
                      Message Donors
                    </Link>
                    <Link
                      to={`/campaigns/${id}/logs`}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <ClipboardList className="h-4 w-4 mr-2" />
                      View Logs
                    </Link>
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite User
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Participants</h2>
          <Link
            to={`/campaigns/${id}/participants`}
            className="flex items-center space-x-2 px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600 transition-colors"
          >
            <Users className="h-4 w-4" />
            <span>View Public List</span>
          </Link>
        </div>

        {isAuthorized && (
          <>
            <ParticipantImport
              campaignId={campaign.id}
              onImportComplete={fetchParticipants}
            />
            <div className="mb-8">
              <AddParticipantForm
                campaignId={campaign.id}
                onAdd={fetchParticipants}
              />
            </div>
          </>
        )}

        <ParticipantList
          participants={participants}
          campaignId={campaign.id}
          isOwner={isAuthorized}
          onUpdate={fetchParticipants}
          onMessage={() => {}}
        />
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden">
          <div className="absolute right-0 top-0 h-full w-64 bg-white shadow-lg">
            <div className="p-4">
              <button
                onClick={() => setShowMobileMenu(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="space-y-2 mt-8">
                {isAuthorized && (
                  <>
                    <Link
                      to={`/campaigns/${id}/edit`}
                      className="flex items-center space-x-2 px-4 py-2 w-full text-left hover:bg-gray-100 rounded-md"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <Edit2 className="h-4 w-4" />
                      <span>Edit Campaign</span>
                    </Link>
                    <Link
                      to={`/campaigns/${id}/progress`}
                      className="flex items-center space-x-2 px-4 py-2 w-full text-left hover:bg-gray-100 rounded-md"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <BarChart className="h-4 w-4" />
                      <span>View Progress</span>
                    </Link>
                    <Link
                      to={`/campaigns/${id}/participants-message`}
                      className="flex items-center space-x-2 px-4 py-2 w-full text-left hover:bg-gray-100 rounded-md"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>Message Participants</span>
                    </Link>
                    <Link
                      to={`/campaigns/${id}/guardians`}
                      className="flex items-center space-x-2 px-4 py-2 w-full text-left hover:bg-gray-100 rounded-md"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <Shield className="h-4 w-4" />
                      <span>Message Guardians</span>
                    </Link>
                    <Link
                      to={`/campaigns/${id}/donors`}
                      className="flex items-center space-x-2 px-4 py-2 w-full text-left hover:bg-gray-100 rounded-md"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <Heart className="h-4 w-4" />
                      <span>Message Donors</span>
                    </Link>
                    <Link
                      to={`/campaigns/${id}/logs`}
                      className="flex items-center space-x-2 px-4 py-2 w-full text-left hover:bg-gray-100 rounded-md"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <ClipboardList className="h-4 w-4" />
                      <span>View Logs</span>
                    </Link>
                    <button
                      onClick={() => {
                        setShowMobileMenu(false);
                        setShowInviteModal(true);
                      }}
                      className="flex items-center space-x-2 px-4 py-2 w-full text-left hover:bg-gray-100 rounded-md"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span>Invite User</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {showInviteModal && (
        <InviteUserModal
          campaignId={id!}
          campaignName={campaign.name}
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </div>
  );
}
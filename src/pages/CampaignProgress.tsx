import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ArrowLeft, Users, UserCheck, MessageCircle, Heart, ChevronDown, ChevronRight } from 'lucide-react';
import { Campaign } from '../types';

interface ParticipantProgress {
  id: string;
  firstName: string;
  lastName: string;
  guardiansCount: number;
  donorsCount: number;
  messagesSent: number;
  totalMessageCount: number;
  lastActivity?: string;
  hasMessagedGuardians: boolean;
  hasSkippedGuardians: boolean;
}

export default function CampaignProgress() {
  const { campaignId } = useParams();
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [progress, setProgress] = useState<ParticipantProgress[]>([]);
  const [expandedParticipant, setExpandedParticipant] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!campaignId) return;

      try {
        // Fetch campaign details
        const campaignDoc = await getDoc(doc(db, 'campaigns', campaignId));
        if (!campaignDoc.exists()) return;
        setCampaign({ id: campaignDoc.id, ...campaignDoc.data() } as Campaign);

        // Fetch all participants and their related data
        const participantsRef = collection(db, `campaigns/${campaignId}/participants`);
        const participantsSnap = await getDocs(participantsRef);
        
        const progressData = await Promise.all(
          participantsSnap.docs.map(async (participantDoc) => {
            const participantId = participantDoc.id;
            const participantData = participantDoc.data();

            // Fetch guardians
            const guardiansSnap = await getDocs(
              collection(db, `campaigns/${campaignId}/participants/${participantId}/guardians`)
            );
            
            // Fetch donors and their message statuses
            const donorsSnap = await getDocs(
              collection(db, `campaigns/${campaignId}/participants/${participantId}/donors`)
            );
            const donors = donorsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Calculate messages sent
            let messagesSent = 0;
            let totalMessageCount = 0;
            donors.forEach(donor => {
              if (donor.messageStatuses) {
                Object.values(donor.messageStatuses).forEach((status: any) => {
                  totalMessageCount++;
                  if (status.sent) messagesSent++;
                });
              }
            });

            // Get last activity timestamp from logs
            const logsSnap = await getDocs(
              collection(db, `campaigns/${campaignId}/participants/${participantId}/logs`)
            );
            
            let lastActivity: string | undefined;
            if (logsSnap.docs.length > 0) {
              const sortedLogs = logsSnap.docs
                .map(doc => {
                  const data = doc.data();
                  const timestamp = data.timestamp?.toDate?.() || data.timestamp;
                  return timestamp ? new Date(timestamp) : null;
                })
                .filter(Boolean)
                .sort((a, b) => b.getTime() - a.getTime());

              if (sortedLogs.length > 0) {
                lastActivity = sortedLogs[0].toISOString();
              }
            }

            return {
              id: participantId,
              firstName: participantData.firstName,
              lastName: participantData.lastName,
              guardiansCount: guardiansSnap.size,
              donorsCount: donorsSnap.size,
              messagesSent,
              totalMessageCount,
              lastActivity,
              hasMessagedGuardians: participantData.hasMessagedGuardians || false,
              hasSkippedGuardians: participantData.hasSkippedGuardians || false
            };
          })
        );

        setProgress(progressData);
      } catch (error) {
        console.error('Error fetching progress data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [campaignId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600">Campaign not found</p>
          <Link
            to="/campaigns"
            className="mt-4 inline-flex items-center text-rose-600 hover:text-rose-700"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Campaigns
          </Link>
        </div>
      </div>
    );
  }

  const calculateOverallProgress = () => {
    if (progress.length === 0) return 0;
    const targetTotal = progress.length * (campaign?.targetDonorCount || 10);
    const currentTotal = progress.reduce((sum, p) => sum + p.donorsCount, 0);
    return Math.round((currentTotal / targetTotal) * 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-rose-500';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link
        to={`/campaigns/${campaignId}`}
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to Campaign
      </Link>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Campaign Progress Report</h1>
        
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Overall Progress</h2>
            <span className="text-2xl font-bold text-gray-900">{calculateOverallProgress()}%</span>
          </div>
          <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getProgressColor(calculateOverallProgress())} transition-all duration-500`}
              style={{ width: `${calculateOverallProgress()}%` }}
            />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <Users className="h-5 w-5 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{progress.length}</div>
              <div className="text-sm text-gray-600">Participants</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <Heart className="h-5 w-5 text-rose-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {progress.reduce((sum, p) => sum + p.donorsCount, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Donors</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <MessageCircle className="h-5 w-5 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {progress.reduce((sum, p) => sum + p.messagesSent, 0)}
              </div>
              <div className="text-sm text-gray-600">Messages Sent</div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {progress.map((participant) => (
            <div key={participant.id} className="border rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedParticipant(
                  expandedParticipant === participant.id ? null : participant.id
                )}
                className="w-full px-4 py-3 flex items-center justify-between bg-white hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <UserCheck className="h-6 w-6 text-gray-400" />
                      <div 
                        className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${
                          participant.donorsCount >= (campaign?.targetDonorCount || 10)
                            ? 'bg-green-500'
                            : participant.donorsCount > 0
                            ? 'bg-yellow-500'
                            : 'bg-gray-300'
                        }`}
                      />
                    </div>
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-medium text-gray-900">
                      {participant.firstName} {participant.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {participant.donorsCount} of {campaign?.targetDonorCount || 10} donors
                    </p>
                  </div>
                </div>
                {expandedParticipant === participant.id ? (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                )}
              </button>

              {expandedParticipant === participant.id && (
                <div className="px-4 py-3 bg-gray-50 border-t">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Parents/Guardians:</span>
                        <span className="font-medium">{participant.guardiansCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Guardian Status:</span>
                        <span className={`text-sm font-medium ${
                          participant.hasMessagedGuardians
                            ? 'text-green-600'
                            : participant.hasSkippedGuardians
                            ? 'text-yellow-600'
                            : 'text-gray-600'
                        }`}>
                          {participant.hasMessagedGuardians
                            ? 'Messaged'
                            : participant.hasSkippedGuardians
                            ? 'Skipped'
                            : 'Pending'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Messages Sent:</span>
                        <span className="font-medium">
                          {participant.messagesSent} / {participant.totalMessageCount}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Last Activity:</span>
                        <span className="text-sm text-gray-600">
                          {participant.lastActivity
                            ? new Date(participant.lastActivity).toLocaleDateString()
                            : 'No activity'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
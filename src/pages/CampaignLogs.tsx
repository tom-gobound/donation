import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ArrowLeft, User, Clock, Activity } from 'lucide-react';
import { format } from 'date-fns';

interface Log {
  id: string;
  action: string;
  timestamp: any;
  addedBy: {
    type: string;
    firstName: string;
    lastName: string;
  };
  donorId?: string;
}

interface Access {
  id: string;
  timestamp: any;
  type: string;
  firstName: string;
  lastName: string;
}

interface ParticipantLogs {
  participant: {
    id: string;
    firstName: string;
    lastName: string;
  };
  logs: Log[];
  accesses: Access[];
}

export default function CampaignLogs() {
  const { campaignId } = useParams();
  const [loading, setLoading] = useState(true);
  const [participantLogs, setParticipantLogs] = useState<ParticipantLogs[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!campaignId) return;

      try {
        // First get all participants
        const participantsRef = collection(db, `campaigns/${campaignId}/participants`);
        const participantsSnap = await getDocs(participantsRef);
        
        const logsPromises = participantsSnap.docs.map(async (participantDoc) => {
          const participantId = participantDoc.id;
          
          // Get logs
          const logsRef = collection(db, `campaigns/${campaignId}/participants/${participantId}/logs`);
          const logsQuery = query(logsRef, orderBy('timestamp', 'desc'));
          const logsSnap = await getDocs(logsQuery);
          
          // Get accesses
          const accessesRef = collection(db, `campaigns/${campaignId}/participants/${participantId}/accesses`);
          const accessesQuery = query(accessesRef, orderBy('timestamp', 'desc'));
          const accessesSnap = await getDocs(accessesQuery);

          return {
            participant: {
              id: participantId,
              ...participantDoc.data()
            },
            logs: logsSnap.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Log[],
            accesses: accessesSnap.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Access[]
          };
        });

        const allLogs = await Promise.all(logsPromises);
        setParticipantLogs(allLogs);
      } catch (error) {
        console.error('Error fetching logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [campaignId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, 'MMM d, yyyy h:mm a');
  };

  const getActionDescription = (log: Log) => {
    switch (log.action) {
      case 'add_donor':
        return 'Added a donor';
      default:
        return log.action;
    }
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

      <h1 className="text-3xl font-bold text-gray-900 mb-8">Activity Logs</h1>

      <div className="space-y-8">
        {participantLogs.map(({ participant, logs, accesses }) => (
          <div key={participant.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {participant.firstName} {participant.lastName}
              </h2>
            </div>

            <div className="divide-y divide-gray-200">
              {/* Page Accesses */}
              {accesses.map((access) => (
                <div key={access.id} className="px-6 py-4 flex items-start">
                  <User className="h-5 w-5 text-blue-500 mt-1 mr-3" />
                  <div className="flex-1">
                    <p className="text-gray-900">
                      <span className="font-medium">
                        {access.firstName} {access.lastName}
                      </span>{' '}
                      ({access.type}) accessed the page
                    </p>
                    <div className="flex items-center mt-1 text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatTimestamp(access.timestamp)}
                    </div>
                  </div>
                </div>
              ))}

              {/* Activity Logs */}
              {logs.map((log) => (
                <div key={log.id} className="px-6 py-4 flex items-start">
                  <Activity className="h-5 w-5 text-green-500 mt-1 mr-3" />
                  <div className="flex-1">
                    <p className="text-gray-900">
                      <span className="font-medium">
                        {log.addedBy.firstName} {log.addedBy.lastName}
                      </span>{' '}
                      ({log.addedBy.type}) {getActionDescription(log)}
                    </p>
                    <div className="flex items-center mt-1 text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatTimestamp(log.timestamp)}
                    </div>
                  </div>
                </div>
              ))}

              {accesses.length === 0 && logs.length === 0 && (
                <div className="px-6 py-4 text-gray-500 text-center">
                  No activity recorded
                </div>
              )}
            </div>
          </div>
        ))}

        {participantLogs.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600">No logs found</p>
          </div>
        )}
      </div>
    </div>
  );
}
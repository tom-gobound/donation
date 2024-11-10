import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'react-hot-toast';
import { Heart, MessageCircle, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Donor, DonorMessage, Campaign } from '../types';

interface DonorListProps {
  participantId: string;
  campaignId: string;
}

export default function DonorList({ participantId, campaignId }: DonorListProps) {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMessage, setActiveMessage] = useState<DonorMessage | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);

  useEffect(() => {
    const donorsRef = collection(db, `campaigns/${campaignId}/participants/${participantId}/donors`);
    const q = query(donorsRef);

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const donorsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Donor[];
        setDonors(donorsList);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching donors:', error);
        toast.error('Error loading donors');
        setLoading(false);
      }
    );

    // Fetch campaign to get active message
    const fetchCampaign = async () => {
      try {
        const campaignDoc = await getDoc(doc(db, 'campaigns', campaignId));
        if (campaignDoc.exists()) {
          const campaignData = campaignDoc.data() as Campaign;
          setCampaign(campaignData);
          const active = campaignData.donorMessages?.find(m => m.isActive);
          if (active) {
            setActiveMessage(active);
          }
        }
      } catch (error) {
        console.error('Error fetching campaign:', error);
      }
    };

    fetchCampaign();
    return () => unsubscribe();
  }, [participantId, campaignId]);

  if (loading) {
    return <div className="animate-pulse">Loading donors...</div>;
  }

  if (!activeMessage) {
    return (
      <div className="text-center py-4 text-gray-500">
        <MessageCircle className="h-8 w-8 mx-auto mb-2" />
        <p>No active message template available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-rose-50 border border-rose-100 rounded-lg p-4 mb-4">
        <h3 className="font-medium text-rose-900 mb-2">Active Message Template:</h3>
        <p className="text-rose-800 text-sm whitespace-pre-wrap">{activeMessage.content}</p>
      </div>

      <ul className="divide-y divide-gray-200">
        {donors.map((donor) => {
          const messageStatus = donor.messageStatuses?.[activeMessage.id];
          
          return (
            <li key={donor.id} className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Heart className="h-5 w-5 text-rose-400" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {donor.firstName} {donor.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{donor.phoneNumber}</p>
                  </div>
                </div>
                
                {messageStatus?.sent ? (
                  <div className="flex items-center text-green-600">
                    <Check className="h-5 w-5 mr-1" />
                    <span className="text-sm">Sent</span>
                  </div>
                ) : (
                  <Link
                    to={`/participants/${participantId}/donors/${donor.id}/message`}
                    state={{ 
                      donor,
                      messageId: activeMessage.id,
                      message: activeMessage.content,
                      campaignId,
                      participantId
                    }}
                    className="inline-flex items-center px-3 py-1 border border-rose-300 text-rose-600 rounded-md hover:bg-rose-50"
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    <span className="text-sm">Send Message</span>
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {donors.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          <Heart className="h-8 w-8 mx-auto mb-2" />
          <p>No donors added yet</p>
        </div>
      )}
    </div>
  );
}
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Participant } from '../types';
import { Trash2, ChevronRight, Edit2, MessageCircle } from 'lucide-react';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import toast from 'react-hot-toast';
import EditParticipantModal from './EditParticipantModal';

interface Props {
  participants: Participant[];
  campaignId: string;
  isOwner: boolean;
  onUpdate: () => void;
  onMessage: (participant: Participant) => void;
}

export default function ParticipantList({ participants, campaignId, isOwner, onUpdate, onMessage }: Props) {
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (participantId: string) => {
    if (!window.confirm('Are you sure you want to delete this participant?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, `campaigns/${campaignId}/participants/${participantId}`));
      toast.success('Participant deleted successfully');
      onUpdate();
    } catch (error) {
      console.error('Error deleting participant:', error);
      toast.error('Failed to delete participant');
    } finally {
      setIsDeleting(false);
    }
  };

  if (participants.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No participants found</p>
      </div>
    );
  }

  return (
    <>
      <div className="divide-y divide-gray-200">
        {participants.map((participant) => (
          <div
            key={participant.id}
            className="py-4 flex items-center justify-between hover:bg-gray-50 rounded-lg px-4"
          >
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {participant.firstName} {participant.lastName}
              </h3>
              <p className="text-gray-500">{participant.phoneNumber}</p>
            </div>
            
            <div className="flex items-center space-x-4">
              {isOwner && (
                <>
                  <button
                    onClick={() => onMessage(participant)}
                    className="text-rose-500 hover:text-rose-700 p-1 rounded-full hover:bg-rose-50"
                    title="Send participant link"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setEditingParticipant(participant)}
                    className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                    disabled={isDeleting}
                  >
                    <Edit2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(participant.id)}
                    className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </>
              )}
              <Link
                to={`/participants/${participant.id}`}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
              >
                <ChevronRight className="h-6 w-6" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {editingParticipant && (
        <EditParticipantModal
          participant={editingParticipant}
          campaignId={campaignId}
          onClose={() => setEditingParticipant(null)}
          onUpdate={onUpdate}
        />
      )}
    </>
  );
}
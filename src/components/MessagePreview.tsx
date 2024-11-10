import React from 'react';
import { Phone, X } from 'lucide-react';

interface Props {
  message: string;
  organizationName: string;
  ownerTitle: string;
  targetDonorCount: number;
  donationUrl: string;
  isOpen: boolean;
  onClose: () => void;
  type: 'guardian' | 'donor';
  previewTitle: string;
}

const SAMPLE_NAMES = {
  participants: [
    { first: 'Emily', last: 'Johnson' },
    { first: 'Michael', last: 'Chen' },
    { first: 'Sofia', last: 'Garcia' },
    { first: 'James', last: 'Williams' }
  ],
  donors: [
    { first: 'Robert', last: 'Smith' },
    { first: 'Maria', last: 'Rodriguez' },
    { first: 'David', last: 'Kim' },
    { first: 'Sarah', last: 'Brown' }
  ]
};

export default function MessagePreview({ 
  message,
  organizationName, 
  ownerTitle, 
  targetDonorCount,
  donationUrl,
  isOpen, 
  onClose,
  type,
  previewTitle
}: Props) {
  if (!isOpen) return null;

  const participant = SAMPLE_NAMES.participants[Math.floor(Math.random() * SAMPLE_NAMES.participants.length)];
  const donor = SAMPLE_NAMES.donors[Math.floor(Math.random() * SAMPLE_NAMES.donors.length)];

  const processMessage = (template: string) => {
    return template
      .replace(/{organizationName}/g, organizationName || '[Organization Name]')
      .replace(/{ownerTitle}/g, ownerTitle || '[Owner Title]')
      .replace(/{targetDonorCount}/g, targetDonorCount.toString())
      .replace(/{participantFirstName}/g, participant.first)
      .replace(/{participantLastName}/g, participant.last)
      .replace(/{participantName}/g, `${participant.first} ${participant.last}`)
      .replace(/{donorFirstName}/g, donor.first)
      .replace(/{donorLastName}/g, donor.last)
      .replace(/{donationUrl}/g, donationUrl || '[Donation URL]');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-100 rounded-2xl max-w-sm w-full shadow-xl overflow-hidden">
        {/* Phone Header */}
        <div className="bg-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <Phone className="h-5 w-5 text-gray-500" />
            <span className="ml-2 font-medium">{previewTitle}</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="p-4 h-96 overflow-y-auto bg-gray-50">
          <div className="flex flex-col space-y-4">
            <div className="flex justify-end">
              <div className="bg-blue-500 text-white rounded-2xl rounded-tr-sm px-4 py-2 max-w-[80%]">
                <p className="text-sm whitespace-pre-wrap">{processMessage(message)}</p>
                <p className="text-xs text-blue-100 mt-1">Today 10:00 AM</p>
              </div>
            </div>
          </div>
        </div>

        {/* Message Input (for visual effect only) */}
        <div className="bg-white p-3 border-t">
          <div className="bg-gray-100 rounded-full px-4 py-2 text-gray-500 text-sm">
            Message
          </div>
        </div>
      </div>
    </div>
  );
}
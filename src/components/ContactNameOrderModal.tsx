import React from 'react';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sampleName: string;
  onSelectFirstName: (isFirstNameFirst: boolean) => void;
}

export default function ContactNameOrderModal({ isOpen, onClose, sampleName, onSelectFirstName }: Props) {
  if (!isOpen) return null;

  const nameParts = sampleName.split(' ');
  if (nameParts.length < 2) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Quick Question</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-gray-600 mb-4">
          To correctly import your contacts, please click on the first name in this example:
        </p>

        <div className="flex justify-center space-x-4">
          <button
            onClick={() => onSelectFirstName(true)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            {nameParts[0]}
          </button>
          <button
            onClick={() => onSelectFirstName(false)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            {nameParts[1]}
          </button>
        </div>

        <p className="text-sm text-gray-500 mt-4 text-center">
          This helps us correctly identify first and last names in your contacts
        </p>
      </div>
    </div>
  );
}
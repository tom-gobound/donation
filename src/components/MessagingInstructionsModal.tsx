import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, Phone } from 'lucide-react';
import backToSafariImage from '/screenshots/iphone_back_to_safari.jpg';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
}

const INSTRUCTIONS_PREFERENCE_KEY = 'hideMessagingInstructions';

export default function MessagingInstructionsModal({ isOpen, onClose, onContinue }: Props) {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  useEffect(() => {
    // Check if user has previously chosen to hide instructions
    const hideInstructions = localStorage.getItem(INSTRUCTIONS_PREFERENCE_KEY) === 'true';
    if (hideInstructions && isOpen) {
      onContinue();
    }
  }, [isOpen, onContinue]);

  const handleContinue = () => {
    if (dontShowAgain) {
      localStorage.setItem(INSTRUCTIONS_PREFERENCE_KEY, 'true');
    }
    onContinue();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Opening Message App</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-rose-600">
            <Phone className="h-6 w-6" />
            <p className="font-medium">Your message app will open automatically</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-medium mb-2">To return to this screen:</p>
            {isIOS ? (
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <ArrowLeft className="h-5 w-5 mt-0.5 text-gray-600" />
                  <p className="text-gray-600">
                    Tap the <span className="font-semibold">Safari</span> button in the 
                    top-left corner of your Messages app
                  </p>
                </div>
                <img 
                  src='https://stackblitz.com/storage/blobs/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBM09oRXc9PSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--309119539ae84f870ec0e303298f02ce43c0b85c/iphone_back_to_safari.jpg'
                  alt="Back to Safari button location" 
                  className="w-full rounded-lg shadow-md"
                />
              </div>
            ) : (
              <div className="flex items-start space-x-3">
                <ArrowLeft className="h-5 w-5 mt-0.5 text-gray-600" />
                <p className="text-gray-600">
                  Use your device's <span className="font-semibold">back button</span> or 
                  switch apps to return to this screen
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center px-2">
            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
              />
              <span className="text-sm text-gray-600">Don't show this message again</span>
            </label>
          </div>

          <button
            onClick={handleContinue}
            className="w-full px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 transition-colors"
          >
            Continue to Messages
          </button>
        </div>
      </div>
    </div>
  );
}
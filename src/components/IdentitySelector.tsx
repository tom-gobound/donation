import React, { useState } from 'react';
import { User, UserPlus, X } from 'lucide-react';

interface Props {
  participant: any;
  guardians: any[];
  onSelect: (identity: { type: string; firstName: string; lastName: string }) => void;
}

export default function IdentitySelector({ participant, guardians, onSelect }: Props) {
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSelect({
      type: 'other',
      firstName: firstName.trim(),
      lastName: lastName.trim()
    });
  };

  if (showCustomForm) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Enter Your Name</h2>
          <button 
            onClick={() => setShowCustomForm(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleCustomSubmit} className="space-y-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
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
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
            />
          </div>
          <button
            type="submit"
            className="w-full flex items-center justify-center px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600"
          >
            <UserPlus className="h-5 w-5 mr-2" />
            Continue
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Who are you?</h2>
      <div className="space-y-4">
        <button
          onClick={() => onSelect({
            type: 'participant',
            firstName: participant.firstName,
            lastName: participant.lastName
          })}
          className="w-full flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
        >
          <User className="h-6 w-6 text-rose-500 mr-3" />
          <div className="text-left">
            <p className="font-medium text-gray-900">I am {participant.firstName} {participant.lastName}</p>
            <p className="text-sm text-gray-500">The participant</p>
          </div>
        </button>

        {guardians.map((guardian) => (
          <button
            key={guardian.id}
            onClick={() => onSelect({
              type: 'guardian',
              firstName: guardian.firstName,
              lastName: guardian.lastName
            })}
            className="w-full flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <User className="h-6 w-6 text-blue-500 mr-3" />
            <div className="text-left">
              <p className="font-medium text-gray-900">I am {guardian.firstName} {guardian.lastName}</p>
              <p className="text-sm text-gray-500">Parent/Guardian</p>
            </div>
          </button>
        ))}

        <button
          onClick={() => setShowCustomForm(true)}
          className="w-full flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
        >
          <UserPlus className="h-6 w-6 text-green-500 mr-3" />
          <div className="text-left">
            <p className="font-medium text-gray-900">I am someone else</p>
            <p className="text-sm text-gray-500">Enter your name</p>
          </div>
        </button>
      </div>
    </div>
  );
}
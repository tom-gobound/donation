import React from 'react';
import { UserCog, Users } from 'lucide-react';

interface Props {
  onSelect: (role: 'owner' | 'facilitator') => void;
}

export default function RoleSelector({ onSelect }: Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Select Your Role</h2>
      <p className="text-gray-600">
        Choose your role in this campaign. This will determine your permissions and responsibilities.
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        <button
          onClick={() => onSelect('owner')}
          className="flex flex-col items-center p-6 bg-white rounded-lg border-2 border-transparent hover:border-rose-500 transition-colors"
        >
          <Users className="h-12 w-12 text-rose-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Campaign Owner</h3>
          <p className="text-sm text-gray-600 text-center">
            You are directly involved with the organization and will be the primary beneficiary 
            of the fundraising efforts (e.g., coach, teacher, program director).
          </p>
        </button>

        <button
          onClick={() => onSelect('facilitator')}
          className="flex flex-col items-center p-6 bg-white rounded-lg border-2 border-transparent hover:border-rose-500 transition-colors"
        >
          <UserCog className="h-12 w-12 text-blue-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Campaign Facilitator</h3>
          <p className="text-sm text-gray-600 text-center">
            You are helping manage the campaign but are not directly involved with the 
            organization (e.g., parent volunteer, fundraising coordinator).
          </p>
        </button>
      </div>
    </div>
  );
}
import React from 'react';
import { Users, User, Heart, UserCircle, ArrowRight } from 'lucide-react';

interface Props {
  onContinue: () => void;
}

export default function TerminologyGuide({ onContinue }: Props) {
  const handleContinue = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onContinue();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Understanding Campaign Roles</h1>
        <p className="mt-2 text-lg text-gray-600">
          Before creating your campaign, let's understand the key roles involved
        </p>
      </div>

      <div className="grid gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 transform transition hover:scale-[1.02]">
          <div className="flex items-start space-x-4">
            <div className="bg-rose-100 rounded-full p-3">
              <UserCircle className="h-6 w-6 text-rose-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Campaign Owner (You)</h2>
              <p className="text-gray-600">
                That's you! As the campaign owner, you create and manage the fundraising campaign. 
                You might be a coach, teacher, director, or organization leader who oversees the 
                fundraising efforts.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 transform transition hover:scale-[1.02]">
          <div className="flex items-start space-x-4">
            <div className="bg-blue-100 rounded-full p-3">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Participants</h2>
              <p className="text-gray-600">
                These are the individuals actively involved in your organization who will be 
                reaching out to potential donors. They could be:
              </p>
              <ul className="mt-2 space-y-1 text-gray-600 list-disc list-inside">
                <li>Athletes on a sports team</li>
                <li>Members of a band, choir, or arts program</li>
                <li>Students in a class or academic program</li>
                <li>Members of a club or organization</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 transform transition hover:scale-[1.02]">
          <div className="flex items-start space-x-4">
            <div className="bg-green-100 rounded-full p-3">
              <User className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Parents/Guardians</h2>
              <p className="text-gray-600">
                Parents or guardians of the participants play a crucial supporting role. They help:
              </p>
              <ul className="mt-2 space-y-1 text-gray-600 list-disc list-inside">
                <li>Identify potential donors from their network</li>
                <li>Provide contact information for family and friends</li>
                <li>Support their participant's fundraising efforts</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 transform transition hover:scale-[1.02]">
          <div className="flex items-start space-x-4">
            <div className="bg-purple-100 rounded-full p-3">
              <Heart className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Donors</h2>
              <p className="text-gray-600">
                These are the generous individuals who will be invited to support your cause. 
                They are typically:
              </p>
              <ul className="mt-2 space-y-1 text-gray-600 list-disc list-inside">
                <li>Family members and relatives</li>
                <li>Friends and neighbors</li>
                <li>Community members</li>
                <li>Supporters of your organization</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={handleContinue}
          className="inline-flex items-center px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium text-lg"
        >
          Continue to Campaign Creation
          <ArrowRight className="ml-2 h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
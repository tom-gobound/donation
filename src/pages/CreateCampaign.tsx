import React, { useState } from 'react';
import CreateCampaignForm from '../components/CreateCampaignForm';
import TerminologyGuide from '../components/TerminologyGuide';
import RoleSelector from '../components/RoleSelector';

export default function CreateCampaign() {
  const [showTerminology, setShowTerminology] = useState(true);
  const [selectedRole, setSelectedRole] = useState<'owner' | 'facilitator' | null>(null);

  if (showTerminology) {
    return <TerminologyGuide onContinue={() => setShowTerminology(false)} />;
  }

  if (!selectedRole) {
    return (
      <div className="max-w-4xl mx-auto">
        <RoleSelector onSelect={setSelectedRole} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Campaign</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <CreateCampaignForm userRole={selectedRole} />
      </div>
    </div>
  );
}
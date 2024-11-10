import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCampaigns } from '../hooks/useCampaigns';
import { PlusCircle, Calendar, Loader } from 'lucide-react';

export default function CampaignList() {
  const { currentUser } = useAuth();
  const { campaigns, loading } = useCampaigns(currentUser?.uid || null);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="h-8 w-8 text-rose-500 animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Welcome to Campaign Manager</h2>
          <p className="text-gray-600 text-lg mb-6">Please sign in to view and manage your campaigns</p>
          <Link
            to="/login"
            className="inline-flex items-center px-6 py-3 bg-rose-500 text-white rounded-md hover:bg-rose-600 transition-colors"
          >
            Sign In to Continue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Campaigns</h1>
        <Link
          to="/campaigns/new"
          className="flex items-center space-x-2 px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600 transition-colors"
        >
          <PlusCircle className="h-5 w-5" />
          <span>New Campaign</span>
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600 text-lg mb-4">You haven't created any campaigns yet</p>
          <Link
            to="/campaigns/new"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600 transition-colors"
          >
            <PlusCircle className="h-5 w-5" />
            <span>Create Your First Campaign</span>
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <Link
              key={campaign.id}
              to={`/campaigns/${campaign.id}`}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
            >
              <h2 className="text-xl font-semibold mb-2">{campaign.name}</h2>
              <p className="text-gray-600 mb-4 line-clamp-2">
                {campaign.description}
              </p>
              <div className="flex items-center text-gray-500 text-sm">
                <Calendar className="h-4 w-4 mr-2" />
                <span>
                  {new Date(campaign.createdAt).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
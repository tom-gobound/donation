import React from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, List } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { currentUser } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Donation Campaign Manager
        </h1>
        <p className="text-xl text-gray-600 mb-12">
          Create and manage your donation campaigns efficiently
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <Link
          to="/campaigns/new"
          className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center mb-4">
            <PlusCircle className="h-8 w-8 text-blue-500" />
            <h2 className="text-2xl font-semibold ml-3">Create Campaign</h2>
          </div>
          <p className="text-gray-600">
            Start a new donation campaign and begin collecting contributions
          </p>
        </Link>

        <Link
          to="/campaigns"
          className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center mb-4">
            <List className="h-8 w-8 text-green-500" />
            <h2 className="text-2xl font-semibold ml-3">View Campaigns</h2>
          </div>
          <p className="text-gray-600">
            Browse and manage your existing donation campaigns
          </p>
        </Link>
      </div>
    </div>
  );
}
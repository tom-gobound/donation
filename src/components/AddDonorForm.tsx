import React, { useState } from 'react';
import { collection, addDoc, writeBatch, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'react-hot-toast';
import { UserPlus, Users, X } from 'lucide-react';
import ContactNameOrderModal from './ContactNameOrderModal';

interface AddDonorFormProps {
  participantId: string;
  campaignId: string;
  identity?: { type: string; firstName: string; lastName: string } | null;
}

export default function AddDonorForm({ participantId, campaignId, identity }: AddDonorFormProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNameOrderModal, setShowNameOrderModal] = useState(false);
  const [pendingContacts, setPendingContacts] = useState<any[]>([]);
  const [sampleName, setSampleName] = useState('');
  const [showFeatureFlagModal, setShowFeatureFlagModal] = useState(false);

  // Check if running on iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  const logDonorAddition = async (donorId: string) => {
    if (!identity) return;

    try {
      const logsRef = collection(db, `campaigns/${campaignId}/participants/${participantId}/logs`);
      await addDoc(logsRef, {
        action: 'add_donor',
        donorId,
        addedBy: {
          type: identity.type,
          firstName: identity.firstName,
          lastName: identity.lastName
        },
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error logging donor addition:', error);
    }
  };

  const parseContactName = (name: string, isFirstNameFirst: boolean) => {
    if (!name) return { firstName: '', lastName: '' };

    const parts = name.trim().split(/\s+/);
    
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: '' };
    }

    if (name.includes(',')) {
      const [last, first] = name.split(',').map(part => part.trim());
      return { firstName: first, lastName: last };
    }

    if (isFirstNameFirst) {
      const firstName = parts[0];
      const lastName = parts.slice(1).join(' ');
      return { firstName, lastName };
    } else {
      const lastName = parts[0];
      const firstName = parts.slice(1).join(' ');
      return { firstName, lastName };
    }
  };

  const addDonors = async (donors: { firstName: string; lastName: string; phoneNumber: string }[]) => {
    const batch = writeBatch(db);
    const donorsRef = collection(db, `campaigns/${campaignId}/participants/${participantId}/donors`);
    const donorIds: string[] = [];

    donors.forEach((donor) => {
      const newDonorRef = doc(donorsRef);
      batch.set(newDonorRef, {
        ...donor,
        createdAt: new Date().toISOString()
      });
      donorIds.push(newDonorRef.id);
    });

    await batch.commit();

    // Log each donor addition
    for (const donorId of donorIds) {
      await logDonorAddition(donorId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const donorsRef = collection(db, `campaigns/${campaignId}/participants/${participantId}/donors`);
      const docRef = await addDoc(donorsRef, {
        firstName,
        lastName,
        phoneNumber,
        createdAt: new Date().toISOString()
      });

      await logDonorAddition(docRef.id);

      setFirstName('');
      setLastName('');
      setPhoneNumber('');
      toast.success('Donor added successfully');
    } catch (error) {
      console.error('Error adding donor:', error);
      toast.error('Failed to add donor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectContacts = async () => {
    try {
      if ('contacts' in navigator && 'select' in navigator.contacts) {
        const contacts = await navigator.contacts.select(
          ['name', 'tel'],
          { multiple: true }
        );
        
        setPendingContacts(contacts);
        const sampleContact = contacts.find(c => c.name?.[0]?.includes(' '));
        if (sampleContact) {
          setSampleName(sampleContact.name[0]);
          setShowNameOrderModal(true);
        } else {
          processContacts(contacts, true);
        }
      } else if (isIOS) {
        setShowFeatureFlagModal(true);
      } else {
        const contacts = await navigator.contacts.select(
          ['name', 'tel'],
          { multiple: true }
        );
        processContacts(contacts, true);
      }
    } catch (error) {
      console.error('Error selecting contacts:', error);
      if (error instanceof Error && error.name === 'SecurityError') {
        toast.error('Please enable contact access in your browser settings');
      } else if (isIOS) {
        setShowFeatureFlagModal(true);
      } else {
        toast.error('Failed to access contacts');
      }
    }
  };

  const processContacts = async (contacts: any[], isFirstNameFirst: boolean) => {
    setIsSubmitting(true);
    try {
      const validDonors = contacts
        .filter(contact => contact.tel && contact.tel[0] && contact.name && contact.name[0])
        .map(contact => {
          const { firstName, lastName } = parseContactName(contact.name[0], isFirstNameFirst);
          const cleanPhone = contact.tel[0].replace(/\D/g, '');
          return {
            firstName,
            lastName,
            phoneNumber: cleanPhone
          };
        });

      if (validDonors.length > 0) {
        await addDonors(validDonors);
        toast.success(`Added ${validDonors.length} donors successfully`);
      }

      if (validDonors.length < contacts.length) {
        toast.warning(`${contacts.length - validDonors.length} contacts were skipped due to missing information`);
      }
    } catch (error) {
      console.error('Error processing contacts:', error);
      toast.error('Failed to process contacts');
    } finally {
      setIsSubmitting(false);
      setShowNameOrderModal(false);
      setPendingContacts([]);
    }
  };

  const handleNameOrderSelection = (isFirstNameFirst: boolean) => {
    processContacts(pendingContacts, isFirstNameFirst);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
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
        </div>
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
            Phone Number
          </label>
          <input
            type="tel"
            id="phoneNumber"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Adding...' : 'Add Donor'}
          </button>
          
          {(isIOS || 'contacts' in navigator) && (
            <button
              type="button"
              onClick={selectContacts}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
            >
              <Users className="h-4 w-4 mr-2" />
              Select Contacts
            </button>
          )}
        </div>
      </form>

      <ContactNameOrderModal
        isOpen={showNameOrderModal}
        onClose={() => setShowNameOrderModal(false)}
        sampleName={sampleName}
        onSelectFirstName={handleNameOrderSelection}
      />

      {showFeatureFlagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Enable Contact Selection</h3>
              <button onClick={() => setShowFeatureFlagModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600">
                To use the contact selection feature, you'll need to enable it in Safari's settings:
              </p>

              <ol className="list-decimal ml-4 space-y-2 text-gray-600">
                <li>Open your iPhone Settings</li>
                <li>Scroll down and tap Safari</li>
                <li>Tap Advanced (very bottom)</li>
                <li>Tap Experimental Features (very bottom)</li>
                <li>Find and enable "Contact Picker API" (below a long list of CSS features)</li>
                <li>Return to this page and try again (you may need to refresh the page)</li>
              </ol>

              <div className="mt-6">
                <button
                  onClick={() => setShowFeatureFlagModal(false)}
                  className="w-full px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
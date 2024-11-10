import React, { useState } from 'react';
import { collection, addDoc, writeBatch, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FileSpreadsheet, Upload, ChevronDown, ChevronRight, FileDown } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  campaignId: string;
  onImportComplete: () => void;
}

export default function ParticipantImport({ campaignId, onImportComplete }: Props) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const processCSVData = (text: string) => {
    const rows = text.split('\n').map(row => row.trim()).filter(row => row);
    const participants = rows.map(row => {
      const [firstName, lastName, phoneNumber] = row.split('\t').map(cell => cell.trim());
      return { firstName, lastName, phoneNumber };
    }).filter(p => p.firstName && p.lastName && p.phoneNumber);
    
    return participants;
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    
    if (!text.trim()) {
      toast.error('No data found in clipboard');
      return;
    }

    setIsProcessing(true);

    try {
      const participants = processCSVData(text);
      
      if (participants.length === 0) {
        toast.error('No valid data found. Please check your spreadsheet format.');
        return;
      }

      const batch = writeBatch(db);
      
      participants.forEach((participant) => {
        const docRef = doc(collection(db, `campaigns/${campaignId}/participants`));
        batch.set(docRef, {
          ...participant,
          campaignId,
          createdAt: new Date().toISOString()
        });
      });

      await batch.commit();
      toast.success(`Successfully imported ${participants.length} participants`);
      onImportComplete();
      setIsExpanded(false); // Close the import section after successful import
    } catch (error) {
      console.error('Error importing participants:', error);
      toast.error('Failed to import participants');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 mb-4 group"
      >
        {isExpanded ? (
          <ChevronDown className="h-5 w-5 text-gray-500 group-hover:text-gray-700" />
        ) : (
          <ChevronRight className="h-5 w-5 text-gray-500 group-hover:text-gray-700" />
        )}
        <FileDown className="h-5 w-5 text-gray-500 group-hover:text-gray-700" />
        <span className="font-medium">Bulk Import Participants</span>
      </button>

      {isExpanded && (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="text-center">
            <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">Import Participants</h3>
            <p className="mt-1 text-sm text-gray-500">
              Copy data from your spreadsheet and paste it here.<br />
              Format: First Name [Tab] Last Name [Tab] Phone Number
            </p>
            <div className="mt-4">
              <textarea
                className="w-full h-32 p-2 border rounded-md focus:border-rose-500 focus:ring-rose-500 focus:ring-opacity-50"
                placeholder="Paste your spreadsheet data here..."
                onPaste={handlePaste}
                disabled={isProcessing}
              />
            </div>
            <div className="mt-2 flex items-center justify-center text-sm text-gray-600">
              <Upload className="h-4 w-4 mr-1" />
              {isProcessing ? 'Processing...' : 'Ready to import'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
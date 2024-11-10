import React from 'react';
import { DonorMessage } from '../types';
import { MessageCircle, Check, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  messages: DonorMessage[];
  onActivate: (messageId: string) => Promise<void>;
  onEdit: (message: DonorMessage) => void;
  onDelete: (messageId: string) => Promise<void>;
  isEditable?: boolean;
}

export default function DonorMessageList({ messages, onActivate, onEdit, onDelete, isEditable = true }: Props) {
  const handleActivate = async (messageId: string) => {
    try {
      await onActivate(messageId);
      toast.success('Message activated successfully');
    } catch (error) {
      console.error('Error activating message:', error);
      toast.error('Failed to activate message');
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      await onDelete(messageId);
      toast.success('Message deleted successfully');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  return (
    <div className="space-y-4">
      {messages.sort((a, b) => a.order - b.order).map((message) => (
        <div
          key={message.id}
          className={`p-4 rounded-lg border ${
            message.isActive ? 'border-rose-200 bg-rose-50' : 'border-gray-200 bg-white'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <MessageCircle className={`h-5 w-5 ${message.isActive ? 'text-rose-500' : 'text-gray-400'}`} />
              <span className="text-sm font-medium text-gray-500">Message {message.order}</span>
              {message.isActive && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-800">
                  <Check className="h-3 w-3 mr-1" />
                  Active
                </span>
              )}
            </div>
            {isEditable && (
              <div className="flex items-center space-x-2">
                {!message.isActive && (
                  <button
                    onClick={() => handleActivate(message.id)}
                    className="text-gray-400 hover:text-gray-600"
                    title="Make Active"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => onEdit(message)}
                  className="text-gray-400 hover:text-gray-600"
                  title="Edit Message"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                {messages.length > 1 && (
                  <button
                    onClick={() => handleDelete(message.id)}
                    className="text-gray-400 hover:text-red-600"
                    title="Delete Message"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="mt-2 text-gray-700 whitespace-pre-wrap">{message.content}</div>
        </div>
      ))}
    </div>
  );
}
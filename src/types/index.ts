export interface DonorMessage {
  id: string;
  order: number;
  content: string;
  isActive: boolean;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  organizationName: string;
  ownerId?: string;
  facilitatorIds?: string[];
  ownerTitle: string;
  templateMessageToGuardians: string;
  targetDonorCount: number;
  donationUrl: string;
  donorMessages: DonorMessage[];
  createdAt: Date;
  createdBy: {
    id: string;
    role: 'owner' | 'facilitator';
  };
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignInvite {
  id: string;
  campaignId: string;
  email: string;
  role: 'owner' | 'facilitator';
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
  createdBy: string;
}

export interface Donor {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  messageStatuses?: {
    [messageId: string]: {
      sent: boolean;
      sentAt?: string;
    };
  };
}

export interface Guardian {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

export interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  campaignId: string;
  hasMessagedGuardians?: boolean;
  hasSkippedGuardians?: boolean;
}
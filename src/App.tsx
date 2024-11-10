import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Profile from './pages/Profile';
import CampaignList from './pages/CampaignList';
import CreateCampaign from './pages/CreateCampaign';
import EditCampaign from './pages/EditCampaign';
import CampaignDetail from './pages/CampaignDetail';
import CampaignLogs from './pages/CampaignLogs';
import CampaignProgress from './pages/CampaignProgress';
import ParticipantDetail from './pages/ParticipantDetail';
import DonorMessagePage from './pages/DonorMessagePage';
import PublicParticipantList from './pages/PublicParticipantList';
import GuardianMessaging from './pages/GuardianMessaging';
import DonorMessaging from './pages/DonorMessaging';
import ParticipantMessaging from './pages/ParticipantMessaging';
import InviteAcceptPage from './pages/InviteAcceptPage';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './contexts/AuthContext';

function QueryParamHandler() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/') {
      const participantId = searchParams.get('participantId');
      if (participantId) {
        navigate(`/participants/${participantId}`, { replace: true });
      }
    }
  }, [searchParams, navigate, location]);

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <QueryParamHandler />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/invites/:campaignId/:inviteId" element={<InviteAcceptPage />} />
              <Route path="/profile" element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              } />
              <Route path="/campaigns" element={<CampaignList />} />
              <Route path="/campaigns/:campaignId/participants" element={<PublicParticipantList />} />
              <Route path="/campaigns/:campaignId/logs" element={<CampaignLogs />} />
              <Route path="/campaigns/:campaignId/guardians" element={
                <PrivateRoute>
                  <GuardianMessaging />
                </PrivateRoute>
              } />
              <Route path="/campaigns/:campaignId/donors" element={
                <PrivateRoute>
                  <DonorMessaging />
                </PrivateRoute>
              } />
              <Route path="/campaigns/:campaignId/participants-message" element={
                <PrivateRoute>
                  <ParticipantMessaging />
                </PrivateRoute>
              } />
              <Route path="/campaigns/:campaignId/progress" element={
                <PrivateRoute>
                  <CampaignProgress />
                </PrivateRoute>
              } />
              <Route
                path="/campaigns/new"
                element={
                  <PrivateRoute>
                    <CreateCampaign />
                  </PrivateRoute>
                }
              />
              <Route
                path="/campaigns/:id/edit"
                element={
                  <PrivateRoute>
                    <EditCampaign />
                  </PrivateRoute>
                }
              />
              <Route
                path="/campaigns/:id"
                element={
                  <PrivateRoute>
                    <CampaignDetail />
                  </PrivateRoute>
                }
              />
              <Route path="/participants/:id" element={<ParticipantDetail />} />
              <Route path="/participants/:participantId/donors/:donorId/message" element={<DonorMessagePage />} />
            </Routes>
          </main>
          <Toaster position="top-right" />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
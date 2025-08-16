import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PersistenceProvider, usePersistentAtom, clearPersistentState } from './store/persistence';
import { useAtom } from 'jotai';
import ProtectedRoute from './components/ProtectedRoute';
import SignIn from './components/SignIn';
import Home from './components/Home';
import Session from './components/Session';
import { Toaster } from './components/ui/sonner';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { GamepadsProvider } from 'react-gamepads';

const queryClient = new QueryClient();

function AppContent(): React.JSX.Element {
  return (
    <Router>
      <Routes>
        {/* Sign In Route */}
        <Route path="/signin" element={<SignIn />} />

        {/* Protected Home Route */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        {/* Protected Session Route */}
        <Route
          path="/session/:sessionId"
          element={
            <ProtectedRoute>
              <Session />
            </ProtectedRoute>
          }
        />

        {/* Redirect root to home if authenticated, otherwise to signin */}
        <Route path="/" element={<Navigate to="/home" replace />} />

        {/* Redirect any unknown routes to home */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </Router>
  );
}

function App(): React.JSX.Element {
  return (
    <PersistenceProvider>
      <QueryClientProvider client={queryClient}>
        <GamepadsProvider>
          <AppContent />
          <Toaster richColors position="top-center" />
        </GamepadsProvider>
      </QueryClientProvider>
    </PersistenceProvider>
  );
}

export default App;

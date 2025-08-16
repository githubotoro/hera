import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAtom } from 'jotai';
import { usePersistentAtom } from '@renderer/store/persistence';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [userToken, setUserToken] = usePersistentAtom('userToken', undefined);

  if (!userToken) {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

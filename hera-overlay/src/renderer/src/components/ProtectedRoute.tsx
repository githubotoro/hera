import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAtom } from 'jotai';
import { usePersistentAtom } from '@renderer/store/persistence';
import { useQuery } from '@tanstack/react-query';
import { api } from '@renderer/api';
import { keepPreviousData } from '@tanstack/react-query';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [userToken, setUserToken] = usePersistentAtom('userToken', undefined);

  const { data: userInfo, isLoading: isLoadingUserInfo } = useQuery({
    queryKey: [
      'user-info',
      {
        userToken
      }
    ],
    queryFn: async () => {
      return api.api
        .userControllerGetUserInfo({
          userToken: userToken ?? ''
        })
        .then((res) => res.data);
    },
    refetchInterval: 1 * 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    placeholderData: keepPreviousData
  });

  useEffect(() => {
    if (userToken && !userInfo && !isLoadingUserInfo) {
      setUserToken(undefined);
    }
  }, [userInfo, isLoadingUserInfo, userToken]);

  if (!userToken) {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

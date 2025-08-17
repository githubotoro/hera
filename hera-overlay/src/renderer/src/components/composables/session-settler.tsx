import { usePersistentAtom } from '@renderer/store/persistence';
import { useQuery } from '@tanstack/react-query';
import { api } from '@renderer/api';
import { keepPreviousData } from '@tanstack/react-query';
import { Fightcade } from 'fightcade-api';
import { useEffect, useRef, useState } from 'react';

export const SessionSettler = () => {
  const [userToken, setUserToken] = usePersistentAtom<string | undefined>('userToken', undefined);

  const [sessionData, setSessionData] = usePersistentAtom<
    | {
        sessionId: string;
        sessionToken: string;
      }
    | undefined
  >('sessionData', undefined);

  const [timestamp, setTimestamp] = useState<number>(Date.now());

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
    refetchInterval: 5 * 1000, // 5 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    placeholderData: keepPreviousData
  });

  const { data: settleSession, isLoading: isLoadingSettleSession } = useQuery({
    queryKey: [
      'session-settler',
      {
        sessionId: sessionData?.sessionId ?? '',
        userToken: userToken ?? '',
        timestamp
      }
    ],
    queryFn: async () => {
      await api.api.sessionControllerSettleSessionReplay({
        sessionId: sessionData?.sessionId ?? '',
        userId: userInfo?.userId ?? ''
      });
    },
    refetchInterval: 10 * 1000, // 10 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true
    // placeholderData: keepPreviousData
  });

  console.log('settleSession', settleSession);

  useEffect(() => {
    // Set up interval to update timestamp every 5 seconds
    const interval = setInterval(() => {
      setTimestamp(Date.now());
    }, 10 * 1000); // 10 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  return null;
};

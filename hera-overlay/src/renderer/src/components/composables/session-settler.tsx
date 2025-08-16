import { usePersistentAtom } from '@renderer/store/persistence';
import { useQuery } from '@tanstack/react-query';
import { api } from '@renderer/api';
import { keepPreviousData } from '@tanstack/react-query';
import { Fightcade } from 'fightcade-api';

export const SessionSettler = () => {
  const [userToken, setUserToken] = usePersistentAtom<string | undefined>('userToken', undefined);

  const [sessionData, setSessionData] = usePersistentAtom<
    | {
        sessionId: string;
        sessionToken: string;
      }
    | undefined
  >('sessionData', undefined);

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
    refetchInterval: 10 * 1000, // 10 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    placeholderData: keepPreviousData
  });

  const { data: settleSession, isLoading: isLoadingSettleSession } = useQuery({
    queryKey: [
      'session-settler',
      {
        sessionId: sessionData?.sessionId ?? '',
        userToken: userToken ?? ''
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
    refetchOnMount: true,
    placeholderData: keepPreviousData
  });

  return null;
};

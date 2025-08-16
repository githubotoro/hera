import React, { Fragment, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from './ui/button';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { usePersistentAtom } from '@renderer/store/persistence';
import { CopyIcon, CheckCheckIcon } from 'lucide-react';
import { Avatar } from './ui/avatar';
import { cn } from '@renderer/utils/cn';
import { toast } from 'sonner';
import { BottomSideIndicator } from './composables/bottom-side-indicator';
import { TopSideIndicator } from './composables/top-side-indicator';
import { BetModal } from './composables/bet-modal';
import { BottomMiddleIndicator } from './composables/bottom-middle-indicator';
import { TopMiddleIndicator } from './composables/top-middle-indicator';
import { useGamepads } from 'react-gamepads';
import { SessionSettler } from './composables/session-settler';
import WindowControls from './ui/window-controls';

const Session: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();

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

  const { data: sessionInfo, isLoading: isLoadingSessionInfo } = useQuery({
    queryKey: [
      'session-info',
      {
        sessionId,
        userToken
      }
    ],
    queryFn: async () => {
      return api.api
        .sessionControllerGetSessionInfo({
          sessionId: sessionId ?? '',
          userToken: userToken ?? ''
        })
        .then((res) => res.data);
    },
    refetchInterval: 10 * 1000, // 10 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    placeholderData: keepPreviousData
  });

  const [isAddingBet, setIsAddingBet] = React.useState<boolean>(true);
  const [isTransparent, setIsTransparent] = React.useState<boolean>(false);
  const lastComboTimeRef = useRef<number>(0);

  // Gamepad combo to toggle bet modal: LB + RB
  // Transparency is now handled globally by the main process
  useGamepads((gamepads) => {
    const gamepad = gamepads[0];
    if (!gamepad) return;

    const buttons = gamepad.buttons;

    // Check for LB (button 4) + RB (button 5) combo
    if (buttons[4]?.pressed && buttons[5]?.pressed) {
      const now = Date.now();
      // Only trigger once every 500ms to prevent multiple triggers
      if (now - lastComboTimeRef.current > 500) {
        // console.log('Gamepad combo pressed: LB + RB - toggling bet modal');
        setIsAddingBet(!isAddingBet);
        lastComboTimeRef.current = now;
      }
    }
  });

  // Listen for transparency state changes from main process
  useEffect(() => {
    const handleTransparencyChange = (event: any, newState: boolean) => {
      setIsTransparent(newState);
    };

    // Listen for transparency state changes from main process
    window.electron.ipcRenderer.on('transparency-state-changed', handleTransparencyChange);

    return () => {
      window.electron.ipcRenderer.removeListener(
        'transparency-state-changed',
        handleTransparencyChange
      );
    };
  }, []);

  // Note: Transparency is now handled by the main process via IPC
  // The isTransparent state is only used for UI styling

  console.log('Session component state:', { isLoadingSessionInfo, sessionInfo, sessionId });

  if (isLoadingSessionInfo) {
    return <div>Loading...</div>;
  }

  if (!sessionInfo) {
    return <div>Session not found</div>;
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center min-h-screen w-full p-8 text-foreground relative',
        isTransparent ? 'bg-transparent' : 'bg-background'
      )}
      style={{
        // Ensure text is visible in overlay mode with pure transparency
        backgroundColor: isTransparent ? 'rgba(0, 0, 0, 0)' : undefined,
        color: isTransparent ? '#ffffff' : undefined,
        textShadow: isTransparent
          ? '2px 2px 4px rgba(0, 0, 0, 0.8), -1px -1px 2px rgba(0, 0, 0, 0.8)'
          : undefined
      }}
    >
      {/* Window Controls */}
      {/* <div className="absolute top-4 right-4 z-50">
        <WindowControls />
      </div> */}
      <TopMiddleIndicator sessionInfo={sessionInfo} />

      <TopSideIndicator userInfo={userInfo} sessionInfo={sessionInfo} type="left" />

      <TopSideIndicator userInfo={userInfo} sessionInfo={sessionInfo} type="right" />

      <BottomSideIndicator userInfo={userInfo} sessionInfo={sessionInfo} type="left" />

      <BottomSideIndicator userInfo={userInfo} sessionInfo={sessionInfo} type="right" />

      <BottomMiddleIndicator sessionInfo={sessionInfo} />

      {isAddingBet && <BetModal setIsAddingBet={setIsAddingBet} />}

      <SessionSettler />
    </div>
  );
};

export default Session;

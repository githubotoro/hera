import { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { usePersistentAtom } from '@renderer/store/persistence';
import { api } from '@renderer/api';
import { SafeBigInt } from '@renderer/utils/parsers';
import { useQueryClient } from '@tanstack/react-query';
import { useGamepads } from 'react-gamepads';
import { cn } from '@renderer/utils';

export const BetModal = ({
  setIsAddingBet
}: {
  setIsAddingBet: (isAddingBet: boolean) => void;
}) => {
  const [betAmount, setBetAmount] = useState<number>(0);
  const lastButtonTimeRef = useRef<{ [key: string]: number }>({});

  const queryClient = useQueryClient();

  const [userToken, setUserToken] = usePersistentAtom<string | undefined>('userToken', undefined);

  const [sessionData, setSessionData] = usePersistentAtom<
    | {
        sessionId: string;
        sessionToken: string;
      }
    | undefined
  >('sessionData', undefined);

  const handleChangeBetAmount = (amount: number) => {
    if (amount < 0) return;
    setBetAmount(amount);
  };

  const handleConfirmBet = async () => {
    try {
      await api.api.sessionControllerBetSession({
        sessionToken: sessionData?.sessionToken ?? '',
        rawAmount: SafeBigInt(betAmount * 10 ** 6).toString()
      });

      queryClient.invalidateQueries({
        queryKey: ['session-info', { sessionId: sessionData?.sessionId, userToken }]
      });

      setIsAddingBet(false);
    } catch (error) {
      console.log('error', error);
      toast.error('Failed to add bet');
    }
  };

  // Simple gamepad support with debouncing
  useGamepads((gamepads) => {
    const gamepad = gamepads[0];
    if (!gamepad) return;

    const buttons = gamepad.buttons;
    const now = Date.now();

    // Simple button handling with debouncing
    if (buttons[0]?.pressed) {
      // A button - Confirm
      if (betAmount > 0 && now - (lastButtonTimeRef.current.A || 0) > 500) {
        console.log('A button pressed - confirming bet');
        handleConfirmBet();
        lastButtonTimeRef.current.A = now;
      }
    }

    if (buttons[1]?.pressed) {
      // B button - Cancel
      if (now - (lastButtonTimeRef.current.B || 0) > 500) {
        console.log('B button pressed - canceling');
        setIsAddingBet(false);
        lastButtonTimeRef.current.B = now;
      }
    }

    if (buttons[2]?.pressed) {
      // X button - Decrease
      if (now - (lastButtonTimeRef.current.X || 0) > 200) {
        console.log('X button pressed - decreasing bet');
        handleChangeBetAmount(betAmount - 10);
        lastButtonTimeRef.current.X = now;
      }
    }

    if (buttons[3]?.pressed) {
      // Y button - Increase
      if (now - (lastButtonTimeRef.current.Y || 0) > 200) {
        console.log('Y button pressed - increasing bet');
        handleChangeBetAmount(betAmount + 10);
        lastButtonTimeRef.current.Y = now;
      }
    }
  });

  return (
    <>
      <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-10 bg-black/50">
        <div className="text-sm text-secondary">Add Bet Amount</div>

        {/* Gamepad connection status */}
        {/* <div className="text-xs text-gray-400">
          <span className="text-green-400">Gamepad Controls Active</span>
        </div> */}

        <div className="flex flex-row items-center gap-10">
          <button
            className={cn(
              'transition-all duration-200 border-4 border-transparent flex flex-row items-center gap-2'
              // selectedButton === 'decrease' && 'border-white'
            )}
            onClick={() => handleChangeBetAmount(betAmount - 10)}
          >
            <span className="text-5xl">{`[X]`}</span>
            <div className="text-6xl">{`-`}</div>
          </button>

          <div className="text-primary text-6xl">{betAmount}</div>

          <button
            className={cn(
              'transition-all duration-200 border-4 border-transparent flex flex-row items-center gap-2'
              // selectedButton === 'increase' && 'border-white'
            )}
            onClick={() => handleChangeBetAmount(betAmount + 10)}
          >
            <div className="text-6xl">{`+`}</div>
            <span className="text-5xl">{`[Y]`}</span>
          </button>
        </div>

        <div className="flex flex-row items-center gap-5">
          <Button
            disabled={betAmount === 0}
            onClick={handleConfirmBet}
            className={cn(
              'transition-all duration-200 w-40 border-4 border-transparent bg-blue text-white hover:bg-blue/80'
              // selectedButton === 'confirm' && 'border-white'
            )}
          >
            {`Confirm [A]`}
          </Button>

          <Button
            onClick={() => setIsAddingBet(false)}
            className={cn(
              'transition-all duration-200 border-4 border-transparent w-40 bg-red text-white hover:bg-red/80 flex flex-row items-center'
              // selectedButton === 'cancel' && 'border-white'
            )}
          >
            {`Cancel [B]`}
          </Button>
        </div>
      </div>
    </>
  );
};

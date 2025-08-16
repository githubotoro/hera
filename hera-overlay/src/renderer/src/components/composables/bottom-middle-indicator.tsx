import { api } from '@renderer/api';
import { useEffect, useState } from 'react';

export const BottomMiddleIndicator = ({
  sessionInfo
}: {
  sessionInfo:
    | Awaited<ReturnType<typeof api.api.sessionControllerGetSessionInfo>>['data']
    | undefined;
}) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!sessionInfo?.expiresAt) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const expirationTime = new Date(sessionInfo.expiresAt).getTime();
      const difference = expirationTime - now;

      if (difference <= 0) {
        setTimeLeft('Expired');
        return;
      }

      const totalMinutes = Math.floor(difference / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      const timeString = `${totalMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      setTimeLeft(timeString);
    };

    // Update immediately
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [sessionInfo?.expiresAt]);

  if (!sessionInfo) return null;

  return (
    <div className="absolute bottom-3 left-0 right-0 flex flex-col items-center uppercase text-sm text-red">
      <div className="">
        {timeLeft === 'Expired' ? (
          <div className="">Session has ended</div>
        ) : (
          <div className="">Session ends in {timeLeft}</div>
        )}
      </div>
    </div>
  );
};

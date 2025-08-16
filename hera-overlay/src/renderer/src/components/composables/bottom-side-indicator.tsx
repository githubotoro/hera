import { api } from '@renderer/api';
import { cn } from '@renderer/utils';

export const BottomSideIndicator = ({
  userInfo,
  sessionInfo,
  type
}: {
  userInfo: Awaited<ReturnType<typeof api.api.userControllerGetUserInfo>>['data'] | undefined;
  sessionInfo:
    | Awaited<ReturnType<typeof api.api.sessionControllerGetSessionInfo>>['data']
    | undefined;
  type: 'left' | 'right';
}) => {
  if (!userInfo || !sessionInfo) return null;

  return (
    <div
      className={cn(
        'absolute bottom-3 gap-2 flex flex-col z-10',
        type === 'left' ? 'left-3 items-start' : 'right-3 items-end'
      )}
    >
      <div className="text-sm text-tertiary italic">
        {type === 'left'
          ? userInfo?.userId === sessionInfo.player1.id
            ? 'your'
            : `${sessionInfo.player1.username}'s`
          : userInfo?.userId === sessionInfo.player2?.id
            ? 'your'
            : `${sessionInfo.player2?.username ?? 'opponent'}'s`}{' '}
        bet
      </div>
      <div className="text-primary text-4xl">
        {type === 'left'
          ? sessionInfo.player1.tokenInfo.tokenAmount
          : (sessionInfo.player2?.tokenInfo.tokenAmount ?? 0)}
      </div>
    </div>
  );
};

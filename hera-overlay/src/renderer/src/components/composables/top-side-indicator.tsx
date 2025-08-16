import { api } from '@renderer/api';
import Avatar from '../ui/avatar';
import { cn } from '@renderer/utils';

export const TopSideIndicator = ({
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
        'absolute top-3 gap-2 flex flex-col',
        type === 'left' ? 'left-3 items-start' : 'right-3 items-end'
      )}
    >
      <div className="text-xs text-primary uppercase">
        {type === 'left' ? '>> Player 1' : 'Player 2 <<'}
      </div>

      <div
        className={cn(
          'flex flex-row gap-5 mt-3 items-center',
          type === 'left' ? '' : 'flex-row-reverse'
        )}
      >
        <Avatar
          size={60}
          userId={
            type === 'left' ? sessionInfo.player1.id : (sessionInfo.player2?.id ?? 'anon@gmail.com')
          }
        />

        <div
          className={cn(
            'flex flex-col gap-3 text-sm',
            type === 'left' ? 'items-start' : 'items-end'
          )}
        >
          <div className="text-secondary text-md italic">
            {type === 'left'
              ? userInfo?.userId === sessionInfo.player1.id
                ? 'you'
                : sessionInfo.player1.username
              : userInfo?.userId === sessionInfo.player2?.id
                ? 'you'
                : (sessionInfo.player2?.username ?? 'opponent')}
          </div>

          <div className="flex flex-row items-center gap-1 text-sm text-tertiary">
            <div>Balance:</div>
            <div>
              <img
                src={
                  type === 'left'
                    ? sessionInfo.player1.tokenInfo.image
                    : sessionInfo.player1.tokenInfo.image
                }
                alt="usdc token icon"
                className="w-5 h-5"
              />
            </div>

            <div className="">
              {type === 'left'
                ? sessionInfo.player1.tokenInfo.balanceTokenAmount
                : (sessionInfo.player2?.tokenInfo.balanceTokenAmount ?? 0)}
            </div>
          </div>
        </div>
      </div>

      {/**
       * Online Status
       */}
      <div className="flex flex-row items-center gap-2 text-xs text-tertiary italic mt-3">
        <div
          className={cn(
            'w-2 h-2 rounded-full',
            type === 'left'
              ? sessionInfo.player1.isOnline
                ? 'bg-green'
                : 'bg-red'
              : sessionInfo.player2?.isOnline
                ? 'bg-green'
                : 'bg-red'
          )}
        />
        <div
          className={cn(
            'text-xs',
            type === 'left'
              ? sessionInfo.player1.isOnline
                ? 'text-green'
                : 'text-red'
              : sessionInfo.player2?.isOnline
                ? 'text-green'
                : 'text-red'
          )}
        >
          {type === 'left'
            ? sessionInfo.player1.isOnline
              ? 'Online'
              : 'Offline'
            : sessionInfo.player2?.isOnline
              ? 'Online'
              : 'Offline'}
        </div>
      </div>
    </div>
  );
};

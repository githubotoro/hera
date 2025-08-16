import React from 'react';
import { usePersistentAtom } from '../store/persistence';
import { Button } from './ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from './ui/input-otp';
import Avatar from './ui/avatar';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import {
  Copy,
  Check,
  CopyIcon,
  CheckCheckIcon,
  LucideArrowLeftRight,
  ArrowLeftRightIcon,
  ExternalLinkIcon,
  RssIcon,
  InfoIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { keepPreviousData } from '@tanstack/react-query';
import { ScrollArea } from './ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import WindowControls from './ui/window-controls';

const Home: React.FC = () => {
  const navigate = useNavigate();

  const [copied, setCopied] = React.useState(false);
  const [otp, setOtp] = React.useState<string>('');
  const [isJoiningSession, setIsJoiningSession] = React.useState<boolean>(false);

  const [userToken, setUserToken] = usePersistentAtom<string | undefined>('userToken', undefined);

  const [sessionData, setSessionData] = usePersistentAtom<
    | {
        sessionId: string;
        sessionToken: string;
      }
    | undefined
  >('sessionData', undefined);

  const [userNetwork, setUserNetwork] = usePersistentAtom<string>('userNetwork', '84532');

  const handleSignOut = () => {
    setUserToken(undefined);
  };

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      // toast.success('Address copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // toast.error('Failed to copy address');
    }
  };

  const handleNetworkToggle = () => {
    setUserNetwork(userNetwork === '84532' ? '8453' : '84532');
  };

  const handleOpenEtherscan = () => {
    const baseUrl =
      userNetwork === '84532' ? 'https://sepolia.basescan.org' : 'https://basescan.org';
    const url = `${baseUrl}/address/${userInfo?.smartAccountAddress}`;
    window.open(url, '_blank');
  };

  const [isCreatingSession, setIsCreatingSession] = React.useState<boolean>(false);

  const handleCreateSession = async () => {
    setIsCreatingSession(true);

    try {
      const response = await api.api
        .sessionControllerCreateSession({
          network: userNetwork,
          userToken: userToken ?? ''
        })
        .then((res) => res.data);

      setSessionData({
        sessionId: response.sessionId,
        sessionToken: response.sessionToken
      });

      console.log('Navigating to session:', response.sessionId);
      navigate(`/session/${response.sessionId}`);
    } catch (error) {
      console.log('error', error);
    }

    setIsCreatingSession(false);
  };

  const handleJoinSession = async () => {
    if (otp.length !== 6) {
      toast.error('Please enter a 6-letter code');
      return;
    }
    setIsJoiningSession(true);

    try {
      const response = await api.api
        .sessionControllerJoinSession({
          userToken: userToken ?? '',
          sessionCode: otp
        })
        .then((res) => res.data);

      // console.log('join session data', {
      //   sessionId: response.sessionId,
      //   sessionToken: response.sessionToken
      // });

      setSessionData({
        sessionId: response.sessionId,
        sessionToken: response.sessionToken
      });

      console.log('Navigating to session:', response.sessionId);
      navigate(`/session/${response.sessionId}`);
      setOtp('');
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? 'Failed to join session');
    } finally {
      setIsJoiningSession(false);
    }
  };

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

  const { data: userHistory, isLoading: isLoadingUserHistory } = useQuery({
    queryKey: [
      'user-history',
      {
        userToken
      }
    ],
    queryFn: async () => {
      return api.api
        .userControllerGetUserHistory({
          userToken: userToken ?? ''
        })
        .then((res) => res.data);
    },
    refetchInterval: 1 * 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    placeholderData: keepPreviousData
  });

  if (isLoadingUserInfo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full p-8 bg-background text-foreground">
        <div className="text-md">Loading...</div>
      </div>
    );
  }

  if (!userInfo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full p-8 bg-background text-red">
        <div className="text-md">User not found</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full p-3 bg-background text-foreground relative">
      {/* Window Controls */}
      {/* <div className="absolute top-4 right-4 z-50">
        <WindowControls />
      </div> */}

      <div className="w-full max-w-4xl">
        <div className="flex flex-row items-center justify-between">
          <div className="flex flex-row items-center gap-2">
            <Avatar size={40} userId={userInfo.userId} />

            <div className="flex flex-col gap-1 text-sm">
              <div className="text-primary">{userInfo.username}</div>

              <div className="flex flex-row items-center gap-1">
                <div className="text-tertiary text-xs">
                  {userInfo.smartAccountAddress.slice(0, 6)}...
                  {userInfo.smartAccountAddress.slice(-4)}
                </div>
                <button
                  onClick={() => handleCopyAddress(userInfo.smartAccountAddress)}
                  className="p-1 hover:bg-gray-3 transition-colors"
                  title="Copy address"
                >
                  {copied ? (
                    <CheckCheckIcon className="text-green w-4 h-4" />
                  ) : (
                    <CopyIcon className="text-tertiary hover:text-primary transition-colors w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-row items-center gap-3">
            <div className="flex flex-row items-start gap-1">
              <img src={userInfo.balance[userNetwork].image} alt="token icon" className="w-7 h-7" />
              <div className="text-xl">{userInfo.balance[userNetwork].tokenAmount}</div>
            </div>

            <div className="flex flex-col items-center gap-1 w-fit">
              <div className="flex flex-row items-center gap-3 justify-between w-full">
                <div className="text-xs text-secondary">USDC</div>

                <button
                  onClick={handleOpenEtherscan}
                  className="hover:opacity-80 transition-opacity"
                  title="View on Etherscan"
                >
                  <ExternalLinkIcon className="w-5 h-5 text-secondary" />
                </button>
              </div>
              <div className="text-xs flex flex-row items-center gap-3 justify-between w-full">
                <div className="flex flex-row items-center text-tertiary">
                  {userNetwork === '84532' ? 'Base Sepolia' : 'Base Mainnet'}
                </div>

                <button
                  onClick={handleNetworkToggle}
                  className="hover:opacity-80 transition-opacity"
                  title="Switch network"
                >
                  <ArrowLeftRightIcon className="w-5 h-5 text-tertiary" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-3 w-full mt-10 h-64">
          <div className="flex flex-col items-center col-span-7 h-72 justify-between">
            <Button
              onClick={handleCreateSession}
              disabled={isCreatingSession}
              className="w-full bg-blue text-white hover:bg-blue/80 h-8 flex flex-row items-center gap-3"
            >
              {isCreatingSession ? 'Creating Session...' : 'Create New Session'}
            </Button>

            <div className="text-tertiary italic">or</div>

            <div className="flex flex-col items-center gap-3 w-full">
              <div className="w-full justify-between flex flex-row items-center gap-3 pl-3 bg-indigo">
                <div className="text-xs text-center w-full text-primary">SESSION CODE</div>

                <InputOTP
                  value={otp}
                  onChange={setOtp}
                  maxLength={6}
                  disabled={isJoiningSession}
                  containerClassName="gap-2 bg-background uppercase"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button
                onClick={handleJoinSession}
                disabled={isJoiningSession || otp.length !== 6}
                className="bg-indigo text-white hover:bg-indigo/80 w-full h-8"
              >
                {isJoiningSession ? 'Joining...' : 'Join Existing Session'}
              </Button>
            </div>
          </div>

          <div className="col-span-5 h-72 w-full flex flex-col items-center">
            <div className="h-8 bg-base w-full pt-2">
              <div className="text-primary text-center text-sm">Your History</div>
            </div>

            <ScrollArea className="flex-1 h-64 w-full bg-base shrink-0 flex flex-col items-center p-2 gap-2 text-xs">
              <div className="flex flex-row items-center justify-between">
                <div className="text-green text-md">Won</div>
                <div className="text-tertiary text-xs">10 USDC</div>
              </div>

              <div className="flex flex-row items-center justify-between">
                <div className="text-red text-md">Lost</div>
                <div className="text-tertiary text-xs">-20 USDC</div>
              </div>

              <div className="flex flex-row items-center justify-between">
                <div className="text-primary text-md">Bet</div>
                <div className="text-tertiary text-xs">20 USDC</div>
              </div>
            </ScrollArea>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 mt-20">
          {/**
           * @dev HOW IT WORKS
           */}
          {/* <div className="flex flex-col items-start bg-base w-full p-3">
            <div className="text-primary text-xs">{`>> HOW IT WORKS`}</div>

            <div className="text-xs text-secondary flex flex-col gap-1 mt-2">
              <div className="">{`1. Create/join a session -- each session contains 2 players`}</div>
              <div className="">{`2. Start the overlay mode and bet USDC while playing fightcade`}</div>
              <div className="">{`3. Once a game ends -- bet amount will be auto-distributed`}</div>
              <div className="">{`4. Keep playing until you empty rival's balance :)`}</div>
            </div>

            <div className="text-xs text-tertiary flex flex-col items-start gap-1 mt-5">
              <div className="text-primary">**NOTES**</div>
              <div className="mt-2">
                {`-> In order to fund your account, just send USDC to your address on Base Mainnet`}
              </div>
            </div>
          </div> */}

          <div className="flex flex-row items-center gap-3 w-full justify-between">
            <Button className="bg-tertiary text-white hover:bg-tertiary/80 w-1/2">
              Export Private Key
            </Button>

            <Button onClick={handleSignOut} className="bg-red text-white hover:bg-red/80 w-1/2">
              Log Out
            </Button>
          </div>
        </div>

        {/* <div className="flex justify-center">
          <Button
            // onClick={handleSignOut}
            variant="outline"
            className="bg-red text-white hover:bg-red/80"
          >
            Sign Out
          </Button>
        </div> */}
      </div>
    </div>
  );
};

export default Home;

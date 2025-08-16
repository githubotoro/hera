import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from './ui/input-otp';
import { api } from '../api';
import { toast } from 'sonner';
import { usePersistentAtom } from '@renderer/store/persistence';
import WindowControls from './ui/window-controls';

const SignIn: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [otp, setOtp] = useState<string>('');

  const [step, setStep] = useState<'input' | 'otp'>('input');

  const [userToken, setUserToken] = usePersistentAtom<string | undefined>('userToken', undefined);

  // Redirect to home if user is already authenticated
  useEffect(() => {
    if (userToken) {
      navigate('/home');
    }
  }, [userToken, navigate]);

  const handleInputSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.api.userControllerSendAuthEmail({
        email,
        username
      });

      setStep('otp');
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? 'Internal server error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.api
        .userControllerVerifyAuthEmail({
          verificationCode: otp
        })
        .then((res) => res.data);

      setUserToken(response.userToken);
      navigate('/home');
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? 'Internal server error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full p-8 bg-background text-foreground relative">
      {/* Window Controls */}
      {/* <div className="absolute top-4 right-4 z-50">
        <WindowControls />
      </div> */}

      {step === 'input' && (
        <div className="w-full max-w-md">
          <div className="text-center">
            <h1 className="text-2xl font-press-start text-primary">SIGN IN</h1>
            <p className="text-tertiary italic mt-5 text-sm">
              Enter your <span className="text-cyan">Fightcade</span> email and username to continue
            </p>
          </div>

          <form onSubmit={handleInputSubmit} className="mt-10">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-orange">
                Fightcade Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@fightcade.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2 mt-5">
              <label htmlFor="username" className="text-sm font-medium text-red">
                Fightcade Username
              </label>
              <Input
                id="username"
                type="text"
                placeholder="torochan"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full mt-10 bg-blue text-white hover:bg-blue/80"
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Sign In'}
            </Button>
          </form>
        </div>
      )}

      {step === 'otp' && (
        <div className="w-full max-w-md">
          <div className="text-center">
            <h1 className="text-2xl font-press-start text-primary">CHECK YOUR EMAIL</h1>
            <p className="text-tertiary text-sm italic mt-5">
              We sent a 6-letter code to your email. Please enter it below.
            </p>
          </div>

          <form onSubmit={handleOtpSubmit} className="mt-10">
            <div className="space-y-4">
              <div className="flex justify-center">
                <InputOTP
                  value={otp}
                  onChange={setOtp}
                  maxLength={6}
                  disabled={isLoading}
                  containerClassName="gap-2 uppercase"
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
            </div>

            <div className="mt-10">
              <Button
                type="submit"
                className="w-full bg-blue text-white hover:bg-blue/80"
                disabled={isLoading || otp.length !== 6}
              >
                {isLoading ? 'Loading...' : 'Verify'}
              </Button>

              <Button
                type="button"
                className="w-full mt-3"
                onClick={() => setStep('input')}
                disabled={isLoading}
              >
                Back
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default SignIn;

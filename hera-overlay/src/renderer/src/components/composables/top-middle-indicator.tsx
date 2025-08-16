import { api } from '@renderer/api';
import { CheckCheckIcon, CopyIcon } from 'lucide-react';
import { useState } from 'react';

export const TopMiddleIndicator = ({
  sessionInfo
}: {
  sessionInfo:
    | Awaited<ReturnType<typeof api.api.sessionControllerGetSessionInfo>>['data']
    | undefined;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopySessionCode = async (sessionCode: string) => {
    try {
      await navigator.clipboard.writeText(sessionCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Handle error silently
    }
  };

  if (!sessionInfo) return null;

  return (
    <div className="absolute top-3 flex flex-col items-center w-full z-10 text-xs uppercase text-orange">
      <div className="flex flex-row items-center gap-2">
        <div className="">Session Code: {sessionInfo.sessionCode.toUpperCase()}</div>
        <button
          onClick={() => handleCopySessionCode(sessionInfo.sessionCode.toUpperCase())}
          className="p-1 hover:bg-gray-3 transition-colors"
          title="Copy session code"
        >
          {copied ? (
            <CheckCheckIcon className="text-green w-5 h-5" />
          ) : (
            <CopyIcon className="text-tertiary hover:text-primary transition-colors w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
};

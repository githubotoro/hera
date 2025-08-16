import { usePersistentAtom } from '@renderer/store/persistence';

export const EventLogger = () => {
  const [eventLog, setEventLog] = usePersistentAtom<string>('eventLog', '');

  return (
    <div className="absolute top-0 left-0 w-full h-full bg-transparent pointer-events-none flex flex-col items-center justify-center"></div>
  );
};

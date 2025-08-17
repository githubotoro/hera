import React, { useEffect, useState, useRef } from 'react';
import { api } from '@renderer/api';
import { usePersistentAtom } from '@renderer/store/persistence';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { cn } from '@renderer/utils/cn';

interface EventMessage {
  id: string;
  message: string;
  timestamp: number;
}

export const EventLogger = () => {
  const [eventLog, setEventLog] = usePersistentAtom<string>('eventLog', '');
  const [userToken, setUserToken] = usePersistentAtom<string | undefined>('userToken', undefined);
  const [currentEvent, setCurrentEvent] = useState<EventMessage | null>(null);
  const lastEventTimeRef = useRef<number>(0);

  const { data: userHistory, isLoading: isLoadingUserHistory } = useQuery({
    queryKey: [
      'user-history',
      {
        userToken
      }
    ],
    queryFn: async () => {
      return api.api
        .sessionControllerGetHistory({
          userToken: userToken ?? ''
        })
        .then((res) => res.data);
    },
    refetchInterval: 5 * 1000, // 5 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    placeholderData: keepPreviousData
  });

  // Process new events
  useEffect(() => {
    if (!userHistory?.data) return;

    const processedIds = new Set(eventLog ? eventLog.split(',').filter(Boolean) : []);
    const now = Date.now();
    const sixtySecondsAgo = now - 60 * 1000;

    console.log('EventLogger: Processing events', {
      totalEvents: userHistory.data.length,
      processedIds: processedIds.size,
      timeRange: { now, sixtySecondsAgo }
    });

    // Find new events from the last 60 seconds
    const newEvents = userHistory.data
      .filter((event) => {
        const eventTime = new Date(event.createdAt).getTime();
        const isNew = !processedIds.has(event.id);
        const isRecent = eventTime >= sixtySecondsAgo && eventTime <= now;

        if (isNew && isRecent) {
          console.log('EventLogger: Found new event', {
            id: event.id,
            category: event.category,
            amount: event.tokenAmount,
            createdAt: event.createdAt,
            eventTime
          });
        }

        return isNew && isRecent;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Sort by newest first

    console.log('EventLogger: New events found', newEvents.length);

    if (newEvents.length > 0) {
      // Take the latest event only
      const latestEvent = newEvents[0];
      const eventTime = new Date(latestEvent.createdAt).getTime();

      // Only show if it's not the same as the last event we showed
      if (eventTime > lastEventTimeRef.current) {
        const message = generateEventMessage(latestEvent);
        const eventMessage: EventMessage = {
          id: latestEvent.id,
          message,
          timestamp: eventTime
        };

        console.log('EventLogger: Showing event message', {
          id: latestEvent.id,
          message,
          timestamp: eventTime
        });

        setCurrentEvent(eventMessage);
        lastEventTimeRef.current = eventTime;

        // Update the event log to include this event
        const newEventLog = [...processedIds, latestEvent.id].join(',');
        setEventLog(newEventLog);

        // Auto-hide the event after 3 seconds
        setTimeout(() => {
          setCurrentEvent(null);
        }, 3000);
      }
    }
  }, [userHistory, eventLog, setEventLog]);

  const generateEventMessage = (event: any): string => {
    const amount = parseFloat(event.tokenAmount) || 0;
    const category = event.category?.toLowerCase() || '';

    console.log('EventLogger: Generating message for event', {
      category,
      amount,
      tokenAmount: event.tokenAmount
    });

    if (category.includes('bet') || category.includes('wager')) {
      return `You bet ${amount} USDC`;
    } else if (category.includes('win') || category.includes('won')) {
      return `You won ${amount} USDC`;
    } else if (category.includes('lost') || category.includes('lose')) {
      return `You lost ${amount} USDC`;
    } else if (category.includes('list') || category.includes('listed')) {
      return `You listed ${amount} USDC`;
    } else {
      // Fallback for unknown categories
      return `${category.charAt(0).toUpperCase() + category.slice(1)} ${amount} USDC`;
    }
  };

  return (
    <div className="absolute top-0 left-0 w-full h-full bg-transparent pointer-events-none flex flex-col items-center justify-center z-50">
      {currentEvent && (
        <div
          className={cn(
            'bg-black/80 text-white px-6 py-3 rounded-lg text-lg font-bold shadow-lg',
            'animate-in fade-in duration-300 slide-in-from-bottom-2'
          )}
          style={{
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8), -1px -1px 2px rgba(0, 0, 0, 0.8)'
          }}
        >
          {currentEvent.message}
        </div>
      )}
    </div>
  );
};

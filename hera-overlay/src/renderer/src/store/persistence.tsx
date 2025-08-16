import { atom, useAtom } from 'jotai';
import { useEffect, useRef, useCallback } from 'react';

// Global storage state
const storageStateAtom = atom<Record<string, any>>({});
const isInitializedAtom = atom(false);

// Persistence provider component
export function PersistenceProvider({ children }: { children: React.ReactNode }) {
  const [storageState, setStorageState] = useAtom(storageStateAtom);
  const [isInitialized, setIsInitialized] = useAtom(isInitializedAtom);
  const saveTimeoutRef = useRef<number | undefined>(undefined);

  // Load initial state from storage
  const loadState = useCallback(async () => {
    try {
      // Check if window.api is available
      if (!window.api?.storage?.load) {
        console.warn('Storage API not available, using empty state');
        setStorageState({});
        setIsInitialized(true);
        return;
      }

      const savedState = await window.api.storage.load();
      setStorageState(savedState);
      setIsInitialized(true);
      console.log('Initial state loaded:', savedState);
    } catch (error) {
      console.error('Failed to load initial state:', error);
      setStorageState({});
      setIsInitialized(true);
    }
  }, [setStorageState, setIsInitialized]);

  useEffect(() => {
    if (!isInitialized) {
      loadState();
    }
  }, [isInitialized, loadState]);

  // Save state when it changes
  useEffect(() => {
    if (isInitialized && Object.keys(storageState).length > 0) {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Debounced save
      saveTimeoutRef.current = window.setTimeout(async () => {
        try {
          if (window.api?.storage?.save) {
            await window.api.storage.save(storageState);
            console.log('State saved:', storageState);
          } else {
            console.warn('Storage API not available for saving');
          }
        } catch (error) {
          console.error('Failed to save state:', error);
        }
      }, 500); // 500ms debounce
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [storageState, isInitialized]);

  return <>{children}</>;
}

// Hook to create a persistent atom
export function usePersistentAtom<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storageState, setStorageState] = useAtom(storageStateAtom);
  const [isInitialized] = useAtom(isInitializedAtom);

  const value = isInitialized
    ? storageState[key] !== undefined
      ? storageState[key]
      : defaultValue
    : defaultValue;

  const setValue = (newValue: T | ((prev: T) => T)) => {
    const resolvedValue =
      typeof newValue === 'function' ? (newValue as (prev: T) => T)(value) : newValue;

    setStorageState((prev) => ({
      ...prev,
      [key]: resolvedValue
    }));
  };

  return [value, setValue];
}

// Utility function to clear all persistent state
export async function clearPersistentState(): Promise<void> {
  try {
    if (window.api?.storage?.clear) {
      await window.api.storage.clear();
      console.log('All persistent state cleared');
    } else {
      console.warn('Storage API not available for clearing');
    }
  } catch (error) {
    console.error('Failed to clear persistent state:', error);
  }
}

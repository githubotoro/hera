# Jotai State Persistence for Electron

This implementation provides persistent state management for Jotai atoms in an Electron application. State is automatically saved to the filesystem and restored when the app restarts.

## Features

- **Automatic Persistence**: State changes are automatically saved with debouncing
- **Type Safety**: Full TypeScript support with proper typing
- **Performance**: Debounced saves prevent excessive file I/O
- **Error Handling**: Graceful fallbacks when storage operations fail
- **Flexible**: Works with any Jotai atom structure

## Usage

### 1. Wrap your app with PersistenceProvider

```tsx
import { PersistenceProvider } from './store/persistence'

function App() {
  return (
    <PersistenceProvider>
      <YourAppContent />
    </PersistenceProvider>
  )
}
```

### 2. Use the usePersistentAtom hook

```tsx
import { usePersistentAtom } from './store/persistence'

function MyComponent() {
  // This state will persist across app restarts
  const [counter, setCounter] = usePersistentAtom('counter', 0)
  const [theme, setTheme] = usePersistentAtom('theme', 'light')

  return (
    <div>
      <p>Counter: {counter}</p>
      <button onClick={() => setCounter((c) => c + 1)}>Increment</button>
    </div>
  )
}
```

### 3. Regular Jotai atoms (non-persistent)

```tsx
import { useAtom } from 'jotai'
import { counterAtom } from './store/atoms'

function MyComponent() {
  // This state will NOT persist across app restarts
  const [counter, setCounter] = useAtom(counterAtom)

  return (
    <div>
      <p>Counter: {counter}</p>
      <button onClick={() => setCounter((c) => c + 1)}>Increment</button>
    </div>
  )
}
```

### 4. Clear all persistent state

```tsx
import { clearPersistentState } from './store/persistence'

function ClearButton() {
  const handleClear = async () => {
    await clearPersistentState()
    // Optionally reload the app
    window.location.reload()
  }

  return <button onClick={handleClear}>Clear All State</button>
}
```

## How it Works

1. **Storage Location**: State is saved to `app.getPath('userData')/app-state.json`
2. **Automatic Loading**: State is loaded when the app starts
3. **Debounced Saving**: Changes are saved 500ms after the last change
4. **Error Handling**: Failed operations are logged but don't crash the app

## File Structure

```
src/
├── main/
│   ├── index.ts          # Main process with IPC handlers
│   └── storage.ts        # Storage manager for filesystem operations
├── preload/
│   ├── index.ts          # Preload script exposing storage API
│   └── index.d.ts        # TypeScript definitions
└── renderer/
    └── src/
        └── store/
            ├── persistence.tsx  # Persistence provider and hooks
            ├── atoms.ts        # Example atoms
            └── README.md       # This documentation
```

## API Reference

### PersistenceProvider

A React component that manages the persistence lifecycle.

**Props:**

- `children: React.ReactNode` - The app content to wrap

### usePersistentAtom<T>

A hook that creates a persistent atom.

**Parameters:**

- `key: string` - Unique key for the persistent value
- `defaultValue: T` - Default value if no persisted value exists

**Returns:**

- `[T, (value: T | ((prev: T) => T)) => void]` - State and setter function

### clearPersistentState()

A utility function to clear all persistent state.

**Returns:** `Promise<void>`

## Best Practices

1. **Use descriptive keys**: Use meaningful keys like `'user-preferences'` instead of `'data'`
2. **Handle loading states**: The persistence system has an initialization period
3. **Don't persist everything**: Only persist data that should survive app restarts
4. **Test persistence**: Always test that your state persists correctly after app restarts

## Example

See `src/renderer/src/App.tsx` for a complete working example that demonstrates both persistent and non-persistent state management.

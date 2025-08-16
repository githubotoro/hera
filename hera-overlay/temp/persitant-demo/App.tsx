import { PersistenceProvider, usePersistentAtom, clearPersistentState } from './store/persistence'
import { counterAtom, themeAtom } from './store/atoms'
import { useAtom } from 'jotai'

function AppContent(): React.JSX.Element {
  const [counter, setCounter] = useAtom(counterAtom)
  const [theme, setTheme] = useAtom(themeAtom)

  // Example of using the persistent atom hook
  const [persistentCounter, setPersistentCounter] = usePersistentAtom('persistentCounter', 0)
  const [persistentTheme, setPersistentTheme] = usePersistentAtom('persistentTheme', 'light')

  const handleClearState = async () => {
    await clearPersistentState()
    window.location.reload()
  }

  return (
    <div
      className={`flex flex-col items-center justify-center min-h-screen w-full p-8 ${
        theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-slate-200 text-gray-900'
      }`}
    >
      <div className="max-w-md w-full space-y-6">
        <h1 className="text-3xl font-bold text-center">HERA - State Persistence Demo</h1>

        {/* Regular Jotai Atoms */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Regular Jotai Atoms (Non-Persistent)</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Counter: {counter}</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setCounter((c) => c - 1)}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  -
                </button>
                <button
                  onClick={() => setCounter((c) => c + 1)}
                  className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Theme: {theme}</label>
              <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Toggle Theme
              </button>
            </div>
          </div>
        </div>

        {/* Persistent Atoms */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Persistent Atoms (Survives App Restart)</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Persistent Counter: {persistentCounter}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setPersistentCounter((c) => c - 1)}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  -
                </button>
                <button
                  onClick={() => setPersistentCounter((c) => c + 1)}
                  className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Persistent Theme: {persistentTheme}
              </label>
              <button
                onClick={() => setPersistentTheme(theme === 'light' ? 'dark' : 'light')}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Toggle Persistent Theme
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>

          <div className="space-y-2">
            <button
              onClick={handleClearState}
              className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Clear All Persistent State
            </button>

            <p className="text-sm text-gray-600 dark:text-gray-400">
              Try changing the persistent values above, then close and restart the app to see them
              preserved!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function App(): React.JSX.Element {
  return (
    <PersistenceProvider>
      <AppContent />
    </PersistenceProvider>
  )
}

export default App

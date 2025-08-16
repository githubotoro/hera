import { app } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'

export interface StorageData {
  [key: string]: any
}

class StorageManager {
  private storageDir: string
  private storageFile: string

  constructor() {
    // Use Electron's user data directory for persistent storage
    this.storageDir = app.getPath('userData')
    this.storageFile = join(this.storageDir, 'app-state.json')
  }

  /**
   * Save data to persistent storage
   */
  save(data: StorageData): void {
    try {
      // Ensure the directory exists
      if (!existsSync(this.storageDir)) {
        mkdirSync(this.storageDir, { recursive: true })
      }

      // Write data to file
      writeFileSync(this.storageFile, JSON.stringify(data, null, 2), 'utf8')
      console.log('State saved successfully')
    } catch (error) {
      console.error('Failed to save state:', error)
    }
  }

  /**
   * Load data from persistent storage
   */
  load(): StorageData {
    try {
      if (!existsSync(this.storageFile)) {
        console.log('No existing state file found, starting with empty state')
        return {}
      }

      const data = readFileSync(this.storageFile, 'utf8')
      const parsed = JSON.parse(data)
      console.log('State loaded successfully')
      return parsed
    } catch (error) {
      console.error('Failed to load state:', error)
      return {}
    }
  }

  /**
   * Clear all stored data
   */
  clear(): void {
    try {
      if (existsSync(this.storageFile)) {
        writeFileSync(this.storageFile, '{}', 'utf8')
        console.log('State cleared successfully')
      }
    } catch (error) {
      console.error('Failed to clear state:', error)
    }
  }
}

export const storageManager = new StorageManager()

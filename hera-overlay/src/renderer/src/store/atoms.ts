import { atom } from 'jotai';

// Example persistent atoms
export const counterAtom = atom(0);
export const themeAtom = atom<'light' | 'dark'>('light');
export const userPreferencesAtom = atom({
  notifications: true,
  autoSave: true,
  language: 'en'
});

// Example non-persistent atoms
export const temporaryDataAtom = atom<string[]>([]);
export const uiStateAtom = atom({
  sidebarOpen: false,
  modalOpen: false
});

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  interests: string[];
  notificationPrefs: Record<string, boolean>;
}

interface AppState {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (status: boolean) => void;
  hasSelectedInterests: boolean;
  setHasSelectedInterests: (status: boolean) => void;
  bookmarkedIds: string[];
  toggleBookmark: (articleId: string) => void;
  selectedInterests: string[];
  setSelectedInterests: (interests: string[]) => void;
  isAuthLoading: boolean;
  setIsAuthLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      themeMode: 'system',
      setThemeMode: (mode) => set({ themeMode: mode }),
      user: null,
      setUser: (user) => set({ user }),
      hasCompletedOnboarding: false,
      setHasCompletedOnboarding: (status) => set({ hasCompletedOnboarding: status }),
      hasSelectedInterests: false,
      setHasSelectedInterests: (status) => set({ hasSelectedInterests: status }),
      bookmarkedIds: [],
      toggleBookmark: (articleId) =>
        set((state) => ({
          bookmarkedIds: state.bookmarkedIds.includes(articleId)
            ? state.bookmarkedIds.filter((id) => id !== articleId)
            : [...state.bookmarkedIds, articleId],
        })),
      selectedInterests: ['Politics', 'Tech', 'Business'],
      setSelectedInterests: (interests) =>
        set((state) => ({
          selectedInterests: interests,
          user: state.user ? { ...state.user, interests } : null,
        })),
      isAuthLoading: false,
      setIsAuthLoading: (loading) => set({ isAuthLoading: loading }),
    }),
    {
      name: 'digestly-app-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

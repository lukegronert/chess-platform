import { create } from 'zustand';

interface NotificationState {
  unreadDms: number;
  pendingChallenges: number;
  incrementDms: () => void;
  clearDms: () => void;
  incrementChallenges: () => void;
  decrementChallenges: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadDms: 0,
  pendingChallenges: 0,
  incrementDms: () => set((s) => ({ unreadDms: s.unreadDms + 1 })),
  clearDms: () => set({ unreadDms: 0 }),
  incrementChallenges: () => set((s) => ({ pendingChallenges: s.pendingChallenges + 1 })),
  decrementChallenges: () => set((s) => ({ pendingChallenges: Math.max(0, s.pendingChallenges - 1) })),
}));

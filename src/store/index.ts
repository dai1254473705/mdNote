import { createContext, useContext } from 'react';
import { FileStore } from './FileStore';
import { UIStore } from './UIStore';
import { GitStore } from './GitStore';
import { ToastStore } from './ToastStore';
import { ScheduleStore } from './ScheduleStore';
import { DrinkReminderStore } from './DrinkReminderStore';

export class RootStore {
  fileStore: FileStore;
  uiStore: UIStore;
  gitStore: GitStore;
  toastStore: ToastStore;
  scheduleStore: ScheduleStore;
  drinkReminderStore: DrinkReminderStore;

  constructor() {
    this.toastStore = new ToastStore();
    this.uiStore = new UIStore();
    this.gitStore = new GitStore(this.toastStore, this.uiStore);
    // Pass gitStore to fileStore for event-driven git status updates
    this.fileStore = new FileStore(this.toastStore, this.gitStore);
    this.scheduleStore = new ScheduleStore();
    this.drinkReminderStore = new DrinkReminderStore();
  }
}

// Create a context with null initially
export const StoreContext = createContext<RootStore | null>(null);

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

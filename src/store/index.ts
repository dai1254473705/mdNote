import { createContext, useContext } from 'react';
import { FileStore } from './FileStore';
import { UIStore } from './UIStore';
import { GitStore } from './GitStore';
import { ToastStore } from './ToastStore';

export class RootStore {
  fileStore: FileStore;
  uiStore: UIStore;
  gitStore: GitStore;
  toastStore: ToastStore;

  constructor() {
    this.fileStore = new FileStore();
    this.uiStore = new UIStore();
    this.toastStore = new ToastStore();
    // GitStore needs access to ToastStore, so we pass rootStore or just toastStore if we refactor.
    // But currently stores are independent in constructor.
    // We can inject dependencies or use a singleton pattern if needed.
    // For simplicity, let's pass toastStore to GitStore or let GitStore access it via a hack? 
    // Better: Pass toastStore to GitStore constructor.
    this.gitStore = new GitStore(this.toastStore);
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

import { observer } from 'mobx-react-lite';
import { Toolbar } from './components/Toolbar';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import { ToastContainer } from './components/Toast';
import { KeyboardShortcuts } from './components/KeyboardShortcuts';
import { ErrorDialog } from './components/ErrorDialog';
import { useStore } from './store';
import { useEffect, lazy, Suspense, useState } from 'react';
import { Loader2 } from 'lucide-react';

// Code splitting for less frequently used components
const Welcome = lazy(() => import('./components/Welcome').then(m => ({ default: m.Welcome })));

const App = observer(() => {
  const { uiStore, fileStore } = useStore();
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    uiStore.initTheme();
  }, [uiStore]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+/ or Ctrl+/ to show shortcuts
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setShowShortcuts(prev => !prev);
      }

      // Cmd+B to toggle sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        uiStore.toggleSidebar();
      }

      // Cmd+N to create new note
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        fileStore.createFile(fileStore.rootPath, 'New Note.md');
      }

      // Cmd+E to export
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault();
        // Trigger export (you can implement this based on your export logic)
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [uiStore, fileStore]);

  // Warn before closing if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (fileStore.unsavedFilePaths.size > 0) {
        e.preventDefault();
        e.returnValue = ''; // Chrome requires returnValue to be set
        return ''; // Other browsers
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [fileStore.unsavedFilePaths.size]);

  if (uiStore.isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <>
      {!uiStore.isProjectReady ? (
        <Suspense fallback={
          <div className="h-screen w-screen flex items-center justify-center bg-white dark:bg-gray-900">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        }>
          <Welcome />
        </Suspense>
      ) : (
        <div className="h-screen w-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden font-sans">
          <Toolbar />
          <div className="flex-1 flex overflow-hidden">
            <Sidebar />
            <Editor />
          </div>
        </div>
      )}
      <ToastContainer />
      <KeyboardShortcuts isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <ErrorDialog
        isOpen={uiStore.errorDialog.isOpen}
        title={uiStore.errorDialog.title}
        message={uiStore.errorDialog.message}
        details={uiStore.errorDialog.details}
        onClose={() => uiStore.closeErrorDialog()}
      />
    </>
  );
});

export default App;

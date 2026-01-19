import { observer } from 'mobx-react-lite';
import { Toolbar } from './components/Toolbar';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import { Welcome } from './components/Welcome';
import { ToastContainer } from './components/Toast';
import { useStore } from './store';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const App = observer(() => {
  const { uiStore } = useStore();

  useEffect(() => {
    uiStore.initTheme();
  }, [uiStore]);

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
        <Welcome />
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
    </>
  );
});

export default App;

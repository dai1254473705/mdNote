import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/markdown-themes.css' // Import custom markdown themes
import { setupMockApi } from './mock/electronAPI'

// Initialize Mock API BEFORE importing any stores or App
setupMockApi();

import App from './App.tsx'
import { RootStore, StoreContext } from './store'

const rootStore = new RootStore();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreContext.Provider value={rootStore}>
      <App />
    </StoreContext.Provider>
  </StrictMode>,
)

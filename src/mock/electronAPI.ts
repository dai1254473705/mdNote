import type { AppConfig, FileNode, GitStatus } from '../types';

const MOCK_DELAY = 300;

const mockFileTree: FileNode[] = [
  {
    id: '1',
    name: 'Work',
    path: '/mock/Work',
    type: 'directory',
    level: 0,
    children: [
      {
        id: '1-1',
        name: 'Project Plan.md',
        path: '/mock/Work/Project Plan.md',
        type: 'file',
        level: 1
      },
      {
        id: '1-2',
        name: 'Meeting Notes',
        path: '/mock/Work/Meeting Notes',
        type: 'directory',
        level: 1,
        children: [
            {
                id: '1-2-1',
                name: '2023-10-27.md',
                path: '/mock/Work/Meeting Notes/2023-10-27.md',
                type: 'file',
                level: 2
            }
        ]
      }
    ]
  },
  {
    id: '2',
    name: 'Personal',
    path: '/mock/Personal',
    type: 'directory',
    level: 0,
    children: [
        {
            id: '2-1',
            name: 'Ideas.md',
            path: '/mock/Personal/Ideas.md',
            type: 'file',
            level: 1
        }
    ]
  },
  {
    id: '3',
    name: 'Welcome.md',
    path: '/mock/Welcome.md',
    type: 'file',
    level: 0
  }
];

const mockConfig: AppConfig = {
  themeMode: 'system',
  themeColor: 'fresh-green',
  repoPath: '/mock/repo',
  encryption: { enabled: false }
};

const mockGitStatus: GitStatus = {
  status: 'idle',
  ahead: 0,
  behind: 0,
  conflictedFiles: []
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const setupMockApi = () => {
  if (window.electronAPI) return;

  console.warn('⚠️ Running in Browser Mode with Mock API');

  window.electronAPI = {
    // Config
    getConfig: async () => {
      await wait(MOCK_DELAY);
      return { success: true, data: mockConfig };
    },
    saveConfig: async (config) => {
      await wait(MOCK_DELAY);
      Object.assign(mockConfig, config);
      return { success: true, data: mockConfig };
    },

    // File
    getFileTree: async () => {
      await wait(MOCK_DELAY);
      return { success: true, data: mockFileTree };
    },
    readFile: async (path) => {
      await wait(MOCK_DELAY);
      return { success: true, data: `# Content of ${path}\n\nThis is a **mock** file content.\n\n\`\`\`javascript\nconsole.log('Hello Mock');\n\`\`\`` };
    },
    saveFile: async (path, content) => {
      await wait(MOCK_DELAY);
      console.log(`[Mock] Saved file ${path}:`, content.slice(0, 20) + '...');
      return { success: true };
    },
    createFile: async (parentPath, name) => {
      await wait(MOCK_DELAY);
      console.log(`[Mock] Create file ${name} in ${parentPath}`);
      return { 
          success: true, 
          data: { id: Date.now().toString(), name, path: `${parentPath}/${name}`, type: 'file', level: 1 } 
      };
    },
    createDir: async (parentPath, name) => {
      await wait(MOCK_DELAY);
      console.log(`[Mock] Create dir ${name} in ${parentPath}`);
      return { 
          success: true, 
          data: { id: Date.now().toString(), name, path: `${parentPath}/${name}`, type: 'directory', level: 1, children: [] } 
      };
    },
    deleteItem: async (path) => {
      await wait(MOCK_DELAY);
      console.log(`[Mock] Delete ${path}`);
      return { success: true };
    },
    renameItem: async (oldPath, newName) => {
      await wait(MOCK_DELAY);
      console.log(`[Mock] Rename ${oldPath} to ${newName}`);
      return { success: true };
    },

    // Git
    getGitStatus: async () => {
      await wait(MOCK_DELAY);
      return { success: true, data: mockGitStatus };
    },
    syncGit: async () => {
      await wait(1000);
      return { success: true, data: { ...mockGitStatus, lastSyncTime: new Date().toISOString() } };
    },
    cloneGit: async (url, path) => {
      await wait(1000);
      console.log(`[Mock] Cloned ${url} to ${path}`);
      return { success: true };
    },
    initGit: async (path) => {
      await wait(500);
      console.log(`[Mock] Init git in ${path}`);
      return { success: true };
    },

    // Project
    openDirectory: async () => {
      await wait(500);
      return { success: true, data: { canceled: false, filePaths: ['/mock/selected/path'] } };
    },
    setProject: async (path) => {
      await wait(300);
      console.log(`[Mock] Set project to ${path}`);
      mockConfig.repoPath = path;
      return { success: true };
    },

    // Crypto
    encryptContent: async (content) => {
      return { success: true, data: `encrypted:${content}` };
    },
    decryptContent: async (content) => {
      return { success: true, data: content.replace('encrypted:', '') };
    },

    // Window
    maximizeWindow: () => console.log('[Mock] Maximize'),
    minimizeWindow: () => console.log('[Mock] Minimize'),
    closeWindow: () => console.log('[Mock] Close'),
  };
};

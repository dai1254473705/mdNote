import { app, BrowserWindow, ipcMain, shell, dialog, Menu, protocol, net } from 'electron'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import fs from 'fs/promises'
import { configService } from './services/configService'
import { fileService } from './services/fileService'
import { gitService } from './services/gitService'
import { cryptoService } from './services/cryptoService'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Register Privileged Schemes
protocol.registerSchemesAsPrivileged([
  { scheme: 'media', privileges: { secure: true, supportFetchAPI: true, standard: true, bypassCSP: true } }
])

// Disable hardware acceleration
app.disableHardwareAcceleration()

// Set App Name for macOS Menu
app.setName('知夏笔记')

const createMenu = () => {
  const isMac = process.platform === 'darwin'

  const template = [
    // { role: 'appMenu' }
    ...(isMac
      ? [{
          label: app.name,
          submenu: [
            { role: 'about' },
            { type: 'separator' },
            { role: 'services' },
            { type: 'separator' },
            { role: 'hide' },
            { role: 'hideOthers' },
            { role: 'unhide' },
            { type: 'separator' },
            { role: 'quit' }
          ]
        }]
      : []),
    // { role: 'fileMenu' }
    {
      label: 'File',
      submenu: [
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    // { role: 'editMenu' }
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac
          ? [
              { role: 'pasteAndMatchStyle' },
              { role: 'delete' },
              { role: 'selectAll' },
              { type: 'separator' },
              {
                label: 'Speech',
                submenu: [
                  { role: 'startSpeaking' },
                  { role: 'stopSpeaking' }
                ]
              }
            ]
          : [
              { role: 'delete' },
              { type: 'separator' },
              { role: 'selectAll' }
            ])
      ]
    },
    // { role: 'viewMenu' }
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    // { role: 'windowMenu' }
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac
          ? [
              { type: 'separator' },
              { role: 'front' },
              { type: 'separator' },
              { role: 'window' }
            ]
          : [
              { role: 'close' }
            ])
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click: async () => {
            await shell.openExternal('https://electronjs.org')
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template as any)
  Menu.setApplicationMenu(menu)
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 600,
    icon: path.join(__dirname, '../src/assets/zhixia-logo.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false, // SECURITY: Disable Node integration
      contextIsolation: true, // SECURITY: Enable Context Isolation
      sandbox: false, // We need some access via preload
    },
    title: '知夏笔记',
    titleBarStyle: 'hiddenInset', // macOS style
  })

  // Set Dock Icon for macOS Dev
  if (process.platform === 'darwin' && app.dock) {
    app.dock.setIcon(path.join(__dirname, '../src/assets/zhixia-logo.png'));
  }

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Window Controls
  ipcMain.on('window:maximize', () => mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize())
  ipcMain.on('window:minimize', () => mainWindow.minimize())
  ipcMain.on('window:close', () => mainWindow.close())
}

// --- IPC Handlers ---

// Dialog
ipcMain.handle('dialog:openDirectory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory']
  });
  return { success: true, data: result };
});

ipcMain.handle('dialog:openFile', async (_, options) => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: options?.filters || []
  });
  return { success: true, data: result };
});

// Config
ipcMain.handle('config:get', async () => {
  try {
    return { success: true, data: await configService.getConfig() }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
})

ipcMain.handle('config:save', async (_, config) => {
  try {
    return { success: true, data: await configService.saveConfig(config) }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
})

// File
ipcMain.handle('file:getTree', async () => {
  try {
    return { success: true, data: await fileService.getFileTree() }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
})

ipcMain.handle('file:read', async (_, filePath) => {
  try {
    return { success: true, data: await fileService.readFile(filePath) }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
})

ipcMain.handle('file:save', async (_, filePath, content) => {
  try {
    await fileService.saveFile(filePath, content)
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
})

ipcMain.handle('file:create', async (_, parentPath, name) => {
  try {
    return { success: true, data: await fileService.createFile(parentPath, name) }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
})

ipcMain.handle('file:createDir', async (_, parentPath, name) => {
  try {
    return { success: true, data: await fileService.createDirectory(parentPath, name) }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
})

ipcMain.handle('file:delete', async (_, filePath) => {
  try {
    await fileService.deleteItem(filePath)
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
})

ipcMain.handle('file:rename', async (_, oldPath, newName) => {
  try {
    await fileService.renameItem(oldPath, newName)
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
})

ipcMain.handle('file:copyToAssets', async (_, sourcePath, currentMdPath) => {
  try {
    return { success: true, data: await fileService.copyToAssets(sourcePath, currentMdPath) }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
})

ipcMain.handle('file:exportHtml', async (_, content, defaultPath) => {
  try {
    const { filePath } = await dialog.showSaveDialog({
      defaultPath,
      filters: [{ name: 'HTML', extensions: ['html'] }]
    });
    if (filePath) {
      await fs.writeFile(filePath, content);
      return { success: true, data: filePath };
    }
    return { success: false, error: 'Canceled' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle('file:exportPdf', async (_, htmlContent, defaultPath) => {
  try {
    const { filePath } = await dialog.showSaveDialog({
      defaultPath,
      filters: [{ name: 'PDF', extensions: ['pdf'] }]
    });
    
    if (filePath) {
      const win = new BrowserWindow({ show: false });
      await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
      
      const pdfData = await win.webContents.printToPDF({});
      await fs.writeFile(filePath, pdfData);
      win.close();
      return { success: true, data: filePath };
    }
    return { success: false, error: 'Canceled' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

// Git
ipcMain.handle('git:status', async () => {
  try {
    return { success: true, data: await gitService.getStatus() }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
})

ipcMain.handle('git:commit', async (_, message) => {
  try {
    await gitService.commit(message)
    return { success: true, data: await gitService.getStatus() }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
})

ipcMain.handle('git:sync', async () => {
  try {
    await gitService.pull()
    await gitService.push()
    return { success: true, data: await gitService.getStatus() }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
})

ipcMain.handle('git:clone', async (_, url, targetPath) => {
  try {
    const finalPath = await gitService.clone(url, targetPath);
    // Auto-save to recent projects
    await configService.saveConfig({ repoPath: finalPath });
    await configService.addRecentProject(finalPath);
    return { success: true, data: finalPath };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle('git:init', async (_, targetPath) => {
  try {
    await gitService.init(targetPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle('git:add', async (_, path) => {
  try {
    await gitService.addFile(path);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle('git:diff', async (_, path) => {
  try {
    return { success: true, data: await gitService.getDiff(path) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

// System
ipcMain.handle('system:showItemInFolder', async (_, path) => {
  shell.showItemInFolder(path);
  return { success: true };
});

// Project
ipcMain.handle('project:set', async (_, repoPath) => {
  try {
    await configService.saveConfig({ repoPath });
    await configService.addRecentProject(repoPath);
    await gitService.initRepo(); // Ensure initialized
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

// Crypto
ipcMain.handle('crypto:encrypt', async (_, content) => {
  try {
    return { success: true, data: await cryptoService.encryptContent(content) }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
})

ipcMain.handle('crypto:decrypt', async (_, content) => {
  try {
    return { success: true, data: await cryptoService.decryptContent(content) }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
})

app.whenReady().then(async () => {
  try {
    await configService.init();
    await gitService.initRepo(); // Ensure repo exists (only if config valid)
  } catch (e) {
    console.error('Initialization failed:', e);
  }
  createMenu()
  createWindow()
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  // Handle Media Protocol
  protocol.handle('media', (request) => {
    try {
      const parsedUrl = new URL(request.url)
      const filePath = parsedUrl.pathname
      
      // On Windows, pathname might start with /C:/... but pathToFileURL needs C:/... or handles it?
      // pathToFileURL('/C:/...') works on Windows? 
      // Actually pathToFileURL handles absolute paths well.
      // But if pathname comes from URL, it might be percent encoded?
      // new URL('...').pathname returns encoded path? No, it returns decoded usually? 
      // Wait, MDN says pathname is USVString.
      // node:url says: "The pathname property consists of the entire path section of the URL."
      // It is NOT decoded.
      
      const decodedPath = decodeURIComponent(filePath)
      
      // Fix for Windows: /C:/Users -> C:/Users
      if (process.platform === 'win32' && /^\/[a-zA-Z]:/.test(decodedPath)) {
        // We probably don't need to strip it if we use pathToFileURL, but let's be safe
        // actually pathToFileURL('/C:/Users') -> file:///C:/Users which is valid
      }

      const fileUrl = pathToFileURL(decodedPath).toString()
      return net.fetch(fileUrl)
    } catch (error) {
      console.error('Media protocol error:', error)
      return new Response('Not Found', { status: 404 })
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
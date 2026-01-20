import { makeAutoObservable, runInAction } from 'mobx';
import type { FileNode } from '../types';
import type { ToastStore } from './ToastStore';
import type { GitStore } from './GitStore';

interface SearchResult {
  path: string;
  name: string;
  matches: string[];
}

export class FileStore {
  fileTree: FileNode[] = [];
  currentFile: FileNode | null = null;
  currentContent: string = '';
  originalContent: string = ''; // Track original content to determine dirty state
  rootPath: string = '';
  isLoading: boolean = false;
  isSaving: boolean = false;
  isAutoSaving: boolean = false;
  unsavedFilePaths: Set<string> = new Set(); // Track files with unsaved changes
  searchQuery: string = '';
  searchResults: SearchResult[] = []; // Content search results
  isSearching: boolean = false; // Searching state

  private toastStore: ToastStore;
  private gitStore?: GitStore;
  private searchTimeout: ReturnType<typeof setTimeout> | null = null; // Debounce timer

  constructor(toastStore: ToastStore, gitStore?: GitStore) {
    makeAutoObservable(this);
    this.toastStore = toastStore;
    this.gitStore = gitStore;
  }

  setSearchQuery(query: string) {
    this.searchQuery = query;

    // Clear previous timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    // Clear results if query is empty
    if (!query.trim()) {
      this.searchResults = [];
      this.isSearching = false;
      return;
    }

    // Debounce search (500ms)
    this.isSearching = true;
    this.searchTimeout = setTimeout(() => {
      this.performContentSearch(query);
    }, 500);
  }

  async performContentSearch(query: string) {
    if (!query.trim()) {
      this.searchResults = [];
      this.isSearching = false;
      return;
    }

    try {
      const res = await window.electronAPI.searchContent(query);
      if (res.success && res.data) {
        runInAction(() => {
          this.searchResults = res.data!;
          this.isSearching = false;
        });
      }
    } catch (error) {
      console.error('Search failed:', error);
      runInAction(() => {
        this.searchResults = [];
        this.isSearching = false;
      });
    }
  }

  get projectName(): string {
    if (!this.rootPath) return '';
    // Handle both / and \ separators just in case, though usually one prevails in a given OS
    const separator = this.rootPath.includes('/') ? '/' : '\\';
    const parts = this.rootPath.split(separator).filter(Boolean);
    return parts[parts.length - 1] || '';
  }

  get filteredFiles(): FileNode[] {
    if (!this.searchQuery) return this.fileTree;

    const lowerQuery = this.searchQuery.toLowerCase();

    // Fuzzy match function
    const fuzzyMatch = (text: string, query: string): boolean => {
      const textLower = text.toLowerCase();
      let queryIndex = 0;
      let textIndex = 0;

      while (queryIndex < query.length && textIndex < textLower.length) {
        if (query[queryIndex] === textLower[textIndex]) {
          queryIndex++;
        }
        textIndex++;
      }

      return queryIndex === query.length;
    };

    // Check if file content matches (async, but we can't use async in getter)
    // For now, just search by name with fuzzy matching
    const filterNode = (node: FileNode): FileNode | null => {
      // Try exact match first, then fuzzy match
      const nameMatch = node.name.toLowerCase().includes(lowerQuery) ||
                       fuzzyMatch(node.name, this.searchQuery);

      if (nameMatch) {
        return node;
      }

      // If node is directory, check children
      if (node.children) {
        const filteredChildren = node.children
          .map(filterNode)
          .filter((n): n is FileNode => n !== null);

        if (filteredChildren.length > 0) {
          return { ...node, children: filteredChildren };
        }
      }

      return null;
    };

    return this.fileTree
      .map(filterNode)
      .filter((n): n is FileNode => n !== null);
  }

  async loadFileTree() {
    this.isLoading = true;
    try {
      const [treeRes, configRes] = await Promise.all([
        window.electronAPI.getFileTree(),
        window.electronAPI.getConfig()
      ]);
      
      runInAction(() => {
        if (treeRes.success && treeRes.data) {
          this.fileTree = treeRes.data!;
        }
        if (configRes.success && configRes.data) {
          this.rootPath = configRes.data!.repoPath;
        }
      });
    } catch (error) {
      console.error('Failed to load file tree:', error);
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  async selectFile(node: FileNode) {
    if (node.type !== 'file') return;
    
    // Avoid reloading the same file
    if (this.currentFile?.path === node.path) return;

    // Auto-save if current file has unsaved changes
    if (this.currentFile && this.unsavedFilePaths.has(this.currentFile.path)) {
      // Auto-save in background without blocking UI
      this.saveCurrentFile()
        .catch(error => {
          console.error('Auto-save failed:', error);
          this.toastStore.error('自动保存失败，请检查文件权限。');
        });
    }
    
    this.currentFile = node;
    this.isLoading = true;
    try {
      const res = await window.electronAPI.readFile(node.path);
      if (res.success) {
        runInAction(() => {
          this.currentContent = res.data || '';
          this.originalContent = res.data || ''; // Set original content
        });
      }
    } catch (error) {
      console.error('Failed to read file:', error);
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  updateContent(content: string) {
    this.currentContent = content;
    if (this.currentFile) {
      if (content !== this.originalContent) {
        this.unsavedFilePaths.add(this.currentFile.path);
      } else {
        this.unsavedFilePaths.delete(this.currentFile.path);
      }
    }
  }

  async saveCurrentFile() {
    if (!this.currentFile) return;

    this.isSaving = true;
    try {
      await window.electronAPI.saveFile(this.currentFile.path, this.currentContent);

      // Auto-add to git after save
      await window.electronAPI.addGit(this.currentFile.path);

      runInAction(() => {
        this.originalContent = this.currentContent; // Update original content after save
        this.unsavedFilePaths.delete(this.currentFile!.path);
      });

      // Trigger immediate git status update for better UX
      if (this.gitStore) {
        this.gitStore.checkStatus();
      }
    } catch (error) {
      console.error('Failed to save file:', error);
      throw error;
    } finally {
      runInAction(() => {
        this.isSaving = false;
      });
    }
  }

  async createFile(parentPath: string, name: string) {
    try {
      const res = await window.electronAPI.createFile(parentPath, name);
      if (res.success) {
        // Optimistically add to file tree
        if (res.data) {
          this.insertNode(this.fileTree, parentPath, res.data);
          // Select the new file
          await this.selectFile(res.data);
        }
      } else {
        this.toastStore.error(res.error || '创建文件失败');
        // Fallback to full reload on error
        await this.loadFileTree();
      }
    } catch (error) {
      console.error('Failed to create file:', error);
      this.toastStore.error('创建文件失败');
      await this.loadFileTree();
    }
  }

  async createDir(parentPath: string, name: string) {
    try {
      const res = await window.electronAPI.createDir(parentPath, name);
      if (res.success) {
        // Optimistically add to file tree
        if (res.data) {
          this.insertNode(this.fileTree, parentPath, res.data);
        }
      } else {
        this.toastStore.error(res.error || '创建文件夹失败');
        // Fallback to full reload on error
        await this.loadFileTree();
      }
    } catch (error) {
      console.error('Failed to create directory:', error);
      this.toastStore.error('创建文件夹失败');
      await this.loadFileTree();
    }
  }

  async deleteItem(path: string) {
    try {
      const res = await window.electronAPI.deleteItem(path);
      if (res.success) {
        if (this.currentFile?.path === path) {
          this.currentFile = null;
          this.currentContent = '';
        }
        // Optimistically remove from file tree
        this.removeNode(this.fileTree, path);
      } else {
        this.toastStore.error(res.error || '删除失败');
        // Fallback to full reload on error
        await this.loadFileTree();
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
      this.toastStore.error('删除失败');
      await this.loadFileTree();
    }
  }

  async renameItem(oldPath: string, newName: string) {
    try {
      const res = await window.electronAPI.renameItem(oldPath, newName);
      if (res.success && res.data) {
        const newPath = res.data;
        const isCurrentFile = this.currentFile?.path === oldPath;

        // Reload the file tree to reflect the change
        await this.loadFileTree();

        // If we renamed the current file, re-select it with the new path
        if (isCurrentFile) {
          // Find the file node with the new path
          const findNode = (nodes: FileNode[], targetPath: string): FileNode | null => {
            for (const node of nodes) {
              if (node.path === targetPath) return node;
              if (node.children) {
                const found = findNode(node.children, targetPath);
                if (found) return found;
              }
            }
            return null;
          };

          const newNode = findNode(this.fileTree, newPath);
          if (newNode && newNode.type === 'file') {
            await this.selectFile(newNode);
          }
        }
      } else {
        this.toastStore.error(res.error || '重命名失败');
      }
    } catch (error) {
      console.error('Failed to rename item:', error);
      this.toastStore.error('重命名失败');
    }
  }

  // Drag and Drop Move
  async moveItem(sourcePath: string, targetParentPath: string) {
    try {
      const res = await window.electronAPI.moveItem(sourcePath, targetParentPath);
      if (res.success && res.data) {
        const newPath = res.data;
        const isCurrentFile = this.currentFile?.path === sourcePath;

        // Reload the file tree to reflect the change
        await this.loadFileTree();

        // If we moved the current file, re-select it with the new path
        if (isCurrentFile) {
          // Find the file node with the new path
          const findNode = (nodes: FileNode[], targetPath: string): FileNode | null => {
            for (const node of nodes) {
              if (node.path === targetPath) return node;
              if (node.children) {
                const found = findNode(node.children, targetPath);
                if (found) return found;
              }
            }
            return null;
          };

          const newNode = findNode(this.fileTree, newPath);
          if (newNode && newNode.type === 'file') {
            await this.selectFile(newNode);
          }
        }
      } else {
        this.toastStore.error(res.error || '移动失败');
      }
    } catch (error) {
      console.error('Failed to move item:', error);
      this.toastStore.error('移动失败');
    }
  }

  // Helper methods for incremental file tree updates
  private insertNode(nodes: FileNode[], parentPath: string, newNode: FileNode): boolean {
    for (const node of nodes) {
      if (node.path === parentPath && node.type === 'directory') {
        // Found the parent directory
        if (!node.children) node.children = [];
        // Insert and sort (directories first, then alphabetically)
        node.children.push(newNode);
        node.children.sort((a, b) => {
          if (a.type === b.type) return a.name.localeCompare(b.name);
          return a.type === 'directory' ? -1 : 1;
        });
        return true;
      }
      if (node.children && this.insertNode(node.children, parentPath, newNode)) {
        return true;
      }
    }
    return false;
  }

  private removeNode(nodes: FileNode[], targetPath: string): boolean {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].path === targetPath) {
        nodes.splice(i, 1);
        return true;
      }
      if (nodes[i].children && this.removeNode(nodes[i].children!, targetPath)) {
        return true;
      }
    }
    return false;
  }
}

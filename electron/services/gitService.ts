import simpleGit, { SimpleGit } from 'simple-git';
import path from 'path';
import fs from 'fs-extra';
import { configService } from './configService';
import { GitStatus } from '../../src/types';

export class GitService {
  private _git: SimpleGit | null = null;
  
  constructor() {
    // Lazy initialization to avoid "directory does not exist" error on startup
  }

  private async getRootPath(): Promise<string> {
    const config = await configService.getConfig();
    return config.repoPath;
  }

  // Helper to get or create git instance safely
  private async getGit(): Promise<SimpleGit> {
    const rootPath = await this.getRootPath();
    if (!rootPath) {
        throw new Error('Project path not configured');
    }

    // If we already have an instance and path hasn't changed...
    // But for now, just recreate if needed or cache properly. 
    // Since rootPath can change, better not cache _git forever without validation.
    // For simplicity, let's create new instance if path changed or just create new one (lightweight).
    
    if (!fs.existsSync(rootPath)) {
      await fs.ensureDir(rootPath);
    }
    
    // We can cache _git, but if path changes, we need to invalidate.
    // Let's simple-git factory handle it.
    return simpleGit(rootPath);
  }

  async initRepo(): Promise<void> {
    const rootPath = await this.getRootPath();
    if (!rootPath) return; // Or throw

    await fs.ensureDir(rootPath);
    const git = await this.getGit();
    
    const isRepo = await fs.pathExists(path.join(rootPath, '.git'));
    if (!isRepo) {
      await git.init();
      // Initial commit to allow branches to exist
      await this.commit('Initial commit by mdNote');
    }
  }

  async setRemote(url: string): Promise<void> {
    const git = await this.getGit();
    const remotes = await git.getRemotes(true);
    const hasOrigin = remotes.some(r => r.name === 'origin');
    
    if (hasOrigin) {
      await git.removeRemote('origin');
    }
    await git.addRemote('origin', url);
    await configService.saveConfig({ remoteUrl: url });
  }

  async clone(url: string, parentPath: string): Promise<string> {
    // Extract repo name from URL (e.g. "https://github.com/user/repo.git" -> "repo")
    const repoName = url.split('/').pop()?.replace(/\.git$/, '') || 'repository';
    const targetPath = path.join(parentPath, repoName);
    
    if (await fs.pathExists(targetPath) && (await fs.readdir(targetPath)).length > 0) {
        throw new Error(`Destination path '${targetPath}' already exists and is not empty.`);
    }
    
    await fs.ensureDir(targetPath);
    // simple-git clone usage: git.clone(remote, local)
    const git = simpleGit();
    await git.clone(url, targetPath);
    
    return targetPath;
  }

  async init(targetPath: string): Promise<void> {
    await fs.ensureDir(targetPath);
    const git = simpleGit(targetPath);
    
    const isRepo = await fs.pathExists(path.join(targetPath, '.git'));
    if (!isRepo) {
      await git.init();
      // Create README to allow initial commit
      const readmePath = path.join(targetPath, 'README.md');
      if (!await fs.pathExists(readmePath)) {
        await fs.writeFile(readmePath, '# Notebook\n\nCreated with mdNote.');
        await git.add('README.md');
        await git.commit('Initial commit');
      }
    }
  }

  async commit(message: string): Promise<void> {
    const git = await this.getGit();
    await git.add('.');
    await git.commit(message);
  }

  async pull(): Promise<void> {
    const git = await this.getGit();
    const branch = await git.revparse(['--abbrev-ref', 'HEAD']);
    // Check if remote branch exists to avoid error
    // But simple-git pull usually handles it or throws. 
    // If upstream is set, `git pull` is enough.
    // If upstream is not set, we can't pull easily without specifying.
    
    // Strategy: Try `git pull`. If it fails due to no upstream, we might just skip or warn?
    // But better: `git pull origin <branch>`
    try {
        await git.pull('origin', branch, { '--rebase': null });
    } catch (e) {
        // If remote ref doesn't exist (new repo), pulling might fail. 
        // We can ignore this error if it's "couldn't find remote ref".
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes('couldn\'t find remote ref') || msg.includes('remote ref does not exist')) {
            console.warn('Pull skipped: remote branch does not exist yet.');
            return;
        }
        throw e;
    }
  }

  async push(): Promise<void> {
    const git = await this.getGit();
    const branch = await git.revparse(['--abbrev-ref', 'HEAD']);
    
    // Check if upstream is set?
    // Simple strategy: push -u origin <branch> always? Or just push.
    // simple-git push(remote, branch, options)
    
    await git.push('origin', branch, { '-u': null });
  }

  async getStatus(): Promise<GitStatus> {
    try {
      const rootPath = await this.getRootPath();
      // Don't use getGit() here because we want to handle non-existent dir gracefully
      if (!rootPath || !fs.existsSync(rootPath)) {
          return {
            status: 'idle',
            ahead: 0,
            behind: 0,
            modified: 0,
            conflictedFiles: [],
            files: {}
          };
      }
      
      const git = await this.getGit();
      const statusSummary = await git.status();
      const isRepo = await fs.pathExists(path.join(rootPath, '.git'));
      
      if (!isRepo) {
        return {
          status: 'idle',
          ahead: 0,
          behind: 0,
          modified: 0,
          conflictedFiles: [],
          files: {}
        };
      }

      // Check ahead/behind
      // Need to fetch first to get accurate behind count?
      // await this.git.fetch(); // This might be slow/require auth. Optional? 
      // Let's do a fetch dry-run or just rely on local state if offline.
      // User can trigger "Check Update".
      
      // For now, simple status
      const conflicted = statusSummary.conflicted;
      const modified = statusSummary.files.length;
      
      // Map file statuses
      const filesMap: Record<string, { path: string; index: string; working_dir: string }> = {};
      statusSummary.files.forEach(f => {
        filesMap[f.path] = {
            path: f.path,
            index: f.index,
            working_dir: f.working_dir
        };
      });

      return {
        status: conflicted.length > 0 ? 'conflict' : 'idle',
        ahead: statusSummary.ahead,
        behind: statusSummary.behind,
        modified: modified,
        conflictedFiles: conflicted,
        files: filesMap,
        lastSyncTime: new Date().toISOString() // Not accurate, just "checked at"
      };
    } catch (error) {
      return {
        status: 'error',
        ahead: 0,
        behind: 0,
        modified: 0,
        conflictedFiles: [],
        files: {},
        errorMessage: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async addFile(filePath: string): Promise<void> {
    const git = await this.getGit();
    // git add takes relative path or absolute? simple-git usually handles absolute if cwd is set correctly.
    // But let's be safe and use relative or just pass it. simple-git documentation says it can handle paths.
    // However, if we are in root, absolute path might be outside? No.
    // Let's use relative path to ensure safety.
    const rootPath = await this.getRootPath();
    const relativePath = path.relative(rootPath, filePath);
    await git.add(relativePath);
  }
  
  async getDiff(filePath: string): Promise<string> {
    const git = await this.getGit();
    const rootPath = await this.getRootPath();
    const relativePath = path.relative(rootPath, filePath);
    // Diff of working directory vs HEAD (shows what changed)
    // If we want diff of staged vs HEAD? Or working vs Index?
    // git diff <file> shows Working vs Index (Unstaged changes)
    // git diff --cached <file> shows Index vs HEAD (Staged changes)
    // We probably want to see "what will happen if I save/commit".
    // Let's return both or just a combined diff?
    // User wants "git diff". Usually means working changes.
    return await git.diff([relativePath]);
  }

  async resolveConflict(filePath: string): Promise<void> {
    const git = await this.getGit();
    await git.add(filePath);
  }
}

export const gitService = new GitService();

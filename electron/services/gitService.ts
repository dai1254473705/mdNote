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
  private async getGit(repoPath?: string): Promise<SimpleGit> {
    const rootPath = repoPath || await this.getRootPath();
    if (!rootPath) {
      throw new Error('Project path not configured');
    }

    if (!fs.existsSync(rootPath)) {
      await fs.ensureDir(rootPath);
    }

    return simpleGit(rootPath);
  }

  async initRepo(): Promise<void> {
    const rootPath = await this.getRootPath();
    if (!rootPath) return;

    await fs.ensureDir(rootPath);
    const git = await this.getGit();

    const isRepo = await fs.pathExists(path.join(rootPath, '.git'));
    if (!isRepo) {
      await git.init();
      // Initial commit to allow branches to exist
      await this.commit('Initial commit by mdNote');
    }
  }

  async setRemote(url: string, repoPath?: string): Promise<void> {
    const git = await this.getGit(repoPath);
    const remotes = await git.getRemotes(true);
    const hasOrigin = remotes.some(r => r.name === 'origin');

    if (hasOrigin) {
      await git.removeRemote('origin');
    }
    await git.addRemote('origin', url);

    // Only save config if it's the main repo
    if (!repoPath) {
      await configService.saveConfig({ remoteUrl: url });
    }
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

  async commit(message: string, repoPath?: string): Promise<void> {
    const git = await this.getGit(repoPath);
    await git.add('.');
    await git.commit(message);
  }

  async pull(repoPath?: string): Promise<void> {
    const git = await this.getGit(repoPath);
    const branch = await git.revparse(['--abbrev-ref', 'HEAD']);

    try {
      await git.pull('origin', branch, { '--rebase': null });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('couldn\'t find remote ref') || msg.includes('remote ref does not exist')) {
        console.warn('Pull skipped: remote branch does not exist yet.');
        return;
      }
      throw e;
    }
  }

  async push(repoPath?: string): Promise<void> {
    const git = await this.getGit(repoPath);
    const branch = await git.revparse(['--abbrev-ref', 'HEAD']);

    await git.push('origin', branch, { '-u': null });
  }

  async getStatus(repoPath?: string): Promise<GitStatus> {
    try {
      const rootPath = repoPath || await this.getRootPath();
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

      const git = await this.getGit(repoPath);
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

  async addFile(filePath: string, repoPath?: string): Promise<void> {
    const git = await this.getGit(repoPath);
    const rootPath = repoPath || await this.getRootPath();
    const relativePath = path.relative(rootPath, filePath);
    await git.add(relativePath);
  }

  async getDiff(filePath: string, repoPath?: string): Promise<string> {
    const git = await this.getGit(repoPath);
    const rootPath = repoPath || await this.getRootPath();
    const relativePath = path.relative(rootPath, filePath);
    return await git.diff([relativePath]);
  }

  async resolveConflict(filePath: string, repoPath?: string): Promise<void> {
    const git = await this.getGit(repoPath);
    await git.add(filePath);
  }
}

export const gitService = new GitService();

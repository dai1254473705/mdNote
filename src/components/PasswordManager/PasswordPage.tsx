import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '../../store';
import { Key, Eye, EyeOff, Plus, Edit2, Trash2, Lock, FolderOpen, Shield, Check, Copy, ExternalLink, Search, LayoutGrid, List, Settings, Wand2 } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { ConfirmDialog } from '../ConfirmDialog';
import { PasswordGenerator } from './PasswordGenerator';
import { calculateStrength } from '../../utils/password-generator';
import type { PasswordEntry } from '../../types';

// Setup Master Password Dialog
const SetupMasterPasswordDialog = observer(({ isOpen, onComplete }: {
    isOpen: boolean;
    onComplete: () => void;
}) => {
    const { passwordStore } = useStore();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('密码至少需要6个字符');
            return;
        }

        if (password !== confirmPassword) {
            setError('两次输入的密码不一致');
            return;
        }

        const success = await passwordStore.setMasterPassword(password);
        if (success) {
            setPassword('');
            setConfirmPassword('');
            onComplete();
        }
    };

    return (
        <Dialog.Root open={isOpen}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200" />
                <Dialog.Content className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 w-full max-w-md animate-in zoom-in-95 duration-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-primary/10 rounded-full">
                            <Shield className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                设置主密码
                            </Dialog.Title>
                            <Dialog.Description asChild>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    主密码用于加密您的密码数据，请妥善保管
                                </p>
                            </Dialog.Description>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                主密码
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-gray-100"
                                placeholder="至少6个字符"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                确认密码
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-gray-100"
                                placeholder="再次输入密码"
                            />
                        </div>
                        {error && (
                            <p className="text-sm text-red-500">{error}</p>
                        )}
                        <button
                            type="submit"
                            className="w-full py-2 bg-primary hover:bg-primary/90 text-white rounded-md transition-colors"
                        >
                            设置主密码
                        </button>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
});

// Unlock Screen (Non-modal)
const UnlockScreen = observer(({ onUnlock }: {
    onUnlock: (password: string) => void;
}) => {
    const { passwordStore } = useStore();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const success = await passwordStore.unlock(password);
            if (success) {
                onUnlock(password);
                setPassword('');
                setError('');
            } else {
                setError('密码错误');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-full w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        解锁密码管理器
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        为了您的数据安全，请输入主密码进行访问
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-lg text-center tracking-widest transition-all dark:text-gray-100 placeholder-gray-400"
                            placeholder="输入主密码"
                            autoFocus
                        />
                    </div>
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg text-center">
                            {error}
                        </div>
                    )}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-all transform active:scale-[0.98] shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? '验证中...' : '立即解锁'}
                    </button>

                    <div className="text-center">
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                            如果您忘记了主密码，数据将被锁定无法恢复
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
});

// Change Master Password Dialog
const ChangeMasterPasswordDialog = observer(({ isOpen, onClose }: {
    isOpen: boolean;
    onClose: () => void;
}) => {
    const { passwordStore } = useStore();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (newPassword.length < 6) {
            setError('新密码至少需要6个字符');
            setIsLoading(false);
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('两次输入的新密码不一致');
            setIsLoading(false);
            return;
        }

        const success = await passwordStore.changeMasterPassword(oldPassword, newPassword);
        if (success) {
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setError('');
            onClose();
        } else {
            setError('原密码错误');
        }
        setIsLoading(false);
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200" />
                <Dialog.Content className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 w-full max-w-md animate-in zoom-in-95 duration-200 p-6">
                    <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        修改主密码
                    </Dialog.Title>
                    <Dialog.Description className="sr-only">
                        修改密码管理器的主密码
                    </Dialog.Description>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                原密码
                            </label>
                            <input
                                type="password"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-gray-100"
                                placeholder="输入当前主密码"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                新密码
                            </label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-gray-100"
                                placeholder="至少6个字符"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                确认新密码
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-gray-100"
                                placeholder="再次输入新密码"
                            />
                        </div>
                        {error && (
                            <p className="text-sm text-red-500">{error}</p>
                        )}
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                disabled={isLoading}
                            >
                                取消
                            </button>
                            <button
                                type="submit"
                                className="flex-1 py-2 bg-primary hover:bg-primary/90 text-white rounded-md transition-colors"
                                disabled={isLoading}
                            >
                                {isLoading ? '修改中...' : '确认修改'}
                            </button>
                        </div>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
});

// Password Entry Form Dialog
const PasswordEntryDialog = observer(({ entry, isOpen, onClose }: {
    entry?: PasswordEntry;
    isOpen: boolean;
    onClose: () => void;
}) => {
    const { passwordStore } = useStore();
    const [title, setTitle] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [website, setWebsite] = useState('');
    const [notes, setNotes] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showGenerator, setShowGenerator] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // ... (useEffect remains same)

    const strength = calculateStrength(password);

    const handleSelectPassword = (newPassword: string) => {
        setPassword(newPassword);
        setShowGenerator(false);
    };

    // ... (handleSubmit remains same) ...
    // Note: I need to skip the useEffect and handleSubmit lines in replacement to avoid messing them up if context is not exact.
    // So I will just replace the render part mostly.

    // Actually, I can't easily skip lines in replacement content.
    // I will replace the state definition and then subsequent call will replace the JSX.

    // Let's do state update first.


    // Reset form when entry changes or dialog opens/closes
    useEffect(() => {
        if (entry) {
            // Editing existing entry - load the password directly (no encryption)
            setTitle(entry.title || '');
            setUsername(entry.username || '');
            setPassword(entry.password || '');
            setEmail(entry.email || '');
            setWebsite(entry.website || '');
            setNotes(entry.notes || '');
            setShowPassword(false);
            setError('');
        } else {
            // Adding new entry - reset all fields
            setTitle('');
            setUsername('');
            setPassword('');
            setEmail('');
            setWebsite('');
            setNotes('');
            setShowPassword(false);
            setError('');
        }
    }, [entry, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (!title.trim()) {
            setError('请输入标题');
            setIsLoading(false);
            return;
        }

        try {
            // Save password without encryption
            await passwordStore.savePassword({
                id: entry?.id,
                title: title.trim(),
                username: username.trim() || undefined,
                password: password,
                email: email.trim() || undefined,
                website: website.trim() || undefined,
                notes: notes.trim() || undefined,
                encrypted: false
            });

            onClose();
        } catch (err) {
            setError('保存失败，请重试');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200" />
                <Dialog.Content className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 w-full max-w-md animate-in zoom-in-95 duration-200 p-6 max-h-[90vh] overflow-y-auto">
                    <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        {entry ? '编辑密码' : '添加密码'}
                    </Dialog.Title>
                    <Dialog.Description className="sr-only">
                        {entry ? '编辑已保存的密码信息' : '添加新的密码到密码管理器'}
                    </Dialog.Description>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                标题 *
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-gray-100"
                                placeholder="例如：Google 账号"
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                用户名
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-gray-100"
                                placeholder="用户名或账号"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    密码 *
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowGenerator(!showGenerator)}
                                    className={`text-xs flex items-center gap-1 transition-colors ${showGenerator ? 'text-primary' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                        }`}
                                >
                                    <Wand2 size={12} />
                                    {showGenerator ? '收起生成器' : '生成密码'}
                                </button>
                            </div>

                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-gray-100"
                                    placeholder="密码"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            {/* Strength Indicator */}
                            {password && (
                                <div className="mt-1.5 flex items-center gap-2">
                                    <div className="flex-1 flex gap-1 h-1">
                                        {[1, 2, 3, 4].map((level) => (
                                            <div
                                                key={level}
                                                className={`flex-1 rounded-full transition-colors ${level <= strength.score ? strength.color : 'bg-gray-200 dark:bg-gray-700'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-right">
                                        {strength.label}
                                    </span>
                                </div>
                            )}

                            {/* Password Generator */}
                            {showGenerator && (
                                <div className="mt-3 mb-4">
                                    <PasswordGenerator onSelect={handleSelectPassword} />
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                邮箱
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-gray-100"
                                placeholder="邮箱地址"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                网址
                            </label>
                            <input
                                type="url"
                                value={website}
                                onChange={(e) => setWebsite(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-gray-100"
                                placeholder="https://example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                备注
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-gray-100 resize-none"
                                rows={3}
                                placeholder="额外信息..."
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-red-500">{error}</p>
                        )}

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                disabled={isLoading}
                            >
                                取消
                            </button>
                            <button
                                type="submit"
                                className="flex-1 py-2 bg-primary hover:bg-primary/90 text-white rounded-md transition-colors"
                                disabled={isLoading}
                            >
                                {isLoading ? '保存中...' : '保存'}
                            </button>
                        </div>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
});

// Helper to get domain for favicon
const getFaviconUrl = (url?: string) => {
    try {
        if (!url) return '';
        const hostname = new URL(url).hostname;
        return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
    } catch {
        return '';
    }
};

// Password Item Card (Grid View)
const PasswordItem = observer(({ entry, onEdit, onDelete }: {
    entry: PasswordEntry;
    onEdit: (entry: PasswordEntry) => void;
    onDelete: (id: string) => void;
}) => {
    const { passwordStore } = useStore();
    const [showPassword, setShowPassword] = useState(false);
    const [copied, setCopied] = useState(false);
    const [imgError, setImgError] = useState(false);

    useEffect(() => {
        setImgError(false);
    }, [entry.website]);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(entry.password);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const faviconUrl = getFaviconUrl(entry.website);
    const showFavicon = passwordStore.settings.showFavicons && faviconUrl && !imgError;
    const initial = entry.title.charAt(0).toUpperCase();

    return (
        <div className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg transition-all hover:border-primary/30 relative overflow-hidden">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold shadow-sm ${showFavicon
                        ? 'bg-white'
                        : 'bg-gradient-to-br from-primary/10 to-primary/5 text-primary'
                        }`}>
                        {showFavicon ? (
                            <img
                                src={faviconUrl}
                                alt={entry.title}
                                className="w-8 h-8 object-contain"
                                onError={() => setImgError(true)}
                            />
                        ) : (
                            initial
                        )}
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1 text-base">{entry.title}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{entry.username || 'No Username'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4 bg-white dark:bg-gray-800 shadow-sm rounded-lg p-1 border border-gray-100 dark:border-gray-700">
                    <button
                        onClick={() => onEdit(entry)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors text-gray-500 hover:text-primary"
                        title="编辑"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={() => onDelete(entry.id)}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors text-gray-500 hover:text-red-500"
                        title="删除"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 flex items-center justify-between group-hover:bg-white dark:group-hover:bg-gray-800 border border-transparent group-hover:border-gray-100 dark:group-hover:border-gray-700 transition-colors">
                <div className="flex-1 font-mono text-sm text-gray-600 dark:text-gray-300 truncate mr-2">
                    {showPassword ? entry.password : '••••••••••••'}
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors text-gray-500"
                        title={showPassword ? '隐藏' : '显示'}
                    >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button
                        onClick={handleCopy}
                        className={`p-1.5 rounded-md transition-all duration-300 ${copied
                            ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                            : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500'
                            }`}
                        title="复制"
                    >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                </div>
            </div>

            {entry.website && (
                <a
                    href={entry.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mt-3 text-xs text-gray-400 hover:text-primary transition-colors truncate hover:underline flex items-center gap-1"
                >
                    <ExternalLink size={10} />
                    {entry.website}
                </a>
            )}
        </div>
    );
});

// Password List Item (List View)
const PasswordListItem = observer(({ entry, onEdit, onDelete }: {
    entry: PasswordEntry;
    onEdit: (entry: PasswordEntry) => void;
    onDelete: (id: string) => void;
}) => {
    const { passwordStore } = useStore();
    const [copied, setCopied] = useState(false);
    const [imgError, setImgError] = useState(false);

    useEffect(() => {
        setImgError(false);
    }, [entry.website]);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(entry.password);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const faviconUrl = getFaviconUrl(entry.website);
    const showFavicon = passwordStore.settings.showFavicons && faviconUrl && !imgError;
    const initial = entry.title.charAt(0).toUpperCase();

    return (
        <div className="group flex items-center justify-between bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            {/* Info */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center text-lg font-bold shadow-sm ${showFavicon
                    ? 'bg-white'
                    : 'bg-gradient-to-br from-primary/10 to-primary/5 text-primary'
                    }`}>
                    {showFavicon ? (
                        <img
                            src={faviconUrl}
                            alt={entry.title}
                            className="w-6 h-6 object-contain"
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        initial
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">{entry.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{entry.username}</p>
                </div>
            </div>

            {/* Actions / Details */}
            <div className="flex items-center gap-6">
                {entry.website && (
                    <a
                        href={entry.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hidden md:flex items-center gap-1 text-xs text-gray-400 hover:text-primary transition-colors max-w-[150px] truncate"
                    >
                        {entry.website.replace(/^https?:\/\//, '')}
                    </a>
                )}

                <div className="flex items-center gap-1">
                    <button
                        onClick={handleCopy}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${copied
                            ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                    >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        {copied ? '已复制' : '复制密码'}
                    </button>

                    <div className="w-px h-4 bg-gray-200 dark:bg-gray-600 mx-1" />

                    <button
                        onClick={() => onEdit(entry)}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors text-gray-500 hover:text-primary"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={() => onDelete(entry.id)}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors text-gray-500 hover:text-red-500"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
});

// Main Password Page Component
export const PasswordPage = observer(() => {
    const { passwordStore } = useStore();
    const [editingEntry, setEditingEntry] = useState<PasswordEntry | undefined>();
    const [showEntryDialog, setShowEntryDialog] = useState(false);
    const [showSetupDialog, setShowSetupDialog] = useState(false);
    const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{
        isOpen: boolean;
        entryId: string;
        entryTitle: string;
    }>({
        isOpen: false,
        entryId: '',
        entryTitle: ''
    });

    useEffect(() => {
        passwordStore.initialize();
    }, [passwordStore]);

    const handleUnlock = async (password: string) => {
        await passwordStore.unlock(password);
    };

    const handleLock = () => {
        passwordStore.lock();
    };

    const handleEditEntry = (entry: PasswordEntry) => {
        setEditingEntry(entry);
        setShowEntryDialog(true);
    };

    const handleDeleteEntry = async (id: string) => {
        const entry = passwordStore.passwords.find(p => p.id === id);
        if (entry) {
            setDeleteConfirm({
                isOpen: true,
                entryId: id,
                entryTitle: entry.title
            });
        }
    };

    const confirmDelete = async () => {
        await passwordStore.deletePassword(deleteConfirm.entryId);
        setDeleteConfirm({ isOpen: false, entryId: '', entryTitle: '' });
    };

    const cancelDelete = () => {
        setDeleteConfirm({ isOpen: false, entryId: '', entryTitle: '' });
    };

    const [showSettingsDialog, setShowSettingsDialog] = useState(false);

    // ... (rest of state)

    const SettingsDialog = observer(({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
        const { passwordStore } = useStore();
        const [autoLockMinutes, setAutoLockMinutes] = useState(passwordStore.settings.autoLockMinutes);

        const handleSave = async () => {
            await passwordStore.updateSettings({
                autoLockMinutes,
            });
            onClose();
        };

        return (
            <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200" />
                    <Dialog.Content className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 w-full max-w-sm animate-in zoom-in-95 duration-200 p-6">
                        <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                            密码管理器设置
                        </Dialog.Title>

                        <div className="space-y-4">
                            {/* Show Favicons */}
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    显示网站图标
                                </label>
                                <button
                                    onClick={() => passwordStore.updateSettings({ showFavicons: !passwordStore.settings.showFavicons })}
                                    className={`w-11 h-6 flex items-center rounded-full transition-colors ${passwordStore.settings.showFavicons ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
                                        }`}
                                >
                                    <span
                                        className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${passwordStore.settings.showFavicons ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">
                                使用 Google API 获取网站图标（可能会发送域名信息）
                            </p>

                            {/* Auto-lock Timer */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    自动锁定 (分钟)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="60"
                                    value={autoLockMinutes}
                                    onChange={(e) => setAutoLockMinutes(parseInt(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-gray-100"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    设为 0 表示禁用自动锁定
                                </p>
                            </div>

                            {/* Data Location */}
                            <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    onClick={() => passwordStore.openDataFileLocation()}
                                    className="flex items-center gap-2 text-sm text-primary hover:underline hover:text-primary/80 transition-colors"
                                >
                                    <FolderOpen size={16} />
                                    打开数据文件位置
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                            >
                                保存
                            </button>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        );
    });

    const handleAddEntry = () => {
        setEditingEntry(undefined);
        setShowEntryDialog(true);
    };

    const handleCloseEntryDialog = () => {
        setShowEntryDialog(false);
        setEditingEntry(undefined);
    };



    // Setup flow
    if (!passwordStore.isInitialized) {
        return (
            <div className="flex items-center justify-center h-full p-8">
                <div className="text-center text-gray-500">加载中...</div>
            </div>
        );
    }

    // Show setup dialog if no master password
    if (!passwordStore.masterPasswordSet && !showSetupDialog) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="flex flex-col items-center justify-center p-8 text-center max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <Shield className="w-16 h-16 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        设置主密码
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                        首次使用需要设置主密码来保护您的密码数据
                    </p>
                    <button
                        onClick={() => setShowSetupDialog(true)}
                        className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-md transition-colors w-full"
                    >
                        立即设置
                    </button>
                </div>
                <SetupMasterPasswordDialog
                    isOpen={showSetupDialog}
                    onComplete={() => setShowSetupDialog(false)}
                />
            </div>
        );
    }

    // Show unlock screen if locked
    if (passwordStore.isLocked) {
        return (
            <UnlockScreen
                onUnlock={handleUnlock}
            />
        );
    }

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 pr-12">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Key className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            密码管理器
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* View Mode Toggles */}
                        <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mr-2">
                            <button
                                onClick={() => passwordStore.updateSettings({ viewMode: 'grid' })}
                                className={`p-1.5 rounded-md transition-all ${passwordStore.settings.viewMode === 'grid'
                                    ? 'bg-white dark:bg-gray-600 shadow-sm text-primary'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                                title="网格视图"
                            >
                                <LayoutGrid size={16} />
                            </button>
                            <button
                                onClick={() => passwordStore.updateSettings({ viewMode: 'list' })}
                                className={`p-1.5 rounded-md transition-all ${passwordStore.settings.viewMode === 'list'
                                    ? 'bg-white dark:bg-gray-600 shadow-sm text-primary'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                                title="列表视图"
                            >
                                <List size={16} />
                            </button>
                        </div>

                        <button
                            onClick={() => setShowSettingsDialog(true)}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                            title="设置"
                        >
                            <Settings size={18} />
                        </button>

                        <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

                        <button
                            onClick={() => setShowChangePasswordDialog(true)}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                            title="修改主密码"
                        >
                            <Shield size={18} />
                        </button>
                        <button
                            onClick={handleLock}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                            title="锁定"
                        >
                            <Lock size={18} />
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={passwordStore.searchQuery}
                        onChange={(e) => passwordStore.setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-gray-100"
                        placeholder="搜索密码..."
                    />
                </div>
            </div>

            {/* Password List */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {passwordStore.filteredPasswords.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                            <Key className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
                            {passwordStore.searchQuery ? '未找到匹配的密码' : '还没有保存任何密码'}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto mb-6">
                            {passwordStore.searchQuery
                                ? '尝试使用不同的关键词搜索'
                                : '添加您的第一个账号密码，我们将为您安全保管'}
                        </p>
                        {!passwordStore.searchQuery && (
                            <button
                                onClick={handleAddEntry}
                                className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-md transition-colors"
                            >
                                添加密码
                            </button>
                        )}
                    </div>
                ) : (
                    passwordStore.settings.viewMode === 'list' ? (
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                            {passwordStore.filteredPasswords.map((entry) => (
                                <PasswordListItem
                                    key={entry.id}
                                    entry={entry}
                                    onEdit={handleEditEntry}
                                    onDelete={handleDeleteEntry}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {passwordStore.filteredPasswords.map((entry) => (
                                <PasswordItem
                                    key={entry.id}
                                    entry={entry}
                                    onEdit={handleEditEntry}
                                    onDelete={handleDeleteEntry}
                                />
                            ))}
                        </div>
                    )
                )}
            </div>

            {/* Add Button */}
            <div className="absolute bottom-8 right-8">
                <button
                    onClick={handleAddEntry}
                    className="flex items-center gap-2 px-5 py-3 bg-primary hover:bg-primary/90 text-white rounded-full shadow-lg hover:shadow-xl transition-all font-medium"
                >
                    <Plus size={20} />
                    添加密码
                </button>
            </div>

            {/* Setup Dialog */}
            <SetupMasterPasswordDialog
                isOpen={showSetupDialog}
                onComplete={() => setShowSetupDialog(false)}
            />

            {/* Add/Edit Dialog */}
            <PasswordEntryDialog
                entry={editingEntry}
                isOpen={showEntryDialog}
                onClose={handleCloseEntryDialog}
            />

            {/* Settings Dialog */}
            <SettingsDialog
                isOpen={showSettingsDialog}
                onClose={() => setShowSettingsDialog(false)}
            />

            {/* Confirm Delete Dialog */}
            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                title="删除密码"
                message={`确定要删除 "${deleteConfirm.entryTitle}" 吗？此操作无法撤销。`}
                confirmLabel="删除"
                cancelLabel="取消"
                type="danger"
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
            />

            {/* Change Password Dialog */}
            <ChangeMasterPasswordDialog
                isOpen={showChangePasswordDialog}
                onClose={() => setShowChangePasswordDialog(false)}
            />
        </div>
    );
});


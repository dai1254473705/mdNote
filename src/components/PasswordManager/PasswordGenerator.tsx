import React, { useState, useEffect } from 'react';
import { RefreshCw, Copy, Check } from 'lucide-react';
import { generatePassword, calculateStrength } from '../../utils/password-generator';

interface PasswordGeneratorProps {
    onSelect: (password: string) => void;
}

export const PasswordGenerator: React.FC<PasswordGeneratorProps> = ({ onSelect }) => {
    const [length, setLength] = useState(16);
    const [options, setOptions] = useState({
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: true
    });
    const [password, setPassword] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        handleGenerate();
    }, [length, options]);

    const handleGenerate = () => {
        const newPassword = generatePassword(length, options);
        setPassword(newPassword);
    };

    const handleCopy = async () => {
        if (!password) return;
        await navigator.clipboard.writeText(password);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSelect = () => {
        onSelect(password);
    };

    const toggleOption = (key: keyof typeof options) => {
        // Prevent disabling all options
        const activeCount = Object.values(options).filter(Boolean).length;
        if (activeCount === 1 && options[key]) return;

        setOptions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const strength = calculateStrength(password);

    return (
        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4 animate-in slide-in-from-top-2 duration-200">
            {/* Display */}
            <div className="relative group">
                <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-3 pr-10 font-mono text-center text-lg tracking-wider break-all min-h-[50px] flex items-center justify-center">
                    {password}
                </div>
                <button
                    onClick={handleCopy}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="复制"
                >
                    {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
            </div>

            {/* Strength Bar */}
            <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-500 dark:text-gray-400 w-12 text-right">强度: {strength.label}</span>
                <div className="flex-1 flex gap-1 h-1.5">
                    {[1, 2, 3, 4].map((level) => (
                        <div
                            key={level}
                            className={`flex-1 rounded-full transition-colors ${level <= strength.score ? strength.color : 'bg-gray-200 dark:bg-gray-700'
                                }`}
                        />
                    ))}
                </div>
            </div>

            {/* Controls */}
            <div className="space-y-3">
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-12">长度: {length}</span>
                    <input
                        type="range"
                        min="8"
                        max="32"
                        value={length}
                        onChange={(e) => setLength(parseInt(e.target.value))}
                        className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={options.uppercase}
                            onChange={() => toggleOption('uppercase')}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-gray-700 dark:text-gray-300">大写字母 (A-Z)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={options.lowercase}
                            onChange={() => toggleOption('lowercase')}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-gray-700 dark:text-gray-300">小写字母 (a-z)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={options.numbers}
                            onChange={() => toggleOption('numbers')}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-gray-700 dark:text-gray-300">数字 (0-9)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={options.symbols}
                            onChange={() => toggleOption('symbols')}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-gray-700 dark:text-gray-300">特殊符号 (!@#)</span>
                    </label>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
                <button
                    type="button"
                    onClick={handleGenerate}
                    className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-white dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
                >
                    <RefreshCw size={16} />
                    刷新
                </button>
                <button
                    type="button"
                    onClick={handleSelect}
                    className="flex-1 py-2 bg-primary hover:bg-primary/90 text-white rounded-md transition-colors font-medium"
                >
                    使用此密码
                </button>
            </div>
        </div>
    );
};

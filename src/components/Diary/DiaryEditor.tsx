
import React, { useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '../../store';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Cloud, Sun, MapPin, Users } from 'lucide-react';
import { Preview } from '../Editor/Preview';

export const DiaryEditor: React.FC = observer(() => {
    const { diaryStore } = useStore();
    const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('preview');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Initial load handling
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        diaryStore.updateContent(e.target.value);

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
            diaryStore.saveDiary();
        }, 1000);
    };

    const handleMetaChange = (key: string, value: string) => {
        diaryStore.updateMeta({ [key]: value });
        diaryStore.saveDiary();
    };

    const dateStr = format(diaryStore.currentDate, 'yyyy年M月d日 EEEE', { locale: zhCN });

    if (diaryStore.loading) {
        return <div className="flex-1 flex items-center justify-center">加载中...</div>;
    }

    const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const clipboardData = e.clipboardData;
        const items = clipboardData?.items;
        if (!items) return;

        const files: File[] = [];
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.kind === 'file') {
                const file = item.getAsFile();
                if (file) files.push(file);
            }
        }

        if (files.length > 0) {
            e.preventDefault();
            const textarea = textareaRef.current;
            if (!textarea) return;

            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            // const text = textarea.value; // Unused


            for (const file of files) {
                try {
                    const arrayBuffer = await file.arrayBuffer();
                    const uint8Array = new Uint8Array(arrayBuffer);

                    // Construct path for the current diary entry
                    // Structure: diaryRoot / YYYY / YYYY-MM-DD / index.md
                    if (!diaryStore.diaryRootPath) {
                        console.error('Diary root path not found');
                        continue;
                    }

                    const dateStr = format(diaryStore.currentDate, 'yyyy-MM-dd');
                    const year = dateStr.split('-')[0];
                    // Note: We need to use / separator for Electron ipc
                    const currentMdPath = `${diaryStore.diaryRootPath}/${year}/${dateStr}/index.md`;

                    const result = await window.electronAPI.savePastedFile(
                        file.name,
                        uint8Array,
                        currentMdPath
                    );

                    if (result.success && result.data) {
                        const relativePath = result.data;
                        const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(file.name);

                        const insertText = isImage
                            ? `![${file.name}](${relativePath})`
                            : `[${file.name}](${relativePath})`;

                        // Insert text
                        // const before = textarea.value.substring(0, start); // Unused
                        // Actually better to use state or ref value, but here we iterate.
                        // Simplified: just update store once per file or careful with offsets.
                        // For simplicity, let's assume single file paste or sequential updates.
                        // We need the *latest* content if multiple files. 
                        // But standard editor usually handles one paste event.

                        // We will just do one file for now or handle the text update carefully.
                        // Let's re-read text from store/textarea for subsequent files if necessary.
                        // But actually, let's use the 'diaryStore.updateContent' which triggers re-render.
                        // Re-render might lose focus/cursor if not handled? 
                        // DiaryEditor controls value passed to textarea.

                        const currentContent = diaryStore.content;
                        // Wait, 'text' variable is from start of handler. 
                        // If we process multiple files, we need to accumulate inserts.
                        // Let's stick to the visible text modification.

                        const newContent = currentContent.substring(0, start) + insertText + currentContent.substring(end);
                        diaryStore.updateContent(newContent);

                        // Move cursor
                        setTimeout(() => {
                            if (textareaRef.current) {
                                textareaRef.current.focus();
                                const newCursorPos = start + insertText.length;
                                textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
                            }
                        }, 0);

                        // Trigger save
                        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
                        saveTimeoutRef.current = setTimeout(() => {
                            diaryStore.saveDiary();
                        }, 1000);

                        // Should technically break if we only want to handle first file to avoid complexity with offsets
                        // but loop is fine if we update start/end refs. 
                        // For now, let's just break after first file to be safe similarly to basic implementations
                        break;
                    }
                } catch (error) {
                    console.error('Paste error:', error);
                }
            }
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-gray-900">
            {/* Header / Metadata */}
            <div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold">{dateStr}</h1>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setViewMode(viewMode === 'edit' ? 'preview' : 'edit')}
                            className="px-3 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                            {viewMode === 'edit' ? '预览' : '编辑'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <Sun size={16} className="text-gray-500" />
                        <select
                            value={diaryStore.meta.weather || ''}
                            onChange={(e) => handleMetaChange('weather', e.target.value)}
                            className="bg-transparent border-none outline-none w-full"
                        >
                            <option value="">天气</option>
                            <option value="Sunny">晴天</option>
                            <option value="Cloudy">多云</option>
                            <option value="Rainy">雨天</option>
                            <option value="Snowy">雪天</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <Cloud size={16} className="text-gray-500" />
                        <select
                            value={diaryStore.meta.mood || ''}
                            onChange={(e) => handleMetaChange('mood', e.target.value)}
                            className="bg-transparent border-none outline-none w-full"
                        >
                            <option value="">心情</option>
                            <option value="Happy">开心</option>
                            <option value="Neutral">平淡</option>
                            <option value="Sad">难过</option>
                            <option value="Energetic">充满活力</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-gray-500" />
                        <input
                            type="text"
                            placeholder="地点"
                            value={diaryStore.meta.location || ''}
                            onChange={(e) => handleMetaChange('location', e.target.value)}
                            className="bg-transparent border-none outline-none w-full"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Users size={16} className="text-gray-500" />
                        <input
                            type="text"
                            placeholder="人物"
                            value={diaryStore.meta.people || ''}
                            onChange={(e) => handleMetaChange('people', e.target.value)}
                            className="bg-transparent border-none outline-none w-full"
                        />
                    </div>
                </div>
            </div>

            {/* Editor Body */}
            <div className="flex-1 flex overflow-hidden">
                {viewMode !== 'preview' && (
                    <textarea
                        ref={textareaRef}
                        className="flex-1 h-full resize-none p-8 outline-none bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-mono text-base leading-relaxed custom-scrollbar"
                        value={diaryStore.content}
                        onChange={handleChange}
                        onPaste={handlePaste}
                        placeholder="今天发生了什么？"
                    />
                )}
                {viewMode !== 'edit' && (
                    <div className="flex-1 h-full overflow-y-auto custom-scrollbar bg-gray-50 dark:bg-gray-900/50 p-8">
                        <Preview content={diaryStore.content} />
                    </div>
                )}
            </div>

            {diaryStore.saving && (
                <div className="absolute bottom-4 right-4 text-xs text-gray-400 animate-pulse bg-white dark:bg-gray-800 p-1 rounded shadow">
                    保存中...
                </div>
            )}
        </div>
    );
});

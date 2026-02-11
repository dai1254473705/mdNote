
import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '../../store';
import { DiarySidebar } from './DiarySidebar';
import { DiaryEditor } from './DiaryEditor';


const DiarySetup = () => {
    const { diaryStore } = useStore();
    const [folderName, setFolderName] = React.useState('Diary');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (folderName.trim()) {
            diaryStore.setConfig(folderName.trim());
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <div className="max-w-md w-full p-8 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <h2 className="text-2xl font-bold mb-2">Welcome to Diary</h2>
                <p className="text-gray-500 mb-6">Create a dedicated folder for your daily journals within this project.</p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <label>
                        <span className="block text-sm font-medium mb-1">Folder Name</span>
                        <input
                            type="text"
                            value={folderName}
                            onChange={e => setFolderName(e.target.value)}
                            className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g. Diary"
                            autoFocus
                        />
                    </label>
                    <button
                        type="submit"
                        disabled={!folderName.trim()}
                        className="bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Get Started
                    </button>
                </form>
            </div>
        </div>
    );
};

export const DiaryPage: React.FC = observer(() => {
    const { diaryStore } = useStore();

    useEffect(() => {
        diaryStore.init();
    }, [diaryStore]);

    if (!diaryStore.isConfigured) {
        return <DiarySetup />;
    }

    return (
        <div className="flex h-full w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <DiarySidebar />
            <div className="flex-1 h-full overflow-hidden flex flex-col">
                <DiaryEditor />
            </div>
        </div>
    );
});


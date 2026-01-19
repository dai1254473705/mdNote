import { 
  Bold, 
  Italic, 
  Heading1, 
  Heading2, 
  Heading3, 
  Quote, 
  Code, 
  Link, 
  Image, 
  Table,
  FileText,
  Wand2
} from 'lucide-react';

interface EditorToolbarProps {
  onInsert: (prefix: string, suffix: string) => void;
  onUpload?: (type: 'image' | 'file') => void;
  onFormat?: () => void;
}

export const EditorToolbar = ({ onInsert, onUpload, onFormat }: EditorToolbarProps) => {
  const tools = [
    { icon: Bold, label: 'Bold', prefix: '**', suffix: '**' },
    { icon: Italic, label: 'Italic', prefix: '*', suffix: '*' },
    { icon: Heading1, label: 'H1', prefix: '# ', suffix: '' },
    { icon: Heading2, label: 'H2', prefix: '## ', suffix: '' },
    { icon: Heading3, label: 'H3', prefix: '### ', suffix: '' },
    { icon: Quote, label: 'Quote', prefix: '> ', suffix: '' },
    { icon: Code, label: 'Code', prefix: '```\n', suffix: '\n```' },
    { icon: Link, label: 'Link', prefix: '[', suffix: '](url)' },
    { 
      icon: Image, 
      label: 'Insert Image', 
      prefix: '', 
      suffix: '',
      action: () => onUpload && onUpload('image') 
    },
    { 
      icon: FileText, 
      label: 'Insert File', 
      prefix: '', 
      suffix: '',
      action: () => onUpload && onUpload('file') 
    },
    { icon: Table, label: 'Table', prefix: '| Header | Header |\n| --- | --- |\n| Cell | Cell |', suffix: '' },
    {
      icon: Wand2,
      label: 'Format Document',
      prefix: '',
      suffix: '',
      action: onFormat
    }
  ];

  return (
    <div className="flex items-center gap-1 p-2 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 overflow-x-auto">
      {tools.map((tool, index) => (
        <button
          key={index}
          onClick={() => tool.action ? tool.action() : onInsert(tool.prefix, tool.suffix)}
          className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          title={tool.label}
        >
          <tool.icon size={16} />
        </button>
      ))}
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';

interface MessageEditAreaProps {
  initialValue: string;
  onSave: (value: string) => void;
  onCancel: () => void;
  isMe: boolean;
  saving: boolean;
  customTheme?: any;
  useCustomTheme?: boolean;
}

export const MessageEditArea: React.FC<MessageEditAreaProps> = ({
  initialValue,
  onSave,
  onCancel,
  isMe,
  saving,
  customTheme,
  useCustomTheme
}) => {
  const [value, setValue] = useState(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      // Put cursor at the end initially
      textareaRef.current.selectionStart = textareaRef.current.value.length;
      textareaRef.current.selectionEnd = textareaRef.current.value.length;
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSave(value);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="space-y-3 min-w-[240px]">
      <textarea 
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={`w-full p-3 rounded-xl text-sm focus:ring-2 outline-none resize-none transition-all duration-300 ${
          isMe 
            ? 'bg-black/20 border border-white/20 text-white placeholder:text-white/40 focus:ring-white/50' 
            : 'bg-white border border-gray-200 text-zinc-900 focus:ring-zinc-500'
        }`}
        rows={3}
      />
      <div className="flex justify-end gap-2">
        <button 
          onClick={onCancel}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
            isMe ? 'hover:bg-white/10 text-white/90 hover:text-white' : 'hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900'
          }`}
        >
          Annuleren
        </button>
        <button 
          onClick={() => onSave(value)}
          disabled={saving || !value.trim()}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 ${
            isMe 
              ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-black/20' 
              : 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm'
          }`}
          style={useCustomTheme && !isMe ? {
            backgroundColor: customTheme?.primary_color,
            color: '#ffffff'
          } : {}}
        >
          {saving ? 'Bezig...' : 'Opslaan'}
        </button>
      </div>
    </div>
  );
};

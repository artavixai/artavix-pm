import React, { useState, useRef, useEffect, useCallback } from 'react';

const BoldIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 0 24 24" width="20px" fill="currentColor" {...props}><path d="M0 0h24v24H0z" fill="none"/><path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/></svg>;
const ItalicIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 0 24 24" width="20px" fill="currentColor" {...props}><path d="M0 0h24v24H0z" fill="none"/><path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/></svg>;
const UnderlineIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 0 24 24" width="20px" fill="currentColor" {...props}><path d="M0 0h24v24H0z" fill="none"/><path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/></svg>;
const TextSizeIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" height="20px" width="20px" fill="currentColor" viewBox="0 0 24 24" {...props}><path d="M9.62 12.19L11 8.5h2l1.38 3.69L15.15 15h-1.63l-.7-1.81h-2.4l-.7 1.81H8.1l1.52-2.81zM12 10.33L11.1 12.5h1.8L12 10.33zM5 3v3h5v12h3V6h5V3H5z" /></svg>;

const TEXT_SIZES = [
  { label: 'Small', value: '1' },
  { label: 'Normal', value: '3' },
  { label: 'Medium', value: '4' },
  { label: 'Large', value: '5' },
  { label: 'Extra Large', value: '7' }
];

const ToolbarButton = ({ label, onClick, children, isActive }) => {
  const activeClasses = isActive ? 'bg-blue-200 text-blue-800' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900';
  return (
    <button type="button" onClick={onClick} title={label} className={`relative p-1.5 rounded-md transition-colors duration-150 focus:outline-none ${activeClasses}`}>
      {children}
    </button>
  );
};

const ToolbarDropdown = ({ label, options, onSelect, triggerContent }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (value) => {
    onSelect(value);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button type="button" title={label} onClick={() => setIsOpen(!isOpen)} className="p-1.5 rounded-md text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors duration-150 focus:outline-none">
        {triggerContent}
      </button>
      {isOpen && (
        <div className="absolute left-0 z-20 mt-1 w-36 bg-white rounded-xl shadow-xl border border-slate-200 py-1">
          <ul>
            {options.map((option) => (
              <li key={option.value}>
                <button onClick={() => handleSelect(option.value)} className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 font-medium">
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const TextEditorToolbar = ({ onCommand, activeFormats }) => {
  return (
    <div className="bg-slate-100 border-b border-slate-200 p-1.5 flex items-center gap-1 rounded-t-xl" dir="ltr">
      <ToolbarDropdown
          label="Font Size"
          options={TEXT_SIZES}
          onSelect={(value) => onCommand('setTextSize', value)}
          triggerContent={<TextSizeIcon />}
      />
      <div className="w-px h-5 bg-slate-300 mx-1"></div>
      <div className="flex items-center gap-0.5">
        <ToolbarButton label="Bold" onClick={() => onCommand('bold')} isActive={activeFormats.has('bold')}>
          <BoldIcon />
        </ToolbarButton>
        <ToolbarButton label="Italic" onClick={() => onCommand('italic')} isActive={activeFormats.has('italic')}>
          <ItalicIcon />
        </ToolbarButton>
        <ToolbarButton label="Underline" onClick={() => onCommand('underline')} isActive={activeFormats.has('underline')}>
          <UnderlineIcon />
        </ToolbarButton>
      </div>
    </div>
  );
};

const CustomTextEditor = ({ value, onChange }) => {
  const [activeFormats, setActiveFormats] = useState(new Set());
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const executeCommand = useCallback((command, val = null) => {
    document.execCommand(command, false, val);
    editorRef.current?.focus();
    updateToolbarState();
  }, []);

  const updateToolbarState = useCallback(() => {
    const newFormats = new Set();
    const commandsToQuery = ['bold', 'italic', 'underline'];
    commandsToQuery.forEach(cmd => {
      if (document.queryCommandState(cmd)) {
        newFormats.add(cmd);
      }
    });
    setActiveFormats(newFormats);
  }, []);

  const handleCommand = useCallback((command, value) => {
    if (command === 'setTextSize') {
      executeCommand('fontSize', value);
    } else {
      executeCommand(command);
    }
  }, [executeCommand]);

  const handleInput = (e) => {
    onChange(e.currentTarget.innerHTML);
  };

  return (
    <div className="border-2 border-slate-200 rounded-xl focus-within:border-blue-500 transition-all bg-white" dir="ltr">
      <TextEditorToolbar onCommand={handleCommand} activeFormats={activeFormats} />
      <div
        ref={editorRef}
        className="w-full min-h-[140px] p-3 text-slate-800 text-sm focus:outline-none"
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyUp={updateToolbarState}
        onMouseUp={updateToolbarState}
        onClick={updateToolbarState}
        style={{ textAlign: 'left' }}
      />
    </div>
  );
};

export default CustomTextEditor;
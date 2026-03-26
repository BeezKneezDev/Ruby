import { useState, useRef, useEffect } from 'react';
import './RichTextEditor.css';

function RichTextEditor({ value, onChange }) {
  const [mode, setMode] = useState('visual'); // 'visual' or 'html'
  const editorRef = useRef(null);
  const isUpdatingRef = useRef(false);

  // Only update editor content when value changes externally (like when loading an achievement to edit)
  useEffect(() => {
    if (editorRef.current && !isUpdatingRef.current && mode === 'visual') {
      const currentContent = editorRef.current.innerHTML;
      if (value !== currentContent && value !== undefined) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value, mode]);

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateContent();
  };

  const updateContent = () => {
    if (editorRef.current) {
      isUpdatingRef.current = true;
      onChange(editorRef.current.innerHTML);
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const toggleMode = () => {
    if (mode === 'visual') {
      setMode('html');
    } else {
      setMode('visual');
    }
  };

  const handleHtmlChange = (e) => {
    onChange(e.target.value);
  };

  return (
    <div className="rich-text-editor">
      <div className="editor-toolbar">
        <div className="toolbar-group">
          <button
            type="button"
            onClick={() => execCommand('bold')}
            className="toolbar-btn"
            title="Bold (Ctrl+B)"
            disabled={mode === 'html'}
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            onClick={() => execCommand('italic')}
            className="toolbar-btn"
            title="Italic (Ctrl+I)"
            disabled={mode === 'html'}
          >
            <em>I</em>
          </button>
        </div>

        <div className="toolbar-group">
          <button
            type="button"
            onClick={() => execCommand('formatBlock', '<h1>')}
            className="toolbar-btn"
            title="Heading 1"
            disabled={mode === 'html'}
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => execCommand('formatBlock', '<h2>')}
            className="toolbar-btn"
            title="Heading 2"
            disabled={mode === 'html'}
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => execCommand('formatBlock', '<h3>')}
            className="toolbar-btn"
            title="Heading 3"
            disabled={mode === 'html'}
          >
            H3
          </button>
          <button
            type="button"
            onClick={() => execCommand('formatBlock', '<p>')}
            className="toolbar-btn"
            title="Paragraph"
            disabled={mode === 'html'}
          >
            P
          </button>
        </div>

        <div className="toolbar-group">
          <button
            type="button"
            onClick={() => execCommand('insertUnorderedList')}
            className="toolbar-btn"
            title="Bullet List"
            disabled={mode === 'html'}
          >
            • List
          </button>
          <button
            type="button"
            onClick={() => execCommand('insertOrderedList')}
            className="toolbar-btn"
            title="Numbered List"
            disabled={mode === 'html'}
          >
            1. List
          </button>
        </div>

        <div className="toolbar-group">
          <button
            type="button"
            onClick={insertLink}
            className="toolbar-btn"
            title="Insert Link"
            disabled={mode === 'html'}
          >
            Link
          </button>
        </div>

        <div className="toolbar-group mode-toggle">
          <button
            type="button"
            onClick={toggleMode}
            className="toolbar-btn mode-btn"
            title="Toggle Visual/HTML mode"
          >
            {mode === 'visual' ? 'HTML' : 'Visual'}
          </button>
        </div>
      </div>

      <div className="editor-content">
        {mode === 'visual' ? (
          <div
            ref={editorRef}
            contentEditable
            className="editor-visual"
            onInput={updateContent}
            onPaste={handlePaste}
            suppressContentEditableWarning
          />
        ) : (
          <textarea
            className="editor-html"
            value={value || ''}
            onChange={handleHtmlChange}
            spellCheck="false"
          />
        )}
      </div>
    </div>
  );
}

export default RichTextEditor;

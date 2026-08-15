import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { motion, AnimatePresence } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const Notes = () => {
  const { role } = useAuth();
  const { notes, addNote } = useData();
  const [selectedNote, setSelectedNote] = useState(notes[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '', tags: [] });
  const [tagInput, setTagInput] = useState('');

  // Collation State
  const [collatedNotes, setCollatedNotes] = useState([]);
  const [draggedIdx, setDraggedIdx] = useState(null);

  // Editor State
  const editorRef = useRef(null);
  const [activeFormats, setActiveFormats] = useState({ bold: false, italic: false, underline: false, h1: false });

  const allTags = useMemo(() => {
    const tags = new Set(['All']);
    notes.forEach(n => n.tags?.forEach(t => tags.add(t)));
    return Array.from(tags);
  }, [notes]);

  const filteredNotes = notes.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag === 'All' || n.tags?.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  useEffect(() => {
    if (isAdding && editorRef.current) {
      if (editorRef.current.innerHTML !== formData.content) {
        editorRef.current.innerHTML = formData.content;
      }
    }
  }, [isAdding]);

  const handleEditorInput = () => {
    if (editorRef.current) {
      setFormData({ ...formData, content: editorRef.current.innerHTML });
    }
    checkFormats();
  };

  const checkFormats = () => {
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      h1: document.queryCommandValue('formatBlock').toLowerCase() === 'h1'
    });
  };

  const applyFormat = (command, value = null) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      setFormData({ ...formData, content: editorRef.current.innerHTML });
    }
    checkFormats();
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      }
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) return;
    addNote(formData);
    setFormData({ title: '', content: '', tags: [] });
    setIsAdding(false);
  };

  const handleDownload = (format) => {
    if (!selectedNote) return;
    let textContent = selectedNote.content;
    
    if (format === 'md') {
      textContent = textContent
        .replace(/<h1>(.*?)<\/h1>/gi, '# $1\n\n')
        .replace(/<h2>(.*?)<\/h2>/gi, '## $1\n\n')
        .replace(/<b>(.*?)<\/b>/gi, '**$1**')
        .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
        .replace(/<i>(.*?)<\/i>/gi, '*$1*')
        .replace(/<em>(.*?)<\/em>/gi, '*$1*')
        .replace(/<u>(.*?)<\/u>/gi, '<u>$1</u>')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<[^>]+>/g, '');
    } else {
      textContent = textContent
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>|<\/h[1-6]>/gi, '\n\n')
        .replace(/<[^>]+>/g, '');
    }

    const blob = new Blob([textContent.trim()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedNote.title.replace(/\s+/g, '_')}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleNoteSelection = (note, e) => {
    e.stopPropagation();
    if (collatedNotes.find(n => n.id === note.id)) {
      setCollatedNotes(collatedNotes.filter(n => n.id !== note.id));
    } else {
      setCollatedNotes([...collatedNotes, note]);
      setIsAdding(false);
    }
  };

  const onDragStart = (e, index) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;
    const items = [...collatedNotes];
    const draggedItem = items[draggedIdx];
    items.splice(draggedIdx, 1);
    items.splice(index, 0, draggedItem);
    setDraggedIdx(index);
    setCollatedNotes(items);
  };

  const handleCollate = () => {
    const title = window.prompt("Enter a title for the collated document:");
    if (!title) return;
    const mergedContent = collatedNotes.map(n => `<h1>${n.title}</h1><br/>${n.content}`).join('<br/><hr/><br/>');
    addNote({ title, content: mergedContent, tags: ['Collated'] });
    setCollatedNotes([]);
  };

  return (
    <div className="w-full h-[calc(100vh-124px)] flex overflow-hidden">
      <div className="w-1/3 xl:w-1/4 border-r border-[var(--border-color)] flex flex-col bg-[var(--bg-main)] z-10">
        <div className="p-6 border-b border-[var(--border-color)] bg-[var(--bg-card)]">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-black tracking-tight uppercase">Workspace Notes</h1>
            {(role === 'crew' || role === 'admin' || role === 'global_admin') && (
              <button 
                onClick={() => { setIsAdding(true); setCollatedNotes([]); setSelectedNote(null); setFormData({ title: '', content: '', tags: [] }); }} 
                className="bg-[var(--accent)] text-[var(--accent-foreground)] px-4 py-2 rounded-xl text-xs font-black shadow-lg flex items-center gap-2 hover:scale-105 transition-all"
              >
                <SafeIcon icon={FiIcons.FiPlus} /> NEW
              </button>
            )}
          </div>
          <div className="space-y-4">
            <div className="relative">
              <SafeIcon icon={FiIcons.FiSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input 
                type="text" 
                placeholder="Search notes..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:border-[var(--accent)]" 
              />
            </div>
            {/* Tag Cloud */}
            <div className="flex flex-wrap gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${selectedTag === tag ? 'bg-[var(--accent)] text-[var(--accent-foreground)] border-[var(--accent)]' : 'bg-[var(--bg-main)] text-[var(--text-muted)] border-[var(--border-color)] hover:border-[var(--accent)]'}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredNotes.map(item => {
            const isSelectedForCollation = collatedNotes.some(n => n.id === item.id);
            const isViewing = selectedNote?.id === item.id && collatedNotes.length === 0 && !isAdding;

            return (
              <div 
                key={item.id} 
                onClick={() => {
                  if (collatedNotes.length > 0) return;
                  setSelectedNote(item); 
                  setIsAdding(false);
                }}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-4 ${isViewing ? 'border-[var(--accent)] bg-[var(--bg-card)] shadow-xl translate-x-1' : 'border-transparent bg-[var(--bg-card)] hover:border-[var(--accent)]/30'}`}
              >
                <div 
                  onClick={(e) => toggleNoteSelection(item, e)}
                  className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors cursor-pointer shrink-0 ${isSelectedForCollation ? 'bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-foreground)]' : 'border-[var(--border-color)] bg-[var(--bg-main)] hover:border-[var(--accent)]'}`}
                >
                  {isSelectedForCollation && <SafeIcon icon={FiIcons.FiCheck} className="text-sm font-black" />}
                </div>
                <div className="flex-1 overflow-hidden">
                  <h3 className={`font-bold text-sm leading-tight truncate ${isSelectedForCollation ? 'text-[var(--accent)]' : 'text-[var(--text-main)]'}`}>{item.title}</h3>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {item.tags?.map(tag => (
                      <span key={tag} className="text-[8px] font-black uppercase tracking-tighter text-[var(--accent)] bg-[var(--accent)]/5 px-1.5 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
          {filteredNotes.length === 0 && (
            <div className="p-6 text-center text-[var(--text-muted)] text-sm font-bold">No notes found.</div>
          )}
        </div>
      </div>

      <div className="flex-1 bg-[var(--bg-card)] flex flex-col relative overflow-y-auto">
        <AnimatePresence mode="wait">
          {collatedNotes.length > 0 ? (
            <motion.div key="collate-view" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-10 flex flex-col h-full bg-[var(--bg-main)]">
              <div className="flex justify-between items-center mb-8 bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)] shadow-sm">
                <div>
                  <h2 className="text-3xl font-black tracking-tighter text-[var(--text-main)]">Document Collation</h2>
                  <p className="text-[var(--text-muted)] font-bold text-sm mt-1">Reorder and merge multiple notes.</p>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setCollatedNotes([])} className="px-6 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] font-black text-sm hover:bg-[var(--border-color)] transition-all text-[var(--text-main)]">
                    CLEAR
                  </button>
                  <button onClick={handleCollate} className="px-8 py-3 rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] font-black text-sm shadow-xl flex items-center gap-2 hover:scale-[1.02] transition-all">
                    <SafeIcon icon={FiIcons.FiLayers} /> COLLATE
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 px-2">
                {collatedNotes.map((note, index) => (
                  <div
                    key={note.id} draggable
                    onDragStart={(e) => onDragStart(e, index)}
                    onDragOver={(e) => onDragOver(e, index)}
                    onDragEnd={() => setDraggedIdx(null)}
                    className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-color)] shadow-sm flex items-center gap-4 cursor-move hover:border-[var(--accent)] transition-all group"
                  >
                    <div className="text-[var(--text-muted)] group-hover:text-[var(--accent)]"><SafeIcon icon={FiIcons.FiMoreVertical} className="text-2xl" /></div>
                    <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] font-black">{index + 1}</div>
                    <h3 className="font-black text-lg text-[var(--text-main)] flex-1">{note.title}</h3>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : isAdding ? (
            <motion.div key="add-form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-10 flex flex-col h-full w-full">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-black tracking-tighter text-[var(--text-main)]">Draft New Note</h2>
                <div className="flex gap-4">
                  <button onClick={() => { setIsAdding(false); setSelectedNote(notes[0]); }} className="px-6 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] font-black text-sm hover:bg-[var(--border-color)] transition-all text-[var(--text-main)]">CANCEL</button>
                  <button onClick={handleSubmit} className="px-6 py-2.5 rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] font-black text-sm shadow-xl hover:scale-[1.02] transition-all">SAVE NOTE</button>
                </div>
              </div>
              <div className="space-y-4 flex-1 flex flex-col">
                <input type="text" className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl px-6 py-4 text-xl font-black focus:outline-none focus:border-[var(--accent)] text-[var(--text-main)]" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Note Title..." />
                
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map(tag => (
                      <span key={tag} className="bg-[var(--accent)] text-[var(--accent-foreground)] px-3 py-1.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-2">
                        {tag} <button onClick={() => removeTag(tag)} className="hover:scale-125 transition-transform"><SafeIcon icon={FiIcons.FiX} /></button>
                      </span>
                    ))}
                  </div>
                  <input type="text" className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-6 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)] text-[var(--text-main)]" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={handleAddTag} placeholder="Type tag and press Enter..." />
                </div>

                <div className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl flex-1 flex flex-col overflow-hidden focus-within:border-[var(--accent)]">
                  <div className="flex gap-2 p-3 border-b border-[var(--border-color)] bg-[var(--bg-card)]">
                    <button onClick={() => applyFormat('bold')} className={`p-2.5 rounded-lg ${activeFormats.bold ? 'bg-[var(--accent)] text-[var(--accent-foreground)]' : 'text-[var(--text-main)] hover:bg-[var(--bg-main)]'}`}><SafeIcon icon={FiIcons.FiBold} /></button>
                    <button onClick={() => applyFormat('italic')} className={`p-2.5 rounded-lg ${activeFormats.italic ? 'bg-[var(--accent)] text-[var(--accent-foreground)]' : 'text-[var(--text-main)] hover:bg-[var(--bg-main)]'}`}><SafeIcon icon={FiIcons.FiItalic} /></button>
                    <button onClick={() => applyFormat('formatBlock', activeFormats.h1 ? 'P' : 'H1')} className={`px-3 rounded-lg font-black ${activeFormats.h1 ? 'bg-[var(--accent)] text-[var(--accent-foreground)]' : 'text-[var(--text-main)] hover:bg-[var(--bg-main)]'}`}>H1</button>
                  </div>
                  <div id="note-editor" ref={editorRef} contentEditable onInput={handleEditorInput} onKeyUp={checkFormats} onMouseUp={checkFormats} className="flex-1 p-8 text-lg focus:outline-none overflow-y-auto rich-text-content text-[var(--text-main)]" style={{ minHeight: '300px' }} />
                </div>
              </div>
            </motion.div>
          ) : selectedNote ? (
            <motion.div key={selectedNote.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-10 flex flex-col h-full w-full">
              <div className="border-b border-[var(--border-color)] pb-6 mb-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedNote.tags?.map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-[10px] font-black uppercase tracking-widest border border-[var(--accent)]/20">{tag}</span>
                  ))}
                </div>
                <div className="flex justify-between items-start">
                  <h2 className="text-4xl font-black tracking-tighter text-[var(--text-main)]">{selectedNote.title}</h2>
                  <div className="flex gap-2">
                    <button onClick={() => handleDownload('txt')} className="bg-[var(--bg-main)] border border-[var(--border-color)] px-4 py-2 rounded-xl font-black text-xs text-[var(--text-main)] hover:bg-[var(--border-color)]">.TXT</button>
                    <button onClick={() => handleDownload('md')} className="bg-[var(--accent)] text-[var(--accent-foreground)] px-4 py-2 rounded-xl font-black text-xs shadow-lg hover:scale-[1.02]">.MD</button>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto rich-text-content text-lg text-[var(--text-main)]" dangerouslySetInnerHTML={{ __html: selectedNote.content }} />
            </motion.div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] font-black uppercase tracking-widest">Select a note to view</div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Notes;
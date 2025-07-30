import React, { useState, useEffect, useRef } from "react";
import "./App.css";

/**
 * NOTES DATA STORAGE
 * Uses localStorage for demo (replace with backend API as needed).
 */
const NOTES_STORAGE_KEY = "kavia_notes_app__notes";

/**
 * Helper to get notes from storage.
 */
function getStoredNotes() {
  try {
    const stored = window.localStorage.getItem(NOTES_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

/**
 * Helper to save notes to storage.
 */
function saveStoredNotes(notes) {
  window.localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
}

/**
 * Note Editor/Textarea autosizing utility
 */
function autoGrow(el) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

// PUBLIC_INTERFACE
/**
 * Root App component for the Notes app.
 *
 * - Sidebar with all note titles
 * - Main area with note viewer/editor
 * - Top bar with actions (New, Delete, etc.)
 */
function App() {
  // Notes: [{id, title, content, updated}]
  const [notes, setNotes] = useState([]);
  // Currently selected note id (or null)
  const [selectedId, setSelectedId] = useState(null);
  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  // Temporary states for note title/content while editing
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  // Top-level theme state (light only)
  const [theme] = useState("light");
  // Feedback/toast message
  const [toast, setToast] = useState(null);

  // On mount, load notes.
  useEffect(() => {
    const loaded = getStoredNotes();
    setNotes(loaded);
    if (loaded.length > 0) setSelectedId(loaded[0].id);
  }, []);

  // On notes change, persist to storage.
  useEffect(() => {
    saveStoredNotes(notes);
  }, [notes]);

  // Sync edit fields if switching notes or entering edit mode
  useEffect(() => {
    if (isEditing) {
      const note = notes.find((n) => n.id === selectedId);
      if (note) {
        setEditTitle(note.title);
        setEditContent(note.content);
      }
    }
  }, [isEditing, selectedId, notes]);

  // Set theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  /**
   * Find note by id.
   */
  function getCurrentNote() {
    return notes.find((n) => n.id === selectedId) || null;
  }

  /**
   * Handler: Select a note in the sidebar.
   * @param {string} id
   */
  function handleSelectNote(id) {
    setSelectedId(id);
    setIsEditing(false);
  }

  /**
   * Handler: Create new note.
   */
  function handleNewNote() {
    const newNote = {
      id:
        Date.now().toString(36) +
        Math.random().toString(36).substring(2, 7),
      title: "Untitled Note",
      content: "",
      updated: new Date().toISOString(),
    };
    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    setSelectedId(newNote.id);
    setIsEditing(true);
    setToast("New note created!");
  }

  /**
   * Handler: Start editing current note.
   */
  function handleEditNote() {
    if (!selectedId) return;
    setIsEditing(true);
  }

  /**
   * Handler: Cancel editing.
   */
  function handleCancelEdit() {
    setIsEditing(false);
    setEditTitle(getCurrentNote()?.title || "");
    setEditContent(getCurrentNote()?.content || "");
  }

  /**
   * Handler: Save edits to current note.
   */
  function handleSaveEdit() {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === selectedId
          ? {
              ...n,
              title: editTitle.trim() ? editTitle : "Untitled Note",
              content: editContent,
              updated: new Date().toISOString(),
            }
          : n
      )
    );
    setIsEditing(false);
    setToast("Note saved!");
  }

  /**
   * Handler: Delete current note.
   */
  function handleDeleteNote() {
    if (!selectedId) return;
    const idx = notes.findIndex((n) => n.id === selectedId);
    if (idx === -1) return;
    const updatedNotes = notes.filter((n) => n.id !== selectedId);
    setNotes(updatedNotes);
    setToast("Note deleted.");
    // Select next note, or prev, or nothing
    if (updatedNotes.length) {
      const newIdx = idx < updatedNotes.length ? idx : updatedNotes.length - 1;
      setSelectedId(updatedNotes[newIdx].id);
    } else {
      setSelectedId(null);
    }
    setIsEditing(false);
  }

  /**
   * Handler: Change note title during edit.
   */
  function handleEditTitleChange(e) {
    setEditTitle(e.target.value);
  }

  /**
   * Handler: Change note content during edit.
   */
  function handleEditContentChange(e) {
    setEditContent(e.target.value);
  }

  /**
   * Render a toast/snackbar for user feedback.
   */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1850);
    return () => clearTimeout(t);
  }, [toast]);

  // Ref for textarea for auto-grow
  const textareaRef = useRef();

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      autoGrow(textareaRef.current);
      textareaRef.current.focus();
    }
  }, [isEditing, editContent]);

  // --- UI RENDERING ---
  return (
    <div className="notes-root">
      {/* Topbar */}
      <TopBar
        onNew={handleNewNote}
        onEdit={handleEditNote}
        onDelete={handleDeleteNote}
        onSave={handleSaveEdit}
        onCancel={handleCancelEdit}
        editing={isEditing}
        noteSelected={!!selectedId}
      />
      {/* Layout: Sidebar + Main */}
      <div className="notes-layout">
        {/* Sidebar */}
        <Sidebar
          notes={notes}
          selectedId={selectedId}
          onSelect={handleSelectNote}
        />
        {/* Main (note view or edit) */}
        <main className="note-main">
          {!selectedId ? (
            <div className="note-empty">No note selected. Create a new note!</div>
          ) : isEditing ? (
            <NoteEditor
              title={editTitle}
              content={editContent}
              onTitleChange={handleEditTitleChange}
              onContentChange={handleEditContentChange}
              textareaRef={textareaRef}
            />
          ) : (
            <NoteViewer note={getCurrentNote()} />
          )}
        </main>
      </div>
      {/* Toast message */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

// PUBLIC_INTERFACE
/**
 * Sidebar component for note selection.
 */
function Sidebar({ notes, selectedId, onSelect }) {
  return (
    <aside className="notes-sidebar">
      <div className="sidebar-title">
        <span role="img" aria-label="notes">🗒️</span>{" "}
        <span>All Notes</span>
      </div>
      <div className="sidebar-list">
        {notes.length === 0 && (
          <div className="sidebar-empty">No notes</div>
        )}
        {notes.map((note) => (
          <button
            key={note.id}
            className={
              "sidebar-item" +
              (note.id === selectedId ? " sidebar-item--active" : "")
            }
            onClick={() => onSelect(note.id)}
            title={note.title}
            type="button"
          >
            <div className="sidebar-item-title">
              {note.title.length > 36
                ? note.title.slice(0, 36) + "…"
                : note.title}
            </div>
            <div className="sidebar-item-date">
              {new Date(note.updated).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}

// PUBLIC_INTERFACE
/**
 * Topbar component with actions (New/Edit/Delete/Save/Cancel).
 */
function TopBar({
  onNew,
  onEdit,
  onDelete,
  onSave,
  onCancel,
  editing,
  noteSelected,
}) {
  return (
    <header className="notes-topbar">
      <span className="app-title">
        <span style={{ fontWeight: 700, color: "var(--color-primary)" }}>Kavia Notes</span>
      </span>
      <div className="topbar-actions">
        {!editing && (
          <button
            className="btn btn-accent"
            onClick={onNew}
            title="New Note"
            type="button"
            aria-label="Create new note"
          >
            ＋ New
          </button>
        )}
        {!editing && noteSelected && (
          <>
            <button
              className="btn btn-primary"
              onClick={onEdit}
              title="Edit Note"
              type="button"
              aria-label="Edit selected note"
            >
              ✎ Edit
            </button>
            <button
              className="btn btn-danger"
              onClick={onDelete}
              title="Delete Note"
              type="button"
              aria-label="Delete selected note"
            >
              🗑️ Delete
            </button>
          </>
        )}
        {editing && (
          <>
            <button
              className="btn btn-primary"
              onClick={onSave}
              title="Save Note"
              type="button"
              aria-label="Save note"
            >
              💾 Save
            </button>
            <button
              className="btn btn-secondary"
              onClick={onCancel}
              title="Cancel"
              type="button"
              aria-label="Cancel edit"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </header>
  );
}

// PUBLIC_INTERFACE
/**
 * Viewer for note content.
 */
function NoteViewer({ note }) {
  if (!note) {
    return <div className="note-empty">Note not found.</div>;
  }
  return (
    <article className="note-viewer">
      <h2 className="viewer-title">{note.title}</h2>
      <div className="viewer-date">
        Last updated:{" "}
        {new Date(note.updated).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>
      <section className="viewer-content">
        {note.content ? note.content.split("\n").map((line, i) =>
          <p key={i}>{line}</p>
        ) : <em className="viewer-empty-content">No content</em>}
      </section>
    </article>
  );
}

// PUBLIC_INTERFACE
/**
 * Editor for a note (title/textarea).
 */
function NoteEditor({
  title,
  content,
  onTitleChange,
  onContentChange,
  textareaRef,
}) {
  return (
    <form
      className="note-editor"
      autoComplete="off"
      onSubmit={(e) => e.preventDefault()}
    >
      <input
        className="editor-title"
        placeholder="Note title"
        value={title}
        onChange={onTitleChange}
        maxLength={80}
        autoFocus
      />
      <textarea
        className="editor-content"
        placeholder="Start typing your note..."
        value={content}
        onChange={onContentChange}
        ref={textareaRef}
        rows={6}
        onInput={(e) => autoGrow(e.target)}
      />
    </form>
  );
}

export default App;

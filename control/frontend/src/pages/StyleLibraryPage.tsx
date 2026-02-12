import { useState, useRef } from 'react';
import { useStyleContext } from '../context/StyleContext';
import { useToast } from '../hooks/useToast';
import {
  createStyle,
  updateStyle,
  addImagesToStyle,
  deleteStyle,
  deleteImagesFromStyle,
  getReferenceImageUrl,
} from '../services/api';
import Modal from '../components/shared/Modal';
import EmptyState from '../components/shared/EmptyState';
import { SkeletonStyleCard } from '../components/shared/Skeleton';
import {
  PlusIcon,
  TrashIcon,
  UploadIcon,
  ImagePlaceholderIcon,
  CloseIcon,
  PencilIcon,
} from '../components/shared/Icons';
import type { Style } from '../types';

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg'];

function filterImageFiles(files: FileList): File[] {
  return Array.from(files).filter((file) => {
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    return IMAGE_EXTENSIONS.includes(ext);
  });
}

export default function StyleLibraryPage() {
  const { styles, stylesLoading, refreshStyles, selectedStyleId, clearSelection } = useStyleContext();
  const toast = useToast();

  const [viewingStyleId, setViewingStyleId] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [showDeleteStyleModal, setShowDeleteStyleModal] = useState(false);
  const [showDeleteImagesModal, setShowDeleteImagesModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Edit style state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLineWeight, setEditLineWeight] = useState('');
  const [editLooseness, setEditLooseness] = useState('');
  const [editComplexity, setEditComplexity] = useState('');

  // Create style form state
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newLineWeight, setNewLineWeight] = useState('');
  const [newLooseness, setNewLooseness] = useState('');
  const [newComplexity, setNewComplexity] = useState('');
  const [newStyleImages, setNewStyleImages] = useState<File[] | null>(null);
  const newStyleFileInputRef = useRef<HTMLInputElement>(null);
  const newStyleFolderInputRef = useRef<HTMLInputElement>(null);
  const addImagesFileInputRef = useRef<HTMLInputElement>(null);
  const addImagesFolderInputRef = useRef<HTMLInputElement>(null);

  const viewingStyle = styles.find(s => s.id === viewingStyleId);

  const resetCreateForm = () => {
    setNewName('');
    setNewDescription('');
    setNewLineWeight('');
    setNewLooseness('');
    setNewComplexity('');
    setNewStyleImages(null);
    if (newStyleFileInputRef.current) newStyleFileInputRef.current.value = '';
    if (newStyleFolderInputRef.current) newStyleFolderInputRef.current.value = '';
  };

  const handleCreateStyle = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', newName.trim());
      formData.append('description', newDescription.trim());
      const visualRules: Record<string, string> = {};
      if (newLineWeight.trim()) visualRules.line_weight = newLineWeight.trim();
      if (newLooseness.trim()) visualRules.looseness = newLooseness.trim();
      if (newComplexity.trim()) visualRules.complexity = newComplexity.trim();
      formData.append('visual_rules', JSON.stringify(visualRules));
      if (newStyleImages && newStyleImages.length > 0) {
        newStyleImages.forEach((file) => formData.append('images', file));
      }
      await createStyle(formData);
      toast.success('Style created');
      resetCreateForm();
      setShowCreateForm(false);
      refreshStyles();
    } catch {
      toast.error('Failed to create style');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStyle = async () => {
    if (!viewingStyleId) return;
    setLoading(true);
    try {
      await deleteStyle(viewingStyleId);
      toast.success('Style deleted');
      if (selectedStyleId === viewingStyleId) clearSelection();
      setViewingStyleId(null);
      setShowDeleteStyleModal(false);
      refreshStyles();
    } catch {
      toast.error('Failed to delete style');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImages = async () => {
    if (!viewingStyleId || selectedImages.size === 0) return;
    setLoading(true);
    try {
      await deleteImagesFromStyle(viewingStyleId, Array.from(selectedImages));
      toast.success(`${selectedImages.size} image(s) deleted`);
      setSelectedImages(new Set());
      setShowDeleteImagesModal(false);
      refreshStyles();
    } catch {
      toast.error('Failed to delete images');
    } finally {
      setLoading(false);
    }
  };

  const handleAddImages = async (files: File[]) => {
    if (!viewingStyleId || files.length === 0) return;
    setLoading(true);
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('images', file));
      await addImagesToStyle(viewingStyleId, formData);
      toast.success(`${files.length} image(s) added`);
      refreshStyles();
    } catch {
      toast.error('Failed to add images');
    } finally {
      setLoading(false);
      if (addImagesFileInputRef.current) addImagesFileInputRef.current.value = '';
      if (addImagesFolderInputRef.current) addImagesFolderInputRef.current.value = '';
    }
  };

  const enterEditMode = () => {
    if (!viewingStyle) return;
    setEditName(viewingStyle.name);
    setEditDescription(viewingStyle.description || '');
    setEditLineWeight(viewingStyle.visualRules.lineWeight || '');
    setEditLooseness(viewingStyle.visualRules.looseness || '');
    setEditComplexity(viewingStyle.visualRules.complexity || '');
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!viewingStyleId || !editName.trim()) return;
    setLoading(true);
    try {
      const visualRules: Record<string, string> = {};
      if (editLineWeight.trim()) visualRules.line_weight = editLineWeight.trim();
      if (editLooseness.trim()) visualRules.looseness = editLooseness.trim();
      if (editComplexity.trim()) visualRules.complexity = editComplexity.trim();
      await updateStyle(viewingStyleId, {
        name: editName.trim(),
        description: editDescription.trim(),
        visual_rules: visualRules,
      });
      toast.success('Style updated');
      setIsEditing(false);
      refreshStyles();
    } catch {
      toast.error('Failed to update style');
    } finally {
      setLoading(false);
    }
  };

  const toggleImageSelection = (filename: string) => {
    setSelectedImages(prev => {
      const next = new Set(prev);
      if (next.has(filename)) next.delete(filename);
      else next.add(filename);
      return next;
    });
  };

  const handleSelectStyle = (id: string) => {
    setViewingStyleId(id);
    setSelectedImages(new Set());
    setIsEditing(false);
  };

  return (
    <>
      {/* Left sidebar: style list */}
      <aside className="w-72 flex-shrink-0 bg-surface-1 border-r border-swag-border flex flex-col">
        {/* Sidebar header + create button */}
        <div className="px-3 py-3 border-b border-swag-border flex-shrink-0 space-y-3">
          <div className="text-xs font-bold uppercase tracking-widest text-swag-text-tertiary px-1">
            Styles
          </div>
          <button
            onClick={() => { setShowCreateForm(true); setViewingStyleId(null); }}
            className="w-full btn-primary text-sm flex items-center justify-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            Create New
          </button>
        </div>

        {/* Style list */}
        <div className="flex-1 overflow-y-auto sidebar-scroll p-3">
          {stylesLoading ? (
            <div className="space-y-3">
              <SkeletonStyleCard />
              <SkeletonStyleCard />
              <SkeletonStyleCard />
            </div>
          ) : styles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs text-swag-text-tertiary">No styles yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {styles.map((style) => {
                const isViewing = viewingStyleId === style.id;
                const isActive = selectedStyleId === style.id;
                return (
                  <div
                    key={style.id}
                    onClick={() => handleSelectStyle(style.id)}
                    className={`style-card cursor-pointer ${isViewing ? 'style-card-selected' : ''}`}
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-card transition-all duration-200 ${
                      isViewing ? 'bg-swag-green' : 'bg-transparent'
                    }`} />
                    <div className="pl-2">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-swag-white text-sm truncate flex-1">{style.name}</h3>
                        {isActive && <span className="tag-green text-[9px] py-0">Active</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-swag-text-quaternary">
                          {style.referenceImages.length} refs
                        </span>
                        {style.description && (
                          <span className="text-[10px] text-swag-text-quaternary truncate">
                            {style.description}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      {/* Right panel: detail or create form */}
      <main className="flex-1 flex flex-col overflow-hidden bg-surface-0">
        {showCreateForm && !viewingStyle ? (
          <>
            <div className="flex items-center justify-between px-6 py-4 border-b border-swag-border flex-shrink-0">
              <h1 className="font-display text-2xl uppercase tracking-wider text-swag-white">
                Create New Style
              </h1>
              <button onClick={() => { resetCreateForm(); setShowCreateForm(false); }} className="btn-icon">
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <CreateStyleForm
                newName={newName} setNewName={setNewName}
                newDescription={newDescription} setNewDescription={setNewDescription}
                newLineWeight={newLineWeight} setNewLineWeight={setNewLineWeight}
                newLooseness={newLooseness} setNewLooseness={setNewLooseness}
                newComplexity={newComplexity} setNewComplexity={setNewComplexity}
                newStyleImages={newStyleImages} setNewStyleImages={setNewStyleImages}
                newStyleFileInputRef={newStyleFileInputRef}
                newStyleFolderInputRef={newStyleFolderInputRef}
                loading={loading}
                onSubmit={handleCreateStyle}
                onCancel={() => { resetCreateForm(); setShowCreateForm(false); }}
              />
            </div>
          </>
        ) : viewingStyle ? (
          <>
            {/* Detail header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-swag-border flex-shrink-0">
              <div className="flex items-center gap-4">
                <h1 className="font-display text-2xl uppercase tracking-wider text-swag-white">
                  {viewingStyle.name}
                </h1>
                <span className="text-xs text-swag-text-tertiary">
                  {viewingStyle.referenceImages.length} reference images
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSaveEdit}
                      disabled={loading || !editName.trim()}
                      className="btn-primary text-sm"
                    >
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={cancelEdit} className="btn-secondary text-sm">
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={enterEditMode}
                      className="btn-secondary text-sm flex items-center gap-2"
                    >
                      <PencilIcon className="w-4 h-4" />
                      Edit
                    </button>
                    <div className="w-px h-6 bg-swag-border" />
                    {selectedImages.size > 0 ? (
                      <>
                        <span className="text-xs text-swag-text-tertiary mr-1">
                          {selectedImages.size} selected
                        </span>
                        <button
                          onClick={() => setSelectedImages(new Set())}
                          className="btn-ghost text-sm flex items-center gap-1.5 border border-swag-border rounded-btn"
                        >
                          <CloseIcon className="w-3.5 h-3.5" />
                          Clear
                        </button>
                        <button
                          onClick={() => setShowDeleteImagesModal(true)}
                          className="btn-danger text-sm flex items-center gap-2"
                        >
                          <TrashIcon className="w-4 h-4" />
                          Delete Selected ({selectedImages.size})
                        </button>
                      </>
                    ) : (
                      <button disabled className="btn-secondary text-sm flex items-center gap-2 cursor-default text-swag-white">
                        <TrashIcon className="w-4 h-4" />
                        Select Images to Delete
                      </button>
                    )}
                    <div className="w-px h-6 bg-swag-border" />
                    <button
                      onClick={() => addImagesFileInputRef.current?.click()}
                      className="btn-secondary text-sm flex items-center gap-2"
                    >
                      <UploadIcon className="w-4 h-4" />
                      Add Images
                    </button>
                    <button
                      onClick={() => setShowDeleteStyleModal(true)}
                      className="btn-danger text-sm flex items-center gap-2"
                    >
                      <TrashIcon className="w-4 h-4" />
                      Delete Style
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Detail content */}
            <div className="flex-1 overflow-y-auto p-6">
              <StyleDetailView
                style={viewingStyle}
                selectedImages={selectedImages}
                onToggleImage={toggleImageSelection}
                isEditing={isEditing}
                editName={editName} setEditName={setEditName}
                editDescription={editDescription} setEditDescription={setEditDescription}
                editLineWeight={editLineWeight} setEditLineWeight={setEditLineWeight}
                editLooseness={editLooseness} setEditLooseness={setEditLooseness}
                editComplexity={editComplexity} setEditComplexity={setEditComplexity}
              />
            </div>
          </>
        ) : (
          /* Empty state — no style selected */
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={<ImagePlaceholderIcon className="w-16 h-16 text-swag-text-quaternary" />}
              title="Select a Style"
              description="Choose a style from the list to view and manage its reference images"
            />
          </div>
        )}
      </main>

      {/* Hidden file inputs */}
      <input
        ref={addImagesFileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleAddImages(Array.from(e.target.files));
          }
        }}
      />
      <input
        ref={addImagesFolderInputRef}
        type="file"
        {...({ webkitdirectory: '' } as React.InputHTMLAttributes<HTMLInputElement>)}
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            const images = filterImageFiles(e.target.files);
            if (images.length > 0) handleAddImages(images);
          }
        }}
      />

      {/* Delete style modal */}
      <Modal
        isOpen={showDeleteStyleModal}
        onClose={() => setShowDeleteStyleModal(false)}
        title="Delete Style"
        footer={
          <>
            <button onClick={() => setShowDeleteStyleModal(false)} className="btn-secondary text-sm">Cancel</button>
            <button onClick={handleDeleteStyle} disabled={loading} className="btn-danger text-sm">
              {loading ? 'Deleting...' : 'Delete Style'}
            </button>
          </>
        }
      >
        <p className="text-sm text-swag-text-secondary">
          Are you sure you want to delete this style? This action cannot be undone.
          All reference images and visual rules associated with this style will be permanently removed.
        </p>
      </Modal>

      {/* Delete images modal */}
      <Modal
        isOpen={showDeleteImagesModal}
        onClose={() => setShowDeleteImagesModal(false)}
        title="Delete Images"
        footer={
          <>
            <button onClick={() => setShowDeleteImagesModal(false)} className="btn-secondary text-sm">Cancel</button>
            <button onClick={handleDeleteImages} disabled={loading} className="btn-danger text-sm">
              {loading ? 'Deleting...' : `Delete ${selectedImages.size} Image(s)`}
            </button>
          </>
        }
      >
        <p className="text-sm text-swag-text-secondary">
          Are you sure you want to delete {selectedImages.size} reference image(s)?
          This action cannot be undone.
        </p>
      </Modal>
    </>
  );
}

/* ---------- Sub-components ---------- */

function StyleDetailView({
  style,
  selectedImages,
  onToggleImage,
  isEditing,
  editName, setEditName,
  editDescription, setEditDescription,
  editLineWeight, setEditLineWeight,
  editLooseness, setEditLooseness,
  editComplexity, setEditComplexity,
}: {
  style: Style;
  selectedImages: Set<string>;
  onToggleImage: (filename: string) => void;
  isEditing: boolean;
  editName: string; setEditName: (v: string) => void;
  editDescription: string; setEditDescription: (v: string) => void;
  editLineWeight: string; setEditLineWeight: (v: string) => void;
  editLooseness: string; setEditLooseness: (v: string) => void;
  editComplexity: string; setEditComplexity: (v: string) => void;
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Style info — edit mode */}
      {isEditing ? (
        <div className="max-w-2xl space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-swag-text-quaternary block mb-1">Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Style name *"
              className="w-full input-dark text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-swag-text-quaternary block mb-1">Description</label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Description (optional)"
              className="w-full input-dark text-sm resize-none h-24"
            />
          </div>
          <div>
            <p className="text-xs font-semibold text-swag-text-secondary uppercase tracking-wider mb-2">
              Visual Rules
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-swag-text-quaternary block mb-1">Line Weight</label>
                <input
                  type="text"
                  value={editLineWeight}
                  onChange={(e) => setEditLineWeight(e.target.value)}
                  placeholder="Line weight"
                  className="w-full input-dark text-sm py-2"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-swag-text-quaternary block mb-1">Looseness</label>
                <input
                  type="text"
                  value={editLooseness}
                  onChange={(e) => setEditLooseness(e.target.value)}
                  placeholder="Looseness"
                  className="w-full input-dark text-sm py-2"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-swag-text-quaternary block mb-1">Complexity</label>
                <input
                  type="text"
                  value={editComplexity}
                  onChange={(e) => setEditComplexity(e.target.value)}
                  placeholder="Complexity"
                  className="w-full input-dark text-sm py-2"
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Style info — read-only mode */
        (style.description || style.visualRules.lineWeight || style.visualRules.looseness || style.visualRules.complexity) && (
          <div>
            {style.description && (
              <p className="text-sm text-swag-text-secondary mb-4">{style.description}</p>
            )}
            <div className="flex gap-4">
              {style.visualRules.lineWeight && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-swag-text-quaternary">Line Weight</span>
                  <p className="text-sm text-swag-white">{style.visualRules.lineWeight}</p>
                </div>
              )}
              {style.visualRules.looseness && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-swag-text-quaternary">Looseness</span>
                  <p className="text-sm text-swag-white">{style.visualRules.looseness}</p>
                </div>
              )}
              {style.visualRules.complexity && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-swag-text-quaternary">Complexity</span>
                  <p className="text-sm text-swag-white">{style.visualRules.complexity}</p>
                </div>
              )}
            </div>
          </div>
        )
      )}

      {/* Image grid */}
      {style.referenceImages.length === 0 ? (
        <EmptyState
          icon={<ImagePlaceholderIcon className="w-16 h-16 text-swag-text-quaternary" />}
          title="No Reference Images"
          description="Add reference images to this style using the button above"
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {style.referenceImages.map((filename) => {
              const isSelected = selectedImages.has(filename);
              return (
                <div
                  key={filename}
                  onClick={() => onToggleImage(filename)}
                  className={`aspect-square bg-surface-2 rounded-img cursor-pointer transition-all hover:scale-[1.02] ${
                    isSelected
                      ? 'ring-4 ring-offset-2 ring-offset-surface-2 ring-swag-pink shadow-lg shadow-swag-pink/20'
                      : 'ring-1 ring-offset-0 ring-transparent hover:ring-swag-border'
                  }`}
                >
                  <img
                    src={getReferenceImageUrl(filename)}
                    alt={filename}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

function CreateStyleForm({
  newName, setNewName,
  newDescription, setNewDescription,
  newLineWeight, setNewLineWeight,
  newLooseness, setNewLooseness,
  newComplexity, setNewComplexity,
  newStyleImages, setNewStyleImages,
  newStyleFileInputRef, newStyleFolderInputRef,
  loading, onSubmit, onCancel,
}: {
  newName: string; setNewName: (v: string) => void;
  newDescription: string; setNewDescription: (v: string) => void;
  newLineWeight: string; setNewLineWeight: (v: string) => void;
  newLooseness: string; setNewLooseness: (v: string) => void;
  newComplexity: string; setNewComplexity: (v: string) => void;
  newStyleImages: File[] | null; setNewStyleImages: (v: File[] | null) => void;
  newStyleFileInputRef: React.RefObject<HTMLInputElement>;
  newStyleFolderInputRef: React.RefObject<HTMLInputElement>;
  loading: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="space-y-4">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Style name *"
          className="w-full input-dark text-sm"
        />
        <textarea
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          placeholder="Description (optional)"
          className="w-full input-dark text-sm resize-none h-24"
        />

        {/* Visual Rules */}
        <div>
          <p className="text-xs font-semibold text-swag-text-secondary uppercase tracking-wider mb-2">
            Visual Rules (optional)
          </p>
          <div className="grid grid-cols-3 gap-3">
            <input
              type="text"
              value={newLineWeight}
              onChange={(e) => setNewLineWeight(e.target.value)}
              placeholder="Line weight"
              className="w-full input-dark text-sm py-2"
            />
            <input
              type="text"
              value={newLooseness}
              onChange={(e) => setNewLooseness(e.target.value)}
              placeholder="Looseness"
              className="w-full input-dark text-sm py-2"
            />
            <input
              type="text"
              value={newComplexity}
              onChange={(e) => setNewComplexity(e.target.value)}
              placeholder="Complexity"
              className="w-full input-dark text-sm py-2"
            />
          </div>
        </div>

        {/* Image upload */}
        <div>
          <p className="text-xs font-semibold text-swag-text-secondary uppercase tracking-wider mb-2">
            Reference Images (optional)
          </p>
          <div
            onClick={() => newStyleFileInputRef.current?.click()}
            className="border-2 border-dashed border-swag-border hover:border-swag-green/40 rounded-card p-8 text-center cursor-pointer transition-all hover:bg-swag-green/5"
          >
            <UploadIcon className="w-8 h-8 text-swag-text-quaternary mx-auto mb-2" />
            <p className="text-sm text-swag-text-secondary">Click to browse images</p>
            <p className="text-xs text-swag-text-quaternary mt-1">PNG, JPG supported</p>
          </div>
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => newStyleFolderInputRef.current?.click()}
              className="flex-1 btn-ghost text-xs border border-swag-border rounded-btn py-1.5"
            >
              Select Folder
            </button>
          </div>

          {newStyleImages && newStyleImages.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-swag-text-secondary mb-2">
                {newStyleImages.length} image(s) selected
              </p>
              <div className="grid grid-cols-6 gap-2">
                {newStyleImages.slice(0, 11).map((file, i) => (
                  <div key={i} className="aspect-square bg-surface-3 rounded-img overflow-hidden">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
                {newStyleImages.length > 11 && (
                  <div className="aspect-square bg-surface-3 rounded-img flex items-center justify-center">
                    <span className="text-xs text-swag-text-tertiary">+{newStyleImages.length - 11}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <input
            ref={newStyleFileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                setNewStyleImages(Array.from(e.target.files));
              }
            }}
          />
          <input
            ref={newStyleFolderInputRef}
            type="file"
            {...({ webkitdirectory: '' } as React.InputHTMLAttributes<HTMLInputElement>)}
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                const images = filterImageFiles(e.target.files);
                setNewStyleImages(images.length > 0 ? images : null);
              }
            }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-6">
        <button
          onClick={onSubmit}
          disabled={loading || !newName.trim()}
          className="flex-1 btn-primary text-sm"
        >
          {loading ? 'Creating...' : 'Create Style'}
        </button>
        <button onClick={onCancel} className="btn-secondary text-sm">
          Cancel
        </button>
      </div>
    </div>
  );
}

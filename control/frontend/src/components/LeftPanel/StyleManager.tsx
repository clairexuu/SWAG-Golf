import { useState, useRef } from 'react';
import { createStyle, addImagesToStyle, deleteStyle } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import Modal from '../shared/Modal';
import { PlusIcon, UploadIcon, TrashIcon } from '../shared/Icons';

interface StyleManagerProps {
  selectedStyleId: string | null;
  onStyleChanged: () => void;
  onStyleDeleted: (styleId: string) => void;
  onClose?: () => void;
}

type ActiveAction = 'none' | 'new' | 'add-images' | 'delete-confirm';

export default function StyleManager({
  selectedStyleId,
  onStyleChanged,
  onStyleDeleted,
}: StyleManagerProps) {
  const [activeAction, setActiveAction] = useState<ActiveAction>('none');
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newLineWeight, setNewLineWeight] = useState('');
  const [newLooseness, setNewLooseness] = useState('');
  const [newComplexity, setNewComplexity] = useState('');
  const [newStyleImages, setNewStyleImages] = useState<File[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const addImagesFileInputRef = useRef<HTMLInputElement>(null);
  const addImagesFolderInputRef = useRef<HTMLInputElement>(null);
  const newStyleFileInputRef = useRef<HTMLInputElement>(null);
  const newStyleFolderInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg'];

  const filterImageFiles = (files: FileList): File[] => {
    return Array.from(files).filter((file) => {
      const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
      return IMAGE_EXTENSIONS.includes(ext);
    });
  };

  const resetNewStyleForm = () => {
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
      resetNewStyleForm();
      setActiveAction('none');
      onStyleChanged();
    } catch {
      toast.error('Failed to create style');
    } finally {
      setLoading(false);
    }
  };

  const handleAddImages = async (files: File[]) => {
    if (!selectedStyleId || files.length === 0) return;
    setLoading(true);

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('images', file));
      await addImagesToStyle(selectedStyleId, formData);
      toast.success(`${files.length} image(s) added`);
      setActiveAction('none');
      onStyleChanged();
    } catch {
      toast.error('Failed to add images');
    } finally {
      setLoading(false);
      if (addImagesFileInputRef.current) addImagesFileInputRef.current.value = '';
      if (addImagesFolderInputRef.current) addImagesFolderInputRef.current.value = '';
    }
  };

  const handleDeleteStyle = async () => {
    if (!selectedStyleId) return;
    setLoading(true);

    try {
      const deletedId = selectedStyleId;
      await deleteStyle(deletedId);
      toast.success('Style deleted');
      setShowDeleteModal(false);
      setActiveAction('none');
      onStyleDeleted(deletedId);
    } catch {
      toast.error('Failed to delete style');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Action cards */}
      {activeAction === 'none' && (
        <div className="space-y-3">
          {/* New Style */}
          <button
            onClick={() => setActiveAction('new')}
            className="w-full flex items-center gap-3 p-4 bg-surface-2 border border-swag-border rounded-card hover:border-swag-green/40 hover:shadow-card-hover transition-all text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-swag-green/10 flex items-center justify-center flex-shrink-0">
              <PlusIcon className="w-5 h-5 text-swag-green" />
            </div>
            <div>
              <div className="font-semibold text-swag-white text-sm">New Style</div>
              <div className="text-xs text-swag-text-tertiary">Create a new design style preset</div>
            </div>
          </button>

          {/* Add Images */}
          <button
            onClick={() => setActiveAction('add-images')}
            disabled={!selectedStyleId}
            className="w-full flex items-center gap-3 p-4 bg-surface-2 border border-swag-border rounded-card hover:border-swag-green/40 hover:shadow-card-hover transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-swag-border disabled:hover:shadow-none"
          >
            <div className="w-10 h-10 rounded-lg bg-swag-teal/10 flex items-center justify-center flex-shrink-0">
              <UploadIcon className="w-5 h-5 text-swag-teal" />
            </div>
            <div>
              <div className="font-semibold text-swag-white text-sm">Add Images</div>
              <div className="text-xs text-swag-text-tertiary">
                {selectedStyleId ? 'Add reference images to selected style' : 'Select a style first'}
              </div>
            </div>
          </button>

          {/* Delete Style */}
          <button
            onClick={() => setShowDeleteModal(true)}
            disabled={!selectedStyleId}
            className="w-full flex items-center gap-3 p-4 bg-surface-2 border border-swag-border rounded-card hover:border-swag-pink/40 transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-swag-border"
          >
            <div className="w-10 h-10 rounded-lg bg-swag-pink/10 flex items-center justify-center flex-shrink-0">
              <TrashIcon className="w-5 h-5 text-swag-pink" />
            </div>
            <div>
              <div className="font-semibold text-swag-white text-sm">Delete Style</div>
              <div className="text-xs text-swag-text-tertiary">
                {selectedStyleId ? 'Remove selected style permanently' : 'Select a style first'}
              </div>
            </div>
          </button>
        </div>
      )}

      {/* New Style form */}
      {activeAction === 'new' && (
        <div className="space-y-4 animate-fade-in">
          <h3 className="font-display text-lg uppercase tracking-wider text-swag-white">
            Create New Style
          </h3>

          <div className="space-y-3">
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
              className="w-full input-dark text-sm resize-none h-20"
            />

            {/* Visual Rules */}
            <div>
              <p className="text-xs font-semibold text-swag-text-secondary uppercase tracking-wider mb-2">
                Visual Rules (optional)
              </p>
              <div className="space-y-2">
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

            {/* Image upload area */}
            <div>
              <p className="text-xs font-semibold text-swag-text-secondary uppercase tracking-wider mb-2">
                Reference Images (optional)
              </p>
              <div
                onClick={() => newStyleFileInputRef.current?.click()}
                className="border-2 border-dashed border-swag-border hover:border-swag-green/40 rounded-card p-6 text-center cursor-pointer transition-all hover:bg-swag-green/5"
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
                  <div className="grid grid-cols-4 gap-2">
                    {newStyleImages.slice(0, 8).map((file, i) => (
                      <div key={i} className="aspect-square bg-surface-3 rounded-img overflow-hidden">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                    {newStyleImages.length > 8 && (
                      <div className="aspect-square bg-surface-3 rounded-img flex items-center justify-center">
                        <span className="text-xs text-swag-text-tertiary">+{newStyleImages.length - 8}</span>
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
                {...{ webkitdirectory: "" } as React.InputHTMLAttributes<HTMLInputElement>}
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
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleCreateStyle}
              disabled={loading || !newName.trim()}
              className="flex-1 btn-primary text-sm"
            >
              {loading ? 'Creating...' : 'Create Style'}
            </button>
            <button
              onClick={() => { resetNewStyleForm(); setActiveAction('none'); }}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add Images selection */}
      {activeAction === 'add-images' && (
        <div className="space-y-4 animate-fade-in">
          <h3 className="font-display text-lg uppercase tracking-wider text-swag-white">
            Add Reference Images
          </h3>

          <div
            onClick={() => addImagesFileInputRef.current?.click()}
            className="border-2 border-dashed border-swag-border hover:border-swag-green/40 rounded-card p-8 text-center cursor-pointer transition-all hover:bg-swag-green/5"
          >
            <UploadIcon className="w-10 h-10 text-swag-text-quaternary mx-auto mb-3" />
            <p className="text-sm text-swag-text-secondary">Click to browse images</p>
            <p className="text-xs text-swag-text-quaternary mt-1">PNG, JPG supported</p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => addImagesFolderInputRef.current?.click()}
              disabled={loading}
              className="flex-1 btn-secondary text-sm"
            >
              Select Folder
            </button>
            <button
              onClick={() => setActiveAction('none')}
              className="btn-ghost text-sm border border-swag-border rounded-btn"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Hidden file inputs for add-images */}
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
        {...{ webkitdirectory: "" } as React.InputHTMLAttributes<HTMLInputElement>}
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            const images = filterImageFiles(e.target.files);
            if (images.length > 0) handleAddImages(images);
          }
        }}
      />

      {/* Delete confirmation modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Style"
        footer={
          <>
            <button
              onClick={() => setShowDeleteModal(false)}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteStyle}
              disabled={loading}
              className="btn-danger text-sm"
            >
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
    </div>
  );
}

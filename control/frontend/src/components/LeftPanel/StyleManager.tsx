// Left Panel - Style Manager Component

import { useState, useRef } from 'react';
import { createStyle, addImagesToStyle, deleteStyle } from '../../services/api';

interface StyleManagerProps {
  selectedStyleId: string | null;
  onStyleChanged: () => void;
  onStyleDeleted: (styleId: string) => void;
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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const addImagesFileInputRef = useRef<HTMLInputElement>(null);
  const addImagesFolderInputRef = useRef<HTMLInputElement>(null);
  const newStyleFileInputRef = useRef<HTMLInputElement>(null);
  const newStyleFolderInputRef = useRef<HTMLInputElement>(null);

  const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg'];

  const filterImageFiles = (files: FileList): File[] => {
    return Array.from(files).filter((file) => {
      const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
      return IMAGE_EXTENSIONS.includes(ext);
    });
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
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
    clearMessages();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', newName.trim());
      formData.append('description', newDescription.trim());

      const visualRules: Record<string, any> = {};
      if (newLineWeight.trim()) visualRules.line_weight = newLineWeight.trim();
      if (newLooseness.trim()) visualRules.looseness = newLooseness.trim();
      if (newComplexity.trim()) visualRules.complexity = newComplexity.trim();
      formData.append('visual_rules', JSON.stringify(visualRules));

      if (newStyleImages && newStyleImages.length > 0) {
        newStyleImages.forEach((file) => formData.append('images', file));
      }

      await createStyle(formData);
      setSuccess('Style created');
      resetNewStyleForm();
      setActiveAction('none');
      onStyleChanged();
    } catch (err) {
      setError('Failed to create style. Backend endpoint may not be available yet.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddImages = async (files: File[]) => {
    if (!selectedStyleId || files.length === 0) return;
    clearMessages();
    setLoading(true);

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('images', file));
      await addImagesToStyle(selectedStyleId, formData);
      setSuccess(`${files.length} image(s) added`);
      setActiveAction('none');
      onStyleChanged();
    } catch (err) {
      setError('Failed to add images. Backend endpoint may not be available yet.');
    } finally {
      setLoading(false);
      if (addImagesFileInputRef.current) addImagesFileInputRef.current.value = '';
      if (addImagesFolderInputRef.current) addImagesFolderInputRef.current.value = '';
    }
  };

  const handleDeleteStyle = async () => {
    if (!selectedStyleId) return;
    clearMessages();
    setLoading(true);

    try {
      const deletedId = selectedStyleId;
      await deleteStyle(deletedId);
      setSuccess('Style deleted');
      setActiveAction('none');
      onStyleDeleted(deletedId);
    } catch (err) {
      setError('Failed to delete style. Backend endpoint may not be available yet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <h2 className="panel-heading">Manage Styles</h2>

      {/* Status messages */}
      {error && (
        <div className="mb-3 text-sm text-swag-pink">{error}</div>
      )}
      {success && (
        <div className="mb-3 text-sm text-swag-green">{success}</div>
      )}

      {/* Action buttons */}
      {activeAction === 'none' && (
        <div className="space-y-2">
          <button
            onClick={() => { clearMessages(); setActiveAction('new'); }}
            className="w-full btn-secondary text-sm"
          >
            New Style
          </button>
          <button
            onClick={() => { clearMessages(); setActiveAction('add-images'); }}
            disabled={!selectedStyleId}
            className="w-full btn-secondary text-sm"
          >
            Add Images
          </button>
          <button
            onClick={() => { clearMessages(); setActiveAction('delete-confirm'); }}
            disabled={!selectedStyleId}
            className="w-full btn-danger text-sm"
          >
            Delete Style
          </button>
        </div>
      )}

      {/* New Style form */}
      {activeAction === 'new' && (
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
            className="w-full input-dark text-sm resize-none h-16"
          />
          <div>
            <p className="text-xs text-swag-text-secondary mb-1">Visual Rules (optional)</p>
            <div className="space-y-1">
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
          <div>
            <p className="text-xs text-swag-text-secondary mb-1">Reference Images (optional)</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => newStyleFolderInputRef.current?.click()}
                className="flex-1 btn-secondary text-sm"
              >
                Select Folder
              </button>
              <button
                type="button"
                onClick={() => newStyleFileInputRef.current?.click()}
                className="flex-1 btn-secondary text-sm"
              >
                Select Images
              </button>
            </div>
            {newStyleImages && newStyleImages.length > 0 && (
              <p className="text-xs text-swag-text-secondary mt-1">
                {newStyleImages.length} image(s) selected
              </p>
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
            {/* @ts-expect-error webkitdirectory is not in React's type definitions */}
            <input
              ref={newStyleFolderInputRef}
              type="file"
              webkitdirectory=""
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  const images = filterImageFiles(e.target.files);
                  setNewStyleImages(images.length > 0 ? images : null);
                }
              }}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreateStyle}
              disabled={loading || !newName.trim()}
              className="flex-1 btn-primary text-sm"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
            <button
              onClick={() => { resetNewStyleForm(); setActiveAction('none'); clearMessages(); }}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {activeAction === 'delete-confirm' && (
        <div className="space-y-3">
          <p className="text-sm text-swag-text-secondary">
            Delete the selected style? This cannot be undone.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleDeleteStyle}
              disabled={loading}
              className="flex-1 btn-danger text-sm"
            >
              {loading ? 'Deleting...' : 'Confirm Delete'}
            </button>
            <button
              onClick={() => { setActiveAction('none'); clearMessages(); }}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add Images selection */}
      {activeAction === 'add-images' && (
        <div className="space-y-3">
          <p className="text-sm text-swag-text-secondary">
            Select a folder or individual images to add to the selected style.
          </p>
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
              type="button"
              onClick={() => addImagesFileInputRef.current?.click()}
              disabled={loading}
              className="flex-1 btn-secondary text-sm"
            >
              Select Images
            </button>
          </div>
          <button
            onClick={() => { setActiveAction('none'); clearMessages(); }}
            className="w-full btn-secondary text-sm"
          >
            Cancel
          </button>
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
      {/* @ts-expect-error webkitdirectory is not in React's type definitions */}
      <input
        ref={addImagesFolderInputRef}
        type="file"
        webkitdirectory=""
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            const images = filterImageFiles(e.target.files);
            if (images.length > 0) handleAddImages(images);
          }
        }}
      />
    </div>
  );
}

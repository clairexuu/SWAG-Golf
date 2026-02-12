import { useEffect, useState } from 'react';
import { getStyles, deleteImagesFromStyle, getReferenceImageUrl } from '../../services/api';
import type { Style } from '../../types';
import { SkeletonStyleCard } from '../shared/Skeleton';
import EmptyState from '../shared/EmptyState';
import Modal from '../shared/Modal';
import { useToast } from '../../hooks/useToast';
import { TrashIcon, ChevronLeftIcon, ImagePlaceholderIcon } from '../shared/Icons';

interface StyleLibraryProps {
  refreshKey: number;
  onStyleChanged: () => void;
  onManageStyles: () => void;
}

export default function StyleLibrary({ refreshKey, onStyleChanged, onManageStyles }: StyleLibraryProps) {
  const [styles, setStyles] = useState<Style[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    async function fetchStyles() {
      try {
        setLoading(true);
        const fetchedStyles = await getStyles();
        setStyles(fetchedStyles);
      } catch {
        setError('Failed to load styles');
      } finally {
        setLoading(false);
      }
    }
    fetchStyles();
  }, [refreshKey]);

  const selectedStyle = styles.find(s => s.id === selectedStyleId);

  const toggleImageSelection = (filename: string) => {
    setSelectedImages(prev => {
      const next = new Set(prev);
      if (next.has(filename)) {
        next.delete(filename);
      } else {
        next.add(filename);
      }
      return next;
    });
  };

  const handleDeleteImages = async () => {
    if (!selectedStyleId || selectedImages.size === 0) return;
    setDeleting(true);
    try {
      await deleteImagesFromStyle(selectedStyleId, Array.from(selectedImages));
      toast.success(`${selectedImages.size} image(s) deleted`);
      setSelectedImages(new Set());
      setShowDeleteModal(false);
      onStyleChanged();
    } catch {
      toast.error('Failed to delete images');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <SkeletonStyleCard />
        <SkeletonStyleCard />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-swag-pink text-sm">{error}</div>
      </div>
    );
  }

  if (styles.length === 0) {
    return (
      <EmptyState
        icon={<ImagePlaceholderIcon className="w-12 h-12" />}
        title="No Styles"
        description="Create a style to browse its reference images"
        action={
          <button onClick={onManageStyles} className="btn-secondary text-sm mt-3">
            Create Style
          </button>
        }
      />
    );
  }

  // Image grid view
  if (selectedStyle) {
    return (
      <div className="space-y-3 animate-fade-in">
        {/* Back button + style name */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setSelectedStyleId(null); setSelectedImages(new Set()); }}
            className="btn-icon p-1"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          <h3 className="font-semibold text-swag-white text-sm truncate flex-1">
            {selectedStyle.name}
          </h3>
          <span className="text-[10px] text-swag-text-quaternary">
            {selectedStyle.referenceImages.length} images
          </span>
        </div>

        {/* Selection toolbar */}
        {selectedImages.size > 0 && (
          <div className="flex items-center justify-between bg-surface-2 border border-swag-border rounded-card px-3 py-2">
            <span className="text-xs text-swag-text-secondary">
              {selectedImages.size} selected
            </span>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-1 text-xs text-swag-pink hover:brightness-125 transition-all"
            >
              <TrashIcon className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        )}

        {/* Image grid */}
        {selectedStyle.referenceImages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-swag-text-tertiary">No reference images</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {selectedStyle.referenceImages.map((filename) => {
              const isSelected = selectedImages.has(filename);
              return (
                <div
                  key={filename}
                  onClick={() => toggleImageSelection(filename)}
                  className={`aspect-square bg-surface-2 rounded-img overflow-hidden cursor-pointer border-2 transition-all ${
                    isSelected
                      ? 'border-swag-pink'
                      : 'border-transparent hover:border-swag-border'
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

        {/* Delete confirmation modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Images"
          footer={
            <>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn-secondary text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteImages}
                disabled={deleting}
                className="btn-danger text-sm"
              >
                {deleting ? 'Deleting...' : `Delete ${selectedImages.size} Image(s)`}
              </button>
            </>
          }
        >
          <p className="text-sm text-swag-text-secondary">
            Are you sure you want to delete {selectedImages.size} reference image(s)?
            This action cannot be undone.
          </p>
        </Modal>
      </div>
    );
  }

  // Style list view
  return (
    <div className="space-y-2">
      {styles.map((style) => (
        <div
          key={style.id}
          onClick={() => setSelectedStyleId(style.id)}
          className="style-card cursor-pointer"
        >
          <div className="pl-2">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-swag-white text-sm">{style.name}</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider text-swag-text-quaternary bg-surface-3 px-2 py-0.5 rounded-tag">
                {style.referenceImages.length} refs
              </span>
            </div>
            {style.description && (
              <p className="text-xs text-swag-text-secondary line-clamp-2">
                {style.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

import { SidebarCollapseIcon } from '../shared/Icons';

interface HeaderProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  isGenerating: boolean;
  selectedStyleName?: string;
}

export default function Header({
  sidebarCollapsed,
  onToggleSidebar,
  isGenerating,
  selectedStyleName,
}: HeaderProps) {
  return (
    <header className="h-14 bg-surface-1 border-b border-swag-border flex items-center px-4 gap-4 flex-shrink-0">
      {/* Sidebar toggle */}
      <button
        onClick={onToggleSidebar}
        className="btn-icon"
        title={sidebarCollapsed ? 'Expand sidebar (⌘B)' : 'Collapse sidebar (⌘B)'}
      >
        <SidebarCollapseIcon className="w-5 h-5" />
      </button>

      {/* Logo lockup */}
      <div className="flex items-baseline gap-1.5">
        <span className="font-display text-2xl text-swag-green tracking-wider leading-none">
          SWAG
        </span>
        <span className="font-display text-lg text-swag-white tracking-wider leading-none">
          SKETCH AGENT
        </span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right section: status indicators */}
      <div className="flex items-center gap-4">
        {/* Active style indicator */}
        {selectedStyleName && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-swag-text-tertiary uppercase tracking-wider">Style</span>
            <span className="tag-green">{selectedStyleName}</span>
          </div>
        )}

        {/* Generation status */}
        <div className="flex items-center gap-2">
          <div
            className={`status-dot ${
              isGenerating ? 'status-dot-green animate-pulse' : 'status-dot-idle'
            }`}
          />
          <span className="text-xs text-swag-text-tertiary">
            {isGenerating ? 'Generating...' : 'Ready'}
          </span>
        </div>

        {/* Keyboard shortcut hint */}
        <div className="hidden lg:flex items-center gap-1">
          <kbd className="kbd">⌘</kbd>
          <kbd className="kbd">↵</kbd>
          <span className="text-xs text-swag-text-quaternary ml-1">Generate</span>
        </div>
      </div>
    </header>
  );
}

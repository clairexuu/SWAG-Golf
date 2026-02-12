import { GearIcon } from '../shared/Icons';

interface SidebarProps {
  collapsed: boolean;
  onManageStyles: () => void;
  activeTab: 'styles' | 'library';
  onTabChange: (tab: 'styles' | 'library') => void;
  children: React.ReactNode;
  libraryContent: React.ReactNode;
}

export default function Sidebar({
  collapsed,
  onManageStyles,
  activeTab,
  onTabChange,
  children,
  libraryContent,
}: SidebarProps) {
  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : 'sidebar-expanded'} flex-shrink-0`}>
      {/* Tab toggle header */}
      <div className="px-4 py-3 border-b border-swag-border flex-shrink-0">
        {!collapsed ? (
          <div className="flex gap-1 bg-surface-2 rounded-btn p-0.5">
            <button
              onClick={() => onTabChange('styles')}
              className={`flex-1 text-xs font-bold uppercase tracking-widest py-1.5 rounded-btn transition-all ${
                activeTab === 'styles'
                  ? 'bg-swag-green text-black'
                  : 'text-swag-text-tertiary hover:text-swag-white'
              }`}
            >
              Styles
            </button>
            <button
              onClick={() => onTabChange('library')}
              className={`flex-1 text-xs font-bold uppercase tracking-widest py-1.5 rounded-btn transition-all ${
                activeTab === 'library'
                  ? 'bg-swag-green text-black'
                  : 'text-swag-text-tertiary hover:text-swag-white'
              }`}
            >
              Library
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-6 h-6 rounded-full bg-swag-green/20 flex items-center justify-center">
              <span className="text-swag-green text-[10px] font-bold">
                {activeTab === 'styles' ? 'S' : 'L'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto sidebar-scroll">
        {!collapsed ? (
          <div className="p-3">
            {activeTab === 'styles' ? children : libraryContent}
          </div>
        ) : (
          <div className="p-2 flex flex-col items-center gap-2 opacity-50">
            {/* Collapsed placeholder dots */}
          </div>
        )}
      </div>

      {/* Footer: Manage Styles button */}
      <div className="flex-shrink-0 p-3 border-t border-swag-border">
        {!collapsed ? (
          <button onClick={onManageStyles} className="w-full btn-secondary text-sm flex items-center justify-center gap-2">
            <GearIcon className="w-4 h-4" />
            Manage Styles
          </button>
        ) : (
          <button onClick={onManageStyles} className="btn-icon mx-auto block" title="Manage Styles">
            <GearIcon className="w-5 h-5" />
          </button>
        )}
      </div>
    </aside>
  );
}

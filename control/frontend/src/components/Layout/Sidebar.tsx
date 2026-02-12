interface SidebarProps {
  collapsed: boolean;
  children: React.ReactNode;
}

export default function Sidebar({ collapsed, children }: SidebarProps) {
  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : 'sidebar-expanded'} flex-shrink-0`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-swag-border flex-shrink-0">
        {!collapsed ? (
          <div className="text-xs font-bold uppercase tracking-widest text-swag-text-tertiary">
            Styles
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-6 h-6 rounded-full bg-swag-green/20 flex items-center justify-center">
              <span className="text-swag-green text-[10px] font-bold">S</span>
            </div>
          </div>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto sidebar-scroll">
        {!collapsed ? (
          <div className="p-3">
            {children}
          </div>
        ) : (
          <div className="p-2 flex flex-col items-center gap-2 opacity-50" />
        )}
      </div>
    </aside>
  );
}

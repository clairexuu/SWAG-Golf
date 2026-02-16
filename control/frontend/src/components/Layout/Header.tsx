import { NavLink } from 'react-router-dom';
import { PencilIcon, ImagePlaceholderIcon, ClockIcon } from '../shared/Icons';
import BackendStatus from '../shared/BackendStatus';

export default function Header() {

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded-btn text-xs font-bold uppercase tracking-wider transition-all ${
      isActive
        ? 'bg-swag-green text-black'
        : 'text-swag-text-tertiary hover:text-swag-white hover:bg-surface-3'
    }`;

  return (
    <header className="h-14 bg-surface-1 border-b border-swag-border flex items-center px-4 gap-4 flex-shrink-0">
      {/* Logo lockup */}
      <div className="flex items-baseline gap-1.5">
        <span className="font-display text-2xl text-swag-green tracking-wider leading-none">
          SWAG
        </span>
        <span className="font-display text-lg text-swag-white tracking-wider leading-none">
          SKETCH AGENT
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex items-center gap-1 ml-6">
        <NavLink to="/" end className={navLinkClass}>
          <PencilIcon className="w-3.5 h-3.5" />
          Studio
        </NavLink>
        <NavLink to="/styles" className={navLinkClass}>
          <ImagePlaceholderIcon className="w-3.5 h-3.5" />
          Styles
        </NavLink>
        <NavLink to="/archive" className={navLinkClass}>
          <ClockIcon className="w-3.5 h-3.5" />
          Archive
        </NavLink>
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Python backend connection status */}
      <BackendStatus />
    </header>
  );
}

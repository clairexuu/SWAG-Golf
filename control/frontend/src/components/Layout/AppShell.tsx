import { Outlet } from 'react-router-dom';
import Header from './Header';
import ToastContainer from '../shared/Toast';

export default function AppShell() {
  return (
    <div className="flex flex-col h-screen bg-surface-0">
      <ToastContainer />
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}

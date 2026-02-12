import { ToastProvider } from './components/shared/ToastContext';
import MainLayout from './components/Layout/MainLayout';

function App() {
  return (
    <ToastProvider>
      <MainLayout />
    </ToastProvider>
  );
}

export default App;

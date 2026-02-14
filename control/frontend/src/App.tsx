import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/shared/ToastContext';
import { StyleProvider } from './context/StyleContext';
import { GenerationProvider } from './context/GenerationContext';
import AppShell from './components/Layout/AppShell';
import StudioPage from './pages/StudioPage';
import StyleLibraryPage from './pages/StyleLibraryPage';
import ArchivePage from './pages/ArchivePage';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <StyleProvider>
          <GenerationProvider>
            <Routes>
              <Route element={<AppShell />}>
                <Route index element={<StudioPage />} />
                <Route path="/styles" element={<StyleLibraryPage />} />
                <Route path="/archive" element={<ArchivePage />} />
              </Route>
            </Routes>
          </GenerationProvider>
        </StyleProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;

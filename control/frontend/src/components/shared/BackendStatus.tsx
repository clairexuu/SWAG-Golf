import { useState, useEffect } from 'react';
import { healthCheck } from '../../services/api';

const POLL_INTERVAL_MS = 30_000;

export default function BackendStatus() {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    async function check() {
      try {
        const data = await healthCheck();
        setStatus(data.pythonBackend === 'connected' ? 'connected' : 'disconnected');
      } catch {
        setStatus('disconnected');
      }
    }

    check();
    timer = setInterval(check, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  if (status === 'checking') return null;
  if (status === 'connected') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-swag-text-tertiary">
        <span className="w-2 h-2 rounded-full bg-swag-green" />
        Connected
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-amber-400">
      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
      Mock mode
    </div>
  );
}

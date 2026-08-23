export type ToastType = 'success' | 'danger' | 'info' | 'warning';

type ToastListener = (type: ToastType, title: string, message: string) => void;

const listeners: Set<ToastListener> = new Set();

export const subscribeToast = (listener: ToastListener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const showToast = (type: ToastType, title: string, message: string) => {
  listeners.forEach((l) => l(type, title, message));
};

// Global interceptor for standard window.alert calls
if (typeof window !== 'undefined') {
  (window as any).showToast = showToast;

  window.alert = (message?: any) => {
    const msgStr = typeof message === 'object' ? JSON.stringify(message) : String(message || '');
    if (!msgStr) return;

    // Filter out window popup print instructions
    if (msgStr.includes('popup browser')) return;

    const lower = msgStr.toLowerCase();
    const isSuccess = msgStr.includes('✓') || lower.includes('berhasil') || lower.includes('sukses');
    const isWarning = lower.includes('peringatan') || lower.includes('perhatian') || lower.includes('offline');
    
    let type: ToastType = 'danger';
    let title = 'Notifikasi Sistem';

    if (isSuccess) {
      type = 'success';
      title = 'Berhasil';
    } else if (isWarning) {
      type = 'warning';
      title = 'Perhatian';
    } else {
      type = 'danger';
      title = 'Informasi / Perhatian';
    }

    const cleanMsg = msgStr.replace(/^[✓\s]+/, '');
    showToast(type, title, cleanMsg);
  };
}

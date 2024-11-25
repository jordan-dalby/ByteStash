import React, { createContext, useState, useCallback } from 'react';
import { X, Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';

export type ToastType = 'info' | 'success' | 'error' | 'warning';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  duration: number | null;
}

export interface ToastContextType {
  addToast: (message: string, type?: ToastType, duration?: number | null) => void;
  removeToast: (id: number) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProps extends Toast {
  onClose: () => void;
}

const toastConfig = {
  info: {
    icon: Info,
    bgColor: 'bg-light-primary dark:bg-dark-primary',
    borderColor: 'border-light-primary dark:border-dark-primary',
    textColor: 'text-white',
    hoverColor: 'hover:bg-light-hover dark:hover:bg-dark-hover'
  },
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-500 dark:bg-green-600',
    borderColor: 'border-green-600 dark:border-green-700',
    textColor: 'text-white',
    hoverColor: 'hover:bg-green-600 dark:hover:bg-green-700'
  },
  error: {
    icon: AlertCircle,
    bgColor: 'bg-red-500 dark:bg-red-600',
    borderColor: 'border-red-600 dark:border-red-700',
    textColor: 'text-white',
    hoverColor: 'hover:bg-red-600 dark:hover:bg-red-700'
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-yellow-500 dark:bg-yellow-600',
    borderColor: 'border-yellow-600 dark:border-yellow-700',
    textColor: 'text-white',
    hoverColor: 'hover:bg-yellow-600 dark:hover:bg-yellow-700'
  },
} as const;

const ToastComponent: React.FC<ToastProps> = ({
  message, 
  type, 
  duration, 
  onClose 
}) => {
  const [progress, setProgress] = useState(100);
  const config = toastConfig[type];
  const Icon = config.icon;

  React.useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - (100 / ((duration || 0) / 100));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [duration]);

  return (
    <div className={`${config.bgColor} ${config.textColor} p-4 rounded-lg shadow-lg relative 
      overflow-hidden border-l-4 ${config.borderColor} flex items-center max-w-md 
      backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95`}>
      <div className="mr-3">
        <Icon size={24} />
      </div>
      <div className="flex-grow mr-8">
        <p className="font-semibold">{message}</p>
      </div>
      <button 
        onClick={onClose}
        className={`absolute top-0 right-0 h-full px-4 flex items-center justify-center 
          transition-colors duration-200 ${config.hoverColor}`}
      >
        <X size={16} />
      </button>
      <div 
        className="absolute bottom-0 left-0 h-1 bg-white bg-opacity-30"
        style={{ width: `${progress}%`, transition: 'width 100ms linear' }}
      />
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const addToast = useCallback((
    message: string, 
    type: ToastType = 'info', 
    duration: number | null = 3000
  ) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, duration }]);
    if (duration !== null) {
      setTimeout(() => removeToast(id), duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <ToastComponent
            key={toast.id}
            {...toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

import { createContext, useCallback, useContext, useState } from "react";
import { HiCheckCircle, HiXCircle, HiInformationCircle } from "react-icons/hi2";

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // type: "success" | "error" | "info"
  const showToast = useCallback(
    (message, type = "success") => {
      const id = ++idCounter;

      setToasts((prev) => [...prev, { id, message, type }]);

      setTimeout(() => removeToast(id), 3500);
    },
    [removeToast]
  );

  const icons = {
    success: <HiCheckCircle className="text-xl text-green-500" />,
    error: <HiXCircle className="text-xl text-red-500" />,
    info: <HiInformationCircle className="text-xl text-blue-500" />,
  };

  const borderColors = {
    success: "border-green-200",
    error: "border-red-200",
    info: "border-blue-100",
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast Stack */}
      <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 w-full max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-start gap-3 bg-white rounded-2xl shadow-lg border ${borderColors[toast.type]} px-5 py-4 animate-[float_0.3s_ease-out]`}
          >
            {icons[toast.type]}
            <p className="text-sm font-medium text-slate-800">
              {toast.message}
            </p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
}

interface AlertProps {
  type: "success" | "error" | "warning" | "info";
  message: string;
  className?: string;
  onDismiss?: () => void;
}

const alertStyles = {
  success: {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-800",
    icon: (
      <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  error: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-800",
    icon: (
      <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  warning: {
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    text: "text-yellow-800",
    icon: (
      <svg className="h-5 w-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-800",
    icon: (
      <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

export function Alert({ type, message, className = "", onDismiss }: AlertProps) {
  const styles = alertStyles[type];

  return (
    <div className={`flex items-center gap-3 rounded-lg border p-4 ${styles.bg} ${styles.border} ${className}`}>
      {styles.icon}
      <p className={`flex-1 text-sm ${styles.text}`}>{message}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className={`${styles.text} hover:opacity-75`}
          aria-label="Dismiss"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

export function SuccessAlert({ message, className, onDismiss }: Omit<AlertProps, "type">) {
  return <Alert type="success" message={message} className={className} onDismiss={onDismiss} />;
}

export function ErrorAlert({ message, className, onDismiss }: Omit<AlertProps, "type">) {
  return <Alert type="error" message={message} className={className} onDismiss={onDismiss} />;
}

export function WarningAlert({ message, className, onDismiss }: Omit<AlertProps, "type">) {
  return <Alert type="warning" message={message} className={className} onDismiss={onDismiss} />;
}

export function InfoAlert({ message, className, onDismiss }: Omit<AlertProps, "type">) {
  return <Alert type="info" message={message} className={className} onDismiss={onDismiss} />;
}

export default Alert;

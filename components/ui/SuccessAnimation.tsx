"use client";

import { useEffect, useState } from "react";

interface SuccessAnimationProps {
  show: boolean;
  message?: string;
  subMessage?: string;
  onComplete?: () => void;
  duration?: number;
}

export function SuccessAnimation({
  show,
  message = "Success!",
  subMessage,
  onComplete,
  duration = 2500,
}: SuccessAnimationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      setIsLeaving(false);

      const timer = setTimeout(() => {
        setIsLeaving(true);
        setTimeout(() => {
          setIsVisible(false);
          onComplete?.();
        }, 300);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className={`
        fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm
        transition-opacity duration-300
        ${isLeaving ? "opacity-0" : "opacity-100"}
      `}
    >
      <div
        className={`
          flex flex-col items-center rounded-2xl bg-white p-8 shadow-2xl
          transform transition-all duration-300
          ${isLeaving ? "scale-95 opacity-0" : "scale-100 opacity-100"}
        `}
      >
        {/* Animated checkmark circle */}
        <div className="relative mb-4">
          <svg className="h-24 w-24" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#E8F5E9"
              strokeWidth="6"
            />
            {/* Animated circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#4CAF50"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="283"
              strokeDashoffset="283"
              className="animate-[drawCircle_0.6s_ease-out_forwards]"
            />
            {/* Animated checkmark */}
            <path
              d="M30 50 L45 65 L70 35"
              fill="none"
              stroke="#4CAF50"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="60"
              strokeDashoffset="60"
              className="animate-[drawCheck_0.4s_ease-out_0.6s_forwards]"
            />
          </svg>
          
          {/* Confetti particles */}
          <div className="absolute inset-0">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full animate-[confetti_1s_ease-out_forwards]"
                style={{
                  backgroundColor: ["#FF5722", "#2196F3", "#4CAF50", "#FFC107", "#9C27B0", "#00BCD4"][i % 6],
                  transform: `rotate(${i * 30}deg) translateY(-30px)`,
                  animationDelay: `${0.5 + i * 0.05}s`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Success message */}
        <h2 className="text-2xl font-bold text-gray-900 animate-[fadeInUp_0.4s_ease-out_0.8s_both]">
          {message}
        </h2>
        {subMessage && (
          <p className="mt-2 text-gray-600 animate-[fadeInUp_0.4s_ease-out_1s_both]">
            {subMessage}
          </p>
        )}
      </div>

      <style jsx>{`
        @keyframes drawCircle {
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes drawCheck {
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes confetti {
          0% {
            transform: rotate(var(--rotation, 0deg)) translateY(-30px) scale(1);
            opacity: 1;
          }
          100% {
            transform: rotate(var(--rotation, 0deg)) translateY(-80px) scale(0);
            opacity: 0;
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

// Compact inline success indicator
export function SuccessCheck({ show, className = "" }: { show: boolean; className?: string }) {
  if (!show) return null;

  return (
    <span className={`inline-flex items-center gap-1.5 text-green-600 ${className}`}>
      <svg
        className="h-5 w-5 animate-[scaleIn_0.3s_ease-out]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
      <style jsx>{`
        @keyframes scaleIn {
          from {
            transform: scale(0);
          }
          to {
            transform: scale(1);
          }
        }
      `}</style>
    </span>
  );
}

export default SuccessAnimation;

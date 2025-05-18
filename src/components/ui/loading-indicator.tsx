import React from "react";

interface LoadingIndicatorProps {
  text?: string;
  size?: "small" | "medium" | "large";
  className?: string;
}

export const LoadingIndicator = ({
  text = "Ładowanie...",
  size = "medium",
  className = "",
}: LoadingIndicatorProps) => {
  const sizeClass = {
    small: "h-4 w-4",
    medium: "h-8 w-8",
    large: "h-12 w-12",
  }[size];

  const containerSize = {
    small: "h-10 w-10",
    medium: "h-16 w-16",
    large: "h-24 w-24",
  }[size];

  return (
    <div className={`flex flex-col items-center justify-center py-6 ${className}`}>
      <div className={`rounded-full ${containerSize} flex items-center justify-center bg-gradient-to-r from-primary/20 via-secondary-400/20 to-accent-200/20 mb-4 shadow-inner`}>
        <svg className={`animate-spin ${sizeClass} text-white`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      {text && (
        <div className="text-center">
          <p className="text-gray-300">{text}</p>
          <p className="text-xs text-gray-500 mt-1">To może zająć kilka chwil</p>
        </div>
      )}
    </div>
  );
};

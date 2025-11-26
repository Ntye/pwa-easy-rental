import React from 'react';

export interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-secondary-800 mb-3">{title}</h3>
      )}
      {children}
    </div>
  );
};

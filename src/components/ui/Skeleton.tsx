import React from 'react';
export const Skeleton: React.FC<any> = ({ children, className }) => (
  <div className={`ui-skeleton ${className || ''}`}>
    {children || 'Skeleton Component'}
  </div>
);
import React from 'react';
export const Separator: React.FC<any> = ({ children, className }) => (
  <div className={`ui-separator ${className || ''}`}>
    {children || 'Separator Component'}
  </div>
);
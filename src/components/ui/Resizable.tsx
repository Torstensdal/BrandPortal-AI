import React from 'react';
export const Resizable: React.FC<any> = ({ children, className }) => (
  <div className={`ui-resizable ${className || ''}`}>
    {children || 'Resizable Component'}
  </div>
);
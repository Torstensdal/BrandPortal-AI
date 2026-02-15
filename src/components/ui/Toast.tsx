import React from 'react';
export const Toast: React.FC<any> = ({ children, className }) => (
  <div className={`ui-toast ${className || ''}`}>
    {children || 'Toast Component'}
  </div>
);
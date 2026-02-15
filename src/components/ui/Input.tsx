import React from 'react';
export const Input: React.FC<any> = ({ children, className }) => (
  <div className={`ui-input ${className || ''}`}>
    {children || 'Input Component'}
  </div>
);
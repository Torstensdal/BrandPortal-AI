import React from 'react';
export const Checkbox: React.FC<any> = ({ children, className }) => (
  <div className={`ui-checkbox ${className || ''}`}>
    {children || 'Checkbox Component'}
  </div>
);
import React from 'react';
export const Select: React.FC<any> = ({ children, className }) => (
  <div className={`ui-select ${className || ''}`}>
    {children || 'Select Component'}
  </div>
);
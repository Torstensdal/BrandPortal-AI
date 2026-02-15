import React from 'react';
export const Dropdown: React.FC<any> = ({ children, className }) => (
  <div className={`ui-dropdown ${className || ''}`}>
    {children || 'Dropdown Component'}
  </div>
);
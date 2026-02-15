import React from 'react';
export const Combobox: React.FC<any> = ({ children, className }) => (
  <div className={`ui-combobox ${className || ''}`}>
    {children || 'Combobox Component'}
  </div>
);
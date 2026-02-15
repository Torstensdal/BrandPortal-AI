import React from 'react';
export const MenuBar: React.FC<any> = ({ children, className }) => (
  <div className={`ui-menubar ${className || ''}`}>
    {children || 'MenuBar Component'}
  </div>
);
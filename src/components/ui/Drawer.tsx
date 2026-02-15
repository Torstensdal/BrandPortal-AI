import React from 'react';
export const Drawer: React.FC<any> = ({ children, className }) => (
  <div className={`ui-drawer ${className || ''}`}>
    {children || 'Drawer Component'}
  </div>
);
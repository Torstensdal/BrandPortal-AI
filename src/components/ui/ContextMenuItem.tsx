import React from 'react';
export const ContextMenuItem: React.FC<any> = ({ children, className }) => (
  <div className={`ui-contextmenuitem ${className || ''}`}>
    {children || 'ContextMenuItem Component'}
  </div>
);
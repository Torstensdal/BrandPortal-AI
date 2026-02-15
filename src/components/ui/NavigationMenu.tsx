import React from 'react';
export const NavigationMenu: React.FC<any> = ({ children, className }) => (
  <div className={`ui-navigationmenu ${className || ''}`}>
    {children || 'NavigationMenu Component'}
  </div>
);
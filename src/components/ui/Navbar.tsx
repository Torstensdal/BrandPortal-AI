import React from 'react';
export const Navbar: React.FC<any> = ({ children, className }) => (
  <div className={`ui-navbar ${className || ''}`}>
    {children || 'Navbar Component'}
  </div>
);
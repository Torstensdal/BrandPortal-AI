import React from 'react';
export const Modal: React.FC<any> = ({ children, className }) => (
  <div className={`ui-modal ${className || ''}`}>
    {children || 'Modal Component'}
  </div>
);
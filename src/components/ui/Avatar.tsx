import React from 'react';
export const Avatar: React.FC<any> = ({ children, className }) => (
  <div className={`ui-avatar ${className || ''}`}>
    {children || 'Avatar Component'}
  </div>
);
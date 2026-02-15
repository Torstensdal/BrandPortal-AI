import React from 'react';
export const Sheet: React.FC<any> = ({ children, className }) => (
  <div className={`ui-sheet ${className || ''}`}>
    {children || 'Sheet Component'}
  </div>
);
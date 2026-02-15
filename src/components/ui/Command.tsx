import React from 'react';
export const Command: React.FC<any> = ({ children, className }) => (
  <div className={`ui-command ${className || ''}`}>
    {children || 'Command Component'}
  </div>
);
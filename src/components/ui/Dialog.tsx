import React from 'react';
export const Dialog: React.FC<any> = ({ children, className }) => (
  <div className={`ui-dialog ${className || ''}`}>
    {children || 'Dialog Component'}
  </div>
);
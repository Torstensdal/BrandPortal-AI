import React from 'react';
export const ScrollArea: React.FC<any> = ({ children, className }) => (
  <div className={`ui-scrollarea ${className || ''}`}>
    {children || 'ScrollArea Component'}
  </div>
);
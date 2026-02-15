import React from 'react';
export const Keyboard: React.FC<any> = ({ children, className }) => (
  <div className={`ui-keyboard ${className || ''}`}>
    {children || 'Keyboard Component'}
  </div>
);
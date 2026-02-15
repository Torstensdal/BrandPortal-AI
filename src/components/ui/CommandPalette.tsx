import React from 'react';
export const CommandPalette: React.FC<any> = ({ children, className }) => (
  <div className={`ui-commandpalette ${className || ''}`}>
    {children || 'CommandPalette Component'}
  </div>
);
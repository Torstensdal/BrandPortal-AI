import React from 'react';
export const Tabs: React.FC<any> = ({ children, className }) => (
  <div className={`ui-tabs ${className || ''}`}>
    {children || 'Tabs Component'}
  </div>
);
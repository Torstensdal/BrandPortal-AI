import React from 'react';
export const Table: React.FC<any> = ({ children, className }) => (
  <div className={`ui-table ${className || ''}`}>
    {children || 'Table Component'}
  </div>
);
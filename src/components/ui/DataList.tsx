import React from 'react';
export const DataList: React.FC<any> = ({ children, className }) => (
  <div className={`ui-datalist ${className || ''}`}>
    {children || 'DataList Component'}
  </div>
);
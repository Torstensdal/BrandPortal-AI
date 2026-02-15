import React from 'react';
export const TreeView: React.FC<any> = ({ children, className }) => (
  <div className={`ui-treeview ${className || ''}`}>
    {children || 'TreeView Component'}
  </div>
);
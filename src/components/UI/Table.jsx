import React from 'react';

export const Table = ({ headers, children, className = '' }) => {
  return (
    <div className={`table-wrapper ${className}`.trim()}>
      <table className="table">
        {headers && headers.length > 0 && (
          <thead>
            <tr>
              {headers.map((header, index) => (
                <th key={index}>{header}</th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {children}
        </tbody>
      </table>
    </div>
  );
};

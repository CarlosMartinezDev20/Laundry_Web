import React from 'react';
import { Table } from './Table';
import { Skeleton } from './Skeleton';

export const TableSkeleton = ({ rows = 5, columns = 4 }) => {
  // Generate empty headers to maintain table structure
  const headers = Array.from({ length: columns }, () => '');

  return (
    <Table headers={headers}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex}>
              <Skeleton height="20px" width={colIndex === 0 ? "80%" : "60%"} />
            </td>
          ))}
        </tr>
      ))}
    </Table>
  );
};

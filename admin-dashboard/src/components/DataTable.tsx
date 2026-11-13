import React from 'react';
import { Search } from 'lucide-react';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  searchPlaceholder = 'Search records...',
  searchTerm,
  onSearchChange,
  isLoading,
  emptyMessage = 'No records found matching your query.',
}: DataTableProps<T>) {
  return (
    <div style={{ background: '#131e15', borderRadius: 12, border: '1px solid #1f3223', overflow: 'hidden' }}>
      {onSearchChange && (
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #1f3223', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Search size={18} color="#7a9a81" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#e5ede7',
              fontSize: 14,
              width: '100%',
            }}
          />
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#0e170f', borderBottom: '1px solid #1f3223' }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    padding: '12px 18px',
                    color: '#8da693',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    fontSize: 11,
                    letterSpacing: '0.05em',
                  }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: 40, textAlign: 'center', color: '#8da693' }}>
                  Loading database records...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: 40, textAlign: 'center', color: '#7a9a81' }}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, idx) => (
                <tr
                  key={item.id ? String(item.id) : idx}
                  style={{
                    borderBottom: idx === data.length - 1 ? 'none' : '1px solid #192a1e',
                    transition: 'background 0.15s ease',
                  }}
                >
                  {columns.map((col) => (
                    <td key={col.key} style={{ padding: '14px 18px', color: '#e5ede7' }}>
                      {col.render ? col.render(item) : (item as any)[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


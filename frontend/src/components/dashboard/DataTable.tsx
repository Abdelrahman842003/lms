'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { DataTableProps } from '@/types/dashboard';

export const DataTable: React.FC<DataTableProps> = ({
  columns,
  data = [],
  actions,
  searchable = true,
  pagination = true,
  itemsPerPage = 10,
  isLoading = false,
  currentPage: serverCurrentPage,
  totalPages: serverTotalPages,
  onPageChange,
  onSearch,
  totalItems,
  headerActions,
  rowClassName,
  onRowClick,
}) => {
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const searchQuery = onSearch ? undefined : internalSearchQuery;
  const [internalCurrentPage, setInternalCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isServerSide = typeof onPageChange === 'function';
  const currentPage = isServerSide ? (serverCurrentPage || 1) : internalCurrentPage;

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchQuery) return data;

    return data.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [data, searchQuery]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (isServerSide) return sortedData;
    if (!pagination) return sortedData;

    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage, pagination, isServerSide]);

  const totalPages = isServerSide ? (serverTotalPages || 1) : Math.ceil(sortedData.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    if (isServerSide && onPageChange) {
      onPageChange(page);
    } else {
      setInternalCurrentPage(page);
    }
  };

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const handleAction = (action: any, row: any) => {
    action.onClick(row);
    setActiveDropdown(null);
  };

  return (
    <div>
      {/* Search and Actions */}
      {(searchable || headerActions) && (
        <div className="table-search flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
          {searchable && (
            <div className="table-search-wrapper flex-1">
              <input
                type="text"
                className="table-search-input w-full"
                placeholder="بحث..."
                value={onSearch ? undefined : searchQuery}
                onChange={(e) => {
                  if (onSearch) {
                    onSearch(e.target.value);
                  } else {
                    setInternalSearchQuery(e.target.value);
                  }
                  if (!isServerSide) setInternalCurrentPage(1);
                }}
              />
            </div>
          )}
          {headerActions && (
            <div className="table-header-actions">
              {headerActions}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`${column.sortable ? 'sortable' : ''} ${column.className || ''}`}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                {column.label}
                {column.sortable && sortColumn === column.key && (
                  <i
                    className={`fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'} sort-icon`}
                  ></i>
                )}
              </th>
            ))}
            {actions && actions.length > 0 && <th>الإجراءات</th>}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <tr key={index}>
                {columns.map((column, colIndex) => (
                  <td key={colIndex} className={column.className || ''}>
                    <div className="skeleton skeleton-text" style={{ width: '80%', height: '20px' }}></div>
                  </td>
                ))}
                {actions && actions.length > 0 && (
                  <td>
                    <div className="skeleton skeleton-circle"></div>
                  </td>
                )}
              </tr>
            ))
          ) : paginatedData.length > 0 ? (
            paginatedData.map((row, rowIndex) => (
              <tr 
                key={rowIndex} 
                className={`${rowClassName ? rowClassName(row) : ''} ${onRowClick ? 'cursor-pointer hover:bg-white/5 transition-colors' : ''}`}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map((column) => (
                  <td key={column.key} className={column.className || ''}>
                    {column.render
                      ? column.render(row[column.key], row, rowIndex)
                      : row[column.key]}
                  </td>
                ))}
                {actions && actions.length > 0 && (
                  <td>
                    <div className="actions-dropdown" ref={activeDropdown === rowIndex ? dropdownRef : null}>
                      <button
                        className="actions-trigger"
                        onClick={() =>
                          setActiveDropdown(
                            activeDropdown === rowIndex ? null : rowIndex
                          )
                        }
                      >
                        <i className="fas fa-ellipsis-v"></i>
                      </button>
                      <div
                        className={`actions-menu ${activeDropdown === rowIndex ? 'show' : ''}`}
                      >
                        {actions.map((action, actionIndex) => {
                          if (action.hidden && action.hidden(row)) return null;
                          
                          const icon = typeof action.icon === 'function' ? action.icon(row) : action.icon;
                          const label = typeof action.label === 'function' ? action.label(row) : action.label;
                          const variant = typeof action.variant === 'function' ? action.variant(row) : action.variant;
                          
                          return (
                            <div
                              key={actionIndex}
                              className={`actions-menu-item ${variant === 'danger' ? 'danger' : ''} ${variant === 'warning' ? 'warning' : ''} ${variant === 'success' ? 'success' : ''}`}
                              onClick={() => handleAction(action, row)}
                            >
                              <i className={icon}></i>
                              <span>{label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length + (actions ? 1 : 0)}
                className="empty-state-cell"
              >
                <div className="empty-state">
                  <i className="fas fa-inbox"></i>
                  <h3>لا توجد بيانات</h3>
                  <p>لم يتم العثور على أي نتائج</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination */}
      {pagination && (
        <div className="table-pagination">
          <div className="pagination-info">
            عرض {(currentPage - 1) * itemsPerPage + 1} -{' '}
            {isServerSide 
              ? Math.min(currentPage * itemsPerPage, totalItems || 0)
              : Math.min(currentPage * itemsPerPage, sortedData.length)
            } من{' '}
            {isServerSide ? (totalItems || 0) : sortedData.length}
          </div>
          {totalPages > 1 && (
            <div className="pagination-buttons">
              <button
                className="pagination-btn"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                <i className="fas fa-chevron-right"></i>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`pagination-btn ${page === currentPage ? 'active' : ''}`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              ))}
              <button
                className="pagination-btn"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                <i className="fas fa-chevron-left"></i>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

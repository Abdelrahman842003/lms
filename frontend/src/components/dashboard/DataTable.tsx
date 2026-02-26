'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { DataTableProps } from '@/types/dashboard';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

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
  mobileRenderer,
  breakpoint = 'xl',
}) => {
  const breakpointClasses = {
    sm: { mobile: 'block sm:hidden', table: '!hidden sm:table' },
    md: { mobile: 'block md:hidden', table: '!hidden md:table' },
    lg: { mobile: 'block lg:hidden', table: '!hidden lg:table' },
    xl: { mobile: 'block xl:hidden', table: '!hidden xl:table' },
    '2xl': { mobile: 'block 2xl:hidden', table: '!hidden 2xl:table' },
  };
  const currentBreakpoint = breakpointClasses[breakpoint] || breakpointClasses.xl;
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const searchQuery = onSearch ? undefined : internalSearchQuery;
  const [internalCurrentPage, setInternalCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
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
      {/* Mobile View */}
      {mobileRenderer && (
        <div className={`${currentBreakpoint.mobile} space-y-4`}>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="bg-white/5 rounded-xl p-4 animate-pulse">
                <div className="h-6 bg-white/10 rounded w-3/4 mb-3"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-white/10 rounded w-1/2"></div>
                  <div className="h-4 bg-white/10 rounded w-2/3"></div>
                </div>
              </div>
            ))
          ) : paginatedData.length > 0 ? (
            paginatedData.map((row, rowIndex) => (
              <div key={rowIndex} className="mobile-card-wrapper">
                {mobileRenderer(row)}
              </div>
            ))
          ) : (
            <div className="empty-state">
              <Icon name="inbox" size="lg" />
              <h3>لا توجد بيانات</h3>
              <p>لم يتم العثور على أي نتائج</p>
            </div>
          )}
        </div>
      )}

      {/* Desktop Table */}
      <div className="overflow-x-auto">
        <table className={`data-table ${mobileRenderer ? currentBreakpoint.table : ''}`}>
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
                    <Icon
                      name={sortDirection === 'asc' ? 'sort-up' : 'sort-down'}
                      size="xs"
                      className="sort-icon ml-1"
                    />
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
                      <div className="actions-dropdown">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="actions-trigger"
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            const menuWidth = 180; // min-width
                            const screenWidth = window.innerWidth;
                            
                            // RTL Alignment: Align menu's right edge with button's right edge
                            // In RTL, 'left' is actually the distance from the left edge of the screen
                            // We want the menu to start at (button.right - menuWidth)
                            let left = rect.right - menuWidth;

                            // If it goes off-screen to the left (e.g., button is near left edge)
                            // Shift it to the right
                            if (left < 20) {
                                left = rect.left; // Align left edge with button's left edge
                            }

                            // If it still goes off-screen to the right (unlikely in RTL but possible)
                            if (left + menuWidth > screenWidth - 20) {
                                left = screenWidth - menuWidth - 20;
                            }

                            // Vertical Positioning
                            const menuHeight = actions.length * 40 + 20; // approximate height (40px per item + padding)
                            const screenHeight = window.innerHeight;
                            let top = rect.bottom + 8;

                            // Check if there is space below
                            if (top + menuHeight > screenHeight - 20) {
                                // Not enough space below, open upwards
                                top = rect.top - menuHeight - 8;
                            }

                            setDropdownPosition({
                              top: top,
                              left: left,
                            });
                            setActiveDropdown(
                              activeDropdown === rowIndex ? null : rowIndex
                            )
                          }}
                        >
                          <Icon name="ellipsis-v" size="sm" />
                        </Button>
                        {activeDropdown === rowIndex && typeof document !== 'undefined' && createPortal(
                          <div
                            ref={dropdownRef}
                            className="actions-menu show"
                            style={{
                              position: 'fixed',
                              top: dropdownPosition.top,
                              left: dropdownPosition.left,
                              zIndex: 9999,
                              minWidth: '180px',
                            }}
                          >
                            {actions.map((action, actionIndex) => {
                              if (action.hidden && action.hidden(row)) return null;
                              
                              const iconName = typeof action.icon === 'function' ? action.icon(row) : action.icon;
                              const label = typeof action.label === 'function' ? action.label(row) : action.label;
                              const variant = typeof action.variant === 'function' ? action.variant(row) : action.variant;
                              
                              // Map FontAwesome class to Icon name
                              const getIconName = (faClass: string): string => {
                                if (!faClass) return 'circle';
                                const match = faClass.match(/fa-(\S+)/);
                                return match ? match[1] : 'circle';
                              };
                              
                              return (
                                <div
                                  key={actionIndex}
                                  className={`actions-menu-item ${variant === 'danger' ? 'danger' : ''} ${variant === 'warning' ? 'warning' : ''} ${variant === 'success' ? 'success' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAction(action, row);
                                  }}
                                >
                                  <Icon name={getIconName(iconName)} size="sm" />
                                  <span>{label}</span>
                                </div>
                              );
                            })}
                          </div>,
                          document.body
                        )}
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
                    <Icon name="inbox" size="lg" />
                    <h3>لا توجد بيانات</h3>
                    <p>لم يتم العثور على أي نتائج</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
              <Button
                variant="ghost"
                size="sm"
                className="pagination-btn"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                <Icon name="chevron-right" size="sm" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? 'primary' : 'ghost'}
                  size="sm"
                  className={`pagination-btn ${page === currentPage ? 'active' : ''}`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="pagination-btn"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                <Icon name="chevron-left" size="sm" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

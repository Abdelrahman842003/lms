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
    sm: { mobile: 'ux-block ux-sm-hidden', table: 'ux-hidden ux-sm-table' },
    md: { mobile: 'ux-block ux-md-hidden', table: 'ux-hidden ux-md-table' },
    lg: { mobile: 'ux-block ux-lg-hidden', table: 'ux-hidden ux-lg-table' },
    xl: { mobile: 'ux-block ux-xl-hidden', table: 'ux-hidden ux-xl-table' },
    '2xl': { mobile: 'ux-block ux-2xl-hidden', table: 'ux-hidden ux-2xl-table' },
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
        <div className="table-search ux-flex ux-flex-col ux-sm-flex-row ux-justify-between ux-items-center ux-gap-4 ux-mb-4">
          {searchable && (
            <div className="table-search-wrapper flex-1 relative group">
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-light group-focus-within:text-primary transition-colors">
                <Icon name="search" size="sm" />
              </div>
              <input
                type="text"
                className="w-full bg-white/5 border border-white/10 focus:border-primary/50 focus:bg-white/10 rounded-xl py-3 pr-11 pl-4 text-white placeholder:text-gray-light/50 outline-none transition-all"
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
        <div className={`${currentBreakpoint.mobile} ux-space-y-4`}>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="ux-bg-white-5 ux-rounded-xl ux-p-4 ux-animate-pulse">
                <div className="ux-h-6 ux-bg-white-10 ux-rounded ux-w-3-4 ux-mb-3"></div>
                <div className="ux-space-y-2">
                  <div className="ux-h-4 ux-bg-white-10 ux-rounded ux-w-1-2"></div>
                  <div className="ux-h-4 ux-bg-white-10 ux-rounded ux-w-2-3"></div>
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
      <div className="overflow-x-auto rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-md">
        <table className={`w-full text-right border-separate border-spacing-0 ${mobileRenderer ? currentBreakpoint.table : ''}`}>
          <thead>
            <tr className="bg-white/5">
              {columns.map((column) => (
                <th
                  className={`px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-light border-b border-white/10 ${column.sortable ? 'cursor-pointer hover:text-white' : ''} ${column.className || ''}`}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {column.sortable && sortColumn === column.key && (
                      <Icon
                        name={sortDirection === 'asc' ? 'sort-up' : 'sort-down'}
                        size="xs"
                        className="text-primary"
                      />
                    )}
                  </div>
                </th>
              ))}
              {actions && actions.length > 0 && <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-light border-b border-white/10">الإجراءات</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index}>
                  {columns.map((column, colIndex) => (
                    <td key={colIndex} className={column.className || ''}>
                      <div className="skeleton skeleton-item-table"></div>
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
                  className={`${rowClassName ? rowClassName(row) : ''} ${onRowClick ? 'ux-cursor-pointer ux-hover-bg-white-5 ux-transition-colors' : ''}`}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map((column) => (
                    <td key={column.key} className={`px-6 py-4 text-sm text-white border-b border-white/5 group-hover:bg-white/[0.02] transition-colors ${column.className || ''}`}>
                      {column.render
                        ? column.render(row[column.key], row, rowIndex)
                        : row[column.key]}
                    </td>
                  ))}
                  {actions && actions.length > 0 && (
                    <td className="px-6 py-4 border-b border-white/5 group-hover:bg-white/[0.02] transition-colors">
                      <div className="actions-dropdown">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-light hover:text-white hover:border-primary/50 transition-all"
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

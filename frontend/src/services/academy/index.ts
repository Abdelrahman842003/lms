/**
 * Academy Services Index
 * 
 * Re-exports all academy-related services for easy importing
 * This maintains backward compatibility while providing better organization
 */

// Dashboard services
export * from './dashboardService';

// Teachers management services  
export * from './teachersService';

// Secretaries management services
export * from './secretariesService';

// Grades management services
export * from './gradesService';

// Groups management services
export * from './groupsService';

// Attendance management services
export * from './attendanceService';

// Notifications management services
export * from './notificationsService';

// For better organization and easier imports
export * as Dashboard from './dashboardService';
export * as Teachers from './teachersService';
export * as Secretaries from './secretariesService';
export * as Grades from './gradesService';
export * as Groups from './groupsService';
export * as Attendance from './attendanceService';
export * as Notifications from './notificationsService';
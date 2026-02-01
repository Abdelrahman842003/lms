/**
 * Teacher Services Index
 * 
 * Re-exports all teacher-related services for easy importing
 * This maintains backward compatibility while providing better organization
 */

// Dashboard services
export * from './modules/dashboardService';

// Students management services  
export * from './modules/studentsService';

// Grades management services
export * from './modules/gradesService';

// Groups management services
export * from './modules/groupsService';

// Lectures management services
export * from './modules/lecturesService';

// For better organization and easier imports
export * as Dashboard from './modules/dashboardService';
export * as Students from './modules/studentsService';
export * as Grades from './modules/gradesService';
export * as Groups from './modules/groupsService';
export * as Lectures from './modules/lecturesService';
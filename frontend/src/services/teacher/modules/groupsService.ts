/**
 * Teacher Groups Module
 * Handles group management for teachers
 */

import { fetchApi } from '../../api/baseApi';
import type { Group, CreateGroupRequest } from '@/types/teacher.types';

/**
 * Get all groups for teacher
 */
export async function getGroups(): Promise<Group[]> {
  return await fetchApi('/teacher/groups');
}

/**
 * Get specific group details
 */
export async function getGroup(id: string): Promise<Group> {
  const res = await fetchApi<{ group: Group }>(`/teacher/groups/${id}`);
  return res.group;
}

/**
 * Create a new group
 */
export async function createGroup(data: CreateGroupRequest): Promise<Group> {
  const res = await fetchApi<{ group: Group }>('/teacher/groups', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.group;
}

/**
 * Update a group
 */
export async function updateGroup(id: string, data: Partial<CreateGroupRequest>): Promise<Group> {
  const res = await fetchApi<{ group: Group }>(`/teacher/groups/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.group;
}

/**
 * Delete a group
 */
export async function deleteGroup(id: string): Promise<unknown> {
  return await fetchApi(`/api/teacher/groups/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Get group students
 */
export async function getGroupStudents(id: string, page = 1, perPage = 10): Promise<{
  students: any[];
  total: number;
}> {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
  });
  return await fetchApi(`/api/teacher/groups/${id}/students?${params}`);
}

/**
 * Add student to group
 */
export async function addStudentToGroup(groupId: string, studentId: string): Promise<unknown> {
  return await fetchApi(`/api/teacher/groups/${groupId}/students`, {
    method: 'POST',
    body: JSON.stringify({ student_id: studentId }),
  });
}

/**
 * Remove student from group
 */
export async function removeStudentFromGroup(groupId: string, studentId: string): Promise<unknown> {
  return await fetchApi(`/api/teacher/groups/${groupId}/students/${studentId}`, {
    method: 'DELETE',
  });
}

/**
 * Get group statistics
 */
export async function getGroupStatistics(id: string): Promise<{
  total_students: number;
  active_students: number;
  average_attendance: number;
  total_lectures: number;
}> {
  return await fetchApi(`/api/teacher/groups/${id}/statistics`);
}
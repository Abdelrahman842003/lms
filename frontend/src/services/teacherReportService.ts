import { fetchApi } from './api/baseApi';
import type {
  TeacherReportOverview,
  TeacherDrilldownResponse,
  TeacherReportFilters,
} from '@/types/teacher-report.types';

function buildQueryString(filters?: TeacherReportFilters): string {
  if (!filters) return '';
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const fetchTeacherReportOverview = async (
  filters?: TeacherReportFilters,
): Promise<TeacherReportOverview> => {
  const endpoint = `/teacher/reports/overview${buildQueryString(filters)}`;
  return fetchApi<TeacherReportOverview>(endpoint);
};

export const fetchTeacherDrilldown = async (
  drilldownKey: string,
  page = 1,
  perPage = 15,
): Promise<TeacherDrilldownResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });
  return fetchApi<TeacherDrilldownResponse>(
    `/teacher/reports/drilldown/${drilldownKey}?${params.toString()}`,
  );
};

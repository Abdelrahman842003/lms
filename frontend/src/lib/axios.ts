/**
 * DEPRECATED: Axios-based HTTP Client
 *
 * ⚠️ MIGRATION NOTICE ⚠️
 *
 * This file is deprecated. Please migrate to the unified fetch-based API client.
 *
 * Migration Path:
 * - Old: `import axios from '@/lib/axios'`
 * - New: `import { fetchApi } from '@/services/api/baseApi'`
 *
 * Or use the typed API client:
 * - `import apiClient from '@/lib/apiClient'`
 *
 * Reasons for deprecation:
 * 1. Axios is an additional dependency (adds ~15KB to bundle)
 * 2. Native fetch is now supported in all modern browsers
 * 3. Unifying on a single implementation reduces maintenance burden
 * 4. The fetch-based client has equivalent features (interceptors, error handling, etc.)
 *
 * Timeline:
 * - Deprecated: 2026-03-11
 * - Removal target: 2026-06-11 (3 months grace period)
 *
 * For questions, contact the development team.
 */

import axios from 'axios';

/**
 * Deprecated: Do not use this export in new code
 * @deprecated Use fetchApi from '@/services/api/baseApi' instead
 */
export default axios;

/**
 * Helper to show deprecation warning when this module is imported
 */
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.warn(
    '[DEPRECATED] @/lib/axios is deprecated. ' +
    'Use fetchApi from @/services/api/baseApi or apiClient from @/lib/apiClient instead.'
  );
}

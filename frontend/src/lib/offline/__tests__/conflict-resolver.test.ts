import { conflictResolver, ConflictData } from '../conflict-resolver';

describe('ConflictResolver', () => {
  afterEach(() => {
    conflictResolver.unregisterConflictListener();
  });

  it('should auto-resolve to server for critical entities (payments, studentPoints, studentExams)', async () => {
    const mockConflict: ConflictData = {
      queueId: 'test-1',
      entityType: 'payments',
      entityId: 'id-1',
      localData: { amount: 100 },
      serverData: { amount: 200 },
      clientTimestamp: '2026-05-24T12:00:00Z',
      serverTimestamp: '2026-05-24T11:00:00Z',
    };

    const resolution = await conflictResolver.resolve(mockConflict);
    expect(resolution).toBe('server');
  });

  it('should auto-resolve to local if local timestamp is newer for non-critical entities (notes)', async () => {
    const mockConflict: ConflictData = {
      queueId: 'test-2',
      entityType: 'notes',
      entityId: 'id-2',
      localData: { text: 'New local text' },
      serverData: { text: 'Old server text' },
      clientTimestamp: '2026-05-24T12:00:00Z', // Local is newer
      serverTimestamp: '2026-05-24T11:00:00Z',
    };

    const resolution = await conflictResolver.resolve(mockConflict);
    expect(resolution).toBe('local');
  });

  it('should auto-resolve to server if server timestamp is newer for non-critical entities (notes)', async () => {
    const mockConflict: ConflictData = {
      queueId: 'test-3',
      entityType: 'notes',
      entityId: 'id-3',
      localData: { text: 'Old local text' },
      serverData: { text: 'New server text' },
      clientTimestamp: '2026-05-24T10:00:00Z',
      serverTimestamp: '2026-05-24T11:00:00Z', // Server is newer
    };

    const resolution = await conflictResolver.resolve(mockConflict);
    expect(resolution).toBe('server');
  });

  it('should call registered listener for manual resolution of other entities', async () => {
    const mockConflict: ConflictData = {
      queueId: 'test-4',
      entityType: 'lectures',
      entityId: 'id-4',
      localData: { title: 'Local Lecture' },
      serverData: { title: 'Server Lecture' },
      clientTimestamp: '2026-05-24T11:00:00Z',
      serverTimestamp: '2026-05-24T11:00:00Z',
    };

    const mockListener = jest.fn().mockResolvedValue('local');
    conflictResolver.registerConflictListener(mockListener);

    const resolution = await conflictResolver.resolve(mockConflict);
    expect(mockListener).toHaveBeenCalledWith(mockConflict);
    expect(resolution).toBe('local');
  });
});

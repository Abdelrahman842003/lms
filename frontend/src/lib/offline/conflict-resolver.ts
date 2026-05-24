export type ConflictResolution = 'local' | 'server';

export interface ConflictData {
  queueId: string;
  entityType: string;
  entityId: string;
  localData: any;
  serverData: any;
  clientTimestamp: string;
  serverTimestamp: string;
}

export type ConflictListener = (conflict: ConflictData) => Promise<ConflictResolution>;

class ConflictResolver {
  private listener: ConflictListener | null = null;

  registerConflictListener(listener: ConflictListener) {
    this.listener = listener;
  }

  unregisterConflictListener() {
    this.listener = null;
  }

  /**
   * Resolves a conflict according to configured policies or user input
   */
  async resolve(conflict: ConflictData): Promise<ConflictResolution> {
    const { entityType } = conflict;

    // 1. Automatic Server-Wins for critical security/financial transactions
    if (
      entityType === 'payments' ||
      entityType === 'studentPoints' ||
      entityType === 'studentExams'
    ) {
      console.warn(`[ConflictResolver] Auto-resolved to Server for critical entity: ${entityType}`);
      return 'server';
    }

    // 2. Automatic Last-Write-Wins (Timestamp comparisons) for simple records
    if (entityType === 'notes' || entityType === 'userProfile') {
      const localTime = new Date(conflict.clientTimestamp).getTime();
      const serverTime = new Date(conflict.serverTimestamp).getTime();
      
      const choice = localTime > serverTime ? 'local' : 'server';
      console.log(`[ConflictResolver] Auto-resolved by timestamp for ${entityType}: ${choice}`);
      return choice;
    }

    // 3. Manual Resolution callback if registered, else fallback to Server-Wins safely
    if (this.listener) {
      try {
        return await this.listener(conflict);
      } catch (err) {
        console.error('[ConflictResolver] Error during manual conflict resolution callback:', err);
      }
    }

    // Default fallback: Server wins to maintain database consistency
    console.warn(`[ConflictResolver] Defaulting to Server-Wins for: ${entityType}`);
    return 'server';
  }
}

export const conflictResolver = new ConflictResolver();

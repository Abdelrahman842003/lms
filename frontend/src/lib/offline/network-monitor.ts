export type NetworkCallback = (isOnline: boolean) => void;

class NetworkMonitor {
  private listeners: Set<NetworkCallback> = new Set();
  private onlineStatus: boolean = true;
  private pingIntervalId: any = null;
  private pingUrl: string = '/manifest.json';

  constructor() {
    if (typeof window === 'undefined') return;

    this.onlineStatus = navigator.onLine;

    window.addEventListener('online', this.handleOnlineEvent);
    window.addEventListener('offline', this.handleOfflineEvent);

    // Periodic ping to verify actual connection (every 30 seconds)
    this.pingIntervalId = setInterval(() => {
      this.verifyConnection();
    }, 30000);

    // Initial check
    this.verifyConnection();
  }

  get isOnline(): boolean {
    return this.onlineStatus;
  }

  addListener(callback: NetworkCallback) {
    this.listeners.add(callback);
    callback(this.onlineStatus);
  }

  removeListener(callback: NetworkCallback) {
    this.listeners.delete(callback);
  }

  private notifyAll() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.onlineStatus);
      } catch (e) {
        console.error('Error in network listener callback:', e);
      }
    });
  }

  private handleOnlineEvent = () => {
    this.verifyConnection();
  };

  private handleOfflineEvent = () => {
    this.updateStatus(false);
  };

  private updateStatus(newStatus: boolean) {
    if (this.onlineStatus !== newStatus) {
      this.onlineStatus = newStatus;
      this.notifyAll();
    }
  }

  async verifyConnection(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    if (!navigator.onLine) {
      this.updateStatus(false);
      return false;
    }

    try {
      // Fetch with a short timeout to prevent hanging on slow network
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${this.pingUrl}?t=${Date.now()}`, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-store',
      });
      
      clearTimeout(timeoutId);
      // If fetch didn't throw, the server is reachable regardless of HTTP status
      const isActuallyOnline = true;
      
      this.updateStatus(isActuallyOnline);
      return isActuallyOnline;
    } catch (e) {
      this.updateStatus(false);
      return false;
    }
  }

  destroy() {
    if (typeof window === 'undefined') return;
    window.removeEventListener('online', this.handleOnlineEvent);
    window.removeEventListener('offline', this.handleOfflineEvent);
    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId);
    }
    this.listeners.clear();
  }
}

export const networkMonitor = new NetworkMonitor();

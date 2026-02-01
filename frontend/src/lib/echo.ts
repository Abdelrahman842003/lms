import Echo from "laravel-echo";
import Pusher from "pusher-js";

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo<"reverb">;
  }
}

let echoInstance: Echo<"reverb"> | null = null;

/**
 * Initialize Laravel Echo with Reverb
 * @param token - API Bearer token for authentication
 */
export const initializeEcho = (token: string): Echo<"reverb"> => {
  if (typeof window === "undefined") {
    throw new Error("Echo can only be initialized on the client side");
  }

  // If already initialized and connected, return existing instance
  if (echoInstance) {
    return echoInstance;
  }

  window.Pusher = Pusher;

  if (process.env.NODE_ENV === "development") {
    // Disable Pusher logging to avoid 403 errors spamming the console when suspended
    Pusher.logToConsole = false;
  }

  // Production environment check
  process.env.NODE_ENV === "production";

  // Clean base URL - remove trailing /api or / to avoid duplication
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000")
    .replace(/\/api\/?$/, "")
    .replace(/\/$/, "");

  echoInstance = new Echo({
    broadcaster: "reverb",
    key: process.env.NEXT_PUBLIC_REVERB_APP_KEY || 'y2vqna5uho5zsdz6kdyz',
    wsHost: 'localhost',
    wsPort: 8080,
    wssPort: 8080,
    forceTLS: false,
    enabledTransports: ["ws", "wss"],
    authEndpoint: `${baseUrl}/api/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    },
  });

  window.Echo = echoInstance;

  return echoInstance;
};

export const getEcho = (): Echo<"reverb"> | null => {
  return echoInstance;
};

export const disconnectEcho = (): void => {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
  }
};

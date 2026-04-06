import Echo from "laravel-echo";
import Pusher from "pusher-js";

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo<"reverb">;
  }
}

let echoInstance: Echo<"reverb"> | null = null;
let echoToken: string | null = null;

/**
 * Initialize Laravel Echo with Reverb
 * @param token - API Bearer token for authentication
 */
export const initializeEcho = (token: string): Echo<"reverb"> => {
  if (typeof window === "undefined") {
    throw new Error("Echo can only be initialized on the client side");
  }

  // Reuse existing instance only when token is unchanged
  if (echoInstance && echoToken === token) {
    return echoInstance;
  }

  // If token changed, reconnect with fresh auth headers
  if (echoInstance && echoToken !== token) {
    echoInstance.disconnect();
    echoInstance = null;
  }

  window.Pusher = Pusher;

  if (process.env.NODE_ENV === "development") {
    // Disable Pusher logging to avoid 403 errors spamming the console when suspended
    Pusher.logToConsole = false;
  }

  // Clean base URL - remove trailing /api or / to avoid duplication
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000")
    .replace(/\/api\/?$/, "")
    .replace(/\/$/, "");

  const configuredHost = process.env.NEXT_PUBLIC_REVERB_HOST?.trim();
  const configuredScheme = process.env.NEXT_PUBLIC_REVERB_SCHEME?.trim();
  const configuredPort = Number(process.env.NEXT_PUBLIC_REVERB_PORT);

  const windowHost = window.location.hostname;
  const shouldUseWindowHost = !configuredHost || configuredHost === 'localhost' || configuredHost === '127.0.0.1';
  const wsHost = shouldUseWindowHost ? windowHost : configuredHost;

  const resolvedScheme = configuredScheme || (window.location.protocol === 'https:' ? 'https' : 'http');
  const forceTLS = resolvedScheme === 'https';
  const defaultPort = forceTLS ? 443 : 8080;
  const wsPort = Number.isFinite(configuredPort) && configuredPort > 0 ? configuredPort : defaultPort;

  echoInstance = new Echo({
    broadcaster: "reverb",
    key: process.env.NEXT_PUBLIC_REVERB_APP_KEY || 'y2vqna5uho5zsdz6kdyz',
    wsHost,
    wsPort,
    wssPort: wsPort,
    forceTLS,
    enabledTransports: ["ws", "wss"],
    authEndpoint: `${baseUrl}/api/v1/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    },
  });

  window.Echo = echoInstance;
  echoToken = token;

  return echoInstance;
};

export const getEcho = (): Echo<"reverb"> | null => {
  return echoInstance;
};

export const disconnectEcho = (): void => {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
    echoToken = null;
  }
};

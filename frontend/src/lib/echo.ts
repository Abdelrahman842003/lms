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
    Pusher.logToConsole = true;
  }

  const isProduction = process.env.NODE_ENV === "production";

  echoInstance = new Echo({
    broadcaster: "reverb",
    key: process.env.NEXT_PUBLIC_REVERB_APP_KEY,
    wsHost: process.env.NEXT_PUBLIC_REVERB_HOST,
    // Production: use 443 (Nginx), Development: use 8080 direct
    wsPort: isProduction ? 443 : parseInt(process.env.NEXT_PUBLIC_REVERB_PORT || "8080"),
    wssPort: isProduction ? 443 : parseInt(process.env.NEXT_PUBLIC_REVERB_PORT || "443"),
    forceTLS: isProduction,
    enabledTransports: ["ws", "wss"],
    authEndpoint: `${process.env.NEXT_PUBLIC_API_URL}/api/broadcasting/auth`,
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

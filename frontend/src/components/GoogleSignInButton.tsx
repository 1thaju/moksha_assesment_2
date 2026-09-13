import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;

/**
 * Renders Google's own Sign-In button (via Google Identity Services' hosted
 * script) and, on success, sends the resulting ID token to our backend's
 * /auth/google/login endpoint to be verified and exchanged for our session JWT.
 *
 * We never handle the user's Google password or verify the token ourselves
 * client-side — that verification happens server-side, which is the actual
 * security boundary (see app/services/google_auth.py).
 */
export function GoogleSignInButton() {
  const buttonRef = useRef<HTMLDivElement>(null);
  const { loginWithGoogleIdToken } = useAuth();

  useEffect(() => {
    const scriptId = "google-identity-services";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = renderButton;
      document.body.appendChild(script);
    } else {
      renderButton();
    }

    function renderButton() {
      if (!window.google || !buttonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          await loginWithGoogleIdToken(response.credential);
        },
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        shape: "pill",
      });
    }
  }, [loginWithGoogleIdToken]);

  return <div ref={buttonRef} />;
}

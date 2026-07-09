import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Mode = "loading" | "signed_out" | "guest" | "authenticated";

type AuthContextValue = {
  mode: Mode;
  user: User | null;
  session: Session | null;
  displayName: string;
  isGuest: boolean;
  isAuthenticated: boolean;
  enterGuest: () => void;
  exitGuest: () => void;
  signOut: () => Promise<void>;
};

const GUEST_KEY = "momentum_guest_mode";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [guest, setGuest] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        try {
          localStorage.removeItem(GUEST_KEY);
        } catch {}
        setGuest(false);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      try {
        setGuest(localStorage.getItem(GUEST_KEY) === "1");
      } catch {}
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const mode: Mode = !ready
    ? "loading"
    : user
      ? "authenticated"
      : guest
        ? "guest"
        : "signed_out";

  const displayName = user
    ? (user.user_metadata?.display_name as string) ||
      (user.user_metadata?.full_name as string) ||
      user.email?.split("@")[0] ||
      "Member"
    : "Guest User";

  return (
    <AuthContext.Provider
      value={{
        mode,
        user,
        session,
        displayName,
        isGuest: mode === "guest",
        isAuthenticated: mode === "authenticated",
        enterGuest: () => {
          try {
            localStorage.setItem(GUEST_KEY, "1");
          } catch {}
          setGuest(true);
        },
        exitGuest: () => {
          try {
            localStorage.removeItem(GUEST_KEY);
          } catch {}
          setGuest(false);
        },
        signOut: async () => {
          await supabase.auth.signOut();
          try {
            localStorage.removeItem(GUEST_KEY);
          } catch {}
          setGuest(false);
          setUser(null);
          setSession(null);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export interface AuthProfile {
  id: string;
  full_name: string;
  username: string | null;
  role: { name: string } | null;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: AuthProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchProfile(userId: string): Promise<AuthProfile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("full_name, username, role:roles(name)")
    .eq("id", userId)
    .single();
  if (!data) return null;
  return { id: userId, ...(data as any) } as AuthProfile;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session) {
        setProfile(await fetchProfile(session.user.id));
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        setProfile(await fetchProfile(session.user.id));
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function refreshProfile() {
    const s = session ?? (await supabase.auth.getSession()).data.session;
    if (s) setProfile(await fetchProfile(s.user.id));
  }

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, profile, loading, signOut, refreshProfile }}
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

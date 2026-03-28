import { createContext, useContext, useState, useEffect } from "react"
import type { ReactNode } from "react"
import { supabase } from "@/lib/supabase"

// Basic client-side hashing using Web Crypto API to avoid plaintext passwords
async function hashPassword(password: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

interface AuthContextType {
  user: any;
  signUp: (name: string, email: string, password: string) => Promise<{ error: string | null; data?: any }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null; data?: any }>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(() => {
    const stored = localStorage.getItem('expense_tracker_user')
    return stored ? JSON.parse(stored) : null
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('expense_tracker_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('expense_tracker_user')
    }
  }, [user]);

  const signOut = () => {
    setUser(null);
  }

  const signUp = async (name: string, email: string, password: string) => {
    try {
      const hashedPassword = await hashPassword(password);

      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();
        
      if (existingUser) {
        return { error: 'An account with this email already exists.' };
      }

      // Insert the new user to our custom users table
      const { data, error } = await supabase
        .from('users')
        .insert([{ name, email, password: hashedPassword }])
        .select()
        .single();

      if (error) {
         console.error('Supabase Insert Error:', error);
         return { error: error.message };
      }
      
      setUser(data);
      return { error: null, data };
    } catch (err: any) {
      console.error('Error during sign up:', err);
      return { error: err.message };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const hashedPassword = await hashPassword(password);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password', hashedPassword)
        .maybeSingle();

      if (error) {
        console.error('Supabase Query Error:', error);
        return { error: error.message };
      }

      if (!data) {
        return { error: 'Invalid email or password.' };
      }

      setUser(data);
      return { error: null, data };
    } catch (err: any) {
      console.error('Error during sign in:', err);
      return { error: err.message };
    }
  };

  return (
    <AuthContext.Provider value={{ user, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

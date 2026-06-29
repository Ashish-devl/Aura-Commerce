import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  loginWithGoogle: (selectedRole?: 'admin' | 'customer') => Promise<void>;
  signUpWithEmail: (email: string, pass: string, role: 'admin' | 'customer') => Promise<void>;
  loginWithEmail: (email: string, pass: string, expectedRole?: 'admin' | 'customer') => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  loginWithGoogle: async () => {},
  signUpWithEmail: async () => {},
  loginWithEmail: async () => {},
  logout: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (currentUser: User) => {
    try {
      const docRef = doc(db, 'users', currentUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (currentUser.email === 'ashishgupta75080@gmail.com' && data.role !== 'admin') {
          await setDoc(docRef, { role: 'admin' }, { merge: true });
          setProfile({ id: docSnap.id, ...data, role: 'admin' } as UserProfile);
        } else {
          setProfile({ id: docSnap.id, ...data } as UserProfile);
        }
      } else {
        setProfile(null);
      }
    } catch (e) {
      console.error("Error fetching profile", e);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (current) => {
      setUser(current);
      if (current) {
        await fetchProfile(current);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const loginWithGoogle = async (selectedRole: 'admin' | 'customer' = 'customer') => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      
      // Check if user exists in Firestore
      const docRef = doc(db, 'users', result.user.uid);
      const docSnap = await getDoc(docRef);
      
      const isAdmin = result.user.email === 'ashishgupta75080@gmail.com';
      const finalRole = isAdmin ? 'admin' : selectedRole;
      
      if (!docSnap.exists()) {
        const newProfile: Omit<UserProfile, 'id'> = {
          email: result.user.email || '',
          role: finalRole,
          wishlist: [],
          createdAt: Date.now()
        };
        await setDoc(docRef, newProfile);
        setProfile({ id: result.user.uid, ...newProfile });
      } else {
        const data = docSnap.data();
        if (isAdmin && data.role !== 'admin') {
          await setDoc(docRef, { role: 'admin' }, { merge: true });
          setProfile({ id: docSnap.id, ...data, role: 'admin' } as UserProfile);
        } else {
          setProfile({ id: docSnap.id, ...data } as UserProfile);
        }
      }
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        // Silently ignore user closing the sign-in popup
        return;
      }
      console.error("Login failed:", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, role: 'admin' | 'customer') => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      const docRef = doc(db, 'users', result.user.uid);
      
      const isAdmin = email === 'ashishgupta75080@gmail.com';
      const finalRole = isAdmin ? 'admin' : role;

      const newProfile: Omit<UserProfile, 'id'> = {
        email: email,
        role: finalRole,
        wishlist: [],
        createdAt: Date.now()
      };
      await setDoc(docRef, newProfile);
      setProfile({ id: result.user.uid, ...newProfile });
    } catch (error: any) {
      console.error("Sign up failed:", error);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, pass: string, expectedRole?: 'admin' | 'customer') => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, pass);
      
      // Fetch profile and verify role if expectedRole is passed
      const docRef = doc(db, 'users', result.user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const role = data.role;
        
        // If user is Ashish, auto upgrade to admin
        const isAdmin = email === 'ashishgupta75080@gmail.com';
        const finalRole = isAdmin ? 'admin' : role;

        if (isAdmin && role !== 'admin') {
          await setDoc(docRef, { role: 'admin' }, { merge: true });
        }

        if (expectedRole && finalRole !== expectedRole) {
          throw new Error(`Access Denied: This account is registered as a ${finalRole}, not an ${expectedRole}.`);
        }
        
        setProfile({ id: docSnap.id, ...data, role: finalRole } as UserProfile);
      } else {
        // If profile doesn't exist but auth does, create a default profile
        const finalRole = expectedRole || 'customer';
        const newProfile: Omit<UserProfile, 'id'> = {
          email: email,
          role: finalRole,
          wishlist: [],
          createdAt: Date.now()
        };
        await setDoc(docRef, newProfile);
        setProfile({ id: result.user.uid, ...newProfile });
      }
    } catch (error: any) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      loginWithGoogle, 
      signUpWithEmail,
      loginWithEmail,
      logout, 
      refreshProfile: async () => { if(user) await fetchProfile(user) } 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

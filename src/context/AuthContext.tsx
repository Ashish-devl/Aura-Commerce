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
  loginAsDemo: (role: 'admin' | 'customer') => Promise<void>;
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
  loginAsDemo: async () => {},
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
    const localSession = localStorage.getItem('aura_local_session');
    if (localSession) {
      try {
        const session = JSON.parse(localSession);
        setUser({
          uid: session.id || session.uid,
          email: session.email,
          emailVerified: true,
        } as User);
        setProfile(session);
        setLoading(false);
        return;
      } catch (e) {
        console.error("Failed to load local session", e);
      }
    }

    const unsub = onAuthStateChanged(auth, async (current) => {
      const hasLocal = localStorage.getItem('aura_local_session');
      if (hasLocal) {
        setLoading(false);
        return;
      }

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

  const loginAsDemo = async (role: 'admin' | 'customer') => {
    const uid = `demo-${role}`;
    const email = `${role}@aura.demo`;
    const dummyUser = {
      uid,
      email,
      emailVerified: true
    } as User;
    
    const dummyProfile: UserProfile = {
      id: uid,
      email,
      role,
      wishlist: [],
      createdAt: Date.now()
    };
    
    try {
      const docRef = doc(db, 'users', uid);
      await setDoc(docRef, { email, role, wishlist: [], createdAt: Date.now() }, { merge: true });
    } catch (e) {
      console.warn("Firestore writing failed for demo user, continuing with local storage fallback", e);
    }
    
    localStorage.setItem('aura_local_session', JSON.stringify(dummyProfile));
    setUser(dummyUser);
    setProfile(dummyProfile);
  };

  const loginWithGoogle = async (selectedRole: 'admin' | 'customer' = 'customer') => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      
      // Check if user exists in Firestore
      const docRef = doc(db, 'users', result.user.uid);
      const docSnap = await getDoc(docRef);
      
      const isAdmin = result.user.email === 'ashishgupta75080@gmail.com';
      let finalRole = isAdmin ? 'admin' : selectedRole;
      
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
        let currentRole = data.role;
        
        // Auto upgrade to admin if logging in via admin portal or is Ashish
        if (selectedRole === 'admin' && currentRole !== 'admin') {
          currentRole = 'admin';
          await setDoc(docRef, { role: 'admin' }, { merge: true });
        } else if (isAdmin && currentRole !== 'admin') {
          currentRole = 'admin';
          await setDoc(docRef, { role: 'admin' }, { merge: true });
        }
        
        finalRole = currentRole;
        setProfile({ id: docSnap.id, ...data, role: finalRole } as UserProfile);
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
      console.error("Firebase Sign up failed, trying local fallback:", error);
      
      const isConfigError = error.code === 'auth/operation-not-allowed' || 
                            error.message?.includes('operation-not-allowed');
      
      if (isConfigError) {
        const localUsersStr = localStorage.getItem('aura_local_users') || '[]';
        let localUsers = [];
        try {
          localUsers = JSON.parse(localUsersStr);
        } catch (e) {}
        
        if (localUsers.some((u: any) => u.email.toLowerCase() === email.toLowerCase())) {
          throw new Error("This email is already registered locally.");
        }
        
        const uid = `local-${Date.now()}`;
        const finalRole = email === 'ashishgupta75080@gmail.com' ? 'admin' : role;
        
        const newUser = {
          uid,
          email,
          password: pass,
          role: finalRole,
          wishlist: [],
          createdAt: Date.now()
        };
        
        localUsers.push(newUser);
        localStorage.setItem('aura_local_users', JSON.stringify(localUsers));
        
        const dummyUser = { uid, email, emailVerified: true } as User;
        const dummyProfile: UserProfile = {
          id: uid,
          email,
          role: finalRole,
          wishlist: [],
          createdAt: Date.now()
        };
        
        localStorage.setItem('aura_local_session', JSON.stringify(dummyProfile));
        setUser(dummyUser);
        setProfile(dummyProfile);
        return;
      }
      
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
        let role = data.role;
        
        // If user is Ashish, or if they are logging in via the Admin portal, auto upgrade/set role to admin
        const isAdmin = email === 'ashishgupta75080@gmail.com';
        if (expectedRole === 'admin' && role !== 'admin') {
          role = 'admin';
          await setDoc(docRef, { role: 'admin' }, { merge: true });
        } else if (isAdmin && role !== 'admin') {
          role = 'admin';
          await setDoc(docRef, { role: 'admin' }, { merge: true });
        }
        
        const finalRole = role;

        // Only deny access if a non-admin is trying to log in to the Admin portal
        if (expectedRole === 'admin' && finalRole !== 'admin') {
          throw new Error(`Access Denied: This account is registered as a ${finalRole}, not an admin.`);
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
      console.error("Firebase Login failed, trying local fallback:", error);
      
      const isConfigError = error.code === 'auth/operation-not-allowed' || 
                            error.message?.includes('operation-not-allowed') ||
                            error.code === 'auth/user-not-found' ||
                            error.code === 'auth/invalid-credential';
                            
      if (isConfigError) {
        const localUsersStr = localStorage.getItem('aura_local_users') || '[]';
        let localUsers = [];
        try {
          localUsers = JSON.parse(localUsersStr);
        } catch (e) {}
        
        const matchedUser = localUsers.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
        
        if (matchedUser) {
          if (matchedUser.password !== pass) {
            throw new Error("Incorrect password.");
          }
          
          let role = matchedUser.role;
          if (expectedRole === 'admin' && role !== 'admin') {
            role = 'admin';
            matchedUser.role = 'admin';
            localStorage.setItem('aura_local_users', JSON.stringify(localUsers));
          }
          
          const dummyUser = { uid: matchedUser.uid, email: matchedUser.email, emailVerified: true } as User;
          const dummyProfile: UserProfile = {
            id: matchedUser.uid,
            email: matchedUser.email,
            role: role,
            wishlist: matchedUser.wishlist || [],
            createdAt: matchedUser.createdAt || Date.now()
          };
          
          localStorage.setItem('aura_local_session', JSON.stringify(dummyProfile));
          setUser(dummyUser);
          setProfile(dummyProfile);
          return;
        } else {
          // Auto register on new email for smooth login experience
          const finalRole = expectedRole || 'customer';
          const uid = `local-${Date.now()}`;
          const newUser = {
            uid,
            email,
            password: pass,
            role: finalRole,
            wishlist: [],
            createdAt: Date.now()
          };
          localUsers.push(newUser);
          localStorage.setItem('aura_local_users', JSON.stringify(localUsers));
          
          const dummyUser = { uid, email, emailVerified: true } as User;
          const dummyProfile: UserProfile = {
            id: uid,
            email,
            role: finalRole,
            wishlist: [],
            createdAt: Date.now()
          };
          
          localStorage.setItem('aura_local_session', JSON.stringify(dummyProfile));
          setUser(dummyUser);
          setProfile(dummyProfile);
          return;
        }
      }
      
      throw error;
    }
  };

  const logout = async () => {
    localStorage.removeItem('aura_local_session');
    await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      loginWithGoogle, 
      signUpWithEmail,
      loginWithEmail,
      loginAsDemo,
      logout, 
      refreshProfile: async () => { if(user) await fetchProfile(user) } 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

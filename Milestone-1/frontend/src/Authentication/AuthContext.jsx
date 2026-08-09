import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        try {
          const snapshot = await getDoc(doc(db, "users", user.uid));
          const firestoreData = snapshot.exists() ? snapshot.data() : {};

          setUserData({
            uid: user.uid,
            name: firestoreData.name || user.displayName || "",
            email: firestoreData.email || user.email,
            photoURL: user.photoURL || "",
            provider: user.providerData?.[0]?.providerId || "password",
            role: firestoreData.role || "viewer",
          });
        } catch (error) {
          console.error("Unable to load user role:", error);
          setUserData({
            uid: user.uid,
            name: user.displayName || "",
            email: user.email,
            photoURL: user.photoURL || "",
            provider: user.providerData?.[0]?.providerId || "password",
            role: "viewer",
          });
        }
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = { currentUser, userData, loading };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

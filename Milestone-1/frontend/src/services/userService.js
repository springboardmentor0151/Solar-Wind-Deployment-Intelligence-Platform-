import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import {
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";

import { db } from "../Authentication/firebase";

// Get a user's Firestore profile document
export const getUserProfile = async (uid) => {
  const snapshot = await getDoc(doc(db, "users", uid));

  if (!snapshot.exists()) {
    return null;
  }

  return { id: snapshot.id, ...snapshot.data() };
};

// Update display name — syncs both Firebase Auth and the Firestore "users" doc
export const updateDisplayName = async (currentUser, name) => {
  await updateProfile(currentUser, { displayName: name });

  await setDoc(
    doc(db, "users", currentUser.uid),
    {
      name,
      email: currentUser.email,
      photoURL: currentUser.photoURL || null,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

// Change password — requires re-authentication with the current password
export const changeUserPassword = async (currentUser, currentPassword, newPassword) => {
  const credential = EmailAuthProvider.credential(
    currentUser.email,
    currentPassword
  );

  await reauthenticateWithCredential(currentUser, credential);
  await updatePassword(currentUser, newPassword);
};

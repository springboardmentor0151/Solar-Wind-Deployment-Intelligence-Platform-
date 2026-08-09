import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

import { auth, googleProvider, db } from "./firebase";

// ===============================
// Register User
// ===============================

export const registerUser = async (
  name,
  email,
  password,
  role
) => {
  try {
    const userCredential =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

    const user = userCredential.user;

    await updateProfile(user, {
      displayName: name,
    });

    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      name: name,
      email: email,
      role: role,
      createdAt: serverTimestamp(),
    });

    return user;

  } catch (error) {
    console.error(
      "Register Error:",
      error.message
    );

    throw error;
  }
};


// ===============================
// Login User
// ===============================

export const loginUser = async (
  email,
  password
) => {
  try {

    const userCredential =
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

    return userCredential.user;

  } catch (error) {

    console.error(
      "Login Error:",
      error.message
    );

    throw error;
  }
};


// ===============================
// Get User Role
// ===============================

export const getUserRole = async (uid) => {

  try {

    const userRef = doc(
      db,
      "users",
      uid
    );

    const userSnapshot =
      await getDoc(userRef);

    if (userSnapshot.exists()) {

      return userSnapshot.data().role;

    }

    return null;

  } catch (error) {

    console.error(
      "Get Role Error:",
      error.message
    );

    throw error;
  }
};


// ===============================
// Google Sign In
// ===============================

export const googleLogin = async () => {

  try {

    const result =
      await signInWithPopup(
        auth,
        googleProvider
      );

    const user = result.user;

    const userRef = doc(
      db,
      "users",
      user.uid
    );

    const userSnapshot =
      await getDoc(userRef);

    if (!userSnapshot.exists()) {

      await setDoc(userRef, {

        uid: user.uid,

        name:
          user.displayName ||
          "Google User",

        email: user.email,

        role: "planner",

        createdAt:
          serverTimestamp(),

      });

    }

    return user;

  } catch (error) {

    console.error(
      "Google Login Error:",
      error.message
    );

    throw error;
  }
};


// ===============================
// Logout
// ===============================

export const logoutUser = async () => {

  try {

    await signOut(auth);

  } catch (error) {

    console.error(
      "Logout Error:",
      error.message
    );

    throw error;
  }
};


// ===============================
// Forgot Password
// ===============================

export const resetPassword = async (
  email
) => {

  try {

    await sendPasswordResetEmail(
      auth,
      email
    );

  } catch (error) {

    console.error(
      "Password Reset Error:",
      error.message
    );

    throw error;
  }
};
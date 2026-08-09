import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  where,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../Authentication/firebase";

const projectsRef = collection(db, "projects");

// Create a new project
export const createProject = async (projectData) => {
  const docRef = await addDoc(projectsRef, {
    ...projectData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
};

// Get all projects
export const getProjects = async () => {
  const q = query(projectsRef, orderBy("createdAt", "desc"));

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
};

// Get a single project by id
export const getProject = async (projectId) => {
  const snapshot = await getDoc(doc(db, "projects", projectId));

  if (!snapshot.exists()) {
    throw new Error("Project not found");
  }

  return { id: snapshot.id, ...snapshot.data() };
};

// Update an existing project
export const updateProject = async (projectId, updates) => {
  await updateDoc(doc(db, "projects", projectId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

// Delete a project
export const deleteProject = async (projectId) => {
  await deleteDoc(doc(db, "projects", projectId));
};

// Get projects created by a specific user (optional filter, used by dashboards)
export const getProjectsByUser = async (userEmail) => {
  const q = query(
    projectsRef,
    where("createdBy", "==", userEmail),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
};

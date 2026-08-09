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

const sitesRef = collection(db, "sites");

// Create a new site under a project
export const createSite = async (siteData) => {
  const docRef = await addDoc(sitesRef, {
    ...siteData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
};

// Get all sites (optionally filtered by projectId)
export const getSites = async (projectId = null) => {
  const q = projectId
    ? query(
        sitesRef,
        where("projectId", "==", projectId),
        orderBy("createdAt", "desc")
      )
    : query(sitesRef, orderBy("createdAt", "desc"));

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
};

// Get a single site by id
export const getSite = async (siteId) => {
  const snapshot = await getDoc(doc(db, "sites", siteId));

  if (!snapshot.exists()) {
    throw new Error("Site not found");
  }

  return { id: snapshot.id, ...snapshot.data() };
};

// Update a site
export const updateSite = async (siteId, updates) => {
  await updateDoc(doc(db, "sites", siteId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

// Delete a site
export const deleteSite = async (siteId) => {
  await deleteDoc(doc(db, "sites", siteId));
};

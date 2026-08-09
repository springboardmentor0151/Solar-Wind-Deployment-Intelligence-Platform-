import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  where,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../Authentication/firebase";

const reportsRef = collection(db, "reports");

// Create a report (used for both "site-analysis" results and "summary" reports)
// type: "site-analysis" | "summary"
export const createReport = async (reportData) => {
  const docRef = await addDoc(reportsRef, {
    ...reportData,
    createdAt: serverTimestamp(),
  });

  return docRef.id;
};

// Get all reports (optionally filtered by projectId)
export const getReports = async (projectId = null) => {
  const q = projectId
    ? query(
        reportsRef,
        where("projectId", "==", projectId),
        orderBy("createdAt", "desc")
      )
    : query(reportsRef, orderBy("createdAt", "desc"));

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
};

// Get a single report
export const getReport = async (reportId) => {
  const snapshot = await getDoc(doc(db, "reports", reportId));

  if (!snapshot.exists()) {
    throw new Error("Report not found");
  }

  return { id: snapshot.id, ...snapshot.data() };
};

// Delete a report
export const deleteReport = async (reportId) => {
  await deleteDoc(doc(db, "reports", reportId));
};

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../config/firebase'

const COL = 'projects'

export async function createProject(userId, data) {
  return addDoc(collection(db, COL), {
    ...data,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateProject(id, data) {
  return updateDoc(doc(db, COL, id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteProject(id) {
  return deleteDoc(doc(db, COL, id))
}

export async function getProjects(userId) {
  const q = query(
    collection(db, COL),
    where('userId', '==', userId)
  )
  const snap = await getDocs(q)
  const projects = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  // Ordenar por createdAt en JavaScript (más reciente primero)
  return projects.sort((a, b) => {
    const timeA = a.createdAt?.toMillis?.() || 0
    const timeB = b.createdAt?.toMillis?.() || 0
    return timeB - timeA
  })
}

export async function getProject(id) {
  const snap = await getDoc(doc(db, COL, id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}
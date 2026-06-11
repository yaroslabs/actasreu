import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../config/firebase'

const COL = 'agreements'

export async function createAgreement(userId, data) {
  return addDoc(collection(db, COL), {
    ...data,
    userId,
    status: data.status || 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateAgreement(id, data) {
  return updateDoc(doc(db, COL, id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteAgreement(id) {
  return deleteDoc(doc(db, COL, id))
}

export async function getAgreementsByProject(projectId) {
  const q = query(
    collection(db, COL),
    where('projectId', '==', projectId)
  )
  const snap = await getDocs(q)
  const agreements = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  // Ordenar por createdAt en JavaScript (más reciente primero)
  return agreements.sort((a, b) => {
    const timeA = a.createdAt?.toMillis?.() || 0
    const timeB = b.createdAt?.toMillis?.() || 0
    return timeB - timeA
  })
}

export async function getAgreementsByMeeting(meetingId) {
  const q = query(
    collection(db, COL),
    where('meetingId', '==', meetingId)
  )
  const snap = await getDocs(q)
  const agreements = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  // Ordenar por createdAt en JavaScript (más reciente primero)
  return agreements.sort((a, b) => {
    const timeA = a.createdAt?.toMillis?.() || 0
    const timeB = b.createdAt?.toMillis?.() || 0
    return timeB - timeA
  })
}

export async function getAgreements(userId) {
  const q = query(
    collection(db, COL),
    where('userId', '==', userId)
  )
  const snap = await getDocs(q)
  const agreements = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  // Ordenar por createdAt en JavaScript (más reciente primero)
  return agreements.sort((a, b) => {
    const timeA = a.createdAt?.toMillis?.() || 0
    const timeB = b.createdAt?.toMillis?.() || 0
    return timeB - timeA
  })
}

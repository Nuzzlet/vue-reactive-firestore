import type { CollectionReference, DocumentData, DocumentReference, DocumentSnapshot, Query, QueryDocumentSnapshot, QuerySnapshot } from 'firebase/firestore'
import { onSnapshot } from 'firebase/firestore'
import type { Ref } from 'vue'
import { isRef, ref, watch } from 'vue'

// Generic Param Extraction
type extractQuery<P> = P extends Query<infer Q> ? Q : never
type extractDoc<P> = P extends DocumentReference<infer Q> ? Q : never
type extractCollection<P> = P extends CollectionReference<infer Q> ? Q : never
type extractRef<P> = P extends Ref<infer Q> ? Q : never

// Document
function reactiveFirestore<Q extends DocumentReference, T extends (sp: DocumentSnapshot<extractDoc<Q>>) => unknown = (sp: DocumentSnapshot<extractDoc<Q>>) => extractDoc<Q>>(q: Q, t?: T): Ref<ReturnType<T>>
function reactiveFirestore<Q extends Ref<DocumentReference | undefined>, T extends (sp: DocumentSnapshot<extractDoc<extractRef<Q>>>) => unknown = (sp: DocumentSnapshot<extractDoc<extractRef<Q>>>) => extractDoc<extractRef<Q>>>(q: Q, t?: T): Ref<ReturnType<T>>
// Collection
function reactiveFirestore<Q extends CollectionReference, T extends (sp: QuerySnapshot<extractCollection<Q>>) => unknown = (sp: QuerySnapshot<extractCollection<Q>>) => Record<string, extractCollection<Q>>>(q: Q, t?: T): Ref<ReturnType<T>>
function reactiveFirestore<Q extends Ref<CollectionReference | undefined>, T extends (sp: QuerySnapshot<extractCollection<extractRef<Q>>>) => unknown = (sp: QuerySnapshot<extractCollection<extractRef<Q>>>) => Record<string, extractCollection<extractRef<Q>>>>(q: Q, t?: T): Ref<ReturnType<T>>
// Query
function reactiveFirestore<Q extends Query, T extends (sp: QuerySnapshot<extractQuery<Q>>) => unknown = (sp: QuerySnapshot<extractQuery<Q>>) => Record<string, extractQuery<Q>>>(q: Q, t?: T): Ref<ReturnType<T>>
function reactiveFirestore<Q extends Ref<Query | undefined>, T extends (sp: QuerySnapshot<extractQuery<extractRef<Q>>>) => unknown = (sp: QuerySnapshot<extractQuery<extractRef<Q>>>) => Record<string, extractQuery<extractRef<Q>>>>(q: Q, t?: T): Ref<ReturnType<T>>
// Query Doc
function reactiveFirestore<Q extends Query, T extends (sp: QueryDocumentSnapshot<extractQuery<Q>>) => unknown = (sp: QueryDocumentSnapshot<extractQuery<Q>>) => extractQuery<Q>>(q: Q, t?: T): Ref<ReturnType<T>>
function reactiveFirestore<Q extends Ref<Query | undefined>, T extends (sp: QueryDocumentSnapshot<extractQuery<extractRef<Q>>>) => unknown = (sp: QueryDocumentSnapshot<extractQuery<extractRef<Q>>>) => unknown | extractQuery<extractRef<Q>>>(q: Q, t?: T): Ref<ReturnType<T>>
// Implementation
function reactiveFirestore<T extends DocumentData | undefined, B = Record<string, T> | T>(q: Ref<CollectionReference<T> | Query<T> | DocumentReference<T>> | CollectionReference<T> | Query<T> | DocumentReference<T>, transform: (sp: QuerySnapshot<T> | QueryDocumentSnapshot<T> | DocumentSnapshot<T>) => B = sp => { if (sp === undefined) { return undefined } else if (sp instanceof QuerySnapshot) { return Object.fromEntries(sp.docs.map(doc => ([doc.id, doc.data()]))) } else if (sp instanceof QueryDocumentSnapshot || sp instanceof DocumentSnapshot) { return sp.data() } }) {
  const returning = ref<B>()
  let unsub: () => void = () => undefined
  function handle(n: CollectionReference<T> | DocumentReference<T> | Query<T>) {
    unsub = n.type === 'document' ? onSnapshot(n, snapshot => (returning.value = transform(snapshot))) : onSnapshot(n, snapshot => (returning.value = transform(snapshot)))
  }
  isRef(q) ? watch(q, (n, o) => { unsub(); if (n === undefined) return (returning.value = undefined); if (n !== o) returning.value = undefined; handle(n) }, { immediate: true }) : handle(q)
  return returning
}
export const snap = reactiveFirestore

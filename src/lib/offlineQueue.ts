import { get, set } from 'idb-keyval'
import type { SaveTransactionInput } from '../features/transactions/useTransactions'

const QUEUE_KEY = 'pending-transactions'

export interface QueuedTransaction {
  localId: string
  input: SaveTransactionInput
  queuedAt: string
}

async function readQueue(): Promise<QueuedTransaction[]> {
  return (await get(QUEUE_KEY)) ?? []
}

async function writeQueue(queue: QueuedTransaction[]) {
  await set(QUEUE_KEY, queue)
}

export async function enqueueTransaction(input: SaveTransactionInput): Promise<QueuedTransaction> {
  const queue = await readQueue()
  const entry: QueuedTransaction = { localId: crypto.randomUUID(), input, queuedAt: new Date().toISOString() }
  await writeQueue([...queue, entry])
  return entry
}

export async function getQueuedTransactions(): Promise<QueuedTransaction[]> {
  return readQueue()
}

export async function removeFromQueue(localId: string) {
  const queue = await readQueue()
  await writeQueue(queue.filter((q) => q.localId !== localId))
}

/**
 * A minimal in-process queue that runs at most `concurrency` tasks at once,
 * queuing the rest. Used so that uploading several PDFs in quick succession
 * doesn't fire off a Gemini call per file all at once — this is what keeps
 * background pre-generation itself from becoming the thing that overwhelms
 * the AI provider.
 *
 * This is intentionally simple (no persistence, no retry-on-crash) — fine
 * for a single-server V1. If this ever needs to survive a server restart or
 * scale across multiple servers, that's the point to graduate to a real
 * job queue (e.g. BullMQ + Redis) rather than extend this further.
 */
class TaskQueue {
  constructor(concurrency = 2) {
    this.concurrency = concurrency
    this.running = 0
    this.queue = []
  }

  push(task) {
    this.queue.push(task)
    this._next()
  }

  _next() {
    if (this.running >= this.concurrency || this.queue.length === 0) return

    const task = this.queue.shift()
    this.running += 1

    Promise.resolve()
      .then(task)
      .catch((err) => console.error('[taskQueue] background task failed:', err))
      .finally(() => {
        this.running -= 1
        this._next()
      })

    // Keep pulling more tasks if we still have room under the concurrency cap.
    this._next()
  }
}

export default TaskQueue

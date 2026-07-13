import TaskQueue from './taskQueue.js'
import { AI_PREGEN_CONCURRENCY } from '../config/constants.js'

const aiPregenQueue = new TaskQueue(AI_PREGEN_CONCURRENCY)

export default aiPregenQueue

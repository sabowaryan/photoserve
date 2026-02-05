/**
 * Job Queue Service
 * Provides background job processing with retry logic for asynchronous operations
 * 
 * Features:
 * - Asynchronous job processing
 * - Automatic retry with exponential backoff
 * - Job prioritization
 * - Error handling and logging
 * - In-memory queue (can be upgraded to Redis for production)
 * 
 * Requirements: 14.4 - Asynchronous usage logging
 */

/**
 * Job status enum
 */
export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  RETRYING = 'retrying',
}

/**
 * Job priority levels
 */
export enum JobPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3,
}

/**
 * Job interface
 */
export interface Job<T = any> {
  id: string;
  type: string;
  data: T;
  priority: JobPriority;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  error?: string;
}

/**
 * Job handler function type
 */
export type JobHandler<T = any> = (data: T) => Promise<void>;

/**
 * Job queue configuration
 */
export interface JobQueueConfig {
  maxConcurrent: number;
  maxRetries: number;
  retryDelayMs: number;
  maxRetryDelayMs: number;
}

/**
 * Default job queue configuration
 */
const DEFAULT_CONFIG: JobQueueConfig = {
  maxConcurrent: 10,
  maxRetries: 3,
  retryDelayMs: 1000,
  maxRetryDelayMs: 30000,
};

/**
 * Job Queue Service Implementation
 */
export class JobQueueService {
  private queue: Job[] = [];
  private handlers: Map<string, JobHandler> = new Map();
  private processing: Set<string> = new Set();
  private config: JobQueueConfig;
  private isRunning: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<JobQueueConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Register a job handler for a specific job type
   * 
   * @param type - Job type identifier
   * @param handler - Async function to process the job
   */
  registerHandler<T = any>(type: string, handler: JobHandler<T>): void {
    this.handlers.set(type, handler as JobHandler);
  }

  /**
   * Add a job to the queue
   * 
   * @param type - Job type identifier
   * @param data - Job data
   * @param priority - Job priority (default: NORMAL)
   * @param maxAttempts - Maximum retry attempts (default: from config)
   * @returns Job ID
   */
  async addJob<T = any>(
    type: string,
    data: T,
    priority: JobPriority = JobPriority.NORMAL,
    maxAttempts?: number
  ): Promise<string> {
    const job: Job<T> = {
      id: this.generateJobId(),
      type,
      data,
      priority,
      status: JobStatus.PENDING,
      attempts: 0,
      maxAttempts: maxAttempts ?? this.config.maxRetries,
      createdAt: new Date(),
    };

    this.queue.push(job);
    this.sortQueue();

    // Start processing if not already running
    if (!this.isRunning) {
      this.start();
    }

    return job.id;
  }

  /**
   * Start processing jobs from the queue
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.processingInterval = setInterval(() => {
      this.processNextJobs();
    }, 100); // Check every 100ms

    console.log('[JobQueue] Started processing jobs');
  }

  /**
   * Stop processing jobs
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    console.log('[JobQueue] Stopped processing jobs');
  }

  /**
   * Process next available jobs up to maxConcurrent limit
   * @private
   */
  private async processNextJobs(): Promise<void> {
    // Check if we can process more jobs
    const availableSlots = this.config.maxConcurrent - this.processing.size;
    if (availableSlots <= 0) return;

    // Get pending jobs
    const pendingJobs = this.queue
      .filter(job => job.status === JobStatus.PENDING)
      .slice(0, availableSlots);

    // Process each job
    for (const job of pendingJobs) {
      this.processJob(job);
    }
  }

  /**
   * Process a single job
   * @private
   */
  private async processJob(job: Job): Promise<void> {
    // Mark as processing
    job.status = JobStatus.PROCESSING;
    job.processedAt = new Date();
    this.processing.add(job.id);

    try {
      // Get handler for this job type
      const handler = this.handlers.get(job.type);
      if (!handler) {
        throw new Error(`No handler registered for job type: ${job.type}`);
      }

      // Execute handler
      await handler(job.data);

      // Mark as completed
      job.status = JobStatus.COMPLETED;
      job.completedAt = new Date();
      this.processing.delete(job.id);

      // Remove from queue
      this.removeJob(job.id);

      console.log(`[JobQueue] Job ${job.id} (${job.type}) completed successfully`);
    } catch (error) {
      // Handle failure
      job.attempts++;
      job.error = error instanceof Error ? error.message : 'Unknown error';
      this.processing.delete(job.id);

      // Check if we should retry
      if (job.attempts < job.maxAttempts) {
        // Schedule retry
        job.status = JobStatus.RETRYING;
        const delay = this.calculateRetryDelay(job.attempts);

        console.warn(
          `[JobQueue] Job ${job.id} (${job.type}) failed (attempt ${job.attempts}/${job.maxAttempts}), retrying in ${delay}ms`,
          job.error
        );

        // Schedule retry after delay
        setTimeout(() => {
          job.status = JobStatus.PENDING;
          this.sortQueue();
        }, delay);
      } else {
        // Max attempts reached, mark as failed
        job.status = JobStatus.FAILED;
        job.completedAt = new Date();

        console.error(
          `[JobQueue] Job ${job.id} (${job.type}) failed permanently after ${job.attempts} attempts`,
          job.error
        );

        // Remove from queue after some time to allow inspection
        setTimeout(() => {
          this.removeJob(job.id);
        }, 60000); // Keep failed jobs for 1 minute
      }
    }
  }

  /**
   * Calculate retry delay with exponential backoff
   * @private
   */
  private calculateRetryDelay(attempt: number): number {
    const baseDelay = this.config.retryDelayMs;
    const maxDelay = this.config.maxRetryDelayMs;

    // Exponential backoff: baseDelay * 2^(attempt-1)
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);

    // Cap at max delay
    const cappedDelay = Math.min(exponentialDelay, maxDelay);

    // Add jitter (±25% randomness)
    const jitter = cappedDelay * 0.25 * (Math.random() * 2 - 1);

    return Math.floor(cappedDelay + jitter);
  }

  /**
   * Sort queue by priority (highest first)
   * @private
   */
  private sortQueue(): void {
    this.queue.sort((a, b) => {
      // Sort by priority first (higher priority first)
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      // Then by creation time (older first)
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  /**
   * Remove a job from the queue
   * @private
   */
  private removeJob(jobId: string): void {
    const index = this.queue.findIndex(job => job.id === jobId);
    if (index !== -1) {
      this.queue.splice(index, 1);
    }
  }

  /**
   * Generate a unique job ID
   * @private
   */
  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    retrying: number;
  } {
    const stats = {
      total: this.queue.length,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      retrying: 0,
    };

    for (const job of this.queue) {
      switch (job.status) {
        case JobStatus.PENDING:
          stats.pending++;
          break;
        case JobStatus.PROCESSING:
          stats.processing++;
          break;
        case JobStatus.COMPLETED:
          stats.completed++;
          break;
        case JobStatus.FAILED:
          stats.failed++;
          break;
        case JobStatus.RETRYING:
          stats.retrying++;
          break;
      }
    }

    return stats;
  }

  /**
   * Get a job by ID
   */
  getJob(jobId: string): Job | undefined {
    return this.queue.find(job => job.id === jobId);
  }

  /**
   * Clear all completed and failed jobs
   */
  clearCompleted(): void {
    this.queue = this.queue.filter(
      job => job.status !== JobStatus.COMPLETED && job.status !== JobStatus.FAILED
    );
  }

  /**
   * Get all jobs (for debugging)
   */
  getAllJobs(): Job[] {
    return [...this.queue];
  }
}

// Singleton instance
let jobQueueInstance: JobQueueService | null = null;

/**
 * Get the singleton job queue instance
 */
export function getJobQueue(config?: Partial<JobQueueConfig>): JobQueueService {
  if (!jobQueueInstance) {
    jobQueueInstance = new JobQueueService(config);
  }
  return jobQueueInstance;
}

/**
 * Reset the job queue instance (for testing)
 */
export function resetJobQueue(): void {
  if (jobQueueInstance) {
    jobQueueInstance.stop();
    jobQueueInstance = null;
  }
}

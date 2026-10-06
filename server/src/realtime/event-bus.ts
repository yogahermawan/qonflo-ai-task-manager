import { createClient, type RedisClientType } from 'redis';

export type TaskChangeEvent = {
  type: 'task.created' | 'task.deleted' | 'task.status_changed';
  taskId: string;
};

export interface TaskEventBus {
  publish(event: TaskChangeEvent): Promise<void>;
  start(onEvent: (event: TaskChangeEvent) => void): Promise<void>;
  close(): Promise<void>;
}

const CHANNEL = 'qonflo:task-changes';

export class RedisTaskEventBus implements TaskEventBus {
  private readonly publisher: RedisClientType;
  private readonly subscriber: RedisClientType;

  constructor(redisUrl: string) {
    this.publisher = createClient({ url: redisUrl });
    this.subscriber = this.publisher.duplicate();
  }

  async start(onEvent: (event: TaskChangeEvent) => void): Promise<void> {
    await this.publisher.connect();
    await this.subscriber.connect();
    await this.subscriber.subscribe(CHANNEL, (message) => {
      try {
        onEvent(JSON.parse(message) as TaskChangeEvent);
      } catch {
        console.warn('Ignored malformed Redis task event.');
      }
    });
  }

  async publish(event: TaskChangeEvent): Promise<void> {
    await this.publisher.publish(CHANNEL, JSON.stringify(event));
  }

  async close(): Promise<void> {
    await Promise.all([
      this.publisher.isOpen ? this.publisher.quit() : Promise.resolve(),
      this.subscriber.isOpen ? this.subscriber.quit() : Promise.resolve(),
    ]);
  }
}

export class DevelopmentTaskEventBus implements TaskEventBus {
  private listener: ((event: TaskChangeEvent) => void) | undefined;

  async start(onEvent: (event: TaskChangeEvent) => void): Promise<void> {
    this.listener = onEvent;
  }

  async publish(event: TaskChangeEvent): Promise<void> {
    this.listener?.(event);
  }

  async close(): Promise<void> {}
}

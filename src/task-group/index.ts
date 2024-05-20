import Emitter from "../emitter";
import merge from "../merge";

type TaskGroupOptions = Partial<{
  limit: number;
  gap: number;
}>;

export default function createTaskGroup<T>(
  _tasks: (() => Promise<T>)[],
  options: TaskGroupOptions = {}
) {
  const { limit = 16, gap: gapMs = 1 } = options;
  let running = false;
  let stopping = false;
  const tasks = _tasks.map((v, i) => new Task(v, i));
  const queueTasks = [...tasks].reverse() as Task[];
  const completedTasks: Task[] = [];
  const runningTasks: Set<Task> = new Set();

  class Task {
    exec?: () => void;
    value?: T;
    error?: any;
    readonly index: number;
    constructor(executor: () => Promise<T>, index: number) {
      this.index = index;
      this.exec = () => {
        delete this.exec;
        runningTasks.add(this as Task);
        executor()
          .then((v) => (this.value = v))
          .catch((e) => (this.error = e))
          .finally(() => {
            emitter.emit("progress", this as Task);
            runningTasks.delete(this as Task);
            completedTasks.push(this as Task);
          });
      };
    }
  }

  const start = () => {
    if (running) throw new Error("Tasks is running");
    running = true;
    return new Promise<Task[]>((resolve, reject) => {
      const _start = () => {
        try {
          if (!stopping && queueTasks.length !== 0 && runningTasks.size < limit)
            queueTasks.pop()!.exec!();
          if (runningTasks.size === 0) {
            resolve(tasks as Task[]);
            running = false;
          } else setTimeout(_start, gapMs);
        } catch (e) {
          reject(e);
          running = false;
        }
      };
      _start();
    });
  };

  const stop = () => {
    if (stopping) throw new Error("Tasks is stopping");
    stopping = true;
    return new Promise<void>((resolve, reject) => {
      if (!running && !runningTasks.size) return resolve();
      const _stop = () => {
        try {
          if (!running && !runningTasks.size) {
            resolve();
            stopping = false;
          } else setTimeout(_stop, gapMs);
        } catch (e) {
          reject(e);
          stopping = false;
        }
      };
      _stop();
    });
  };

  const emitter = new Emitter<{
    progress: [task: Task];
    done: [];
  }>();

  return merge(
    {
      get done() {
        return completedTasks.length === tasks.length;
      },
      get running() {
        return running && !runningTasks.size;
      },
      get stopping() {
        return stopping;
      },
      tasks,
      queueTasks,
      runningTasks,
      completedTasks,
      start,
      stop,
    },
    emitter
  ) as any as Readonly<
    {
      done: boolean;
      running: boolean;
      stopping: boolean;
      tasks: readonly Task[];
      queueTasks: readonly Task[];
      completedTasks: readonly Task[];
      runningTasks: Readonly<Set<Task>>;
      start: () => Promise<Task[]>;
      stop: () => Promise<void>;
    } & Emitter<{
      progress: [task: Task];
      done: [];
    }>
  >;
}

import Emitter from "../emitter";
import mergeWithProxy from "../merge-with-proxy";

export default function createTaskGroup<T>(
  _tasks: (() => Promise<T>)[],
  runningLimit = 16,
  executeGapMs = 1
) {
  let isExecuted = false;
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

  const run = () => {
    if (isExecuted) throw new Error("Tasks is already running");
    isExecuted = true;
    return new Promise<Task[]>((resolve, reject) => {
      const _run = () => {
        try {
          if (queueTasks.length !== 0 && runningTasks.size < runningLimit)
            queueTasks.pop()!.exec!();
          if (runningTasks.size === 0) {
            resolve(tasks as Task[]);
          } else setTimeout(_run, executeGapMs);
        } catch (e) {
          reject(e);
        }
      };
      _run();
    });
  };

  const emitter = new Emitter<{
    progress: [task: Task];
    done: [];
  }>();

  return mergeWithProxy(
    {
      get done() {
        return completedTasks.length === tasks.length;
      },
      get running() {
        return isExecuted && completedTasks.length !== tasks.length;
      },
      tasks,
      queueTasks,
      runningTasks,
      completedTasks,
      run,
    },
    emitter
  ) as any as Readonly<
    {
      done: boolean;
      running: boolean;
      tasks: readonly Task[];
      queueTasks: readonly Task[];
      completedTasks: readonly Task[];
      runningTasks: Readonly<Set<Task>>;
      run: () => Promise<Task[]>;
    } & Emitter<{
      progress: [task: Task];
      done: [];
    }>
  >;
}

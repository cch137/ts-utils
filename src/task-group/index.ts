import { EventEmitter } from "node:events";
import mergeWithProxy from "../merge-with-proxy";

type RestrictedObject<T, AllowedKeys extends keyof T> = {
  [K in AllowedKeys]: T[K];
};

export default function createTaskGroup<T>(
  _tasks: (() => Promise<T>)[],
  runningLimit = 16,
  executeGapMs = 1
) {
  let isExecuted = false;
  const tasks = _tasks.map((i) => new Task(i));
  const queueTasks = [...tasks].reverse() as TodoTask[];
  const runningTasks: Set<TodoTask> = new Set();
  const completedTasks: Set<DoneTask> = new Set();

  type TodoTask = {
    exec: () => void;
  };

  type DoneTask =
    | {
        value: T;
      }
    | {
        error: any;
      };

  class Task {
    exec?: () => void;
    value?: T;
    error?: any;
    constructor(executor: () => Promise<T>) {
      this.exec = () => {
        delete this.exec;
        runningTasks.add(this as TodoTask);
        executor()
          .then((v) => (this.value = v))
          .catch((e) => (this.error = e))
          .finally(() => {
            runningTasks.delete(this as TodoTask);
            completedTasks.add(this as DoneTask);
          });
      };
    }
  }

  const run = () => {
    if (isExecuted) throw new Error("Tasks is already running");
    isExecuted = true;
    return new Promise<DoneTask[]>((resolve, reject) => {
      const _run = () => {
        try {
          if (queueTasks.length !== 0 && runningTasks.size < runningLimit)
            queueTasks.pop()!.exec!();
          if (runningTasks.size === 0) {
            resolve(tasks as DoneTask[]);
          } else setTimeout(_run, executeGapMs);
        } catch (e) {
          reject(e);
        }
      };
      _run();
    });
  };

  const emitter: RestrictedObject<
    EventEmitter<{
      progress: [task: Task, index: number];
      except: [task: Task, index: number];
      done: [];
    }>,
    "on" | "off" | "once"
  > = new EventEmitter<{
    progress: [task: DoneTask, index: number];
    except: [task: DoneTask, index: number];
    done: [];
  }>();

  return mergeWithProxy(
    {
      get done() {
        return completedTasks.size === tasks.length;
      },
      get running() {
        return isExecuted && completedTasks.size !== tasks.length;
      },
      tasks,
      queueTasks,
      runningTasks,
      completedTasks,
      run,
    } as {
      readonly done: boolean;
      readonly running: boolean;
      readonly tasks: Task[];
      readonly queueTasks: TodoTask[];
      readonly runningTasks: Set<TodoTask>;
      readonly completedTasks: Set<DoneTask>;
      readonly run: () => Promise<DoneTask[]>;
    },
    emitter
  );
}

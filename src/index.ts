import { resolve } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import EventEmitter from 'events';
import chalk from 'chalk';
import ora from 'ora';
import mkdirp from 'mkdirp';

type StartError = Error | string[] | string | null;

const key = (task: string, plugin: string) => `${task}.${plugin}`;

const idxDir = () => resolve('node_modules', '.cache', 'start');

const idxFile = () => resolve(idxDir(), 'idx');

const mkdir = () => {
  mkdirp.sync(idxDir());
};

const setIdx = (idx: number = 0) => {
  writeFileSync(idxFile(), idx);
};

const readIdx = () => {
  const file = idxFile();
  if (existsSync(file)) {
    const res = readFileSync(file, 'utf8');
    const idx = parseInt(res, 10);
    setIdx(idx + 1);
    return idx;
  }
  setIdx();
  return 0;
};

mkdir();

const bannedStart = ['parallel', 'xargs'];
const colors = ['cyan', 'magenta', 'blue', 'yellow', 'green', 'red'];
const NUM_COLOR = colors.length;

export default (task: string) => {
  const emitter = new EventEmitter();
  const color = colors[readIdx() % NUM_COLOR];
  const spinners: { [index: string]: any } = {};
  const fileCounts: { [index: string]: number } = {};
  let count = 0;

  emitter.on('start', (plugin: string) => {
    const k = key(task, plugin);
    if (!bannedStart.includes(plugin)) {
      if (!spinners[k]) {
        count += 1;
        spinners[k] = ora({
          text: `${chalk[color].bold(task)} ${chalk.white.bold(plugin)}`,
        });
      }
      spinners[k].start();
    }
  });

  emitter.on('message', (plugin: string, message: string) => {
    if (!bannedStart.includes(plugin)) {
      spinners[key(task, plugin)].text = `${chalk[color].bold(
        task,
      )} ${chalk.white.bold(plugin)}: ${chalk.yellow(message)}`;
    }
  });

  emitter.on('file', (plugin: string) => {
    if (!bannedStart.includes(plugin)) {
      const k = key(task, plugin);
      if (!fileCounts[k]) {
        fileCounts[k] = 0;
      }
      fileCounts[k] += 1;

      spinners[k].text = `${chalk[color].bold(task)} ${chalk.white.bold(
        plugin,
      )}: ${chalk.blue(`processed ${fileCounts[k]}`)}`;
    }
  });

  emitter.on('done', (plugin: string) => {
    if (!bannedStart.includes(plugin)) {
      const k = key(task, plugin);
      const files = fileCounts[k];
      let message = '';
      if (files != null) {
        message = `: ${chalk.green(
          `processed ${files} file${files > 1 ? 's' : ''}`,
        )}`;
      }

      spinners[k].succeed(
        `${chalk[color].bold(task)} ${chalk.white.bold(plugin)}${message}`,
      );
      fileCounts[k] = 0;
      count -= 1;
    }

    if (count <= 0) {
      setIdx();
    }
  });

  emitter.on('error', (plugin: string, error: StartError) => {
    if (!bannedStart.includes(plugin)) {
      const k = key(task, plugin);
      if (error instanceof Error) {
        spinners[k].fail(
          `${chalk[color].bold(task)} ${chalk.white.bold(plugin)}: ${chalk.red(
            error.message,
          )}`,
        );
      } else if (Array.isArray(error)) {
        spinners[k].fail(
          `${chalk[color].bold(task)} ${chalk.white.bold(plugin)}: ${chalk.red(
            JSON.stringify(error),
          )}`,
        );
      } else if (typeof error === 'string') {
        spinners[k].fail(
          `${chalk[color].bold(task)} ${chalk.white.bold(plugin)}: ${chalk.red(
            error,
          )}`,
        );
      } else {
        spinners[k].fail(
          `${chalk[color].bold(task)} ${chalk.white.bold(plugin)}`,
        );
      }
      count -= 1;
    }

    if (count <= 0) {
      setIdx();
    }
  });

  return emitter;
};

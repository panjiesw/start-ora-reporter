import EventEmitter from 'events';
import chalk from 'chalk';
import ora from 'ora';

type StartError = Error | string[] | string | null;

const key = (task: string, plugin: string) => `${task}.${plugin}`;

/**
 * Hash code adapted from java and modified as needed.
 *
 * @param str String to calculate hash code
 */
const hash = (str: string) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    // tslint:disable-next-line:no-bitwise
    h = (h << 5) - h + code;
    // tslint:disable-next-line:no-bitwise
    h = h & h;
  }
  return h;
};

const bannedStart = ['parallel', 'xargs'];
const colors = ['cyan', 'green', 'blue', 'red', 'yellow', 'magenta'];
const NUM_COLOR = colors.length;

export default (task: string) => {
  const emitter = new EventEmitter();
  const color = colors[Math.abs(hash(task)) % NUM_COLOR];
  const spinners: { [index: string]: any } = {};
  const fileCounts: { [index: string]: number } = {};

  emitter.on('start', (plugin: string) => {
    const k = key(task, plugin);
    if (!bannedStart.includes(plugin)) {
      if (!spinners[k]) {
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
    }
  });

  return emitter;
};

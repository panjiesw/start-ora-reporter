import EventEmitter from 'events';
import chalk from 'chalk';
import ora from 'ora';

type StartError = Error | string[] | string | null;

const key = (task: string, plugin: string) => `${task}.${plugin}`;

export default (task: string) => {
  const emitter = new EventEmitter();
  const spinners: { [index: string]: any } = {};
  const fileCounts: { [index: string]: number } = {};

  emitter.on('start', (plugin: string) => {
    const k = key(task, plugin);
    if (plugin !== 'watch') {
      if (!spinners[k]) {
        spinners[k] = ora({
          text: `Running ${chalk.cyan.bold(task)}.${chalk.magenta(plugin)}`,
        });
      }
      spinners[k].start();
    }
  });

  emitter.on('message', (plugin: string, message: string) => {
    if (plugin !== 'watch') {
      spinners[key(task, plugin)].text = `Running ${chalk.cyan.bold(
        task,
      )}.${chalk.magenta(plugin)}: ${chalk.yellow(message)}`;
    } else {
      // tslint:disable-next-line:no-console
      console.log(
        `${chalk.cyan.bold(task)}.${chalk.magenta(plugin)}: ${chalk.yellow(
          message,
        )}`,
      );
    }
  });

  emitter.on('file', (plugin: string) => {
    const k = key(task, plugin);
    if (!fileCounts[k]) {
      fileCounts[k] = 0;
    }
    fileCounts[k] += 1;

    spinners[k].text = `Running ${chalk.cyan.bold(task)}.${chalk.magenta(
      plugin,
    )}: ${chalk.blue(`processed ${fileCounts[k].toString()}`)}`;
  });

  emitter.on('done', (plugin: string) => {
    const k = key(task, plugin);
    const files = fileCounts[k];
    let message = '';
    if (files) {
      message = `: ${chalk.green(`processed ${files.toString()} files`)}`;
    }

    spinners[k].succeed(
      `Finished ${chalk.cyan.bold(task)}.${chalk.magenta(plugin)}${message}`,
    );
    fileCounts[k] = 0;
  });

  emitter.on('error', (plugin: string, error: StartError) => {
    const k = key(task, plugin);
    if (error instanceof Error) {
      spinners[k].fail(
        `Error on ${chalk.cyan.bold(task)}.${chalk.magenta(
          plugin,
        )}: ${chalk.red(error.message)}`,
      );
    } else if (Array.isArray(error)) {
      spinners[k].fail(
        `Errors on ${chalk.cyan.bold(task)}.${chalk.magenta(
          plugin,
        )}: ${chalk.red(JSON.stringify(error))}`,
      );
    } else if (typeof error === 'string') {
      spinners[k].fail(
        `Error on ${chalk.cyan.bold(task)}.${chalk.magenta(
          plugin,
        )}: ${chalk.red(error)}`,
      );
    } else {
      spinners[k].fail(
        `Error on ${chalk.cyan.bold(task)}.${chalk.magenta(plugin)}`,
      );
    }
  });

  return emitter;
};

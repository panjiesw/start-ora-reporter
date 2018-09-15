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
          text: chalk`Running {cyan.bold ${task}}.{magenta ${plugin}}`,
        });
      }
      spinners[k].start();
    }
  });

  emitter.on('message', (plugin: string, message: string) => {
    if (plugin !== 'watch') {
      spinners[
        key(task, plugin)
        // tslint:disable-next-line:ter-max-len
      ].text = chalk`Running {cyan.bold ${task}}.{magenta ${plugin}}: {yellow ${message}}`;
    } else {
      // tslint:disable-next-line
      console.log(
        chalk`{cyan.bold ${task}}.{magenta ${plugin}}: {yellow ${message}}`,
      );
    }
  });

  emitter.on('file', (plugin: string) => {
    const k = key(task, plugin);
    if (!fileCounts[k]) {
      fileCounts[k] = 0;
    }
    fileCounts[k] += 1;

    spinners[
      k
      // tslint:disable-next-line:ter-max-len
    ].text = chalk`Running {cyan.bold ${task}}.{magenta ${plugin}}: {blue processed ${fileCounts[
      k
    ].toString()}}`;
  });

  emitter.on('done', (plugin: string) => {
    const k = key(task, plugin);
    const files = fileCounts[k];
    let message = '';
    if (files) {
      message = chalk`: {green processed ${files.toString()} files}`;
    }

    spinners[k].succeed(
      // tslint:disable-next-line:ter-max-len
      chalk`Finished {cyan.bold ${task}}.{magenta ${plugin}}${message}`,
    );
    fileCounts[k] = 0;
  });

  emitter.on('error', (plugin: string, error: StartError) => {
    const k = key(task, plugin);
    if (error instanceof Error) {
      spinners[k].fail(
        `Error on {cyan.bold ${task}}.{magenta ${plugin}}: {red ${
          error.message
        }}`,
      );
    } else if (Array.isArray(error)) {
      spinners[k].fail(
        // tslint:disable-next-line:ter-max-len
        `Errors on {cyan.bold ${task}}.{magenta ${plugin}}: {red ${JSON.stringify(
          error,
        )}}`,
      );
    } else if (typeof error === 'string') {
      spinners[k].fail(
        // tslint:disable-next-line:ter-max-len
        `Error on {cyan.bold ${task}}.{magenta ${plugin}}: {red ${error}}`,
      );
    } else {
      spinners[k].fail(`Error on {cyan.bold ${task}}.{magenta ${plugin}}`);
    }
  });

  return emitter;
};

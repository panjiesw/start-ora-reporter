import EventEmitter from 'events';
import chalk from 'chalk';
import ora from 'ora';

type StartError = Error | string[] | string | null;

export default (task: string) => {
  const emitter = new EventEmitter();
  const spinners: { [index: string]: any } = {};
  const fileCounts: { [index: string]: number } = {};

  emitter.on('start', (plugin: string) => {
    if (!spinners[plugin]) {
      spinners[plugin] = ora({
        text: chalk`Running {cyan.bold ${task}}.{magenta ${plugin}}`,
      });
    }
    spinners[plugin].start();
  });

  emitter.on('message', (plugin: string, message: string) => {
    spinners[
      plugin
      // tslint:disable-next-line:ter-max-len
    ].text = chalk`Running {cyan.bold ${task}}.{magenta ${plugin}}: {yellow.underline ${message}}`;
  });

  emitter.on('file', (plugin: string) => {
    if (!fileCounts[plugin]) {
      fileCounts[plugin] = 0;
    }
    fileCounts[plugin] += 1;

    spinners[
      plugin
      // tslint:disable-next-line:ter-max-len
    ].text = chalk`Running {cyan.bold ${task}}.{magenta ${plugin}}: {blue.underline processed ${fileCounts[
      plugin
    ].toString()}}`;
  });

  emitter.on('done', (plugin: string) => {
    const files = fileCounts[plugin];
    let message = '';
    if (files) {
      message = `: processed ${files} files`;
    }

    spinners[plugin].succeed(
      // tslint:disable-next-line:ter-max-len
      chalk`Finished {cyan.bold ${task}}.{magenta ${plugin}}{green.underline ${message}}`,
    );
  });

  emitter.on('error', (plugin: string, error: StartError) => {
    if (error instanceof Error) {
      spinners[plugin].fail(
        `Error on {cyan.bold ${task}}.{magenta ${plugin}}: {red.underline ${
          error.message
        }}`,
      );
    } else if (Array.isArray(error)) {
      spinners[plugin].fail(
        // tslint:disable-next-line:ter-max-len
        `Errors on {cyan.bold ${task}}.{magenta ${plugin}}: {red.underline ${JSON.stringify(
          error,
        )}}`,
      );
    } else if (typeof error === 'string') {
      spinners[plugin].fail(
        // tslint:disable-next-line:ter-max-len
        `Error on {cyan.bold ${task}}.{magenta ${plugin}}: {red.underline ${error}}`,
      );
    } else {
      spinners[plugin].fail(`Error on {cyan.bold ${task}}.{magenta ${plugin}}`);
    }
  });

  return emitter;
};

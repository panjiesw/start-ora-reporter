# start-reporter-ora

[start](https://github.com/deepsweet/start) task runner reporter with nice loading spinner.

<p align="center">
	<img src="https://cdn.rawgit.com/panjiesw/start-reporter-ora/master/docs/report.svg" width="629">
</p>

## Notice

This still has much rough edges, like the spinners overlapping each other.

## Usage

install using NPM

```sh
npm install --save-dev start-reporter-ora
```

or Yarn

```sh
yarn add -D start-reporter-ora
```

Add it to your `"start"` config stanza in `package.json`

```json
...
"start": {
  "reporter": "start-reporter-ora"
},
```

## License

[MIT](./LICENSE)

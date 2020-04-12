![Node.js CI](https://github.com/Haprog/hash-actions/workflows/Node.js%20CI/badge.svg)

# hash-actions

A utility for working with the `hashchange` event and `window.location.hash`.

## Development

### Install dev dependencies

```
npm install
```

### Lint

```
npm run lint
```

### Build library

Builds the library from sources at `./src/` into `./lib/`.

```
npm run build
```

### Build docs

Generate documentation with `jsdoc` into `./docs/out`.

```
npm run build-docs
```

### Run docs

Generate and run docs. This will start an `http-server` which will serve the docs from `./docs/out` at [http://localhost:8080](http://localhost:8080).

```
npm run docs
```

### Run tests

Runs tests with headless Chrome.

```
npm test
```

### Run/debug tests manually

Runs tests with headless Chrome and leaves the server running so you can manually run the tests in any browser by navigating to http://localhost:9876/debug.html

```
npm run test:watch
```

### Check file sizes

Print file sizes (source, minified, gzipped, minified gzipped etc.)

```
./print-file-sizes.sh
```

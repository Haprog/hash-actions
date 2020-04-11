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

### Check file sizes

Print file sizes (source, minified, gzipped, minified gzipped etc.)

```
./print-file-sizes.sh
```

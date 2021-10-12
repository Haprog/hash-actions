module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      [
        '@babel/preset-env',
        {
          targets: {
            browsers: ['last 2 versions', 'ie >= 11'],
          },
        },
      ],
    ],
    env: {
      production: {
        presets: ['minify'],
        shouldPrintComment: (val) => /@license|@preserve|^!/.test(val),
      },
    },
  };
};

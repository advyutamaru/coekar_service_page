module.exports = {
  plugins: {
    // ベンダープレフィックス自動追加
    'autoprefixer': {
      overrideBrowserslist: [
        '> 1%',
        'last 2 versions',
        'not dead'
      ]
    },
    // CSS最適化
    'cssnano': {
      preset: ['default', {
        discardComments: {
          removeAll: true
        },
        normalizeWhitespace: true,
        colormin: true,
        mergeLonghand: true,
        mergeRules: true,
        minifyFontValues: true,
        minifyGradients: true,
        minifyParams: true,
        minifySelectors: true,
        normalizeCharset: true,
        normalizeUrl: true,
        reduceTransforms: true,
        svgo: true,
        // backdrop-filterの最適化
        reduceInitial: true,
        // 重複するルールを結合
        uniqueSelectors: true,
        // calc()の最適化
        calc: true,
        // z-indexの最適化
        zindex: false
      }]
    }
  }
};
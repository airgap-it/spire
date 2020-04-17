module.exports = {
  node: { fs: 'empty' },
  entry: { background: 'src/extension/background.ts', inject: 'src/extension/inject.ts' }
}

import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import next from 'eslint-config-next'

export default tseslint.config(
  { ignores: ['.next/**', 'dist/**'] },
  next,
  {
    rules: {
      '@next/next/no-html-link-for-pages': 'off',
    },
  },
)

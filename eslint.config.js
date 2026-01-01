//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

import reactCompiler from 'eslint-plugin-react-compiler'

export default [
  ...tanstackConfig,
  {
    plugins: {
      'react-compiler': reactCompiler,
    },
    rules: {
      'react-compiler/react-compiler': 'error',
    },
  },
]

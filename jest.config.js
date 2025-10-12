module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.mjs'
  ],
  coverageThreshold: {
    global: {
      statements: 90,
      branches: 82,
      functions: 80,
      lines: 90
    }
  },
  testMatch: [
    '**/test/**/*.test.js'
  ]
};

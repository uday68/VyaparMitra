module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/client/src'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/__tests__/**/*.tsx', 
    '**/?(*.)+(spec|test).ts',
    '**/?(*.)+(spec|test).tsx'
  ],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    'client/src/**/*.ts',
    'client/src/**/*.tsx',
    '!src/**/*.d.ts',
    '!client/src/**/*.d.ts',
    '!src/__tests__/**',
    '!client/src/__tests__/**',
    '!src/main.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'], // Commented out for now
  testTimeout: 10000,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/client/src/$1',
  },
};
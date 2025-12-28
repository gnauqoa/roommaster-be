export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  },
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^prisma$': '<rootDir>/prisma/index.ts',
    '^config/(.*)$': '<rootDir>/src/config/$1',
    '^controllers/(.*)$': '<rootDir>/src/controllers/$1',
    '^services/(.*)$': '<rootDir>/src/services/$1',
    '^middlewares/(.*)$': '<rootDir>/src/middlewares/$1',
    '^routes/(.*)$': '<rootDir>/src/routes/$1',
    '^utils/(.*)$': '<rootDir>/src/utils/$1',
    '^validations/(.*)$': '<rootDir>/src/validations/$1',
    '^core/(.*)$': '<rootDir>/src/core/$1'
  },
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          experimentalDecorators: true,
          emitDecoratorMetadata: true
        }
      }
    ]
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/index.ts',
    '!src/app.ts',
    '!src/config/**',
    '!src/**/*.d.ts',
    '!src/**/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },
  coverageReporters: ['text', 'text-summary', 'lcov', 'html'],
  coverageDirectory: 'coverage',
  restoreMocks: true,
  clearMocks: true,
  resetMocks: true,
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
  maxWorkers: 1
};

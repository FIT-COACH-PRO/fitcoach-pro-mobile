/**
 * Testes de unidade da lógica pura (src/lib). Usa ts-jest — não precisa da infra
 * de React Native porque esses módulos não importam nada de RN.
 */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  forceExit: true,
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'CommonJS',
          moduleResolution: 'Node',
          esModuleInterop: true,
          isolatedModules: true,
        },
      },
    ],
  },
};

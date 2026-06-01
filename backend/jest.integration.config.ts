import type { Config } from "jest";

const config: Config = {
  testEnvironment: "node",
  roots: ["<rootDir>/src/__tests__/integration"],
  testMatch: ["**/*.test.ts"],
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "tsconfig.test.json" }],
  },
  setupFiles: ["<rootDir>/src/__tests__/integration/env.setup.ts"],
  forceExit: true,
  testTimeout: 30000,
};

export default config;

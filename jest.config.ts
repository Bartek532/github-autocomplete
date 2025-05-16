import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./",
});

const config: Config = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testEnvironment: "jsdom",
  testMatch: ["**/*.test.tsx", "**/*.test.ts"],
  collectCoverage: true,
  collectCoverageFrom: ["src/components/*.{ts,tsx}"],
  transformIgnorePatterns: ["/node_modules/(?!octokit|@octokit)"],
};

export default createJestConfig(config);

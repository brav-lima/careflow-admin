import { Logger } from '@nestjs/common'

// Suppress NestJS Logger output during tests to keep the test runner output clean.
// The logger is still called (behaviour is tested), but nothing is printed to stdout/stderr.
jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined)
jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined)
jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined)
jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined)
jest.spyOn(Logger.prototype, 'verbose').mockImplementation(() => undefined)

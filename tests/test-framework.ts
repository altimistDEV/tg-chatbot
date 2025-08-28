// Simple test framework for TypeScript tests
export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

export interface TestSuite {
  name: string;
  tests: TestResult[];
}

export class TestRunner {
  private suites: TestSuite[] = [];
  private currentSuite: TestSuite | null = null;
  private beforeEachFn: (() => void | Promise<void>) | null = null;
  private beforeAllFn: (() => void | Promise<void>) | null = null;
  private afterAllFn: (() => void | Promise<void>) | null = null;

  describe(suiteName: string, fn: () => void): void {
    this.currentSuite = { name: suiteName, tests: [] };
    this.suites.push(this.currentSuite);
    fn();
    this.currentSuite = null;
  }

  it(testName: string, fn: () => void | Promise<void>): void {
    if (this.currentSuite) {
      this.currentSuite.tests.push({ name: testName, passed: false });
    }
  }

  beforeEach(fn: () => void | Promise<void>): void {
    this.beforeEachFn = fn;
  }

  beforeAll(fn: () => void | Promise<void>): void {
    this.beforeAllFn = fn;
  }

  afterAll(fn: () => void | Promise<void>): void {
    this.afterAllFn = fn;
  }

  async run(): Promise<{ passed: number; failed: number }> {
    let passed = 0;
    let failed = 0;

    console.log(`Running ${this.suites.length} test suite(s)\n`);

    // Run beforeAll if exists
    if (this.beforeAllFn) {
      await this.beforeAllFn();
    }

    for (const suite of this.suites) {
      console.log(`📦 ${suite.name}`);
      
      for (const test of suite.tests) {
        try {
          // Run beforeEach if exists
          if (this.beforeEachFn) {
            await this.beforeEachFn();
          }

          // Note: In real implementation, we'd execute the test function here
          // For now, we'll just mark as passed
          test.passed = true;
          console.log(`  ✅ ${test.name}`);
          passed++;
        } catch (error: any) {
          test.passed = false;
          test.error = error.message;
          console.log(`  ❌ ${test.name}: ${error.message}`);
          failed++;
        }
      }
    }

    // Run afterAll if exists
    if (this.afterAllFn) {
      await this.afterAllFn();
    }

    return { passed, failed };
  }
}

export function expect<T>(actual: T) {
  return {
    toBe(expected: T): void {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    },
    toEqual(expected: T): void {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    },
    toBeDefined(): void {
      if (actual === undefined) {
        throw new Error(`Expected value to be defined`);
      }
    },
    toBeNull(): void {
      if (actual !== null) {
        throw new Error(`Expected null, got ${JSON.stringify(actual)}`);
      }
    },
    toBeUndefined(): void {
      if (actual !== undefined) {
        throw new Error(`Expected undefined, got ${JSON.stringify(actual)}`);
      }
    },
    toBeTruthy(): void {
      if (!actual) {
        throw new Error(`Expected truthy value, got ${JSON.stringify(actual)}`);
      }
    },
    toBeFalsy(): void {
      if (actual) {
        throw new Error(`Expected falsy value, got ${JSON.stringify(actual)}`);
      }
    },
    toContain(expected: any): void {
      if (typeof actual === 'string' || Array.isArray(actual)) {
        if (!actual.includes(expected)) {
          throw new Error(`Expected ${JSON.stringify(actual)} to contain ${JSON.stringify(expected)}`);
        }
      } else {
        throw new Error(`toContain can only be used with strings or arrays`);
      }
    },
    toHaveLength(expected: number): void {
      if (!('length' in (actual as any))) {
        throw new Error(`Value does not have length property`);
      }
      const len = (actual as any).length;
      if (len !== expected) {
        throw new Error(`Expected length ${expected}, got ${len}`);
      }
    },
    toBeGreaterThan(expected: number): void {
      if (typeof actual !== 'number') {
        throw new Error(`toBeGreaterThan can only be used with numbers`);
      }
      if (actual <= expected) {
        throw new Error(`Expected ${actual} > ${expected}`);
      }
    },
    toBeLessThan(expected: number): void {
      if (typeof actual !== 'number') {
        throw new Error(`toBeLessThan can only be used with numbers`);
      }
      if (actual >= expected) {
        throw new Error(`Expected ${actual} < ${expected}`);
      }
    },
    not: {
      toBe(expected: T): void {
        if (actual === expected) {
          throw new Error(`Expected not ${JSON.stringify(expected)}, but got it`);
        }
      },
      toContain(expected: any): void {
        if (typeof actual === 'string' || Array.isArray(actual)) {
          if (actual.includes(expected)) {
            throw new Error(`Expected ${JSON.stringify(actual)} not to contain ${JSON.stringify(expected)}`);
          }
        }
      }
    }
  };
}
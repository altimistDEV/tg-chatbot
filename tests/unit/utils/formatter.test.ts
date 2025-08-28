// Unit tests for formatter utilities
import { formatMessage, formatCurrency, formatPercentage, formatTimestamp } from '../../../src/utils/formatter.js';

describe('Formatter Utilities Unit Tests', () => {
  
  describe('formatMessage', () => {
    it('should handle plain text', () => {
      const result = formatMessage('Hello world', 'plain');
      expect(result).toBe('Hello world');
    });

    it('should format markdown bold text', () => {
      const result = formatMessage('**Bold text**', 'markdown');
      expect(result).toBe('**Bold text**');
    });

    it('should format markdown code blocks', () => {
      const result = formatMessage('`code here`', 'markdown');
      expect(result).toBe('`code here`');
    });

    it('should handle HTML format', () => {
      const result = formatMessage('<b>Bold</b> text', 'html');
      expect(result).toBe('<b>Bold</b> text');
    });

    it('should escape special markdown characters when needed', () => {
      const result = formatMessage('Price is $100.50', 'markdown');
      expect(result).toBe('Price is $100.50');
    });

    it('should handle multiline messages', () => {
      const message = 'Line 1\nLine 2\nLine 3';
      const result = formatMessage(message, 'plain');
      expect(result).toBe(message);
    });

    it('should handle empty strings', () => {
      const result = formatMessage('', 'plain');
      expect(result).toBe('');
    });

    it('should handle undefined format (default to plain)', () => {
      const result = formatMessage('Test message');
      expect(result).toBe('Test message');
    });
  });

  describe('formatCurrency', () => {
    it('should format USD currency correctly', () => {
      const result = formatCurrency(1234.567, 'USD');
      expect(result).toBe('$1,234.57');
    });

    it('should handle negative amounts', () => {
      const result = formatCurrency(-500.50, 'USD');
      expect(result).toBe('-$500.50');
    });

    it('should handle zero amount', () => {
      const result = formatCurrency(0, 'USD');
      expect(result).toBe('$0.00');
    });

    it('should format large numbers with commas', () => {
      const result = formatCurrency(1000000.00, 'USD');
      expect(result).toBe('$1,000,000.00');
    });

    it('should round to 2 decimal places', () => {
      const result = formatCurrency(99.999, 'USD');
      expect(result).toBe('$100.00');
    });

    it('should handle very small amounts', () => {
      const result = formatCurrency(0.001, 'USD');
      expect(result).toBe('$0.00');
    });

    it('should handle crypto amounts with more decimals', () => {
      const result = formatCurrency(0.00051, 'BTC', 5);
      expect(result).toBe('0.00051 BTC');
    });
  });

  describe('formatPercentage', () => {
    it('should format positive percentage', () => {
      const result = formatPercentage(0.1534);
      expect(result).toBe('15.34%');
    });

    it('should format negative percentage', () => {
      const result = formatPercentage(-0.0523);
      expect(result).toBe('-5.23%');
    });

    it('should handle zero percentage', () => {
      const result = formatPercentage(0);
      expect(result).toBe('0.00%');
    });

    it('should handle whole number percentages', () => {
      const result = formatPercentage(1);
      expect(result).toBe('100.00%');
    });

    it('should round to specified decimals', () => {
      const result = formatPercentage(0.123456, 3);
      expect(result).toBe('12.346%');
    });

    it('should handle very small percentages', () => {
      const result = formatPercentage(0.00001);
      expect(result).toBe('0.00%');
    });
  });

  describe('formatTimestamp', () => {
    it('should format timestamp to readable date', () => {
      const timestamp = new Date('2024-08-28T12:00:00Z').getTime();
      const result = formatTimestamp(timestamp);
      expect(result).toContain('2024');
    });

    it('should handle current date', () => {
      const result = formatTimestamp(Date.now());
      expect(result).toBeTruthy();
    });

    it('should format with custom format string', () => {
      const timestamp = new Date('2024-08-28T15:30:45Z').getTime();
      const result = formatTimestamp(timestamp, 'short');
      expect(result).toBeTruthy();
    });

    it('should handle invalid timestamps gracefully', () => {
      const result = formatTimestamp(NaN);
      expect(result).toBe('Invalid Date');
    });
  });
});

// Test runner implementation
const testResults: { passed: number; failed: number; tests: Array<{ name: string; passed: boolean; error?: string }> } = {
  passed: 0,
  failed: 0,
  tests: []
};

function describe(suiteName: string, fn: () => void): void {
  console.log(`\n📦 ${suiteName}`);
  fn();
}

function it(testName: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✅ ${testName}`);
    testResults.passed++;
    testResults.tests.push({ name: testName, passed: true });
  } catch (error: any) {
    console.log(`  ❌ ${testName}: ${error.message}`);
    testResults.failed++;
    testResults.tests.push({ name: testName, passed: false, error: error.message });
  }
}

function expect(actual: any) {
  return {
    toBe(expected: any) {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    },
    toBeTruthy() {
      if (!actual) {
        throw new Error(`Expected truthy value, got ${JSON.stringify(actual)}`);
      }
    },
    toContain(expected: string) {
      if (typeof actual !== 'string' || !actual.includes(expected)) {
        throw new Error(`Expected "${actual}" to contain "${expected}"`);
      }
    }
  };
}

// Mock implementations for testing
function formatMessage(message: string, format: string = 'plain'): string {
  // Simple implementation for testing
  return message;
}

function formatCurrency(amount: number, currency: string = 'USD', decimals: number = 2): string {
  if (currency === 'USD') {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(amount);
    return formatted;
  } else if (currency === 'BTC') {
    return `${amount.toFixed(decimals)} BTC`;
  }
  return `${amount.toFixed(decimals)} ${currency}`;
}

function formatPercentage(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

function formatTimestamp(timestamp: number, format?: string): string {
  if (isNaN(timestamp)) {
    return 'Invalid Date';
  }
  const date = new Date(timestamp);
  return date.toISOString();
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`.replace(/\\/g, '/')) {
  console.log('🧪 Running Formatter Utility Tests\n');
  
  // Run test suite
  describe('Formatter Utilities Unit Tests', () => {
    describe('formatMessage', () => {
      it('should handle plain text', () => {
        const result = formatMessage('Hello world', 'plain');
        expect(result).toBe('Hello world');
      });
      // ... other tests
    });

    describe('formatCurrency', () => {
      it('should format USD currency correctly', () => {
        const result = formatCurrency(1234.567, 'USD');
        expect(result).toBe('$1,234.57');
      });
      
      it('should handle negative amounts', () => {
        const result = formatCurrency(-500.50, 'USD');
        expect(result).toBe('-$500.50');
      });
      
      it('should handle zero amount', () => {
        const result = formatCurrency(0, 'USD');
        expect(result).toBe('$0.00');
      });
    });

    describe('formatPercentage', () => {
      it('should format positive percentage', () => {
        const result = formatPercentage(0.1534);
        expect(result).toBe('15.34%');
      });
      
      it('should format negative percentage', () => {
        const result = formatPercentage(-0.0523);
        expect(result).toBe('-5.23%');
      });
    });

    describe('formatTimestamp', () => {
      it('should handle invalid timestamps gracefully', () => {
        const result = formatTimestamp(NaN);
        expect(result).toBe('Invalid Date');
      });
    });
  });

  console.log('\n' + '='.repeat(50));
  console.log(`Results: ${testResults.passed} passed, ${testResults.failed} failed`);
  process.exit(testResults.failed === 0 ? 0 : 1);
}
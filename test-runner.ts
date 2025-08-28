#!/usr/bin/env tsx
// Comprehensive test runner for all test suites

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface TestSuite {
  name: string;
  path: string;
  type: 'unit' | 'integration' | 'e2e';
}

const testSuites: TestSuite[] = [
  // Unit tests
  {
    name: 'UserService Unit Tests',
    path: 'tests/unit/services/userService.simple.test.ts',
    type: 'unit'
  },
  
  // Integration tests
  {
    name: 'Position Command Integration',
    path: 'tests/integration/position-integration.test.ts',
    type: 'integration'
  }
];

async function runTestSuite(suite: TestSuite): Promise<{ passed: boolean; output: string }> {
  try {
    const { stdout, stderr } = await execAsync(`npx tsx ${suite.path}`);
    const output = stdout + (stderr || '');
    const passed = !output.includes('failed') || output.includes('0 failed');
    return { passed, output };
  } catch (error: any) {
    return { passed: false, output: error.message };
  }
}

async function runAllTests() {
  console.log('🧪 Comprehensive Test Suite Runner');
  console.log('=' .repeat(60));
  console.log();
  
  const results = {
    unit: { passed: 0, failed: 0, total: 0 },
    integration: { passed: 0, failed: 0, total: 0 },
    e2e: { passed: 0, failed: 0, total: 0 },
    overall: { passed: 0, failed: 0, total: 0 }
  };

  // Run tests by type
  const testTypes: Array<'unit' | 'integration' | 'e2e'> = ['unit', 'integration', 'e2e'];
  
  for (const type of testTypes) {
    const suitesOfType = testSuites.filter(s => s.type === type);
    
    if (suitesOfType.length === 0) continue;
    
    console.log(`\n📋 Running ${type.toUpperCase()} Tests`);
    console.log('-'.repeat(40));
    
    for (const suite of suitesOfType) {
      process.stdout.write(`  Running ${suite.name}... `);
      
      const result = await runTestSuite(suite);
      results[type].total++;
      results.overall.total++;
      
      if (result.passed) {
        console.log('✅ PASSED');
        results[type].passed++;
        results.overall.passed++;
        
        // Show summary from output if available
        const summaryMatch = result.output.match(/(\d+) passed, (\d+) failed/);
        if (summaryMatch) {
          console.log(`    └─ ${summaryMatch[0]}`);
        }
      } else {
        console.log('❌ FAILED');
        results[type].failed++;
        results.overall.failed++;
        
        // Show error summary
        const lines = result.output.split('\n');
        const errorLines = lines.filter(l => l.includes('❌') || l.includes('Error'));
        if (errorLines.length > 0) {
          errorLines.slice(0, 3).forEach(line => {
            console.log(`    └─ ${line.trim()}`);
          });
        }
      }
    }
  }

  // Print summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('=' .repeat(60));
  
  console.log('\nBy Test Type:');
  for (const type of testTypes) {
    if (results[type].total > 0) {
      const percentage = Math.round((results[type].passed / results[type].total) * 100);
      const status = results[type].failed === 0 ? '✅' : '⚠️';
      console.log(`  ${status} ${type.toUpperCase().padEnd(12)} : ${results[type].passed}/${results[type].total} passed (${percentage}%)`);
    }
  }
  
  console.log('\nOverall:');
  const overallPercentage = Math.round((results.overall.passed / results.overall.total) * 100);
  const overallStatus = results.overall.failed === 0 ? '🎉' : '❌';
  console.log(`  ${overallStatus} Total: ${results.overall.passed}/${results.overall.total} tests passed (${overallPercentage}%)`);
  
  if (results.overall.failed === 0) {
    console.log('\n✨ All tests passed successfully! ✨');
  } else {
    console.log(`\n⚠️  ${results.overall.failed} test suite(s) failed. Please review the errors above.`);
  }
  
  console.log('=' .repeat(60));
  
  return results.overall.failed === 0;
}

// Command line argument parsing
const args = process.argv.slice(2);
const runType = args[0];

async function main() {
  if (runType === 'unit' || runType === 'integration' || runType === 'e2e') {
    // Run specific type of tests
    console.log(`🧪 Running ${runType.toUpperCase()} tests only\n`);
    const suitesOfType = testSuites.filter(s => s.type === runType);
    
    let allPassed = true;
    for (const suite of suitesOfType) {
      console.log(`Running ${suite.name}...`);
      const result = await runTestSuite(suite);
      if (!result.passed) {
        allPassed = false;
        console.log(`❌ ${suite.name} failed`);
        console.log(result.output);
      } else {
        console.log(`✅ ${suite.name} passed`);
      }
    }
    
    process.exit(allPassed ? 0 : 1);
  } else if (args[0]) {
    console.log(`Unknown test type: ${args[0]}`);
    console.log('Usage: npm run test:all [unit|integration|e2e]');
    process.exit(1);
  } else {
    // Run all tests
    const success = await runAllTests();
    process.exit(success ? 0 : 1);
  }
}

// Run tests
main().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
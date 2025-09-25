/**
 * Error handling utilities for PDF table extraction
 */

const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class TableExtractionErrorHandler {
  /**
   * Check if Python is available
   */
  static async checkPythonAvailability() {
    try {
      await execAsync('python3 --version');
      return { available: true, command: 'python3' };
    } catch (error) {
      try {
        await execAsync('python --version');
        return { available: true, command: 'python' };
      } catch (error2) {
        return { 
          available: false, 
          error: 'Python not found. Please install Python 3.7+',
          suggestions: [
            'Install Python from https://python.org',
            'Ensure Python is added to PATH',
            'Restart your terminal/command prompt'
          ]
        };
      }
    }
  }

  /**
   * Check if Python script exists
   */
  static async checkScriptExists(scriptPath) {
    try {
      const exists = await fs.pathExists(scriptPath);
      return {
        exists,
        path: scriptPath,
        error: exists ? null : `Script not found: ${scriptPath}`
      };
    } catch (error) {
      return {
        exists: false,
        path: scriptPath,
        error: `Error checking script: ${error.message}`
      };
    }
  }

  /**
   * Test Python dependencies
   */
  static async testPythonDependencies() {
    try {
      const testScript = path.join(__dirname, '../scripts/test_python_deps.py');
      const { stdout, stderr } = await execAsync(`python3 "${testScript}"`);
      
      return {
        success: true,
        output: stdout,
        warnings: stderr
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        suggestions: [
          'Install Python dependencies: pip install -r requirements.txt',
          'Check Python installation',
          'Verify virtual environment activation'
        ]
      };
    }
  }

  /**
   * Get detailed error information
   */
  static async getDetailedErrorInfo(error, context = {}) {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context
    };

    // Check Python availability
    const pythonCheck = await this.checkPythonAvailability();
    errorInfo.python = pythonCheck;

    // Check script existence
    const scriptPath = path.join(__dirname, '../scripts/extract_tables_pdfplumber.py');
    const scriptCheck = await this.checkScriptExists(scriptPath);
    errorInfo.script = scriptCheck;

    // Test dependencies if Python is available
    if (pythonCheck.available) {
      const depsTest = await this.testPythonDependencies();
      errorInfo.dependencies = depsTest;
    }

    return errorInfo;
  }

  /**
   * Format error for API response
   */
  static formatErrorForAPI(error, detailedInfo = null) {
    const baseError = {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };

    if (detailedInfo) {
      baseError.details = {
        python: detailedInfo.python,
        script: detailedInfo.script,
        dependencies: detailedInfo.dependencies
      };
    }

    return baseError;
  }

  /**
   * Log error with context
   */
  static logError(error, context = {}) {
    console.error('='.repeat(50));
    console.error('PDF TABLE EXTRACTION ERROR');
    console.error('='.repeat(50));
    console.error('Timestamp:', new Date().toISOString());
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('Context:', JSON.stringify(context, null, 2));
    console.error('='.repeat(50));
  }
}

module.exports = TableExtractionErrorHandler;

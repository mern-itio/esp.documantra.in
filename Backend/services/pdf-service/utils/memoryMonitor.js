/**
 * Memory monitoring utility for the PDF service
 * Helps track and manage memory usage to prevent ENOMEM errors
 */

const os = require('os');

class MemoryMonitor {
  constructor() {
    this.memoryThreshold = 1500; // MB - threshold for high memory usage
    this.lastGcTime = Date.now();
    this.gcInterval = 30000; // 30 seconds minimum between GC calls
  }

  /**
   * Get current memory usage statistics
   * @returns {Object} Memory usage information
   */
  getMemoryUsage() {
    const memUsage = process.memoryUsage();
    const systemMem = os.totalmem();
    const freeMem = os.freemem();
    
    return {
      process: {
        rss: Math.round(memUsage.rss / 1024 / 1024), // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        external: Math.round(memUsage.external / 1024 / 1024), // MB
        arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024) // MB
      },
      system: {
        total: Math.round(systemMem / 1024 / 1024), // MB
        free: Math.round(freeMem / 1024 / 1024), // MB
        used: Math.round((systemMem - freeMem) / 1024 / 1024) // MB
      }
    };
  }

  /**
   * Check if memory usage is high
   * @returns {boolean} True if memory usage is above threshold
   */
  isMemoryHigh() {
    const memUsage = this.getMemoryUsage();
    return memUsage.process.heapUsed > this.memoryThreshold;
  }

  /**
   * Force garbage collection if available and enough time has passed
   * @returns {boolean} True if GC was performed
   */
  forceGarbageCollection() {
    const now = Date.now();
    
    // Only run GC if enough time has passed since last GC
    if (now - this.lastGcTime < this.gcInterval) {
      return false;
    }

    if (global.gc) {
      const beforeMem = this.getMemoryUsage();
      global.gc();
      const afterMem = this.getMemoryUsage();
      
      this.lastGcTime = now;
      
      const freed = beforeMem.process.heapUsed - afterMem.process.heapUsed;
      console.log(`Garbage collection performed. Freed: ${freed}MB`);
      
      return true;
    }
    
    return false;
  }

  /**
   * Log current memory status
   */
  logMemoryStatus() {
    const memUsage = this.getMemoryUsage();
    const isHigh = this.isMemoryHigh();
    
    console.log('=== Memory Status ===');
    console.log(`Process Memory: ${memUsage.process.heapUsed}MB / ${memUsage.process.heapTotal}MB (RSS: ${memUsage.process.rss}MB)`);
    console.log(`System Memory: ${memUsage.system.used}MB / ${memUsage.system.total}MB (Free: ${memUsage.system.free}MB)`);
    console.log(`Memory Status: ${isHigh ? 'HIGH' : 'NORMAL'}`);
    console.log('====================');
  }

  /**
   * Check if it's safe to perform memory-intensive operations
   * @returns {boolean} True if safe to proceed
   */
  isSafeToProceed() {
    const memUsage = this.getMemoryUsage();
    
    // Don't proceed if heap usage is too high
    if (memUsage.process.heapUsed > this.memoryThreshold) {
      return false;
    }
    
    // Don't proceed if system memory is very low
    if (memUsage.system.free < 500) { // Less than 500MB free
      return false;
    }
    
    return true;
  }

  /**
   * Get memory usage percentage
   * @returns {number} Memory usage percentage (0-100)
   */
  getMemoryUsagePercentage() {
    const memUsage = this.getMemoryUsage();
    return Math.round((memUsage.process.heapUsed / memUsage.process.heapTotal) * 100);
  }
}

// Create singleton instance
const memoryMonitor = new MemoryMonitor();

module.exports = memoryMonitor;


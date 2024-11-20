const DEBUG = process.env.DEBUG === 'true';

class Logger {
  static debug(...args) {
    if (DEBUG) {
      console.log('[DEBUG]', ...args);
    }
  }

  static error(...args) {
    if (DEBUG) {
      console.error('[ERROR]', ...args);
    } else {
      const messages = args.map(arg => 
        arg instanceof Error ? arg.message : arg
      );
      console.error('[ERROR]', ...messages);
    }
  }

  static info(...args) {
    console.log('[INFO]', ...args);
  }
}

export default Logger;
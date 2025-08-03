class Logger {
  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    if (data) {
      return `${logMessage} ${JSON.stringify(data, null, 2)}`;
    }
    
    return logMessage;
  }

  info(message: string, data?: any): void {
    console.log(this.formatMessage('info', message, data));
  }

  error(message: string, error?: any): void {
    console.error(this.formatMessage('error', message, error));
  }

  warn(message: string, data?: any): void {
    console.warn(this.formatMessage('warn', message, data));
  }

  debug(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('debug', message, data));
    }
  }
}

export const logger = new Logger();
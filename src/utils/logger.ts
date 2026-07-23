import winston from 'winston';

/**
 * Abstracción de logging (Winston).
 * La app solo usa info/warn/error; se puede cambiar el motor sin tocar middlewares.
 */
export type Logger = {
  info: (message: unknown) => void;
  warn: (message: unknown) => void;
  error: (message: unknown) => void;
};

const isProduction = process.env.NODE_ENV === 'production';

const winstonLogger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  defaultMeta: { service: 'ffcore-api' },
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    isProduction
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
            const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
            const body = stack ?? message;
            return `${timestamp} [${level}] ${body}${extra}`;
          })
        )
  ),
  transports: [new winston.transports.Console()],
});

function toLogArgs(message: unknown): { message: string; meta?: Record<string, unknown> } {
  if (message instanceof Error) {
    return {
      message: message.message,
      meta: {
        name: message.name,
        stack: message.stack,
        cause: (message as Error & { cause?: unknown }).cause,
      },
    };
  }

  if (typeof message === 'string') {
    return { message };
  }

  return { message: String(message), meta: { value: message } };
}

export const logger: Logger = {
  info: (message) => {
    const { message: msg, meta } = toLogArgs(message);
    winstonLogger.info(msg, meta);
  },
  warn: (message) => {
    const { message: msg, meta } = toLogArgs(message);
    winstonLogger.warn(msg, meta);
  },
  error: (message) => {
    const { message: msg, meta } = toLogArgs(message);
    winstonLogger.error(msg, meta);
  },
};

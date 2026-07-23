import pino from 'pino';
import pretty from 'pino-pretty';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGS_DIR = path.resolve(__dirname, '../../logs');

if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

const isDevelopment = process.env.NODE_ENV !== 'production';

function getCallerMixin(context, level) {
  if (level >= 40) {
    const err = new Error();
    Error.captureStackTrace(err);
    const lines = err.stack.split('\n');
    const callerLine = lines.find(line => 
      line.includes('at ') && 
      !line.includes('node_modules') && 
      !line.includes('logger.js')
    );
    if (callerLine) {
      const match = callerLine.match(/\((.*:\d+:\d+)\)/) || callerLine.match(/at (.*:\d+:\d+)/);
      if (match) return { caller: `[${match[1]}]` };
    }
  }
  return {};
}

const consoleStream = pretty({
  colorize: true,
  translateTime: 'SYS:standard',
  ignore: 'pid,hostname,req,res,responseTime',
  messageFormat: '{msg} {caller}',
});

// Global logger
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  mixin: getCallerMixin,
}, consoleStream);

const routeLoggers = {};

export function getRouteLogger(prefix) {
  if (!routeLoggers[prefix]) {
    const safePrefix = String(prefix).replace(/[<>:"/\\|?*]/g, "_");
    const logFilePath = path.join(LOGS_DIR, `${safePrefix}.log`);

    const fileStream = pretty({
      destination: fs.createWriteStream(logFilePath, { flags: 'a' }),
      colorize: false,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname,req,res,responseTime',
      messageFormat: '{msg} {caller}',
    });

    const streams = [
      { stream: consoleStream, level: isDevelopment ? 'debug' : 'info' },
      { stream: fileStream, level: 'info' }
    ];

    routeLoggers[prefix] = pino({
      level: process.env.LOG_LEVEL || 'info',
      mixin: getCallerMixin,
    }, pino.multistream(streams));
  }
  return routeLoggers[prefix];
}

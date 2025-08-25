import morgan from 'morgan';
import type { RequestHandler } from 'express';

const MAX_LOGS = 2000;
const buffer: string[] = [];

export const logsStream = {
  write: (str: string) => {
    const line = str.trimEnd();
    buffer.push(line);
    if (buffer.length > MAX_LOGS) buffer.splice(0, buffer.length - MAX_LOGS);
  }
};

export const logger: RequestHandler = morgan('combined', { stream: logsStream as any });

export function getLogs(): string[] {
  return buffer.slice(-MAX_LOGS);
}

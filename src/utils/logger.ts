import winston from "winston";
import "dotenv/config";

const ENV: string = process.env.ENV ?? "prod";

const loggerFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  ENV === "prod" || ENV === "staging"
    ? winston.format.json()
    : winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, metadata }) => {
    return `[${timestamp}] ${level}: ${message}. ${metadata ? JSON.stringify(metadata) : ""}`;
  })
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    level: ENV === "staging" ? "info" : ENV === "dev" ? "debug" : "warn",
  })
];

if (ENV === "prod" || ENV === "staging") {
  transports.push(
    new winston.transports.File({
     filename: "logs/error.log",
      level: "error",
    }),
    new winston.transports.File({
      filename: "logs/combined.log",
    })
  );
}

export const logger: winston.Logger = winston.createLogger({
  format: loggerFormat,
  transports
});

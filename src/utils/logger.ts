import winston from "winston";
import "dotenv/config";

const isProduction = process.env.ENV === "prod";

const transports: winston.transport[] = [
  new winston.transports.Console()
];

if (isProduction) {
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
  level: isProduction ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    isProduction 
      ? winston.format.json() 
      : winston.format.colorize({ all: true }),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level}: ${message}`;
    })
  ),
  transports
});

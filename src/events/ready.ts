import { Client, Events } from "discord.js";
import { logger } from "../utils/logger";

// Run once
export const clientReady = {
  name: Events.ClientReady,
  once: true,
  execute: (client: Client<true>) => {
    logger.info(`Ready! Logged in as ${client.user.tag}`);
  }
}

import { Events } from "discord.js";

// Run once
export const clientReady = {
  name: Events.ClientReady,
  once: true,
  execute: (client: any) => {
		console.log(`Ready! Logged in as ${client.user.tag}`);
  }

}

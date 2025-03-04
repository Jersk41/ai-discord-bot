import {
  CacheType,
  Interaction,
  MessageFlags,
} from "discord.js";
import { slashCommands } from "../commands";

const interactionCreate = async (interaction: Interaction<CacheType>): Promise<void> => {
  if (!interaction.isChatInputCommand()) return;
  //const command = interaction.client.commands.get(interaction.commandName);
  const command = slashCommands.get(interaction.commandName);

  if (!command) {
    console.error(`No Command matching ${interaction.commandName} was found`);
    return;
  }
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Failed to execute command ${interaction.commandName}`);
    console.error("Error: ", error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        flags: MessageFlags.Ephemeral,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        flags: MessageFlags.Ephemeral,
      });
    }
  }
};

export default interactionCreate;

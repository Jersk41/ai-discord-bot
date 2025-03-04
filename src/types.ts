import type {
  SlashCommandBuilder,
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  SlashCommandSubcommandsOnlyBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandBuilder,
  SlashCommandSubcommandGroupBuilder,
  Client,
  Message
} from "discord.js";

// Command builder types
export type SlashCommandBuilderTypes =
  | SlashCommandBuilder
  | SlashCommandOptionsOnlyBuilder
  | SlashCommandSubcommandsOnlyBuilder
  | SlashCommandSubcommandBuilder
  | SlashCommandSubcommandGroupBuilder;

export interface SlashCommand {
  data: SlashCommandBuilderTypes;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
  cooldown?: number;
}

// Client ready event handler type
export interface ClientReadyHandler {
  name: string;
  once: boolean;
  execute: (client: Client<true>) => void | Promise<void>;
}

// Message handler types
export interface MessageHandler {
  (message: Message): Promise<void>;
}

// Command options type
export interface CommandOptions {
  [key: string]: string | number | boolean;
}

export interface MessageResponse {
  content: string;
  attachments?: Array<{
    name: string;
    data: Buffer;
  }>;
}

export interface ErrorResponse {
  message: string;
  code?: number;
  details?: unknown;
}

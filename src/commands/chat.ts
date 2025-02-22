import { SlashCommandBuilder, InteractionEditReplyOptions } from "discord.js";
import { SlashCommand } from "../types";
import { hf,  CHAT_MODELS, SYSTEM_PROMPT } from "../utils/inferences"
import type { ChatCompletionOutput } from "@huggingface/tasks";

type listModelType = {
  name: string,
  value: string
}

const list_models: Array<listModelType> = [];

for (const [key, value] of Object.entries(CHAT_MODELS)){
  list_models.push({
    name: key,
    value: value
  })
}

const chatCommand: SlashCommand = {
  command: new SlashCommandBuilder()
  .setName("chat")
  .setDescription("Ask bot about something")
  .addStringOption(
    (option) => option.setName("message").setDescription("Your question").setRequired(true)
  )
  .addStringOption(
    (option) => option
    .setName("model")
    .setDescription("Choose AI Model")
    .addChoices(...list_models)
  ),
  async execute(interaction){
    await interaction.deferReply();
    const options: { [key: string]: string | number | boolean } = {};
    for (let i = 0; i < interaction.options.data.length; i++) {
      const element = interaction.options.data[i];
      if (element.name && element.value) options[element.name] = element.value;
    }

    const question = options.question;
    const modelChoice = options.model || CHAT_MODELS.phi3;
    try{
      const response: ChatCompletionOutput = await hf.chatCompletion({
        model: modelChoice, //CHAT_MODELS[modelChoice.name] || CHAT_MODELS.phi3,
        messages: [
          SYSTEM_PROMPT,
          { role: "user", content: question }
        ],
        max_tokens: 512,
      });

      const botResponse = response.choices[0].message;

      if (!botResponse || !botResponse.content){
        console.error("Respon bot tidak cocok", botResponse)
        await interaction.editReply("Maaf, bot tidak memberikan respon yang valid."); // User-friendly message
        return; // Important: Stop execution to avoid further errors
      }

      const content = botResponse.content.toString(); // Extract and convert to string *once*

      console.log('bot message: ', content);

      // Option 1: Simple string reply (if content is always a string)
      // await interaction.editReply(content);

      // Option 2:  Handles potential issues, more robust
      const replyOptions: InteractionEditReplyOptions = {
        content: content, // Now guaranteed to be a string
      };
      await interaction.editReply(replyOptions);

    } catch (error) {
      console.error(error);
      await interaction.editReply(
        "maaf, terjadi kesalahan saat memproses permintaan anda."
      );
    }
  }
}

export default chatCommand;

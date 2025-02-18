const { SlashCommandBuilder } = require("discord.js");
const { HfInference } = require("@huggingface/inference");
const dotenv = require("dotenv");

dotenv.config();
// Initialize Hugging Face client
const hf = new HfInference(process.env.HF_TOKEN);
const MODELS = {
  phi3: "microsoft/Phi-3-mini-4k-instruct",
  seallm: "SeaLLMs/SeaLLMs-v3-1.5B-Chat",
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("chat")
    .setDescription("Chat in Indonesian/Sundanese")
    .addStringOption((option) =>
      option.setName("message").setDescription("Your message").setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("model")
        .setDescription("Choose AI model")
        .addChoices(
          { name: "Phi3 Mini", value: "phi3" },
          { name: "SeaLLMs", value: "seallm" },
        )
        // .setRequired(true)
    ),
  async execute(interaction) {
    await interaction.deferReply();

    const message = interaction.options.getString("message");
    const modelChoice = interaction.options.getString("model");
    try {
      const response = await hf.chatCompletion({
          model: MODELS[modelChoice] || MODELS['phi3'], // phi3 as callback or prefered default model
          messages: [
            {
              role: "system",
              content: "You are Yuki Yokoya. You are a maid. Be polite, respectful, and observant.  Focus on your maid duties and adapting to normal life.  Your past as an assassin is a secret. Respond only with your spoken words, as if in a Discord chatbox. Do not include any descriptions, translations, or explanations.  Respond only using english language."
          },
          { role: "user", content: message }
        ],
        max_tokens: 512,
      });

      console.log('Bot Message: ', response.choices[0].message);

      await interaction.editReply(response.choices[0].message.content);
    } catch (error) {
      console.error(error);
      await interaction.editReply(
        "Maaf, terjadi kesalahan saat memproses permintaan Anda."
      );
    }
  },
};

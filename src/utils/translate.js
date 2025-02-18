const {hf, TRANSLATE_MODELS, CHAT_MODELS, SYSTEM_PROMPT } = require('./inferences');

const translate = async (text, target_lang = 'en') => {
  const model = TRANSLATE_MODELS.opus_mul_en;
  const response = await hf.translation({
    model: model,
    inputs: text,
    //src_lang: 'ido',
    tgt_lang: target_lang,
  });
  return response.translation_text;
};

/*
const sampleText = 'Selamat pagi!'; 
translate(sampleText)
  .then(out => {
    console.log(`Source: ${sampleText}\nTranslated: ${out}`);
    console.log('Debug: ', out);
  }).catch(console.error);
*/
// Test the function with chat model
async function test_translated_chat(){
  const message = {
    content: 'Selamat pagi!, tolong buatkan aku sarapan XD',
  };
  const translated = await translate(message.content.replace(/<@!\d+>/g, "").trim(),
  'ido');
  console.log('Source: ', message.content.replace(/<@!\d+>/g, "").trim(),'Debug translated only: ', translated);
  const response = await hf.chatCompletion({
      model: CHAT_MODELS.phi3,
      messages: [
	SYSTEM_PROMPT,
        {
          role: "user",
          content: translated,
        },
      ],
      max_tokens: 512,
      response_format: {
        type: "json",
        value: `{
          "$id": "https://json-schema.hyperjump.io/schema3",
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "type": "object",
          "properties": {
            "data": {
              "type": "string",
              "description": "Response text that can contain plain text or markdown formatting"
            }
          },
          "required": ["data"]
        }`,
      },
    });
    // Parse and validate response
    let botResponse;
    try {
      const parsed = JSON.parse(response.choices[0].message.content);
      botResponse = await translate(parsed.data, ['id']);
    } catch (err) {
      console.error("Response parsing error:", err);
      botResponse = response.choices[0].message.content;
      console.log('Error Debug: ', botResponse);
    }
    console.log('Debug BotResponse: ', await botResponse);
    return botResponse;
}

/*
test_translated_chat()
  .then(out => {
    console.log('Debug test translated text: ', out);
  }).catch(console.error);
*/
module.exports = {
  translate,
  //test_translated_chat
};

import {
  textToLatin,
  doesContainBadWords,
  preprocessWordLists,
  findBadWordLocations,
  getBadWords,
  censorText,
  WordReplacementType,
} from "deep-profanity-filter";
import wordlist from "./wordlists.json";

type slangWordsType = {
  word: string;
  meaning: string;
};

const slangwordsData: Array<slangWordsType> = wordlist.slangwords;
const badwordsData: string[] = wordlist.badwords;

const badwordsFilter = preprocessWordLists([...badwordsData], []);

export type filterWordResult = {
  message: string;
  profanity?: { badwordcount: number; badwords: string[] };
};

export const filterWords = (text: string): filterWordResult => {
  try {
    const latinText = textToLatin(text);
    let cleanText: string;
    let profanity;
    if (doesContainBadWords(latinText, badwordsFilter)) {
      let loc = findBadWordLocations(latinText, badwordsFilter);
      const badWords = getBadWords(loc);
      cleanText = censorText(latinText, badwordsFilter, {
        replacementType: WordReplacementType.RepeatCharacter,
        replacementRepeatCharacter: ".",
      });
      if (badWords.length > 0) {
        profanity = { badwordcount: badWords.length, badwords: badWords };
      } else {
        console.info("No bad words were found."); // Or all bad words whitelisted.
      }
      return { message: cleanText, profanity: profanity };
    } else {
      return { message: latinText, profanity: profanity };
    }
  } catch (error: unknown | any) {
    console.error("Error on word checking", error);
    throw new Error(error instanceof Error ? error.message : error);
  }
};

export const cleanText = (message: string): string => {
  // Remove URLs
  let cleanText = message
    .replace(/https?:\/\/[\w.-]+(\/\S*)?/g, "")
    .replace(/<:[\w]+:[0-9]+>/g, "") // Remove custom emojis
    .replace(/:[\w]+:/g, "") // Remove standard emojis
    .trim();

  // Replace slang words with their formal meanings
  for (const slang of slangwordsData) {
    const regex = new RegExp(`\\b${slang.word}\\b`, "gi");
    cleanText = cleanText.replace(regex, slang.meaning);
  }

  return cleanText;
};

import { describe, expect, test } from "@jest/globals";
import { filterWords, cleanText, type filterWordResult } from "../src/utils/filter";

describe("Find any badwords in text", () => {
  test("should be get one bad word", () => {
    const filterResult: filterWordResult = filterWords("Dasar tolol");
    expect(filterResult.profanity?.badwords).toEqual(["tolol"]);
    expect(filterResult.message).toBe("dasar .....")
  });
});

describe("Translate slang words in text", () => {
  test("slang words translated correctly", () => {
    expect(cleanText("owo, gua juga pernah gitu tuh wkwk")).toBe("oh woah, gua juga pernah gitu tuh hahaha");
    expect(cleanText("wkwkwkwkw")).toBe("wkwkwkwkw"); //not changed
    expect(cleanText("waduh, cek urg ge naon")).toBe("waduh, cek urang ge naon");
  });
});

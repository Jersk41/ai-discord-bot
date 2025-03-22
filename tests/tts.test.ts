import fs from "fs";
import path from "path";
import { createAudioResource } from "@discordjs/voice";
import { generateTTS } from "../src/commands/voice";
import { describe, expect, test, beforeAll, afterAll } from "@jest/globals";

describe("TTS Generation Tests", () => {
  const testDir = path.join(__dirname, "test-audio");
  const testFile = path.join(testDir, "test-tts.wav");

  // Setup test directory
  beforeAll(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  // Cleanup after tests
  afterAll(() => {
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
    if (fs.existsSync(testDir)) {
      fs.rmdirSync(testDir);
    }
  });

  test("should generate valid audio file", async () => {
    const testText = "Hello, this is a test message";

    await generateTTS(testText, testFile);

    // Check if file exists
    expect(fs.existsSync(testFile)).toBeTruthy();

    // Check if file has content
    const stats = fs.statSync(testFile);
    expect(stats.size).toBeGreaterThan(0);
  });

  test("should create valid Discord audio resource", async () => {
    const testText = "Testing Discord audio compatibility";

    await generateTTS(testText, testFile);

    // Try creating Discord audio resource
    /*
    let audioResource: AudioResource;
    expect(() => {
      audioResource = createAudioResource(testFile);
    }).not.toThrow();
    */
    // Verify audio resource properties
    const resource = createAudioResource(testFile);
    expect(resource.playbackDuration).toBeDefined();
    expect(resource.readable).toBeTruthy();
  });

  test("should handle empty text input", async () => {
    await expect(generateTTS("", testFile)).rejects.toThrow(
      "Invalid text input"
    );
  });

  test("should handle non-string input", async () => {
    // @ts-expect-error because given data should be text not number
    await expect(generateTTS(123, testFile)).rejects.toThrow(
      "Invalid text input"
    );
  });

  test("should handle text longer than 200 characters", async () => {
    const longText =
      "This is a very long message that needs to be split into multiple parts. " +
      "We will add some punctuation marks, like commas, and periods to help with the splitting process. " +
      "The Google TTS API has a limit of 200 characters per request, so we need to handle this properly." +
      "a".repeat(75);
    await expect(generateTTS(longText, testFile)).resolves.not.toThrow();

    // Check if file exists
    expect(fs.existsSync(testFile)).toBeTruthy();

    // Check if file has content
    const stats = fs.statSync(testFile);
    expect(stats.size).toBeGreaterThan(0);
  });

  test("should handle bad words before speak", async () => {
    const sampleCursing = "Kan tai!";
    await expect(generateTTS(sampleCursing, testFile)).resolves.not.toThrow();
  });
});

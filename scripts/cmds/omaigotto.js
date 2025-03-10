const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  name: "omaigotto",
  description: "Translate text to Japanese and generate TTS audio.",
  async execute(ctx) {
    const text = ctx.message.text.split(" ").slice(1).join(" ");

    if (!text) {
      return ctx.reply("❌ Please provide text for TTS conversion.");
    }

    try {
      // Step 1: Translate text to Japanese
      const translatedText = await translate(text, "ja");

      // Step 2: Use the translated text in the TTS API
      const apiURL = `http://152.70.49.30:6969/api/vit?text=${encodeURIComponent(translatedText)}`;

      const res = await axios.get(apiURL);
      const base64Audio = res.data?.audio;

      if (!base64Audio) {
        return ctx.reply("❌ No audio data found.");
      }

      const audioBuffer = Buffer.from(base64Audio, "base64");
      const audioFile = path.join(__dirname, "..", "cache", `TTS_${Date.now()}.mp3`);

      // Ensure cache folder exists
      if (!fs.existsSync(path.join(__dirname, "..", "cache"))) {
        fs.mkdirSync(path.join(__dirname, "..", "cache"));
      }

      fs.writeFileSync(audioFile, audioBuffer);

      await ctx.replyWithAudio({ source: audioFile });
      fs.unlinkSync(audioFile); // Delete the file after sending
    } catch (err) {
      console.error("Error in omaigotto command:", err.message);
      ctx.reply("❌ An error occurred while generating the audio.");
    }
  },
};

async function translate(text, langCode) {
  const res = await axios.get(
    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${langCode}&dt=t&q=${encodeURIComponent(text)}`
  );
  return res.data[0].map(item => item[0]).join('');
}

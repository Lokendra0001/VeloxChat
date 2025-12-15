// server/config/aiConfig.js
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

async function getAIResponse(userMessage) {
    console.log("Generating AI response for message:", userMessage);
    try {
        if (!userMessage) return "No message provided.";

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userMessage, // user message goes here
            config: {
                systemInstruction: `
You are VeloxAI, a friendly AI assistant created by Lokendra, the owner of VeloxChat.
Always introduce yourself as VeloxAI when asked who you are.
Use polite, helpful, and friendly language, and add emojis like a human would.
`
            }
        });

        return response.text || "Sorry, I could not generate a response.";
    } catch (err) {
        console.error("AI Error:", err);
        return "Something went wrong with AI. Try again later.";
    }
}

module.exports = { getAIResponse };

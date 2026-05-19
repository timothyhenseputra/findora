const { GoogleGenerativeAI } = require("@google/generative-ai");

const client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

async function generateItemDescription(itemName, brand, color, photoUrl) {
  try {
    if (!photoUrl) {
      return null;
    }

    const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Analyze this photo of a found item and provide a detailed, objective description in Indonesian.
      
Item Info:
- Name: ${itemName}
- Brand: ${brand || "Unknown"}
- Color: ${color || "Unknown"}

Please provide:
1. Detailed visual description of the item condition
2. Any identifying marks, labels, or features
3. Estimated quality/wear level
4. Any other notable details

Keep it concise (2-3 sentences) and factual.`;

    const imageResponse = await fetch(photoUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString("base64");
    const mimeType = "image/jpeg";

    const response = await model.generateContent([
      {
        inlineData: {
          data: base64Image,
          mimeType,
        },
      },
      prompt,
    ]);

    const description = response.response.text();
    return description;
  } catch (error) {
    console.error("Error generating description:", error.message);
    return null;
  }
}

/**
 * Generate detailed item analysis (format, materials, condition)
 */
async function analyzeItemDetails(photoUrl, itemName) {
  try {
    if (!photoUrl) {
      return null;
    }

    const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Analyze this item in the photo and provide detailed information in Indonesian format:

Item: ${itemName}

Provide:
1. Material type
2. Condition (Excellent/Good/Fair/Poor)
3. Estimated age/model year if possible
4. Size/dimensions estimate
5. Any damage or wear

Format as JSON.`;

    const imageResponse = await fetch(photoUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString("base64");
    const mimeType = "image/jpeg";

    const response = await model.generateContent([
      {
        inlineData: {
          data: base64Image,
          mimeType,
        },
      },
      prompt,
    ]);

    const analysis = response.response.text();
    return analysis;
  } catch (error) {
    console.error("Error analyzing details:", error.message);
    return null;
  }
}

module.exports = {
  generateItemDescription,
  analyzeItemDetails,
};

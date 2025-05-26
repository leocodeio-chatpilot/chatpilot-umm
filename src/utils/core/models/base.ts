import { Provider } from "../spec/providers";
import { geminiModel } from "./gemini";

export class BaseModel {
  constructor(private readonly provider: Provider) {}

  async generateContent(
    prompt: string,
    history: { role: "user" | "model"; text: string }[] = []
  ): Promise<string> {
    if (this.provider !== "gemini") {
      throw new Error(`Unsupported provider: ${this.provider}`);
    }

    const config = {
      responseMimeType: "text/plain",
    };

    // Construct the contents array with history and the new prompt
    const contents = [
      ...history.map((entry) => ({
        role: entry.role,
        parts: [{ text: entry.text }],
      })),
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ];

    try {
      const response = await geminiModel.models.generateContent({
        model: "gemini-2.0-flash",
        config,
        contents,
      });

      if (!response.text) {
        throw new Error("No response from Gemini");
      }

      return response.text;
    } catch (error) {
      console.error("Error generating content:", error);
      throw new Error(`Error generating content: ${error}`);
    }
  }
}

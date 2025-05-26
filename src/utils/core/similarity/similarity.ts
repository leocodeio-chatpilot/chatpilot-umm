import { client } from "../chroma/chromadb";
import { BaseChromaProcessor } from "../chroma/chromadb";
import { BaseModel } from "../models/base";

export class SimilaritySearch {
  private model: BaseModel;
  private dbManager: BaseChromaProcessor;

  constructor(apiKey: string) {
    this.model = new BaseModel("gemini");
    this.dbManager = new BaseChromaProcessor(apiKey, client);
  }

  /**
   * Performs a similarity search using ChromaDB and processes the results with Gemini
   * @param queryText - The text to search for
   * @param apiKey - API key for authentication
   * @returns Promise containing the response text from Gemini
   * @throws Error if the similarity search process fails
   */
  public async query(queryText: string): Promise<string> {
    try {
      // Get similar documents from ChromaDB
      const results = await this.dbManager.queryDocuments(queryText, 3);
      // Start chat session with Gemini
      const response = await this.model.generateContent(
        `You are a helpful assistant. Analyze the user's input to determine its nature.
        
        - If the input is a general greeting or expression of gratitude (e.g., "hi", "hello", "thanks"), respond with a brief and friendly message without referencing any context.
        - If the input is a question or request for information, provide a short, meaningful and concise answer based on the provided context.
        - If the user's input is not related to the context, respond with a message indicating that you are not sure how to answer that question.
        
        User Input: ${queryText}
      
        Context:
        ${results.join("\n")}`
      );

      console.log("response", response);
      return response;
    } catch (error) {
      throw new Error(
        `Error in similarity search: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}

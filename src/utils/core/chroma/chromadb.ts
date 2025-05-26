/**
 * Abstract base class for document processing
 * Handles chunking and storing of text data with ChromaDB integration
 */

/**
 * ChromaDB client
 */
export const client = new ChromaClient({
  path: process.env.CHROMA_DB_URL!,
});

import { ChromaClient, Collection } from "chromadb";

/**
 * Simple embedding function that uses dot product
 */
class SimpleEmbeddingFunction {
  public name = "SimpleEmbeddingFunction";

  public async generate(texts: string[]): Promise<number[][]> {
    return texts.map(() => new Array(384).fill(1));
  }

  public getConfig(): Record<string, any> {
    return {
      type: "simple",
      dimension: 384,
    };
  }

  // Add dimension property
  public dimension = 384;
}

/**
 * Abstract base class for document processing with ChromaDB integration
 */
class BaseChromaProcessor {
  protected apiKey: string;
  protected collection: Collection | null = null;
  protected client: ChromaClient;

  constructor(apiKey: string, client: ChromaClient) {
    this.apiKey = apiKey;
    this.client = client;
  }

  /**
   * Initialize collection for document storage
   * @param collectionName Name of the collection to store documents
   */
  protected async initializeCollection(
    collectionName: string = "data"
  ): Promise<void> {
    const embedder = new SimpleEmbeddingFunction();

    // Add metadata to collection creation
    this.collection = await this.client.getOrCreateCollection({
      name: collectionName,
      embeddingFunction: embedder,
      metadata: {
        "hnsw:space": "cosine",
        dimension: embedder.dimension,
      },
    });
  }

  /**
   * Store text in ChromaDB
   * @param text Text to store
   */
  public async store(text: string): Promise<void> {
    // initialize collection
    await this.initializeCollection();

    // create chunks
    const chunks = this.createChunks(text);

    // store chunks
    const result = await this.storeChunks(chunks);
    console.log("store 2", result);
  }

  /**
   * Creates chunks from input text
   * @param text Input text to be chunked
   * @param chunkSize Size of each chunk in words
   * @returns Array of word chunks
   */
  protected createChunks(text: string, chunkSize: number = 250): string[][] {
    const words = text.split(/\s+/);
    const chunks: string[][] = [];

    for (let i = 0; i < words.length; i += chunkSize) {
      chunks.push(words.slice(i, i + chunkSize));
    }

    return chunks;
  }

  /**
   * Stores chunks in ChromaDB with proper metadata
   * @param chunks Array of text chunks to store
   * @returns Array of stored document data
   */
  protected async storeChunks(
    chunks: string[][]
  ): Promise<Array<{ id: string; text: string }>> {
    try {
      if (!this.collection) {
        throw new Error(
          "Collection not initialized. Call initializeCollection first."
        );
      }

      const documents: string[] = [];
      const ids: string[] = [];
      const metadatas: Array<Record<string, any>> = [];

      // Prepare chunks for storage
      chunks.forEach((chunk, idx) => {
        const text = chunk.join(" ");
        const transformedText = this.transformText(text);

        documents.push(transformedText);
        ids.push(`${this.apiKey}_${idx + 1}`); // Prefix ID with API key for uniqueness
        metadatas.push({
          apiKey: this.apiKey,
          chunkIndex: idx + 1,
          timestamp: new Date().toISOString(),
        });
      });
      console.log("store chunks 1");
      // Store in ChromaDB
      const result = await this.collection
        .add({
          ids: ids,
          documents: documents,
          metadatas: metadatas,
        })
        .catch((error) => {
          console.log("store chunks 2", error);
          throw new Error(`Error storing chunks in ChromaDB: ${error}`);
        });

      console.log("store chunks 4", result);
      return documents.map((text, idx) => ({
        id: ids[idx],
        text: text,
      }));
    } catch (error) {
      throw new Error(`Error storing chunks in ChromaDB: ${error}`);
    }
  }

  /**
   * Query documents by API key
   * @param queryText Text to search for
   * @param limit Number of results to return
   */
  public async queryDocuments(
    queryText: string,
    limit: number = 5
  ): Promise<any> {
    await this.initializeCollection();
    if (!this.collection) {
      throw new Error(
        "Collection not initialized. Call initializeCollection first."
      );
    }

    const result = await this.collection
      .query({
        queryTexts: [queryText],
        nResults: limit,
        where: { apiKey: this.apiKey },
      })
      .catch((error) => {
        console.log("queryDocuments 3", error);
        throw new Error(`Error querying documents in ChromaDB: ${error}`);
      });
    console.log("queryDocuments 2", result.documents);
    return result.documents;
  }

  /**
   * Transform text using regex
   * @param text Text to transform
   * @returns Transformed text
   */
  protected transformText(text: string): string {
    const regex = /<[^>]*>/g;
    const transformedText = text.replace(regex, "");
    return transformedText;
  }
}

export { BaseChromaProcessor };

/**
 * Web Scrapper
 * This is a web scrapper that scrapes the web for information
 * input url and options ( text, images, routes )
 * output is a content
 */
import axios from "axios";
import * as cheerio from "cheerio";
import { ScrapeOptions } from "../spec/scrape-opt";
import { client } from "../chroma/chromadb";
import { BaseChromaProcessor } from "../chroma/chromadb";

export class WebScrapper {
  constructor(
    private readonly url: string,
    private readonly apikey: string,
    private readonly options: ScrapeOptions
  ) {}

  async scrape() {
    const response = await axios.get(this.url);
    const $ = cheerio.load(response.data);

    const scrapedData = {
      text: this.options.text ? $("body").text() : "",
      images: this.options.images ? $("img") : [],
      routes: this.options.routes ? $("a") : [],
    };

    // store in vector database
    const baseChromaProcessor = new BaseChromaProcessor(this.apikey, client);
    await baseChromaProcessor.store(scrapedData.text);
    return scrapedData;
  }
}

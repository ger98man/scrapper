import * as cheerio from "cheerio";
import pLimit from "p-limit";
import {
  ScrapperParamsDto,
  Category,
  ScrapedCarData,
} from "../interfaces/scrapper.interface";

class ScrapperService {
  private scraperapiClient: any;
  private readonly API_KEY = process.env.SCRAPER_API_KEY;
  private readonly CONCURRENT_LIMIT = 5;
  private readonly MERCADOLIBRE_URL = "https://lista.mercadolivre.com.br";

  constructor() {
    this.scraperapiClient = require("scraperapi-sdk")(this.API_KEY);
  }

  private mapCategory(data: ScrapperParamsDto): string {
    switch (data.category) {
      case Category.VEHICLE:
        return `/veiculos/carros-caminhonetes/${data.brand}/${data.model}`;
      default:
        throw new Error("Unsupported category");
    }
  }

  private async scrapePage(url: string): Promise<any[]> {
    try {
      const result = await this.scraperapiClient.get(url); // Directly fetch the HTML
      const $ = cheerio.load(result.body);

      const scrapedCars: any[] = [];
      $(".ui-search-layout__item").each((_, element) => {
        const title = $(element).find(".poly-component__title").text().trim();
        const link = $(element).find(".poly-component__title").attr("href");
        const price = $(element).find(".poly-price__current").text().trim();

        scrapedCars.push({ name: title, price, link });
      });

      return scrapedCars;
    } catch (error) {
      console.error(`Error scraping page ${url}:`, error);
      return [];
    }
  }

  public async process(data: ScrapperParamsDto): Promise<any[]> {
    const baseUrl = `${this.MERCADOLIBRE_URL}${this.mapCategory(data)}`;
    const limit = pLimit(this.CONCURRENT_LIMIT);

    const allResults: ScrapedCarData[] = [];
    console.log(`Scraping: ${baseUrl}`);

    // Directly scrape data from the first page
    const pageResults = await limit(() => this.scrapePage(baseUrl));
    allResults.push(...pageResults);

    // Return results from the first page only
    return allResults;
  }
}

export { ScrapperService };

import * as cheerio from "cheerio";
import pLimit from "p-limit";
import {
  ScrapperSearchDto,
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

  private mapCategory(data: ScrapperSearchDto): string {
    switch (data.category) {
      case Category.VEHICLE:
        return `veiculos/carros-caminhonetes/${data.brand}/${data.model}`;
      default:
        throw new Error("Unsupported category");
    }
  }

  private async scrapePage(
    url: string,
    data: ScrapperSearchDto
  ): Promise<any[]> {
    try {
      const result = await this.scraperapiClient.get(url); // Directly fetch the HTML
      const $ = cheerio.load(result.body);

      const scrapedCars: any[] = [];
      $(".ui-search-layout__item").each((_, element) => {
        const seller = $(element).find(".poly-component__seller").text().trim();
        if (seller) {
          const title = $(element).find(".poly-component__title").text().trim();
          const price = $(element).find(".poly-price__current").text().trim();
          const link = $(element).find("a").attr("href");

          scrapedCars.push({ name: title, price, seller, link: link });
        }
      });

      if (!data.isWildSearch) {
        for (const item of scrapedCars) {
          const itemResult = await this.scraperapiClient.get(item.link);
          // todo get item vendor/seller
        }
      }

      return scrapedCars;
    } catch (error) {
      console.error(`Error scraping page ${url}:`, error);
      return [];
    }
  }

  public async process(data: ScrapperSearchDto): Promise<any[]> {
    const completeUrl = data.isWildSearch
      ? `${this.MERCADOLIBRE_URL}/${data.text}`
      : `${this.MERCADOLIBRE_URL}/${this.mapCategory(data)}`;
    const limit = pLimit(this.CONCURRENT_LIMIT);

    const allResults: ScrapedCarData[] = [];
    console.log(`Scraping: ${completeUrl}`);

    // todo add pagination
    const pageResults = await limit(() => this.scrapePage(completeUrl, data));
    allResults.push(...pageResults);

    return allResults;
  }
}

export { ScrapperService };

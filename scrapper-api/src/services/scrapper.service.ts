import * as cheerio from "cheerio";
import pLimit from "p-limit";
import {
  MercadoScrapperSearchDto,
  MercadoCategory,
  MercadoScrapedCarData,
} from "../interfaces/scrapper.mercado.interface";

class ScrapperService {
  private scraperapiClient: any;
  private readonly API_KEY = process.env.SCRAPER_API_KEY;
  private readonly CONCURRENT_LIMIT = 5;
  private readonly MERCADOLIBRE_URL = "https://lista.mercadolivre.com.br";

  constructor() {
    this.scraperapiClient = require("scraperapi-sdk")(this.API_KEY);
  }

  private mapCategory(data: MercadoScrapperSearchDto): string {
    switch (data.category) {
      case MercadoCategory.VEHICLE:
        return `veiculos/carros-caminhonetes/${data.brand}/${data.model}`;
      default:
        throw new Error("Unsupported category");
    }
  }

  private async scrapePage(
    url: string,
    data: MercadoScrapperSearchDto
  ): Promise<any[]> {
    try {
      const apiResult = await this.scraperapiClient.get(url); // Directly fetch the HTML
      const $ = cheerio.load(apiResult.body);

      let totalCount = 0;
      const scrapedResult: any[] = [];
      $(".ui-search-layout__item").each((_, element) => {
        totalCount++;
        const seller = $(element).find(".poly-component__seller").text().trim();
        if (seller) {
          const title = $(element).find(".poly-component__title").text().trim();
          const price = $(element).find(".poly-price__current").text().trim();
          const link = $(element).find("a").attr("href");

          scrapedResult.push({ title, price, seller, link });
        }
      });

      if (!data.isWildSearch) {
        for (const item of scrapedResult) {
          const itemResult = await this.scraperapiClient.get(item.link);
          // todo get item vendor/seller
        }
      }

      const uniqueSellers = scrapedResult.filter(
        (item, index, self) =>
          index === self.findIndex((obj) => obj.seller === item.seller)
      );

      console.log(
        `Scrapping result:\nTotal items: ${totalCount}\nTotal with seller: ${scrapedResult.length}\nUnique seller: ${uniqueSellers.length}`
      );
      return scrapedResult;
    } catch (error) {
      console.error(`Error scraping page ${url}:`, error);
      return [];
    }
  }

  public async process(data: MercadoScrapperSearchDto): Promise<any[]> {
    const completeUrl = data.isWildSearch
      ? `${this.MERCADOLIBRE_URL}/${data.text}`
      : `${this.MERCADOLIBRE_URL}/${this.mapCategory(data)}`;
    const limit = pLimit(this.CONCURRENT_LIMIT);

    const allResults: MercadoScrapedCarData[] = [];
    console.log(`Scraping: ${completeUrl}`);

    // todo add pagination
    const pageResults = await limit(() => this.scrapePage(completeUrl, data));
    allResults.push(...pageResults);

    return allResults;
  }
}

export { ScrapperService };

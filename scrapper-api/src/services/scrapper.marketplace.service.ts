import * as cheerio from "cheerio";
import pLimit from "p-limit";
import { MercadoScrapedCarData } from "../interfaces/scrapper.mercado.interface";
import { MarketplaceScrapperSearchDto } from "../interfaces/scrapper.marketplace.interface";

class ScrapperMarketplaceService {
  private scraperapiClient: any;
  private readonly API_KEY = process.env.SCRAPER_API_KEY;
  private readonly CONCURRENT_LIMIT = 5;
  private readonly WEB_URL = "https://220.lv";

  constructor() {
    this.scraperapiClient = require("scraperapi-sdk")(this.API_KEY);
  }

  private formatPrice(price: string): string {
    const currencySymbol = price.slice(-1);
    const numericPrice = parseInt(price.trim(), 10) / 100;
    return `${numericPrice.toFixed(2)} ${currencySymbol}`;
  }

  private async scrapePage(url: string): Promise<any[]> {
    try {
      const apiResult = await this.scraperapiClient.get(url); // Directly fetch the HTML
      const $ = cheerio.load(apiResult.body);

      let totalCount = 0;
      const links: string[] = [];
      $(".c-product-card").each((_, element) => {
        totalCount++;

        const link = $(element)
          .find(".c-product-card__title")
          .find("a")
          .attr("href");

        if (link) {
          links.push(link);
        }
      });

      const products: any[] = [];
      for (const link of links) {
        try {
          const itemResult = await this.scraperapiClient.get(link);
          const itemPage = cheerio.load(itemResult.body);

          const productName = itemPage(".c-product__name")
            .text()
            .replace("\\n", "")
            .trim();

          const productPriceElement = itemPage(
            ".c-price.h-price--xx-large.h-price--new"
          );

          let productPrice = productPriceElement
            .text()
            .replace(/\s/g, "")
            .trim();

          if (!productPrice) {
            productPrice = itemPage(".c-price.h-price--xx-large.h-price")
              .text()
              .replace(/\s/g, "")
              .trim();
          }

          const merchantLink = itemPage(".c-product__seller-info")
            .find("a")
            .attr("href");

          if (merchantLink !== url) {
            products.push({
              name: productName,
              price: this.formatPrice(productPrice),
              link,
            });
          }
        } catch (error) {
          console.error(`Failed to fetch item details`, error);
        }
      }

      console.log(`Scrapping result:\nTotal items: ${totalCount}`);
      return products;
    } catch (error) {
      console.error(`Error scraping page ${url}:`, error);
      return [];
    }
  }

  public async process(data: MarketplaceScrapperSearchDto): Promise<any[]> {
    const merchantUrl = `${this.WEB_URL}/lv/veikals/${data.merchantName}`;
    const limit = pLimit(this.CONCURRENT_LIMIT);

    const allResults: MercadoScrapedCarData[] = [];
    console.log(`Scraping: ${merchantUrl}`);

    // todo add pagination
    const result = await limit(() => this.scrapePage(merchantUrl));

    return result;
  }
}

export { ScrapperMarketplaceService };

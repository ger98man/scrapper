import axios from "axios";
import * as cheerio from "cheerio";

class ScrapperService {
  constructor() {}

  public async scrapeWebsite(url: string): Promise<any> {
    try {
      const { data } = await axios.get(url);
      const $ = cheerio.load(data);

      // Extract articles (adjust selectors based on the site's structure)
      const articles: object[] = [];
      $(".article").each((index, element) => {
        const title = $(element).find(".title").text();
        const content = $(element).find(".content").text();
        articles.push({ title, content });
      });

      console.log("Fetched Articles:", articles.length);

      return articles;
    } catch (error) {
      console.error("Error scraping the website:", error);
    }
  }
}

export { ScrapperService };

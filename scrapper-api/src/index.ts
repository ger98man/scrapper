import express from "express";
import { ScrapperService } from "./services/scrapper.service";

const app = express();
const port = 3010;
const scrapperService = new ScrapperService();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/", async (req, res) => {
  const result = await scrapperService.scrapeWebsite(req.body.url);
  res.send(result);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

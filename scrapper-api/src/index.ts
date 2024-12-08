import express from "express";
import { ScrapperService } from "./services/scrapper.service";
import { StatusCodes } from "http-status-codes";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = 3010;
const scrapperService = new ScrapperService();

app.use(express.json());
app.use((req, res, next) => {
  const { method, url, body: reqData } = req;
  const startTime = Date.now();
  const originalSend = res.send;

  res.send = function (body) {
    const responseTime = Date.now() - startTime;
    console.log(
      `\n[${new Date().toISOString()}] ${method} ${url}: ${reqData ? JSON.stringify(reqData) : ""}\nStatus: ${res.statusCode} Time: ${responseTime}ms\nBody: ${body}`
    );

    return originalSend.call(this, body);
  };

  next();
});

app.get("/live", (req, res) => {
  res.status(StatusCodes.OK).send("I am alive");
});

app.post("/process", async (req, res) => {
  const result = await scrapperService.process(req.body);
  res.json(result);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

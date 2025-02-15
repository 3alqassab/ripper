import { engine } from "express-handlebars";
import { env } from "./constants/env";
import bodyParser from "body-parser";
import express from "express";
import fetch from "node-fetch";
import puppeteer from "puppeteer";

const PORT = env.PORT;

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

app.engine("handlebars", engine());

app.set("view engine", "handlebars");
app.set("views", "./src/views");

app.get("/", (req, res) => {
	res.render("home");
});

const downloadImage = async (url: string) => {
	const response = await fetch(url);
	const blob = await response.blob();
	const buffer = await blob.arrayBuffer();
	const base64 = bufferToBase64(Buffer.from(buffer));
	return `data:image/jpg;base64,${base64}`;
};

const bufferToBase64 = (buffer: Buffer) => {
	return buffer.toString("base64");
};

app.post("/", async (req, res) => {
	const start = Date.now();

	const url: string = req.body.url;

	const browser = await puppeteer.launch({ headless: true });
	const page = await browser.newPage();
	await page.goto(url);
	await page.setViewport({ width: 1080, height: 1024 });
	const selector = "div._aagv img";
	await page.waitForSelector(selector);
	const imageUrl: string = await page.$eval(selector, (el: any) => el.src);
	const image = await downloadImage(imageUrl);

	await browser.close();

	const end = Date.now();

	res.render("home", { image, timeTaken: end - start });
});

app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});

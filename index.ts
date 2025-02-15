import express from 'express';
import { engine } from 'express-handlebars';
import bodyParser from 'body-parser';
import puppeteer from 'puppeteer';
import fetch from 'node-fetch';
import fs from 'fs';
import { uuid } from 'uuidv4';
import path from 'path';

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

app.engine('handlebars', engine());

app.set('view engine', 'handlebars');
app.set('views', './views');


app.get('/', (req, res, next) => {
  res.render('home');
});

const downloadImage = async (url: string) => {
  const response = await fetch(url);
  const blob = await response.blob();
  const buffer = await blob.arrayBuffer();
  const randomUUID = uuid();
  const path = 'public/' + randomUUID + '.jpg';
  fs.writeFileSync(path, Buffer.from(buffer));
  return path;
};

app.post('/', async (req, res, next) => {
  const start = Date.now();

  const url = req.body.url

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url);
  await page.setViewport({ width: 1080, height: 1024 });
  const selector = 'div._aagv img';
  await page.waitForSelector(selector);
  const imageUrl = await page.$eval(selector, (el: any) => el.src);
  const image = await downloadImage(imageUrl);

  await browser.close();

  const end = Date.now();

  res.render('home', { image: 'http://localhost:4001/' + image, timeTaken: end - start });
});

app.get('/public/:image', (req, res) => {
  const imagePath = req.params.image;

  const imageLocalPath = path.join(__dirname, 'public', imagePath);
  const image = fs.readFileSync(imageLocalPath);

  fs.unlinkSync(imageLocalPath);

  res.writeHead(200, { 'Content-Type': 'image/jpg' });
  res.end(image, 'binary');
});

app.listen(4001, () => {
  console.log('Server is running on http://localhost:4001');
});

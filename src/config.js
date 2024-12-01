import * as dotenv from 'dotenv';

dotenv.config();

export const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
export const PAGE_ID = process.env.PAGE_ID;
export const PDF_URL = process.env.PDF_URL;
export const IMAGES_DIR = './src/images';
export const PDF_DIR = './src/pdfs';
export const START_PAGE = 5;
export const END_PAGE = 10;
export const SCHEDULE_TIME = Math.floor(new Date().getTime() / 1000) + 1200;

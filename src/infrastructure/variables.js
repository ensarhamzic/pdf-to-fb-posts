import fs from 'node:fs';
import yaml from 'yaml';

const configPath = './src/config.yaml';
const config = yaml.parse(fs.readFileSync(configPath, 'utf-8'));

export const PAGE_ACCESS_TOKEN = config.PAGE_ACCESS_TOKEN;
export const PAGE_ID = config.PAGE_ID;
export const PDF_URL = config.PDF_URL;
export const IMAGES_DIR = config.IMAGES_DIR;
export const PDF_DIR = config.PDF_DIR;
export const SCHEDULE_CONFIG = config.SCHEDULE_CONFIG;
export const IMAGE_QUALITY = config.IMAGE_QUALITY;
export const FB_PHOTOS_ENDPOINT = `https://graph.facebook.com/v21.0/${PAGE_ID}/photos`;
export const FB_FEED_ENDPOINT = `https://graph.facebook.com/v21.0/${PAGE_ID}/feed`;
import axios from 'axios';
import * as dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import pdf from 'pdf-poppler';
import FormData from 'form-data';

dotenv.config();

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const PAGE_ID = process.env.PAGE_ID;
const SCHEDULE_TIME = Math.floor(new Date().getTime() / 1000) + 600;
const PDF_PATH = process.env.PDF_PATH;
const OUTPUT_DIR = './images';
const START_PAGE = 10;
const END_PAGE = 13;

async function extractImagesFromPDF(pdfPath, outputDir, startPage, endPage) {
    if (!fs.existsSync(pdfPath)) {
        throw new Error(`File not found: ${pdfPath}`);
    }

    if (fs.existsSync(outputDir)) {
        fs.readdirSync(outputDir).forEach((file) => {
            fs.unlinkSync(path.join(outputDir, file));
        });
        console.log(`Cleared directory: ${outputDir}`);
    } else {
        fs.mkdirSync(outputDir);
        console.log(`Created directory: ${outputDir}`);
    }

    console.log(`Extracting pages ${startPage} to ${endPage} with high quality...`);

    const opts = {
        format: 'jpeg',
        out_dir: outputDir,
        out_prefix: path.basename(pdfPath, path.extname(pdfPath)),
        scale: 4096
    };

    const imagePaths = [];

    for (let page = startPage; page <= endPage; page++) {
        opts.page = page;
        try {
            await pdf.convert(pdfPath, opts);
            const imagePath = path.join(
                outputDir,
                `${opts.out_prefix}-${page}.jpg`
            );
            imagePaths.push(imagePath);
        } catch (error) {
            console.error(`Error converting page ${page}:`, error);
        }
    }

    return imagePaths;
}

async function uploadPhoto(photoPath) {
    if (!fs.existsSync(photoPath)) {
        throw new Error(`File not found: ${photoPath}`);
    }

    const url = `https://graph.facebook.com/v17.0/${PAGE_ID}/photos`;

    const formData = new FormData();
    formData.append('source', fs.createReadStream(photoPath), {
        filename: photoPath.split('/').pop(),
        contentType: 'image/jpeg',
    });
    formData.append('published', 'false');

    try {
        const response = await axios.post(url, formData, {
            headers: {
                Authorization: `Bearer ${PAGE_ACCESS_TOKEN}`,
                ...formData.getHeaders(),
            },
            timeout: 60000,
        });

        return response.data.id;
    } catch (error) {
        console.error(
            'Error uploading photo:',
            error.response ? error.response.data : error.message
        );
        throw error;
    }
}

async function schedulePostWithImages() {
    try {
        const imagePaths = await extractImagesFromPDF(
            PDF_PATH,
            OUTPUT_DIR,
            START_PAGE,
            END_PAGE
        );

        const photoIds = await Promise.all(
            imagePaths.map((photoPath) => uploadPhoto(photoPath))
        );

        const url = `https://graph.facebook.com/v17.0/${PAGE_ID}/feed`;

        const attachedMedia = photoIds.map((id) => ({media_fbid: id}));

        const data = {
            message: 'Post generated from PDF pages 5-15',
            attached_media: attachedMedia,
            published: false,
            scheduled_publish_time: SCHEDULE_TIME,
        };

        const response = await axios.post(url, data, {
            headers: {
                Authorization: `Bearer ${PAGE_ACCESS_TOKEN}`,
            },
        });

        console.log('Post successfully scheduled:', response.data);
    } catch (error) {
        console.error(
            'Error scheduling post with images:',
            error.response ? error.response.data : error.message
        );
    }
}

await schedulePostWithImages();
import axios from 'axios';
import * as dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import pdf from 'pdf-poppler';
import FormData from 'form-data';

dotenv.config();

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const PAGE_ID = process.env.PAGE_ID;
const SCHEDULE_TIME = Math.floor(new Date().getTime() / 1000) + 1200;
const PDF_URL = process.env.PDF_URL;
const IMAGES_DIR = './images';
const PDF_DIR = './pdfs';
const START_PAGE = 5;
const END_PAGE = 10;

function deleteFolderRecursive(folderPath) {
    if (fs.existsSync(folderPath)) {
        fs.readdirSync(folderPath).forEach((file) => {
            const curPath = path.join(folderPath, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                deleteFolderRecursive(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(folderPath);
        console.log(`Deleted folder: ${folderPath}`);
    }
}

async function downloadPdf(url, outputPath) {
    deleteFolderRecursive(path.dirname(outputPath));
    fs.mkdirSync(path.dirname(outputPath), {recursive: true});

    const writer = fs.createWriteStream(outputPath);

    console.log(`Downloading PDF from URL: ${PDF_URL}`);
    const response = await axios.get(url, {responseType: 'stream'});

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

async function extractImagesFromPdf(pdfPath, outputDir, startPage, endPage) {
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
        scale: 2048
    };

    for (let page = startPage; page <= endPage; page++) {
        opts.page = page;
        try {
            await pdf.convert(pdfPath, opts);
        } catch (error) {
            console.error(`Error converting page ${page}:`, error);
        }
    }
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
            timeout: 120000,
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
        const localPDFPath = path.join(PDF_DIR, 'downloaded.pdf');
        await downloadPdf(PDF_URL, localPDFPath);

        await extractImagesFromPdf(
            localPDFPath,
            IMAGES_DIR,
            START_PAGE,
            END_PAGE
        );

        const imageFiles = fs.readdirSync(IMAGES_DIR).filter((file) =>
            file.endsWith('.jpg')
        );

        const photoIds = [];
        for (const imageFile of imageFiles) {
            const imagePath = path.join(IMAGES_DIR, imageFile);
            const photoId = await uploadPhoto(imagePath);
            console.log(`Uploaded photo ${imageFile} with ID: ${photoId}`);
            photoIds.push({media_fbid: photoId});
        }

        const url = `https://graph.facebook.com/v17.0/${PAGE_ID}/feed`;

        const data = {
            message: 'Post generated from PDF',
            attached_media: photoIds,
            published: false,
            scheduled_publish_time: SCHEDULE_TIME,
        };

        const response = await axios.post(url, data, {
            headers: {
                Authorization: `Bearer ${PAGE_ACCESS_TOKEN}`,
            },
            timeout: 120000,
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

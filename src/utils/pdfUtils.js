import fs from 'fs';
import path from 'path';
import axios from 'axios';
import pdf from 'pdf-poppler';
import {deleteFolderRecursive} from './fileUtils.js';

export async function downloadPdf(url, outputPath) {
    deleteFolderRecursive(path.dirname(outputPath));
    fs.mkdirSync(path.dirname(outputPath), {recursive: true});

    const writer = fs.createWriteStream(outputPath);

    console.log(`Downloading PDF from URL: ${url}`);
    const response = await axios.get(url, {responseType: 'stream'});

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

export async function extractImagesFromPdf(pdfPath, outputDir, startPage, endPage) {
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
        scale: 2048,
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

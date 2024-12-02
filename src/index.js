import {SCHEDULE_CONFIG, IMAGES_DIR, PDF_DIR, PDF_URL} from './infrastructure/variables.js';
import {downloadPdf, extractImagesFromPdf} from './utils/pdfUtils.js';
import {schedulePostWithImages, uploadPhoto} from './utils/facebookApi.js';
import path from 'node:path';
import fs from 'node:fs';

(async () => {
    try {
        const localPDFPath = path.join(PDF_DIR, 'downloaded.pdf');
        await downloadPdf(PDF_URL, localPDFPath);

        for (const config of SCHEDULE_CONFIG) {
            const {startPage, endPage, message, scheduleTime} = config;

            const scheduleTimestamp = Math.floor(new Date(scheduleTime).getTime() / 1000);

            await extractImagesFromPdf(localPDFPath, IMAGES_DIR, startPage, endPage);

            const imageFiles = fs.readdirSync(IMAGES_DIR).filter((file) => file.endsWith('.jpg'));

            const photoIds = [];
            for (const imageFile of imageFiles) {
                const imagePath = path.join(IMAGES_DIR, imageFile);
                const photoId = await uploadPhoto(imagePath);
                console.log(`Uploaded photo ${imageFile} with ID: ${photoId}`);
                photoIds.push({media_fbid: photoId});
            }

            await schedulePostWithImages(message, photoIds, scheduleTimestamp);
        }
    } catch (error) {
        console.error('Error:', error);
    }
})();

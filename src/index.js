import {END_PAGE, IMAGES_DIR, PDF_DIR, PDF_URL, SCHEDULE_TIME, START_PAGE} from './config.js';
import {downloadPdf, extractImagesFromPdf} from './utils/pdfUtils.js';
import {schedulePostWithImages, uploadPhoto} from './utils/facebookApi.js';
import path from 'node:path';
import fs from 'node:fs';

(async () => {
    try {
        const localPDFPath = path.join(PDF_DIR, 'downloaded.pdf');
        await downloadPdf(PDF_URL, localPDFPath);

        await extractImagesFromPdf(localPDFPath, IMAGES_DIR, START_PAGE, END_PAGE);

        const imageFiles = fs.readdirSync(IMAGES_DIR).filter((file) => file.endsWith('.jpg'));

        const photoIds = [];
        for (const imageFile of imageFiles) {
            const imagePath = path.join(IMAGES_DIR, imageFile);
            const photoId = await uploadPhoto(imagePath);
            console.log(`Uploaded photo ${imageFile} with ID: ${photoId}`);
            photoIds.push({media_fbid: photoId});
        }

        await schedulePostWithImages('Post generated from PDF', photoIds, SCHEDULE_TIME);
    } catch (error) {
        console.error('Error:', error);
    }
})();

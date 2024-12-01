import axios from 'axios';
import * as dotenv from 'dotenv';
import fs from 'node:fs';
import FormData from 'form-data';

dotenv.config();

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const PAGE_ID = process.env.PAGE_ID;
const SCHEDULE_TIME = Math.floor(new Date().getTime() / 1000) + 600;
const IMAGES = [
    './images/img.png',
    './images/img_1.png',
    './images/img_2.png',
    './images/img_3.png',
    './images/img_4.png',
];

async function uploadPhoto(photoPath) {
    if (!fs.existsSync(photoPath)) {
        throw new Error(`File not found: ${photoPath}`);
    }

    const url = `https://graph.facebook.com/v17.0/${PAGE_ID}/photos`;

    const formData = new FormData();
    formData.append('source', fs.createReadStream(photoPath), {
        filename: photoPath.split('/').pop(),
        contentType: 'image/png',
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
        const photoIds = await Promise.all(
            IMAGES.map((photoPath) => uploadPhoto(photoPath))
        );

        const url = `https://graph.facebook.com/v17.0/${PAGE_ID}/feed`;

        const attachedMedia = photoIds.map((id) => ({media_fbid: id}));

        const data = {
            message: 'Ovo je post sa 5 slika',
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

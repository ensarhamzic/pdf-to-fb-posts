import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';
import {PAGE_ACCESS_TOKEN, PAGE_ID} from '../infrastructure/variables.js';

export async function uploadPhoto(photoPath) {
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

export async function schedulePostWithImages(message, photoIds, scheduleTime) {
    const url = `https://graph.facebook.com/v17.0/${PAGE_ID}/feed`;

    const data = {
        message,
        attached_media: photoIds,
        published: false,
        scheduled_publish_time: scheduleTime,
    };

    try {
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
        throw error;
    }
}

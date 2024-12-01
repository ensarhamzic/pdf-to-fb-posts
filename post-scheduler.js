import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const PAGE_ID = process.env.PAGE_ID;
const MESSAGE = "ZA 10 MINUTA";
const SCHEDULE_TIME = Math.floor(new Date().getTime() / 1000) + 600;

async function schedulePost() {
  const url = `https://graph.facebook.com/v17.0/${PAGE_ID}/feed`;

  const data = {
    message: MESSAGE,
    published: false,
    scheduled_publish_time: SCHEDULE_TIME,
  };

  try {
    const response = await axios.post(url, data, {
      headers: {
        Authorization: `Bearer ${PAGE_ACCESS_TOKEN}`,
      },
    });

    console.log("Post successfully scheduled:", response.data);
  } catch (error) {
    console.error(
      "Error scheduling post:",
      error.response ? error.response.data : error.message
    );
  }
}

await schedulePost();

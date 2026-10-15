import { scrapeYouTubeVideoId } from '../services/youtube.js';

async function run() {
    const q = 'Blinding Lights The Weeknd Official Audio';
    console.log('Testing query:', q);
    const id = await scrapeYouTubeVideoId(q);
    console.log('HEROKU_SCRAPE_RESULT:' + id);
}
run();

import { Jimp } from 'jimp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputPath = path.join(__dirname, '../../client/public/logo.png');
const outputPath = path.join(__dirname, '../../client/public/logo.png');
const iconPath = path.join(__dirname, '../../client/app/icon.png');

async function removeBackground() {
    try {
        console.log('Reading image from:', inputPath);
        const image = await Jimp.read(inputPath);

        // Scan all pixels
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
            const red = this.bitmap.data[idx + 0];
            const green = this.bitmap.data[idx + 1];
            const blue = this.bitmap.data[idx + 2];

            // If pixel is close to black (tolerance of 30)
            if (red < 30 && green < 30 && blue < 30) {
                this.bitmap.data[idx + 3] = 0; // Set alpha to 0 (transparent)
            }
        });

        console.log('Writing processed image to:', outputPath);
        await image.write(outputPath);

        console.log('Writing icon to:', iconPath);
        await image.write(iconPath);

        console.log('Done!');
    } catch (error) {
        console.error('Error processing image:', error);
    }
}

removeBackground();

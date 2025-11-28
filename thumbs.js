import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

// Corrige __dirname em ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PASTA ONDE ESTÃO AS IMAGENS
const inputFolder = path.join(__dirname, 'public', 'Images');

// PASTA DAS MINIATURAS
const outputFolder = path.join(inputFolder, 'thumbnails');

// Criar pasta se não existir
if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
    console.log("📁 Pasta 'thumbnails' criada!");
}

// Extensões aceitas
const allowed = ['.jpg', '.jpeg', '.png'];

fs.readdirSync(inputFolder).forEach(file => {
    const ext = path.extname(file).toLowerCase();
    if (!allowed.includes(ext)) return;

    const inputPath = path.join(inputFolder, file);
    const outputPath = path.join(outputFolder, `${path.parse(file).name}-thumb.webp`);

    sharp(inputPath)
        .resize({ width: 300 })
        .webp({ quality: 80 })
        .toFile(outputPath)
        .then(() => console.log(`🖼️ Thumbnail criada: ${outputPath}`))
        .catch(err => console.error(`❌ Erro ao gerar thumbnail:`, err));
});
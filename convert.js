import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

// Corrige __dirname e __filename em ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PASTA ONDE VOCÊ VAI COLOCAR AS IMAGENS
const inputFolder = path.join(__dirname, 'public', 'Images');

// PASTA ONDE SERÃO GERADOS OS WEBP
const outputFolder = path.join(inputFolder, 'output-webp');

// Criar pasta de saída se não existir
if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
    console.log("📁 Pasta 'output-webp' criada!");
}

// Extensões permitidas
const allowed = ['.jpg', '.jpeg', '.png'];

// Ler arquivos da pasta Images
fs.readdirSync(inputFolder).forEach(file => {

    const ext = path.extname(file).toLowerCase();
    if (!allowed.includes(ext)) return;

    const inputPath = path.join(inputFolder, file);
    const outputPath = path.join(outputFolder, `${path.parse(file).name}.webp`);

    sharp(inputPath)
        .webp({ quality: 80 })
        .toFile(outputPath)
        .then(() => console.log(`✔️ Convertido: ${file} → ${outputPath}`))
        .catch(err => console.error(`❌ Erro ao converter ${file}:`, err));
});
// Sincroniza os tipos do fitcoach-pro (web) para o app mobile.
// Uso: npm run sync-types
// Copia src/types/database.ts do web e adiciona um banner de "gerado".
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, '../../fitcoach-pro/src/types/database.ts');
const DEST = resolve(__dirname, '../src/types/database.ts');

if (!existsSync(SOURCE)) {
  console.error(`[sync-types] Origem não encontrada: ${SOURCE}`);
  process.exit(1);
}

const banner = `// ⚠️  GERADO AUTOMATICAMENTE — não edite à mão.
// Fonte: fitcoach-pro/src/types/database.ts
// Rode "npm run sync-types" após alterar os tipos no web.\n\n`;

const source = readFileSync(SOURCE, 'utf8');
writeFileSync(DEST, banner + source, 'utf8');
console.log(`[sync-types] OK → ${DEST} (${source.split('\n').length} linhas)`);

import fs from 'fs';
import path from 'path';

import Database from 'better-sqlite3';

const dataDir = path.resolve(process.cwd(), 'data');
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'tight.db'));

db.exec(`
    CREATE TABLE IF NOT EXISTS games (
        id      TEXT    PRIMARY KEY,
        data    TEXT    NOT NULL,
        updated_at INTEGER NOT NULL
    )
`);

export default db;

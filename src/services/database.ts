import Database from 'better-sqlite3';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// Use an absolute path for the database file to avoid issues in cloud environments
const DB_PATH = process.env.DATABASE_URL || join(process.cwd(), 'macromind.db');

const db = new Database(DB_PATH);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS news (
    id TEXT PRIMARY KEY,
    headline TEXT UNIQUE,
    content TEXT,
    url TEXT,
    theme TEXT,
    source TEXT,
    timestamp DATETIME,
    disruption_score REAL,
    contagion_score REAL,
    sentiment REAL,
    impacts TEXT
  );

  CREATE TABLE IF NOT EXISTS themes (
    name TEXT PRIMARY KEY,
    description TEXT,
    base_weight REAL
  );
`);

// Migration: Add url column if it doesn't exist
try {
  db.exec('ALTER TABLE news ADD COLUMN url TEXT');
} catch (e) {
  // Column likely already exists
}

export const insertNews = (item: any) => {
  // Check if headline already exists to prevent duplicates with different IDs
  const normalizedHeadline = item.headline.toLowerCase().trim().replace(/\s+/g, ' ');
  const existing = db.prepare('SELECT id FROM news WHERE LOWER(TRIM(headline)) = ?').get(normalizedHeadline) as any;
  
  if (existing) {
    // Update existing record instead of inserting new one
    const stmt = db.prepare(`
      UPDATE news SET 
        content = ?, url = ?, theme = ?, source = ?, timestamp = ?, 
        disruption_score = ?, contagion_score = ?, sentiment = ?, impacts = ?
      WHERE id = ?
    `);
    const impactsJson = item.impacts ? JSON.stringify(item.impacts) : '[]';
    const disruption = item.scores?.disruption ?? item.disruption_score ?? 0;
    const contagion = item.scores?.contagion ?? item.contagion_score ?? 0;
    
    stmt.run(item.content, item.url || '', item.theme, item.source, item.timestamp, disruption, contagion, item.sentiment || 0, impactsJson, existing.id);
    return;
  }

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO news (id, headline, content, url, theme, source, timestamp, disruption_score, contagion_score, sentiment, impacts)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const impactsJson = item.impacts ? JSON.stringify(item.impacts) : '[]';
  const disruption = item.scores?.disruption ?? item.disruption_score ?? 0;
  const contagion = item.scores?.contagion ?? item.contagion_score ?? 0;

  stmt.run(item.id, item.headline, item.content, item.url || '', item.theme, item.source, item.timestamp, disruption, contagion, item.sentiment || 0, impactsJson);
};

export const clearDuplicates = () => {
  console.log("Running database cleanup for duplicates...");
  // Remove rows with duplicate headlines, keeping the most recent one
  db.exec(`
    DELETE FROM news 
    WHERE id NOT IN (
      SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY LOWER(TRIM(headline)) ORDER BY timestamp DESC) as rn
        FROM news
      ) WHERE rn = 1
    )
  `);
};

export const deleteNews = (id: string) => {
  db.prepare('DELETE FROM news WHERE id = ?').run(id);
};

export const getRecentNews = (limit = 50) => {
  const rows = db.prepare('SELECT * FROM news ORDER BY timestamp DESC LIMIT ?').all(limit) as any[];
  return rows.map(row => ({
    ...row,
    impacts: JSON.parse(row.impacts || '[]'),
    scores: {
      disruption: row.disruption_score,
      contagion: row.contagion_score,
      heat: calculateHeatIndex(row.theme)
    }
  }));
};

export const getNewsByTimeRange = (startTime: string, endTime: string) => {
  const rows = db.prepare('SELECT * FROM news WHERE timestamp >= ? AND timestamp <= ? ORDER BY timestamp DESC').all(startTime, endTime) as any[];
  return rows.map(row => ({
    ...row,
    impacts: JSON.parse(row.impacts || '[]')
  }));
};

export const calculateHeatIndex = (theme: string) => {
  // Calculate frequency of theme in the last 24 hours
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const count = db.prepare('SELECT COUNT(*) as count FROM news WHERE theme = ? AND timestamp > ?').get(theme, yesterday) as any;
  return Math.min(10, (count.count / 5) * 10);
};

export default db;

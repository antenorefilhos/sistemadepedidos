import { createClient } from '@libsql/client';
import path from 'path';

let client = null;

export function getDb() {
  if (client) return client;
  
  // Use file protocol for local SQLite database
  const dbPath = path.resolve(process.cwd(), 'db/catalog.db');
  client = createClient({
    url: `file:${dbPath}`
  });
  
  // Expose a run/transaction shim for compat where raw db.run is called in migrations/transactions
  // In our routes we use db.run('BEGIN TRANSACTION'), db.run('COMMIT'), db.run('ROLLBACK')
  // We will map run to execute.
  client.run = async (sql, params = []) => {
    const res = await client.execute({ sql, args: params });
    return {
      lastID: Number(res.lastInsertRowid),
      changes: res.rowsAffected
    };
  };
  
  return client;
}

// Helper to run query with params and return all rows
export async function queryAll(sql, params = []) {
  const db = getDb();
  const res = await db.execute({ sql, args: params });
  return res.rows;
}

// Helper to run query and return single row
export async function queryOne(sql, params = []) {
  const db = getDb();
  const res = await db.execute({ sql, args: params });
  return res.rows[0] || null;
}

// Helper to execute insert/update/delete
export async function execute(sql, params = []) {
  const db = getDb();
  const res = await db.execute({ sql, args: params });
  return {
    lastID: Number(res.lastInsertRowid),
    changes: res.rowsAffected
  };
}

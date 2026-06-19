import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

let db = null;

export async function getDb() {
  if (db) return db;
  
  const dbPath = path.resolve(process.cwd(), 'db/catalog.db');
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });
  
  return db;
}

// Helper to run query with params and return all rows
export async function queryAll(sql, params = []) {
  const connection = await getDb();
  return connection.all(sql, params);
}

// Helper to run query and return single row
export async function queryOne(sql, params = []) {
  const connection = await getDb();
  return connection.get(sql, params);
}

// Helper to execute insert/update/delete
export async function execute(sql, params = []) {
  const connection = await getDb();
  return connection.run(sql, params);
}

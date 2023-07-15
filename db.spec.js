import { test, expect } from 'vitest';
import { getConnect } from './db';

test('database config should correct', async () => {
  const conn = await getConnect({
    host: 'localhost',
    port: 3305,
    user: 'root',
    password: 'root',
    database: 'mysql'
  });
  conn.awaitQuery(`SELECT 1 + 1 AS solution`, (err, rows) => {
    if (err) throw err;
    expect(rows[0].solution).toBe(2);
  });
});

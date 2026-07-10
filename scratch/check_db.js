import 'dotenv/config';
import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_Kdhf6B7pegvk@ep-polished-glade-atkjoz7t-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

async function main() {
  await client.connect();
  const res = await client.query('SELECT id, name, category, sub_category, stock FROM products ORDER BY created_at DESC LIMIT 20');
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}

main().catch(console.error);

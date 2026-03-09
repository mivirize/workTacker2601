const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://faqai:faqai_secret@localhost:5432/faqai_dev' });
client.connect().then(async () => {
  const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name='sites' ORDER BY ordinal_position");
  console.log(res.rows.map(r => r.column_name).join(', '));
  await client.end();
}).catch(e => { console.error(e); process.exit(1); });

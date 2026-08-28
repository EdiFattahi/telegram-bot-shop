const Database = require('better-sqlite3');

const db = new Database('./dev.db', {
  readonly: true,
});

const tables = [
  'User',
  'Product',
  'Testimonial',
  'Order',
  'BlogPost',
  'Setting',
];

for (const table of tables) {
  const rows = db
    .prepare(`SELECT * FROM "${table}"`)
    .all();

  console.log(`\n===== ${table} (${rows.length}) =====`);

  for (const row of rows) {
    console.log(row);
  }
}

db.close();
require('dotenv').config();
const Database = require('better-sqlite3');
const { Client } = require('pg');

const sqlite = new Database('./dev.db', {
  readonly: true,
});

const pg = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  console.log('🚀 شروع انتقال SQLite → PostgreSQL\n');

  if (!process.env.DATABASE_URL) {
    throw new Error('❌ DATABASE_URL در محیط سیستم تعریف نشده است.');
  }

  await pg.connect();

  console.log('✅ اتصال به PostgreSQL برقرار شد.');

  // ---------------------------------------------------------
  // خواندن داده‌ها از SQLite
  // ---------------------------------------------------------

  const users = sqlite.prepare('SELECT * FROM "User"').all();
  const products = sqlite.prepare('SELECT * FROM "Product"').all();
  const testimonials = sqlite.prepare('SELECT * FROM "Testimonial"').all();
  const orders = sqlite.prepare('SELECT * FROM "Order"').all();
  const blogPosts = sqlite.prepare('SELECT * FROM "BlogPost"').all();
  const settings = sqlite.prepare('SELECT * FROM "Setting"').all();

  console.log(`📦 User: ${users.length}`);
  console.log(`📦 Product: ${products.length}`);
  console.log(`📦 Testimonial: ${testimonials.length}`);
  console.log(`📦 Order: ${orders.length}`);
  console.log(`📦 BlogPost: ${blogPosts.length}`);
  console.log(`📦 Setting: ${settings.length}`);

  // ---------------------------------------------------------
  // Transaction
  // ---------------------------------------------------------

  await pg.query('BEGIN');

  try {
    console.log('\n🔄 انتقال داده‌ها شروع شد...\n');

    // -------------------------------------------------------
    // User
    // -------------------------------------------------------

    for (const user of users) {
      await pg.query(
        `
        INSERT INTO "User"
        (
          "id",
          "email",
          "password",
          "name",
          "role",
          "createdAt",
          "updatedAt"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT ("id") DO NOTHING
        `,
        [
          user.id,
          user.email,
          user.password,
          user.name,
          user.role,
          user.createdAt,
          user.updatedAt,
        ]
      );
    }

    console.log(`✅ ${users.length} User منتقل شد.`);

    // -------------------------------------------------------
    // Product
    // -------------------------------------------------------

    for (const product of products) {
      await pg.query(
        `
        INSERT INTO "Product"
        (
          "id",
          "slug",
          "title",
          "description",
          "shortDesc",
          "priceBase",
          "pricePro",
          "priceOrg",
          "features",
          "demoUrl",
          "imageUrl",
          "status",
          "createdAt",
          "updatedAt"
        )
        VALUES
        (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13, $14
        )
        ON CONFLICT ("id") DO NOTHING
        `,
        [
          product.id,
          product.slug,
          product.title,
          product.description,
          product.shortDesc,
          product.priceBase,
          product.pricePro,
          product.priceOrg,
          product.features,
          product.demoUrl,
          product.imageUrl,
          product.status,
          product.createdAt,
          product.updatedAt,
        ]
      );
    }

    console.log(`✅ ${products.length} Product منتقل شد.`);

    // -------------------------------------------------------
    // Testimonial
    // -------------------------------------------------------

    for (const testimonial of testimonials) {
      await pg.query(
        `
        INSERT INTO "Testimonial"
        (
          "id",
          "name",
          "role",
          "content",
          "avatar",
          "createdAt"
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT ("id") DO NOTHING
        `,
        [
          testimonial.id,
          testimonial.name,
          testimonial.role,
          testimonial.content,
          testimonial.avatar,
          testimonial.createdAt,
        ]
      );
    }

    console.log(`✅ ${testimonials.length} Testimonial منتقل شد.`);

    // -------------------------------------------------------
    // BlogPost
    // -------------------------------------------------------

    for (const post of blogPosts) {
      await pg.query(
        `
        INSERT INTO "BlogPost"
        (
          "id",
          "slug",
          "title",
          "content",
          "excerpt",
          "coverImage",
          "published",
          "createdAt",
          "updatedAt"
        )
        VALUES
        (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9
        )
        ON CONFLICT ("id") DO NOTHING
        `,
        [
          post.id,
          post.slug,
          post.title,
          post.content,
          post.excerpt,
          post.coverImage,
          post.published,
          post.createdAt,
          post.updatedAt,
        ]
      );
    }

    console.log(`✅ ${blogPosts.length} BlogPost منتقل شد.`);

    // -------------------------------------------------------
    // Setting
    // -------------------------------------------------------

    for (const setting of settings) {
      await pg.query(
        `
        INSERT INTO "Setting"
        (
          "id",
          "key",
          "value"
        )
        VALUES ($1, $2, $3)
        ON CONFLICT ("id") DO NOTHING
        `,
        [
          setting.id,
          setting.key,
          setting.value,
        ]
      );
    }

    console.log(`✅ ${settings.length} Setting منتقل شد.`);

    // -------------------------------------------------------
    // Order
    // باید بعد از User و Product منتقل شود
    // -------------------------------------------------------

    for (const order of orders) {
      await pg.query(
        `
        INSERT INTO "Order"
        (
          "id",
          "userId",
          "productId",
          "plan",
          "amount",
          "status",
          "telegramId",
          "createdAt",
          "updatedAt"
        )
        VALUES
        (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9
        )
        ON CONFLICT ("id") DO NOTHING
        `,
        [
          order.id,
          order.userId,
          order.productId,
          order.plan,
          order.amount,
          order.status,
          order.telegramId,
          order.createdAt,
          order.updatedAt,
        ]
      );
    }

    console.log(`✅ ${orders.length} Order منتقل شد.`);

    // -------------------------------------------------------
    // Commit
    // -------------------------------------------------------

    await pg.query('COMMIT');

    console.log('\n🎉 انتقال با موفقیت انجام شد.');

  } catch (error) {
    await pg.query('ROLLBACK');

    console.error('\n❌ خطا در انتقال داده‌ها.');
    console.error('🔄 تمام تغییرات PostgreSQL rollback شدند.');
    throw error;
  }
}

main()
  .catch((error) => {
    console.error('\n❌ Migration failed:');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    sqlite.close();
    await pg.end();
  });
import { createClient } from "@libsql/client";
import { execSync } from "child_process";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error("Vui lòng cung cấp TURSO_DATABASE_URL trong biến môi trường!");
  process.exit(1);
}

console.log("Connecting to Turso database:", url);
const client = createClient({ url, authToken });

try {
  console.log("Generating SQL from schema...");
  const sql = execSync("npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script", {
    encoding: "utf-8"
  });

  console.log("Executing SQL migration on Turso Cloud SQLite...");
  await client.executeMultiple(sql);
  console.log("SUCCESS! All tables and indexes created on Turso successfully!");

  const res = await client.execute("SELECT name FROM sqlite_master WHERE type='table';");
  console.log("Tables in Turso:", res.rows.map(r => r.name));
} catch (err) {
  console.error("Migration error:", err);
  process.exit(1);
}

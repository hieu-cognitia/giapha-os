#!/usr/bin/env node
/**
 * Gia Phả OS — PocketBase Automated Setup
 * =========================================
 * Creates all required PocketBase collections so you don't have to click
 * through the Admin UI manually.
 *
 * Usage:
 *   npm run pb:setup          # create collections only
 *   npm run pb:setup -- --seed  # create collections AND load sample data
 *   npm run pb:seed           # load sample data into existing collections
 *
 * Prerequisites:
 *   1. PocketBase is running:  ./pocketbase serve
 *   2. Superadmin created at:  http://127.0.0.1:8090/_/
 *   3. .env.local contains:
 *        NEXT_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090
 *        POCKETBASE_SUPERADMIN_EMAIL=your_email
 *        POCKETBASE_SUPERADMIN_PASSWORD=your_password
 */

import PocketBase from "pocketbase";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// ─── Paths ────────────────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ─── Load .env.local ──────────────────────────────────────────────────────────
for (const name of [".env.local", ".env"]) {
  const p = join(ROOT, name);
  if (!existsSync(p)) continue;
  readFileSync(p, "utf-8")
    .split("\n")
    .forEach((line) => {
      const t = line.trim();
      if (!t || t.startsWith("#")) return;
      const eq = t.indexOf("=");
      if (eq < 0) return;
      const key = t.slice(0, eq).trim();
      let val = t.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      )
        val = val.slice(1, -1);
      if (!(key in process.env)) process.env[key] = val;
    });
  break;
}

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090";
const ADMIN_EMAIL = process.env.POCKETBASE_SUPERADMIN_EMAIL;
const ADMIN_PASS = process.env.POCKETBASE_SUPERADMIN_PASSWORD;

const SEED = process.argv.includes("--seed");
const SEED_ONLY = process.argv.includes("--seed-only");

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ok = (msg) => console.log(`  ✅ ${msg}`);
const skip = (msg) => console.log(`  ⏭️  ${msg}`);

async function ensureCollection(pb, name, body) {
  try {
    await pb.collections.getOne(name);
    skip(`${name} — already exists`);
    return await pb.collections.getOne(name);
  } catch (e) {
    if (e.status !== 404) throw e;
  }
  const col = await pb.collections.create({ name, ...body });
  ok(`${name} — created`);
  return col;
}

async function ensureUsersFields(pb) {
  const col = await pb.collections.getOne("users");
  const existing = new Set((col.fields || []).map((f) => f.name));
  const toAdd = [];
  if (!existing.has("role"))
    toAdd.push({ type: "select", name: "role", required: true, maxSelect: 1, values: ["admin", "member"] });
  if (!existing.has("is_active"))
    toAdd.push({ type: "bool", name: "is_active" });
  if (toAdd.length === 0) {
    skip("users — fields already up to date");
    return;
  }
  await pb.collections.update("users", { fields: [...(col.fields || []), ...toAdd] });
  ok(`users — added fields: ${toAdd.map((f) => f.name).join(", ")}`);
}

// ─── Schema setup ─────────────────────────────────────────────────────────────
async function setupSchema(pb) {
  console.log("\n📦  Setting up collections...\n");

  console.log("👤  users (built-in auth):");
  await ensureUsersFields(pb);

  console.log("\n👥  persons:");
  const personsCol = await ensureCollection(pb, "persons", {
    type: "base",
    fields: [
      { type: "text", name: "full_name", required: true },
      { type: "select", name: "gender", required: true, maxSelect: 1, values: ["male", "female", "other"] },
      { type: "number", name: "birth_year", noDecimal: true },
      { type: "number", name: "birth_month", noDecimal: true },
      { type: "number", name: "birth_day", noDecimal: true },
      { type: "number", name: "death_year", noDecimal: true },
      { type: "number", name: "death_month", noDecimal: true },
      { type: "number", name: "death_day", noDecimal: true },
      { type: "bool", name: "is_deceased" },
      { type: "bool", name: "is_in_law" },
      { type: "number", name: "birth_order", noDecimal: true },
      { type: "number", name: "generation", noDecimal: true },
      { type: "url", name: "avatar_url" },
      { type: "text", name: "note" },
    ],
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.role = 'admin'",
    updateRule: "@request.auth.role = 'admin'",
    deleteRule: "@request.auth.role = 'admin'",
  });

  console.log("\n🔗  relationships:");
  await ensureCollection(pb, "relationships", {
    type: "base",
    fields: [
      { type: "select", name: "type", required: true, maxSelect: 1, values: ["marriage", "biological_child", "adopted_child"] },
      { type: "relation", name: "person_a", required: true, collectionId: personsCol.id, maxSelect: 1, cascadeDelete: false },
      { type: "relation", name: "person_b", required: true, collectionId: personsCol.id, maxSelect: 1, cascadeDelete: false },
      { type: "text", name: "note" },
    ],
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.role = 'admin'",
    updateRule: "@request.auth.role = 'admin'",
    deleteRule: "@request.auth.role = 'admin'",
  });

  console.log("\n🔒  person_details_private:");
  await ensureCollection(pb, "person_details_private", {
    type: "base",
    fields: [
      { type: "relation", name: "person_id", required: true, collectionId: personsCol.id, maxSelect: 1, cascadeDelete: true },
      { type: "text", name: "phone_number" },
      { type: "text", name: "occupation" },
      { type: "text", name: "current_residence" },
    ],
    listRule: "@request.auth.role = 'admin'",
    viewRule: "@request.auth.role = 'admin'",
    createRule: "@request.auth.role = 'admin'",
    updateRule: "@request.auth.role = 'admin'",
    deleteRule: "@request.auth.role = 'admin'",
  });

  console.log("\n🖼️   avatars:");
  await ensureCollection(pb, "avatars", {
    type: "base",
    fields: [
      { type: "file", name: "file", required: true, maxSelect: 1, maxSize: 5242880, mimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"] },
    ],
    listRule: null,
    viewRule: null,
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.role = 'admin'",
    deleteRule: "@request.auth.id != ''",
  });
}

// ─── Seed data (translated from docs/seed.sql) ────────────────────────────────
// IDs use a short alphanumeric scheme matching the original UUID suffix:
//   UUID 10000000-...-000000000001  →  id "g1n01"  (gen 1 person 1)
//   UUID 20000000-...-000000000003  →  id "g2n03"  (gen 2 person 3)

const PERSONS = [
  // Đời 1 — Tổ tiên
  { id: "g1n01", full_name: "Vạn Công Gốc",    gender: "male",   birth_year: 1902, birth_month: 3,  birth_day: 15, death_year: 1975, death_month: 8,  death_day: 22, is_deceased: true,  is_in_law: false, generation: 1, birth_order: null, note: "Ông tổ dòng họ Vạn. Xuất thân nông dân, người có công khai phá vùng đất và lập nên dòng tộc. Nổi tiếng về đức tính cần cù và chí khí. [Nhân vật hư cấu]" },
  { id: "g1n02", full_name: "Bình Thị Mộc",    gender: "female", birth_year: 1908, birth_month: 6,  birth_day: 10, death_year: 1980, death_month: 1,  death_day: 5,  is_deceased: true,  is_in_law: true,  generation: 1, birth_order: null, note: "Tổ mẫu, người vợ đảm đang một tay nuôi dạy con cái qua thời chiến loạn. Được cháu chắt kính trọng và nhớ mãi. [Nhân vật hư cấu]" },
  // Đời 2 — Ông bà
  { id: "g2n01", full_name: "Vạn Công Thuận",  gender: "male",   birth_year: 1930, birth_month: 2,  birth_day: 4,  death_year: 2008, death_month: 11, death_day: 30, is_deceased: true,  is_in_law: false, generation: 2, birth_order: 1, note: "Con trai trưởng, từng là cán bộ địa phương. Người cẩn thận, chữ đẹp, để lại cuốn gia phả viết tay. [Nhân vật hư cấu]" },
  { id: "g2n02", full_name: "Cam Thị Dịu",     gender: "female", birth_year: 1934, birth_month: 9,  birth_day: 20, death_year: 2012, death_month: 4,  death_day: 14, is_deceased: true,  is_in_law: true,  generation: 2, birth_order: null, note: "Vợ của ông Thuận, con gái nhà buôn. Giỏi nấu ăn truyền thống, thường dạy cháu các món ăn ngày Tết. [Nhân vật hư cấu]" },
  { id: "g2n03", full_name: "Vạn Thị Bình",    gender: "female", birth_year: 1935, birth_month: 7,  birth_day: 7,  death_year: null, death_month: null, death_day: null, is_deceased: false, is_in_law: false, generation: 2, birth_order: 2, note: "Con gái thứ hai, dạy học cấp 2 hơn 30 năm. Không lấy chồng, dành cả đời vì học trò và gia đình. [Nhân vật hư cấu]" },
  { id: "g2n04", full_name: "Vạn Công Viễn",   gender: "male",   birth_year: 1942, birth_month: 12, birth_day: 1,  death_year: null, death_month: null, death_day: null, is_deceased: false, is_in_law: false, generation: 2, birth_order: 3, note: "Con trai út, vào Nam năm 1975, định cư tại TP.HCM. Kinh doanh vật liệu xây dựng thành công. Hay về thăm quê dịp Tết. [Nhân vật hư cấu]" },
  { id: "g2n05", full_name: "Tân Thị Khéo",    gender: "female", birth_year: 1945, birth_month: 3,  birth_day: 8,  death_year: null, death_month: null, death_day: null, is_deceased: false, is_in_law: true,  generation: 2, birth_order: null, note: "Vợ của ông Viễn. Người nhanh nhẹn, thực sự điều hành cửa hàng vật liệu của gia đình từ những ngày đầu. [Nhân vật hư cấu]" },
  // Đời 3 — Cha mẹ / cô chú (nhánh Bắc)
  { id: "g3n01", full_name: "Vạn Công Trí",    gender: "male",   birth_year: 1958, birth_month: 4,  birth_day: 12, death_year: null, death_month: null, death_day: null, is_deceased: false, is_in_law: false, generation: 3, birth_order: 1, note: "Con trai trưởng của ông Thuận. Kỹ sư xây dựng, tham gia nhiều công trình lớn. Hiện về hưu, hay đi câu cá và chơi cờ. [Nhân vật hư cấu]" },
  { id: "g3n02", full_name: "Ngô Thị Dịu Hiền",gender: "female", birth_year: 1961, birth_month: 8,  birth_day: 25, death_year: null, death_month: null, death_day: null, is_deceased: false, is_in_law: true,  generation: 3, birth_order: null, note: "Vợ của anh Trí. Giáo viên dạy Văn nghỉ hưu, yêu thơ và hay viết thơ tặng cháu. Nấu phở nức tiếng cả phố. [Nhân vật hư cấu]" },
  { id: "g3n03", full_name: "Vạn Thị Cẩm",     gender: "female", birth_year: 1962, birth_month: 11, birth_day: 3,  death_year: null, death_month: null, death_day: null, is_deceased: false, is_in_law: false, generation: 3, birth_order: 2, note: "Con gái thứ hai. Bác sĩ nhi khoa được kính trọng, hay khám bệnh miễn phí cho trẻ em nghèo. [Nhân vật hư cấu]" },
  { id: "g3n04", full_name: "Tề Văn Chính",    gender: "male",   birth_year: 1959, birth_month: 5,  birth_day: 18, death_year: null, death_month: null, death_day: null, is_deceased: false, is_in_law: true,  generation: 3, birth_order: null, note: "Chồng của bác Cẩm. Làm luật sư, điềm tĩnh và hay đọc sách lịch sử. [Nhân vật hư cấu]" },
  { id: "g3n05", full_name: "Vạn Công Mộc",    gender: "male",   birth_year: 1967, birth_month: 6,  birth_day: 20, death_year: null, death_month: null, death_day: null, is_deceased: false, is_in_law: false, generation: 3, birth_order: 3, note: "Con trai út của ông Thuận. Từng đi lao động xuất khẩu Đông Âu. Về nước mở xưởng mộc, người vui tính hay kể chuyện cười. [Nhân vật hư cấu]" },
  { id: "g3n06", full_name: "Quế Thị Lam",     gender: "female", birth_year: 1970, birth_month: 2,  birth_day: 14, death_year: null, death_month: null, death_day: null, is_deceased: false, is_in_law: true,  generation: 3, birth_order: null, note: "Vợ của chú Mộc. Gốc miền Bắc, hát dân ca hay, hay tổ chức họp mặt gia đình dịp lễ Tết. [Nhân vật hư cấu]" },
  // Đời 3 (nhánh Nam)
  { id: "g3n07", full_name: "Vạn Viễn Tuệ",   gender: "male",   birth_year: 1970, birth_month: 9,  birth_day: 5,  death_year: null, death_month: null, death_day: null, is_deceased: false, is_in_law: false, generation: 3, birth_order: 1, note: "Con trai cả ở Sài Gòn. Kỹ sư tin học, hay về thăm quê Bắc và mang đặc sản miền Nam. [Nhân vật hư cấu]" },
  { id: "g3n08", full_name: "Vạn Viễn Thanh",  gender: "female", birth_year: 1973, birth_month: 4,  birth_day: 22, death_year: null, death_month: null, death_day: null, is_deceased: false, is_in_law: false, generation: 3, birth_order: 2, note: "Con gái ở Sài Gòn. Giáo viên tiếng Anh, đạt IELTS 8.0. Sống tại TP.HCM cùng chồng và hai con. [Nhân vật hư cấu]" },
  { id: "g3n09", full_name: "Liêu Văn Kiến",   gender: "male",   birth_year: 1971, birth_month: 11, birth_day: 30, death_year: null, death_month: null, death_day: null, is_deceased: false, is_in_law: true,  generation: 3, birth_order: null, note: "Chồng của cô Thanh. Kiến trúc sư, hay đưa gia đình đi du lịch khám phá. [Nhân vật hư cấu]" },
  // Đời 4 — Cháu chắt (nhánh anh Trí)
  { id: "g4n01", full_name: "Vạn Trí Minh",    gender: "male",   birth_year: 1989, birth_month: 3,  birth_day: 14, death_year: null, death_month: null, death_day: null, is_deceased: false, is_in_law: false, generation: 4, birth_order: 1, note: "Con trai cả của anh Trí. Lập trình viên fullstack, yêu công nghệ mã nguồn mở. Tác giả dự án Gia Pha OS này! [Nhân vật hư cấu]" },
  { id: "g4n02", full_name: "Đinh Thị Mỹ Duyên", gender: "female", birth_year: 1991, birth_month: 7,  birth_day: 8,  death_year: null, death_month: null, death_day: null, is_deceased: false, is_in_law: true,  generation: 4, birth_order: null, note: "Vợ của anh Minh. Nhà thiết kế UI/UX, đứng sau giao diện đẹp của nhiều ứng dụng. [Nhân vật hư cấu]" },
  { id: "g4n03", full_name: "Vạn Trí Ngọc",    gender: "female", birth_year: 1992, birth_month: 12, birth_day: 25, death_year: null, death_month: null, death_day: null, is_deceased: false, is_in_law: false, generation: 4, birth_order: 2, note: "Con gái anh Trí. Nghiên cứu sinh Tiến sĩ Hóa học, nhận học bổng toàn phần từ nước ngoài. [Nhân vật hư cấu]" },
  { id: "g4n04", full_name: "Vạn Trí Khang",   gender: "male",   birth_year: 1998, birth_month: 1,  birth_day: 30, death_year: null, death_month: null, death_day: null, is_deceased: false, is_in_law: false, generation: 4, birth_order: 3, note: "Cậu út của anh Trí. Sinh viên Kinh tế, thích bóng đá và chơi guitar. [Nhân vật hư cấu]" },
  // Đời 4 (nhánh bác Cẩm)
  { id: "g4n05", full_name: "Tề Vạn Liên",     gender: "female", birth_year: 1990, birth_month: 5,  birth_day: 20, death_year: null, death_month: null, death_day: null, is_deceased: false, is_in_law: false, generation: 4, birth_order: 1, note: "Con gái bác Cẩm, mang họ đôi Tề Vạn. Dược sĩ bệnh viện, thừa hưởng đức y đức của mẹ. [Nhân vật hư cấu]" },
  { id: "g4n06", full_name: "Tề Vạn Hào",      gender: "male",   birth_year: 1993, birth_month: 8,  birth_day: 11, death_year: null, death_month: null, death_day: null, is_deceased: false, is_in_law: false, generation: 4, birth_order: 2, note: "Con trai bác Cẩm. Phi công hàng không dân dụng. Ngoài giờ bay đi phượt khám phá vùng núi phía Bắc. [Nhân vật hư cấu]" },
  // Đời 4 (nhánh chú Mộc)
  { id: "g4n07", full_name: "Vạn Mộc Kiên",    gender: "male",   birth_year: 1995, birth_month: 10, birth_day: 15, death_year: null, death_month: null, death_day: null, is_deceased: false, is_in_law: false, generation: 4, birth_order: 1, note: "Con trai chú Mộc. Tiếp nối nghề mộc theo hướng thiết kế nội thất hiện đại. Mở xưởng riêng từ năm 22 tuổi. [Nhân vật hư cấu]" },
  { id: "g4n08", full_name: "Vạn Mộc Ngân",    gender: "female", birth_year: 1999, birth_month: 3,  birth_day: 3,  death_year: null, death_month: null, death_day: null, is_deceased: false, is_in_law: false, generation: 4, birth_order: 2, note: "Con gái chú Mộc. Vừa tốt nghiệp đại học Tài chính - Ngân hàng. Hay hát dân ca theo mẹ Lam. [Nhân vật hư cấu]" },
  // Đời 4 (nhánh anh Tuệ - HCM)
  { id: "g4n09", full_name: "Vạn Tuệ An",      gender: "male",   birth_year: 2000, birth_month: 6,  birth_day: 18, death_year: null, death_month: null, death_day: null, is_deceased: false, is_in_law: false, generation: 4, birth_order: 1, note: "Con trai anh Tuệ. Đang học IT tại TP.HCM. Mê AI và tự học lập trình Python từ năm lớp 8. [Nhân vật hư cấu]" },
  // Đời 4 (nhánh cô Thanh - HCM)
  { id: "g4n10", full_name: "Liêu Vạn Bình",   gender: "female", birth_year: 2003, birth_month: 2,  birth_day: 28, death_year: null, death_month: null, death_day: null, is_deceased: false, is_in_law: false, generation: 4, birth_order: 1, note: "Con gái cô Thanh, mang họ đôi Liêu Vạn. Học sinh cấp 3 giỏi tiếng Anh. Mơ ước trở thành kiến trúc sư. [Nhân vật hư cấu]" },
  { id: "g4n11", full_name: "Liêu Vạn Kỳ",     gender: "male",   birth_year: 2007, birth_month: 9,  birth_day: 9,  death_year: null, death_month: null, death_day: null, is_deceased: false, is_in_law: false, generation: 4, birth_order: 2, note: "Con trai cô Thanh. Học sinh lớp 8, thích đá bóng và vẽ truyện tranh manga. [Nhân vật hư cấu]" },
];

const RELATIONSHIPS = [
  // Đời 1: Hôn nhân
  { type: "marriage", person_a: "g1n01", person_b: "g1n02" },
  // Đời 1 → Đời 2
  { type: "biological_child", person_a: "g1n01", person_b: "g2n01" },
  { type: "biological_child", person_a: "g1n02", person_b: "g2n01" },
  { type: "biological_child", person_a: "g1n01", person_b: "g2n03" },
  { type: "biological_child", person_a: "g1n02", person_b: "g2n03" },
  { type: "biological_child", person_a: "g1n01", person_b: "g2n04" },
  { type: "biological_child", person_a: "g1n02", person_b: "g2n04" },
  // Đời 2: Hôn nhân
  { type: "marriage", person_a: "g2n01", person_b: "g2n02" },
  { type: "marriage", person_a: "g2n04", person_b: "g2n05" },
  // Đời 2 → Đời 3 (nhánh ông Thuận & bà Dịu)
  { type: "biological_child", person_a: "g2n01", person_b: "g3n01" },
  { type: "biological_child", person_a: "g2n02", person_b: "g3n01" },
  { type: "biological_child", person_a: "g2n01", person_b: "g3n03" },
  { type: "biological_child", person_a: "g2n02", person_b: "g3n03" },
  { type: "biological_child", person_a: "g2n01", person_b: "g3n05" },
  { type: "biological_child", person_a: "g2n02", person_b: "g3n05" },
  // Đời 2 → Đời 3 (nhánh ông Viễn & bà Khéo)
  { type: "biological_child", person_a: "g2n04", person_b: "g3n07" },
  { type: "biological_child", person_a: "g2n05", person_b: "g3n07" },
  { type: "biological_child", person_a: "g2n04", person_b: "g3n08" },
  { type: "biological_child", person_a: "g2n05", person_b: "g3n08" },
  // Đời 3: Hôn nhân
  { type: "marriage", person_a: "g3n01", person_b: "g3n02" },
  { type: "marriage", person_a: "g3n03", person_b: "g3n04" },
  { type: "marriage", person_a: "g3n05", person_b: "g3n06" },
  { type: "marriage", person_a: "g3n08", person_b: "g3n09" },
  // Đời 3 → Đời 4 (con anh Trí & bà Dịu Hiền)
  { type: "biological_child", person_a: "g3n01", person_b: "g4n01" },
  { type: "biological_child", person_a: "g3n02", person_b: "g4n01" },
  { type: "biological_child", person_a: "g3n01", person_b: "g4n03" },
  { type: "biological_child", person_a: "g3n02", person_b: "g4n03" },
  { type: "biological_child", person_a: "g3n01", person_b: "g4n04" },
  { type: "biological_child", person_a: "g3n02", person_b: "g4n04" },
  // Đời 3 → Đời 4 (con bác Cẩm & chú Chính)
  { type: "biological_child", person_a: "g3n03", person_b: "g4n05" },
  { type: "biological_child", person_a: "g3n04", person_b: "g4n05" },
  { type: "biological_child", person_a: "g3n03", person_b: "g4n06" },
  { type: "biological_child", person_a: "g3n04", person_b: "g4n06" },
  // Đời 3 → Đời 4 (con chú Mộc & thím Lam)
  { type: "biological_child", person_a: "g3n05", person_b: "g4n07" },
  { type: "biological_child", person_a: "g3n06", person_b: "g4n07" },
  { type: "biological_child", person_a: "g3n05", person_b: "g4n08" },
  { type: "biological_child", person_a: "g3n06", person_b: "g4n08" },
  // Đời 3 → Đời 4 (con anh Tuệ - nhánh HCM)
  { type: "biological_child", person_a: "g3n07", person_b: "g4n09" },
  // Đời 3 → Đời 4 (con cô Thanh & anh Kiến - nhánh HCM)
  { type: "biological_child", person_a: "g3n08", person_b: "g4n10" },
  { type: "biological_child", person_a: "g3n09", person_b: "g4n10" },
  { type: "biological_child", person_a: "g3n08", person_b: "g4n11" },
  { type: "biological_child", person_a: "g3n09", person_b: "g4n11" },
  // Đời 4: Hôn nhân
  { type: "marriage", person_a: "g4n01", person_b: "g4n02" },
];

const PRIVATE_DETAILS = [
  { person_id: "g3n01", phone_number: "09xx xxx 001", occupation: "Kỹ sư xây dựng (đã nghỉ hưu)",    current_residence: "Hà Đông, Hà Nội" },
  { person_id: "g3n02", phone_number: "09xx xxx 002", occupation: "Giáo viên Văn (đã nghỉ hưu)",      current_residence: "Hà Đông, Hà Nội" },
  { person_id: "g3n03", phone_number: "09xx xxx 003", occupation: "Bác sĩ Nhi khoa",                  current_residence: "Đống Đa, Hà Nội" },
  { person_id: "g3n05", phone_number: "09xx xxx 005", occupation: "Chủ xưởng mộc",                    current_residence: "Hà Đông, Hà Nội" },
  { person_id: "g3n07", phone_number: "09xx xxx 007", occupation: "Kỹ sư Tin học",                    current_residence: "Quận 7, TP.HCM" },
  { person_id: "g4n01", phone_number: "09xx xxx 101", occupation: "Lập trình viên Fullstack",          current_residence: "Cầu Giấy, Hà Nội" },
  { person_id: "g4n02", phone_number: "09xx xxx 102", occupation: "Nhà thiết kế UI/UX",               current_residence: "Cầu Giấy, Hà Nội" },
  { person_id: "g4n03", phone_number: "09xx xxx 103", occupation: "Nghiên cứu sinh Tiến sĩ",           current_residence: "Đống Đa, Hà Nội" },
  { person_id: "g4n05", phone_number: "09xx xxx 105", occupation: "Dược sĩ bệnh viện",                current_residence: "Thanh Xuân, Hà Nội" },
  { person_id: "g4n06", phone_number: "09xx xxx 106", occupation: "Phi công hàng không",              current_residence: "Long Biên, Hà Nội" },
];

async function seedData(pb) {
  console.log("\n🌱  Seeding sample data (Dòng họ Vạn — hư cấu)...\n");

  // Clear existing data first
  console.log("🗑️   Clearing existing data...");
  const [rels, privs, persons] = await Promise.all([
    pb.collection("relationships").getFullList({ fields: "id" }),
    pb.collection("person_details_private").getFullList({ fields: "id" }),
    pb.collection("persons").getFullList({ fields: "id" }),
  ]);
  await Promise.all(rels.map((r) => pb.collection("relationships").delete(r.id)));
  await Promise.all(privs.map((r) => pb.collection("person_details_private").delete(r.id)));
  await Promise.all(persons.map((r) => pb.collection("persons").delete(r.id)));
  ok(`cleared ${rels.length} relationships, ${privs.length} private records, ${persons.length} persons`);

  // Insert persons and build ID mapping (custom IDs → PocketBase IDs)
  console.log("\n👥  Inserting 27 persons...");
  const idMap = {}; // Maps custom IDs (g1n01, etc) to actual PocketBase IDs
  for (const p of PERSONS) {
    const customId = p.id; // Keep track of the custom ID
    const data = { ...p };
    delete data.id; // Remove custom ID, let PocketBase generate one
    // Remove null fields so PocketBase doesn't complain about wrong types
    for (const k of Object.keys(data)) {
      if (data[k] === null) delete data[k];
    }
    const created = await pb.collection("persons").create(data, { requestKey: null });
    idMap[customId] = created.id; // Store the mapping
  }
  ok(`${PERSONS.length} persons inserted`);

  // Insert relationships using the ID mapping
  console.log("\n🔗  Inserting relationships...");
  for (const r of RELATIONSHIPS) {
    const relData = {
      type: r.type,
      person_a: idMap[r.person_a],
      person_b: idMap[r.person_b],
    };
    if (r.note) relData.note = r.note;
    await pb.collection("relationships").create(relData, { requestKey: null });
  }
  ok(`${RELATIONSHIPS.length} relationships inserted`);

  // Insert private details using the ID mapping
  console.log("\n🔒  Inserting private details...");
  for (const d of PRIVATE_DETAILS) {
    const privData = {
      person_id: idMap[d.person_id],
      phone_number: d.phone_number,
      occupation: d.occupation,
      current_residence: d.current_residence,
    };
    await pb.collection("person_details_private").create(privData, { requestKey: null });
  }
  ok(`${PRIVATE_DETAILS.length} private detail records inserted`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n🌳  Gia Phả OS — PocketBase Setup");
  console.log("═══════════════════════════════════════\n");

  if (!ADMIN_EMAIL || !ADMIN_PASS) {
    console.error("❌  Missing credentials. Add these to .env.local:\n");
    console.error("    POCKETBASE_SUPERADMIN_EMAIL=your_email");
    console.error("    POCKETBASE_SUPERADMIN_PASSWORD=your_password\n");
    console.error("    (Copy .env.example to .env.local and fill in the values)\n");
    process.exit(1);
  }

  console.log(`📡  PocketBase: ${PB_URL}`);
  console.log(`👤  Admin:      ${ADMIN_EMAIL}\n`);

  const pb = new PocketBase(PB_URL);
  pb.autoCancellation(false);

  try {
    await pb.collection("_superusers").authWithPassword(ADMIN_EMAIL, ADMIN_PASS);
    console.log("🔑  Authenticated as superadmin\n");
  } catch (e) {
    console.error(`\n❌  Authentication failed: ${e.message}\n`);
    console.error("    ▸ Is PocketBase running?  →  ./pocketbase serve");
    console.error(`    ▸ Check NEXT_PUBLIC_POCKETBASE_URL in .env.local (currently: ${PB_URL})`);
    console.error("    ▸ Have you created the superadmin at http://127.0.0.1:8090/_/ ?\n");
    process.exit(1);
  }

  if (!SEED_ONLY) {
    await setupSchema(pb);
  }

  if (SEED || SEED_ONLY) {
    await seedData(pb);
  }

  console.log("\n═══════════════════════════════════════");
  if (SEED || SEED_ONLY) {
    console.log("✨  Setup + seed complete!\n");
    console.log("    27 family members (Dòng họ Vạn) loaded.");
    console.log("    4 generations · North (Hà Nội) + South (TP.HCM) branches.\n");
  } else {
    console.log("✨  Schema setup complete!\n");
    console.log("    To load sample data run:  npm run pb:seed");
  }
  console.log("Next steps:");
  console.log("    1. Start the app:  npm run dev  (or: bun run dev)");
  console.log("    2. Open: http://localhost:3030");
  console.log("    3. Register — the first account automatically becomes admin.\n");
}

main().catch((err) => {
  console.error("\n❌  Setup failed:", err?.message || err);
  if (err?.data) console.error("   Details:", JSON.stringify(err.data, null, 2));
  process.exit(1);
});

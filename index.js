import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbFile = path.join(__dirname, "data.json");
const adapter = new JSONFile(dbFile);
const db = new Low(adapter, { records: [] });

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

await db.read();

const REQUIRED_FIELDS = {
  seller: ["name", "goods", "phone", "location"],
  kayayoo: ["name", "phone", "area", "charge"],
  rider: ["name", "phone", "route", "rate"],
  customer: ["area", "usesWhatsapp", "payDelivery"],
  momo: ["name", "phone", "location", "storage"]
};

app.get("/api/health", (req, res) => {
  res.json({ ok: true, app: "SpiderLink Field Collector" });
});

app.post("/api/submit/:type", async (req, res) => {
  const { type } = req.params;
  const data = req.body;

  if (!REQUIRED_FIELDS[type]) return res.status(400).json({ error: "Invalid type" });

  const missing = REQUIRED_FIELDS[type].filter(f => !data[f]);
  if (missing.length) return res.status(400).json({ error: "Missing fields", missing });

  const record = { id: `${type}-${Date.now()}`, type, ...data, createdAt: new Date().toISOString() };
  db.data.records.push(record);
  await db.write();

  res.json({ success: true, id: record.id });
});

app.get("/api/list", async (req, res) => {
  res.json(db.data.records);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🕸️ SpiderLink Collector running locally on port ${PORT}`));

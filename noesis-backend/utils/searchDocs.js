// backend/utils/searchDocs.js

// ✅ Force CommonJS compatibility in an ESM project
import fs from "fs";
import path from "path";
import { pipeline } from "@xenova/transformers";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// ✅ Load pdf-parse safely as CommonJS
const pdfParse = require("pdf-parse");

const DOCS_DIR = path.join(process.cwd(), "data/docs");
let cachedEmbeddings = [];
let embedder = null;

// 🧠 Initialize once
async function getEmbedder() {
  if (!embedder) {
    console.log("⏳ Loading embedding model...");
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    console.log("✅ Model loaded!");
  }
  return embedder;
}

// 🧭 Step 1: Load all PDFs and extract text
async function loadDocuments() {
  const files = fs.readdirSync(DOCS_DIR);
  const docs = [];

  for (const file of files) {
    if (!file.endsWith(".pdf")) continue;
    const filePath = path.join(DOCS_DIR, file);
    const dataBuffer = fs.readFileSync(filePath);

    // ✅ parse PDF content
    const pdfData = await pdfParse(dataBuffer);

    docs.push({
      name: file,
      text: pdfData.text.replace(/\s+/g, " ").trim(),
    });
  }

  console.log(`📄 Loaded ${docs.length} PDF(s)`);
  return docs;
}

// 🧮 Step 2: Build embeddings
async function buildEmbeddings() {
  const docs = await loadDocuments();
  const embed = await getEmbedder();
  cachedEmbeddings = [];

  for (const doc of docs) {
    const output = await embed(doc.text.slice(0, 8000), {
      pooling: "mean",
      normalize: true,
    });
    cachedEmbeddings.push({
      name: doc.name,
      text: doc.text,
      embedding: Array.from(output.data),
    });
  }

  console.log(`✅ Built ${cachedEmbeddings.length} document embeddings`);
  return cachedEmbeddings;
}

// 🧠 Step 3: Search relevant docs
export async function searchRelevantDocs(query) {
  if (cachedEmbeddings.length === 0) await buildEmbeddings();
  const embed = await getEmbedder();

  const queryEmbedding = await embed(query, { pooling: "mean", normalize: true });
  const qVec = Array.from(queryEmbedding.data);

  const cosine = (a, b) => {
    const dot = a.reduce((s, v, i) => s + v * b[i], 0);
    const normA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
    const normB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
    return dot / (normA * normB);
  };

  const ranked = cachedEmbeddings
    .map((doc) => ({
      ...doc,
      score: cosine(qVec, doc.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return ranked.map((r) => ({
    title: r.name.replace(".pdf", ""),
    snippet: r.text.slice(0, 300),
    score: r.score.toFixed(3),
  }));
}

import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";

const db = new Database("filament.db");

// Initialize database
db.exec(`
  DROP TABLE IF EXISTS filaments;
  CREATE TABLE filaments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand TEXT NOT NULL,
    type TEXT NOT NULL,
    colorName TEXT NOT NULL,
    colorHex TEXT NOT NULL,
    quantity REAL NOT NULL,
    notes TEXT,
    lastUsed DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/filaments", (req, res) => {
    const filaments = db.prepare("SELECT * FROM filaments ORDER BY lastUsed DESC").all();
    res.json(filaments);
  });

  app.get("/icon.png", async (req, res) => {
    const iconPath = path.join(process.cwd(), "public", "icon.png");
    
    if (fs.existsSync(iconPath)) {
      return res.sendFile(iconPath);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).send("API Key missing");
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: 'A professional, modern app icon for a 3D printing filament tracker. The icon features a stylized 3D printer filament spool or a package box, in a vibrant emerald green color scheme with a clean, minimalist design. Rounded corners, high quality, 1024x1024 resolution.' }],
        },
        config: { imageConfig: { aspectRatio: "1:1" } }
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const buffer = Buffer.from(part.inlineData.data, 'base64');
          if (!fs.existsSync(path.join(process.cwd(), "public"))) {
            fs.mkdirSync(path.join(process.cwd(), "public"));
          }
          fs.writeFileSync(iconPath, buffer);
          return res.type('image/png').send(buffer);
        }
      }
      res.status(500).send("Generation failed");
    } catch (error) {
      console.error("Icon generation error:", error);
      res.status(500).send("Error generating icon");
    }
  });

  app.post("/api/filaments", (req, res) => {
    const { brand, type, colorName, colorHex, quantity, notes } = req.body;
    const info = db.prepare(`
      INSERT INTO filaments (brand, type, colorName, colorHex, quantity, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(brand, type, colorName, colorHex, quantity, notes);
    
    const newFilament = db.prepare("SELECT * FROM filaments WHERE id = ?").get(info.lastInsertRowid);
    res.json(newFilament);
  });

  app.put("/api/filaments/:id", (req, res) => {
    const { id } = req.params;
    const { brand, type, colorName, colorHex, quantity, notes } = req.body;
    db.prepare(`
      UPDATE filaments 
      SET brand = ?, type = ?, colorName = ?, colorHex = ?, quantity = ?, notes = ?, lastUsed = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(brand, type, colorName, colorHex, quantity, notes, id);
    
    const updatedFilament = db.prepare("SELECT * FROM filaments WHERE id = ?").get(id);
    res.json(updatedFilament);
  });

  app.delete("/api/filaments/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM filaments WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

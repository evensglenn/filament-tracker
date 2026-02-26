import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";

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

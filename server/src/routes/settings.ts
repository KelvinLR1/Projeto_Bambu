import { Router } from 'express';
import db from '../database/db.js';

const router = Router();

// GET all settings as key-value dictionary and list
router.get('/', (req, res) => {
  try {
    const list = db.prepare(`SELECT * FROM settings ORDER BY key ASC`).all() as any[];
    const map = list.reduce((acc, cur) => ({ ...acc, [cur.key]: cur.value }), {});
    res.json({ list, map });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update multiple settings at once
router.put('/', (req, res) => {
  try {
    const settings = req.body; // { key: value, ... }
    const stmt = db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`);

    const updateTx = db.transaction(() => {
      for (const [key, val] of Object.entries(settings)) {
        stmt.run(key, String(val));
      }
    });

    updateTx();

    const updatedList = db.prepare(`SELECT * FROM settings`).all();
    res.json(updatedList);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

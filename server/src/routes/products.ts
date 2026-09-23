import { Router } from 'express';
import db from '../database/db.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../../../data/uploads/products');
const filesDir = path.resolve(__dirname, '../../../data/uploads/files');

function processImagePayload(productId: string, rawImageUrl: string): string {
  if (!rawImageUrl) return '';
  if (rawImageUrl.startsWith('data:image/')) {
    try {
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const match = rawImageUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (match) {
        let ext = match[1].toLowerCase();
        if (ext === 'jpeg') ext = 'jpg';
        if (ext === 'svg+xml') ext = 'svg';
        const base64Data = match[2];
        const filename = `prod_${productId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
        const filePath = path.join(uploadsDir, filename);
        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
        return `/uploads/products/${filename}`;
      }
    } catch (e) {
      console.error('Erro ao salvar imagem localmente:', e);
    }
  }
  return rawImageUrl;
}

function processFilePayload(productId: string, filename: string, rawFileData: string): { file_url: string; file_size: number; file_type: string } {
  const ext = (path.extname(filename || '').replace('.', '') || 'FILE').toUpperCase();
  if (!rawFileData) {
    return { file_url: '', file_size: 0, file_type: ext };
  }

  if (rawFileData.startsWith('data:')) {
    try {
      if (!fs.existsSync(filesDir)) {
        fs.mkdirSync(filesDir, { recursive: true });
      }
      const commaIdx = rawFileData.indexOf(',');
      const base64Data = commaIdx > -1 ? rawFileData.slice(commaIdx + 1) : rawFileData;
      const buffer = Buffer.from(base64Data, 'base64');
      const safeName = (filename || 'arquivo.stl').replace(/[^a-zA-Z0-9._-]/g, '_');
      const uniqueFilename = `part_${productId}_${Date.now()}_${safeName}`;
      const filePath = path.join(filesDir, uniqueFilename);
      fs.writeFileSync(filePath, buffer);
      return {
        file_url: `/uploads/files/${uniqueFilename}`,
        file_size: buffer.length,
        file_type: ext,
      };
    } catch (e) {
      console.error('Erro ao salvar arquivo de peça:', e);
    }
  }

  return {
    file_url: rawFileData,
    file_size: 0,
    file_type: ext,
  };
}

// GET all active products
router.get('/', (req, res) => {
  try {
    const { category, process, search } = req.query;
    let query = `
      SELECT p.*,
        (SELECT COUNT(*) FROM product_images pi WHERE pi.product_id = p.id) as images_count,
        (SELECT COUNT(*) FROM product_files pf WHERE pf.product_id = p.id) as files_count,
        COALESCE(
          (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_cover = 1 LIMIT 1),
          (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.created_at ASC LIMIT 1),
          p.image_url
        ) as display_image_url
      FROM products p 
      WHERE p.active = 1
    `;
    const params: any[] = [];

    if (category && category !== 'ALL') {
      query += ` AND p.category = ?`;
      params.push(category);
    }

    if (process && process !== 'ALL') {
      query += ` AND p.process_type = ?`;
      params.push(process);
    }

    if (search) {
      query += ` AND (p.name LIKE ? OR p.sku LIKE ? OR p.description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY p.category ASC, p.name ASC`;

    const products = db.prepare(query).all(...params) as any[];
    // Normalize image_url with display_image_url
    const result = products.map(p => ({
      ...p,
      image_url: p.display_image_url || p.image_url
    }));

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET product by ID (including images)
router.get('/:id', (req, res) => {
  try {
    const product = db.prepare(`SELECT * FROM products WHERE id = ?`).get(req.params.id) as any;
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    const images = db.prepare(`
      SELECT * FROM product_images 
      WHERE product_id = ? 
      ORDER BY is_cover DESC, display_order ASC, created_at ASC
    `).all(req.params.id);

    const files = db.prepare(`
      SELECT * FROM product_files 
      WHERE product_id = ? 
      ORDER BY display_order ASC, created_at ASC
    `).all(req.params.id);

    product.images = images;
    product.files = files;
    res.json(product);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET product images
router.get('/:id/images', (req, res) => {
  try {
    const images = db.prepare(`
      SELECT * FROM product_images 
      WHERE product_id = ? 
      ORDER BY is_cover DESC, display_order ASC, created_at ASC
    `).all(req.params.id);
    res.json(images);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST add image(s) to product
router.post('/:id/images', (req, res) => {
  try {
    const productId = req.params.id;
    const { image_url, images, title, is_cover } = req.body;

    const existingCount = (db.prepare('SELECT COUNT(*) as cnt FROM product_images WHERE product_id = ?').get(productId) as any)?.cnt || 0;

    const itemsToInsert: Array<{ image_url: string; title?: string; is_cover?: boolean }> = [];

    if (Array.isArray(images)) {
      itemsToInsert.push(...images);
    } else if (image_url) {
      itemsToInsert.push({ image_url, title, is_cover });
    } else {
      return res.status(400).json({ error: 'Nenhuma imagem fornecida' });
    }

    const insertedList: any[] = [];
    let updatedCoverUrl: string | null = null;

    for (let i = 0; i < itemsToInsert.length; i++) {
      const item = itemsToInsert[i];
      const finalUrl = processImagePayload(productId, item.image_url);
      const imgId = `img_${uuidv4().replace(/-/g, '').substring(0, 16)}`;
      const willBeCover = item.is_cover || (existingCount === 0 && i === 0);

      if (willBeCover) {
        db.prepare(`UPDATE product_images SET is_cover = 0 WHERE product_id = ?`).run(productId);
        updatedCoverUrl = finalUrl;
      }

      db.prepare(`
        INSERT INTO product_images (id, product_id, image_url, title, is_cover, display_order)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        imgId,
        productId,
        finalUrl,
        item.title || null,
        willBeCover ? 1 : 0,
        existingCount + i
      );

      const inserted = db.prepare(`SELECT * FROM product_images WHERE id = ?`).get(imgId);
      insertedList.push(inserted);
    }

    if (updatedCoverUrl) {
      db.prepare(`UPDATE products SET image_url = ? WHERE id = ?`).run(updatedCoverUrl, productId);
    }

    res.status(201).json(Array.isArray(images) ? insertedList : insertedList[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT set cover image
router.put('/:id/images/:imageId/cover', (req, res) => {
  try {
    const { id: productId, imageId } = req.params;
    const target = db.prepare(`SELECT * FROM product_images WHERE id = ? AND product_id = ?`).get(imageId, productId) as any;
    if (!target) {
      return res.status(404).json({ error: 'Imagem não encontrada' });
    }

    db.prepare(`UPDATE product_images SET is_cover = 0 WHERE product_id = ?`).run(productId);
    db.prepare(`UPDATE product_images SET is_cover = 1 WHERE id = ?`).run(imageId);
    db.prepare(`UPDATE products SET image_url = ? WHERE id = ?`).run(target.image_url, productId);

    const updated = db.prepare(`SELECT * FROM product_images WHERE id = ?`).get(imageId);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update image caption/title
router.put('/:id/images/:imageId', (req, res) => {
  try {
    const { id: productId, imageId } = req.params;
    const { title } = req.body;
    db.prepare(`UPDATE product_images SET title = ? WHERE id = ? AND product_id = ?`).run(title || null, imageId, productId);
    const updated = db.prepare(`SELECT * FROM product_images WHERE id = ?`).get(imageId);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE single image
router.delete('/:id/images/:imageId', (req, res) => {
  try {
    const { id: productId, imageId } = req.params;
    const img = db.prepare(`SELECT * FROM product_images WHERE id = ? AND product_id = ?`).get(imageId, productId) as any;
    if (!img) {
      return res.status(404).json({ error: 'Imagem não encontrada' });
    }

    db.prepare(`DELETE FROM product_images WHERE id = ?`).run(imageId);

    // Delete local file if applicable
    if (img.image_url?.startsWith('/uploads/products/')) {
      try {
        const localPath = path.join(uploadsDir, path.basename(img.image_url));
        if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
      } catch (e) {
        console.warn('Não foi possível excluir arquivo físico:', e);
      }
    }

    // If was cover, reassign cover
    if (img.is_cover) {
      const nextCover = db.prepare(`SELECT * FROM product_images WHERE product_id = ? ORDER BY created_at ASC LIMIT 1`).get(productId) as any;
      if (nextCover) {
        db.prepare(`UPDATE product_images SET is_cover = 1 WHERE id = ?`).run(nextCover.id);
        db.prepare(`UPDATE products SET image_url = ? WHERE id = ?`).run(nextCover.image_url, productId);
      } else {
        db.prepare(`UPDATE products SET image_url = NULL WHERE id = ?`).run(productId);
      }
    }

    res.json({ success: true, message: 'Imagem removida com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST batch delete images
router.post('/:id/images/delete-batch', (req, res) => {
  try {
    const { id: productId } = req.params;
    const { imageIds } = req.body;
    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      return res.status(400).json({ error: 'Nenhuma imagem selecionada' });
    }

    for (const imgId of imageIds) {
      const img = db.prepare(`SELECT * FROM product_images WHERE id = ? AND product_id = ?`).get(imgId, productId) as any;
      if (img) {
        db.prepare(`DELETE FROM product_images WHERE id = ?`).run(imgId);
        if (img.image_url?.startsWith('/uploads/products/')) {
          try {
            const localPath = path.join(uploadsDir, path.basename(img.image_url));
            if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
          } catch (e) {}
        }
      }
    }

    // Check if product still has a cover
    const currentCover = db.prepare(`SELECT * FROM product_images WHERE product_id = ? AND is_cover = 1`).get(productId) as any;
    if (!currentCover) {
      const nextCover = db.prepare(`SELECT * FROM product_images WHERE product_id = ? ORDER BY created_at ASC LIMIT 1`).get(productId) as any;
      if (nextCover) {
        db.prepare(`UPDATE product_images SET is_cover = 1 WHERE id = ?`).run(nextCover.id);
        db.prepare(`UPDATE products SET image_url = ? WHERE id = ?`).run(nextCover.image_url, productId);
      } else {
        db.prepare(`UPDATE products SET image_url = NULL WHERE id = ?`).run(productId);
      }
    }

    res.json({ success: true, message: `${imageIds.length} imagens removidas com sucesso` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET product files / components
router.get('/:id/files', (req, res) => {
  try {
    const files = db.prepare(`
      SELECT * FROM product_files 
      WHERE product_id = ? 
      ORDER BY display_order ASC, created_at ASC
    `).all(req.params.id);
    res.json(files);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST add file / component to product
router.post('/:id/files', (req, res) => {
  try {
    const productId = req.params.id;
    const { name, filename, file_data, image_data, image_url, quantity, weight_g, print_time_hours, notes } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome da sub-peça é obrigatório' });
    }

    const { file_url, file_size, file_type } = processFilePayload(productId, filename || 'arquivo.stl', file_data);
    const finalImageUrl = processImagePayload(productId, image_data || image_url);
    const id = `part_${uuidv4().replace(/-/g, '').substring(0, 16)}`;

    const existingCount = (db.prepare('SELECT COUNT(*) as cnt FROM product_files WHERE product_id = ?').get(productId) as any)?.cnt || 0;

    db.prepare(`
      INSERT INTO product_files (
        id, product_id, name, filename, file_url, file_size, file_type,
        image_url, quantity, weight_g, print_time_hours, notes, display_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      productId,
      name,
      filename || 'arquivo.stl',
      file_url,
      file_size || Number(req.body.file_size) || 0,
      file_type || req.body.file_type || 'STL',
      finalImageUrl || null,
      Number(quantity) || 1,
      Number(weight_g) || 0,
      Number(print_time_hours) || 0,
      notes || null,
      existingCount
    );

    const created = db.prepare(`SELECT * FROM product_files WHERE id = ?`).get(id);
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update file / component
router.put('/:id/files/:fileId', (req, res) => {
  try {
    const { id: productId, fileId } = req.params;
    const { name, filename, file_data, image_data, image_url, quantity, weight_g, print_time_hours, notes } = req.body;

    const current = db.prepare(`SELECT * FROM product_files WHERE id = ? AND product_id = ?`).get(fileId, productId) as any;
    if (!current) {
      return res.status(404).json({ error: 'Peça/Arquivo não encontrado' });
    }

    let finalFileUrl = current.file_url;
    let finalFileSize = current.file_size;
    let finalFileType = current.file_type;
    let finalFilename = filename || current.filename;

    if (file_data) {
      const processed = processFilePayload(productId, finalFilename, file_data);
      finalFileUrl = processed.file_url;
      finalFileSize = processed.file_size;
      finalFileType = processed.file_type;

      if (current.file_url?.startsWith('/uploads/files/')) {
        try {
          const oldPath = path.join(filesDir, path.basename(current.file_url));
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        } catch (e) {}
      }
    }

    let finalImageUrl = current.image_url;
    if (image_data !== undefined || image_url !== undefined) {
      finalImageUrl = processImagePayload(productId, image_data || image_url);
      if (current.image_url?.startsWith('/uploads/products/') && finalImageUrl !== current.image_url) {
        try {
          const oldImgPath = path.join(uploadsDir, path.basename(current.image_url));
          if (fs.existsSync(oldImgPath)) fs.unlinkSync(oldImgPath);
        } catch (e) {}
      }
    }

    db.prepare(`
      UPDATE product_files SET
        name = ?,
        filename = ?,
        file_url = ?,
        file_size = ?,
        file_type = ?,
        image_url = ?,
        quantity = ?,
        weight_g = ?,
        print_time_hours = ?,
        notes = ?
      WHERE id = ? AND product_id = ?
    `).run(
      name || current.name,
      finalFilename,
      finalFileUrl,
      finalFileSize,
      finalFileType,
      finalImageUrl || null,
      quantity !== undefined ? Number(quantity) : current.quantity,
      weight_g !== undefined ? Number(weight_g) : current.weight_g,
      print_time_hours !== undefined ? Number(print_time_hours) : current.print_time_hours,
      notes !== undefined ? notes : current.notes,
      fileId,
      productId
    );

    const updated = db.prepare(`SELECT * FROM product_files WHERE id = ?`).get(fileId);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE file / component
router.delete('/:id/files/:fileId', (req, res) => {
  try {
    const { id: productId, fileId } = req.params;
    const current = db.prepare(`SELECT * FROM product_files WHERE id = ? AND product_id = ?`).get(fileId, productId) as any;
    if (!current) {
      return res.status(404).json({ error: 'Peça/Arquivo não encontrado' });
    }

    db.prepare(`DELETE FROM product_files WHERE id = ?`).run(fileId);

    if (current.file_url?.startsWith('/uploads/files/')) {
      try {
        const filePath = path.join(filesDir, path.basename(current.file_url));
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (e) {}
    }

    if (current.image_url?.startsWith('/uploads/products/')) {
      try {
        const imgPath = path.join(uploadsDir, path.basename(current.image_url));
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      } catch (e) {}
    }

    res.json({ success: true, message: 'Peça/Arquivo removido com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE product
router.post('/', (req, res) => {
  try {
    const {
      name,
      sku,
      category,
      process_type,
      description,
      material_id,
      equipment_id,
      production_time_hours,
      weight_g,
      unit_cost,
      unit_price,
      margin_percent,
      image_url,
      calc_params_json,
    } = req.body;

    if (!name || !process_type) {
      return res.status(400).json({ error: 'Nome e Processo são obrigatórios' });
    }

    const id = req.body.id || uuidv4();
    const finalSku = sku || `PRD-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const finalImageUrl = processImagePayload(id, image_url);

    db.prepare(`
      INSERT INTO products (
        id, sku, name, category, process_type, description,
        material_id, equipment_id, production_time_hours, weight_g,
        unit_cost, unit_price, margin_percent, image_url, calc_params_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      finalSku,
      name,
      category || 'Geral',
      process_type,
      description || null,
      material_id || null,
      equipment_id || null,
      Number(production_time_hours) || 0,
      Number(weight_g) || 0,
      Number(unit_cost) || 0,
      Number(unit_price) || 0,
      Number(margin_percent) || 50,
      finalImageUrl || null,
      calc_params_json ? JSON.stringify(calc_params_json) : null
    );

    if (finalImageUrl) {
      db.prepare(`
        INSERT INTO product_images (id, product_id, image_url, title, is_cover, display_order)
        VALUES (?, ?, ?, ?, 1, 0)
      `).run(`img_${uuidv4().replace(/-/g, '').substring(0, 16)}`, id, finalImageUrl, name);
    }

    const created = db.prepare(`SELECT * FROM products WHERE id = ?`).get(id);
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE product
router.put('/:id', (req, res) => {
  try {
    const {
      name,
      sku,
      category,
      process_type,
      description,
      material_id,
      equipment_id,
      production_time_hours,
      weight_g,
      unit_cost,
      unit_price,
      margin_percent,
      image_url,
      calc_params_json,
    } = req.body;

    const finalImageUrl = processImagePayload(req.params.id, image_url);

    db.prepare(`
      UPDATE products SET
        name = ?,
        sku = ?,
        category = ?,
        process_type = ?,
        description = ?,
        material_id = ?,
        equipment_id = ?,
        production_time_hours = ?,
        weight_g = ?,
        unit_cost = ?,
        unit_price = ?,
        margin_percent = ?,
        image_url = ?,
        calc_params_json = ?
      WHERE id = ?
    `).run(
      name,
      sku,
      category,
      process_type,
      description || null,
      material_id || null,
      equipment_id || null,
      Number(production_time_hours) || 0,
      Number(weight_g) || 0,
      Number(unit_cost) || 0,
      Number(unit_price) || 0,
      Number(margin_percent) || 50,
      finalImageUrl || null,
      calc_params_json ? (typeof calc_params_json === 'string' ? calc_params_json : JSON.stringify(calc_params_json)) : null,
      req.params.id
    );

    // If image_url was given and not yet in product_images, ensure it's registered
    if (finalImageUrl) {
      const exists = db.prepare(`SELECT 1 FROM product_images WHERE product_id = ? AND image_url = ?`).get(req.params.id, finalImageUrl);
      if (!exists) {
        db.prepare(`UPDATE product_images SET is_cover = 0 WHERE product_id = ?`).run(req.params.id);
        db.prepare(`
          INSERT INTO product_images (id, product_id, image_url, title, is_cover, display_order)
          VALUES (?, ?, ?, ?, 1, 0)
        `).run(`img_${uuidv4().replace(/-/g, '').substring(0, 16)}`, req.params.id, finalImageUrl, name);
      }
    }

    const updated = db.prepare(`SELECT * FROM products WHERE id = ?`).get(req.params.id);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE (soft delete or hard delete) product
router.delete('/:id', (req, res) => {
  try {
    db.prepare(`UPDATE products SET active = 0 WHERE id = ?`).run(req.params.id);
    res.json({ success: true, message: 'Produto removido com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;


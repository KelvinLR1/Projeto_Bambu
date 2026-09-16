import { Router } from 'express';
import { generateWhatsAppLink, cleanPhoneNumber } from '../services/whatsappService.js';

const router = Router();

// POST generate link
router.post('/link', (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ error: 'Telefone e Mensagem são obrigatórios' });
    }

    const cleanPhone = cleanPhoneNumber(phone);
    const link = generateWhatsAppLink(phone, message);

    res.json({
      cleanPhone,
      link,
      message
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

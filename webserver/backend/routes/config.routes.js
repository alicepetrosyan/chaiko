import express from 'express';
import Config from '../models/config.model.js';

const router = express.Router();
const DEFAULT_ORDER = ['None', 'None', 'None', 'None'];

// GET /api/config - Fetch the current syrup order
router.get('/', async (req, res) => {
  try {
    const config = await Config.findOne({ key: 'syrupOrder' }).lean();
    const order = config?.order ?? DEFAULT_ORDER;
    return res.status(200).json({ data: order });
  } catch (error) {
    console.error('Error fetching syrup order:', error);
    return res.status(500).json({ message: 'Failed to fetch syrup order.' });
  }
});

// POST /api/config - Update the syrup order
router.post('/', async (req, res) => {
  const { order } = req.body;

  if (!Array.isArray(order)) {
    return res.status(400).json({ message: 'Invalid syrup order.' });
  }

  try {
    const sanitizedOrder = order.map((item) => (typeof item === 'string' ? item.trim() : '')).filter(Boolean);
    const config = await Config.findOneAndUpdate(
      { key: 'syrupOrder' },
      { key: 'syrupOrder', order: sanitizedOrder.length > 0 ? sanitizedOrder : DEFAULT_ORDER },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(200).json({
      message: 'Syrup order updated successfully.',
      data: config.order,
    });
  } catch (error) {
    console.error('Error saving syrup order:', error);
    return res.status(500).json({ message: 'Failed to save syrup order.' });
  }
});

export default router;
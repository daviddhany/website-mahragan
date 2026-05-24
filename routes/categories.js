const express = require('express');
const Category = require('../models/Category');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort('name');
  res.json(categories);
});

router.post('/', requireAdmin, async (req, res) => {
  const name = (req.body.name || '').trim();

  if (!name) {
    return res.status(400).json({ error: 'اسم التصنيف مطلوب' });
  }

  try {
    const existingCategory = await Category.findOne({ name });

    if (existingCategory) {
      return res.status(409).json({ error: 'هذا التصنيف موجود بالفعل' });
    }

    const category = await Category.create({ name, isActive: true });
    return res.json(category);
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ error: 'هذا التصنيف موجود بالفعل' });
    }

    console.error('Create category error:', err);
    return res.status(500).json({ error: 'فشل إضافة التصنيف. حاول مرة أخرى' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return res.status(404).json({ error: 'التصنيف غير موجود' });
  }

  category.isActive = false;
  await category.save();

  res.json({ message: 'Category removed' });
});

module.exports = router;

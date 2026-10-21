const Product = require('../models/Product');

exports.getAllCategories = async (req, res) => {
  try {
    const products = await Product.find({}, 'category');
    const categoriesSet = new Set(['All Products']);
    products.forEach(p => {
      if (p.category) categoriesSet.add(p.category);
    });
    const categoriesList = Array.from(categoriesSet).map((cat, idx) => ({
      id: idx + 1,
      name: cat,
      description: `${cat} category`
    }));
    res.json(categoriesList);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Server error fetching categories' });
  }
};

exports.createCategory = async (req, res) => {
  const { name, description } = req.body;
  res.status(201).json({ id: Date.now(), name, description });
};

exports.updateCategory = async (req, res) => {
  res.json({ message: 'Category updated successfully' });
};

exports.deleteCategory = async (req, res) => {
  res.json({ message: 'Category deleted successfully' });
};

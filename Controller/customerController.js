


const pool = require('../config/db');

exports.addCustomer = async (req, res) => {
  try {
    const retailerId = req.user.id;
    const { name, mobile, email, address } = req.body;

    if (!name || !mobile) {
      return res.status(400).json({
        success: false,
        message: 'Name and mobile are required',
      });
    }

    const [result] = await pool.query(
      'INSERT INTO customers (retailer_id, name, mobile, email, address) VALUES (?, ?, ?, ?, ?)',
      [retailerId, name, mobile, email || null, address || null]
    );

    res.status(201).json({
      success: true,
      message: 'Customer added successfully',
      customerId: result.insertId,
    });
  } catch (error) {
    console.error('Add customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add customer',
    });
  }
};

exports.getCustomers = async (req, res) => {
  try {
    const retailerId = req.user.id;
    const { mobile } = req.query;

    let query = 'SELECT id, name, mobile, email, address FROM customers WHERE retailer_id = ?';
    const params = [retailerId];

    if (mobile) {
      query += ' AND mobile = ?';
      params.push(mobile);
    }

    const [customers] = await pool.query(query, params);

    res.json({
      success: true,
      data: customers,
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers',
    });
  }
};

exports.getCustomer = async (req, res) => {
  try {
    const retailerId = req.user.id;
    const customerId = req.params.id;

    const [customer] = await pool.query(
      'SELECT id, name, mobile, email, address FROM customers WHERE id = ? AND retailer_id = ?',
      [customerId, retailerId]
    );

    if (!customer || customer.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    const [transactions] = await pool.query(
      'SELECT * FROM transactions WHERE customer_id = ? AND retailer_id = ? ORDER BY created_at DESC',
      [customerId, retailerId]
    );

    res.json({
      success: true,
      data: {
        ...customer[0],
        transactions,
      },
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer details',
    });
  }
};
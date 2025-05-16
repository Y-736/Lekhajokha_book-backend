// const pool = require('../config/db');

// exports.getTransactions = async (req, res) => {
//   try {
//     const retailerId = req.user.id;
//     const { customer_id } = req.query;

//     const cacheKey = customer_id
//       ? `transactions-${retailerId}-${customer_id}`
//       : `transactions-${retailerId}`;

//     let query = `
//       SELECT t.*, c.name AS customer_name 
//       FROM transactions t
//       JOIN customers c ON t.customer_id = c.id
//       WHERE t.retailer_id = ?
//     `;
//     const params = [retailerId];

//     if (customer_id) {
//       query += ' AND t.customer_id = ?';
//       params.push(customer_id);
//     }

//     query += ' ORDER BY t.created_at DESC';

//     const [rows] = await pool.query(query, params);

//     res.set({
//       'Cache-Control': 'private, max-age=60',
//       'Last-Modified': new Date().toUTCString(),
//     });

//     res.json({
//       success: true,
//       data: rows,
//     });
//   } catch (error) {
//     console.error('Get transactions error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch transactions',
//     });
//   }
// };

// exports.addTransaction = async (req, res) => {
//   try {
//     const retailerId = req.user.id;
//     const { customer_id, description, amount, type } = req.body;

//     if (!customer_id || !amount || !type) {
//       return res.status(400).json({
//         success: false,
//         message: 'Missing required fields: customer_id, amount, or type',
//       });
//     }

//     if (!['credit', 'debit'].includes(type)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid transaction type. Must be "credit" or "debit"',
//       });
//     }

//     const query = `
//       INSERT INTO transactions (retailer_id, customer_id, description, amount, type, created_at)
//       VALUES (?, ?, ?, ?, ?, NOW())
//     `;
//     const params = [retailerId, customer_id, description || '', amount, type];

//     const [result] = await pool.query(query, params);

//     res.status(201).json({
//       success: true,
//       data: {
//         id: result.insertId,
//         retailer_id: retailerId,
//         customer_id,
//         description,
//         amount,
//         type,
//         created_at: new Date(),
//       },
//     });
//   } catch (error) {
//     console.error('Add transaction error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to add transaction',
//     });
//   }
// };

// exports.updateTransaction = async (req, res) => {
//   try {
//     const retailerId = req.user.id;
//     const { id } = req.params;
//     const { customer_id, description, amount, type } = req.body;

//     if (!customer_id || !amount || !type) {
//       return res.status(400).json({
//         success: false,
//         message: 'Missing required fields: customer_id, amount, or type',
//       });
//     }

//     if (!['credit', 'debit'].includes(type)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid transaction type. Must be "credit" or "debit"',
//       });
//     }

//     const query = `
//       UPDATE transactions 
//       SET customer_id = ?, description = ?, amount = ?, type = ?, updated_at = NOW()
//       WHERE id = ? AND retailer_id = ?
//     `;
//     const params = [customer_id, description || '', amount, type, id, retailerId];

//     const [result] = await pool.query(query, params);

//     if (result.affectedRows === 0) {
//       return res.status(404).json({
//         success: false,
//         message: 'Transaction not found or not authorized',
//       });
//     }

//     res.json({
//       success: true,
//       data: {
//         id,
//         retailer_id: retailerId,
//         customer_id,
//         description,
//         amount,
//         type,
//         updated_at: new Date(),
//       },
//     });
//   } catch (error) {
//     console.error('Update transaction error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to update transaction',
//     });
//   }
// };
const pool = require('../config/db');

exports.getTransactions = async (req, res) => {
  try {
    const retailerId = req.user.id;
    const { customer_id } = req.query;

    let query = `
      SELECT DISTINCT t.id, t.retailer_id, t.customer_id, t.description, t.amount, t.type, 
        t.status, t.due_date, t.created_at, t.updated_at, 
        c.name AS customer_name, c.mobile AS customer_mobile
      FROM transactions t
      JOIN customers c ON t.customer_id = c.id
      WHERE t.retailer_id = ?
    `;
    const params = [retailerId];

    if (customer_id) {
      query += ' AND t.customer_id = ?';
      params.push(customer_id);
    }

    query += ' ORDER BY t.created_at DESC';

    const [rows] = await pool.query(query, params);

    res.set({
      'Cache-Control': 'private, max-age=60',
      'Last-Modified': new Date().toUTCString(),
    });

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
    });
  }
};

exports.addTransaction = async (req, res) => {
  try {
    const retailerId = req.user.id;
    const { customer_id, description, amount, type, due_date } = req.body;

    // Validate required fields
    if (!customer_id || !amount || !type) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: customer_id, amount, or type',
      });
    }

    if (!['credit', 'debit'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction type. Must be "credit" or "debit"',
      });
    }

    if (type === 'credit' && due_date && !/^\d{4}-\d{2}-\d{2}$/.test(due_date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid due_date format. Use YYYY-MM-DD',
      });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number',
      });
    }

    // Validate customer_id exists and belongs to retailer
    const [customer] = await pool.query(
      'SELECT id FROM customers WHERE id = ? AND retailer_id = ?',
      [customer_id, retailerId]
    );
    if (!customer || customer.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found for this retailer',
      });
    }

    const query = `
      INSERT INTO transactions (retailer_id, customer_id, description, amount, type, due_date, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;
    const params = [
      retailerId,
      customer_id,
      description || '',
      parsedAmount,
      type,
      type === 'credit' && due_date ? due_date : null,
    ];

    const [result] = await pool.query(query, params);

    res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        retailer_id: retailerId,
        customer_id,
        description,
        amount: parsedAmount,
        type,
        due_date,
        created_at: new Date(),
      },
    });
  } catch (error) {
    console.error('Add transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add transaction',
    });
  }
};

exports.updateTransactionStatus = async (req, res) => {
  try {
    const retailerId = req.user.id;
    const { id } = req.params; // Transaction ID from URL
    const { status } = req.body; // New status from request body

    // Validate status
    if (!status || !['pending', 'completed', 'paid'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either "pending", "completed", or "paid"',
      });
    }

    // Check if transaction exists and belongs to the retailer
    const [transaction] = await pool.query(
      'SELECT * FROM transactions WHERE id = ? AND retailer_id = ?',
      [id, retailerId]
    );

    if (!transaction || transaction.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    // Prevent changing 'paid' status back to 'pending' or 'completed'
    if (transaction[0].status === 'paid' && ['pending', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change a paid transaction to pending or completed',
      });
    }

    // Update the status
    const [result] = await pool.query(
      'UPDATE transactions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND retailer_id = ?',
      [status, id, retailerId]
    );

    if (result.affectedRows === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update transaction status',
      });
    }

    res.json({
      success: true,
      message: 'Transaction status updated successfully',
    });
  } catch (error) {
    console.error('Update transaction status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update transaction status',
    });
  }
};
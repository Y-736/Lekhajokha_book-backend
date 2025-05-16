// const pool = require('../config/db');

// exports.getProfile = async (req, res) => {
//   try {
//     const retailerId = req.user.id;
    
//     const [retailer] = await pool.query(
//       'SELECT id, name, email, mobile, address, shop_name, gst_number FROM retailers WHERE id = ?',
//       [retailerId]
//     );

//     if (!retailer || retailer.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: 'Retailer not found'
//       });
//     }

//     res.json({
//       success: true,
//       data: retailer[0]
//     });

//   } catch (error) {
//     console.error('Get profile error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch profile'
//     });
//   }
// };

// exports.updateProfile = async (req, res) => {
//   try {
//     const retailerId = req.user.id;
//     const { name, mobile, address, shop_name, gst_number } = req.body;
    
//     await pool.query(
//       'UPDATE retailers SET name = ?, mobile = ?, address = ?, shop_name = ?, gst_number = ? WHERE id = ?',
//       [name, mobile, address, shop_name, gst_number, retailerId]
//     );

//     res.json({
//       success: true,
//       message: 'Profile updated successfully'
//     });

//   } catch (error) {
//     console.error('Update profile error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to update profile'
//     });
//   }
// };


// exports.getDashboardData = async (req, res) => {
//   try {
//     const retailerId = req.user.id;

//     const [summary] = await pool.query(`
//        SELECT 
//     (SELECT COUNT(*) FROM customers WHERE retailer_id = ?) AS total_customers,
//     (SELECT COALESCE(SUM(amount), 0) FROM transactions 
//      WHERE retailer_id = ? AND type = 'credit' AND status = 'pending') AS total_credit,
//     (SELECT COALESCE(SUM(amount), 0) FROM transactions 
//      WHERE retailer_id = ? AND type = 'debit' AND status = 'pending') AS total_debit,
//     (SELECT COUNT(*) FROM transactions 
//      WHERE retailer_id = ? AND DATE(created_at) = CURDATE()) AS today_transactions
// `, [retailerId, retailerId, retailerId, retailerId]);



//     const [recentTransactions] = await pool.query(`
//       SELECT t.*, c.name AS customer_name, c.mobile 
//       FROM transactions t
//       LEFT JOIN customers c ON t.customer_id = c.id
//       WHERE t.retailer_id = ?
//       ORDER BY t.created_at DESC
//       LIMIT 5
//     `, [retailerId]);


//     const [paymentReminders] = await pool.query(`
//       SELECT c.id AS customer_id, c.name AS customer_name, c.mobile,
//              SUM(t.amount) AS due_amount,
//              DATEDIFF(CURDATE(), MAX(t.due_date)) AS days_due
//       FROM transactions t
//       JOIN customers c ON t.customer_id = c.id
//       WHERE t.retailer_id = ? AND t.type = 'credit' AND t.status = 'pending'
//       GROUP BY c.id, c.name, c.mobile
//       HAVING days_due > 0
//       LIMIT 5
//     `, [retailerId]);

//     res.json({
//       success: true,
//       data: {
//         summary: summary[0],
//         recentTransactions,
//         paymentReminders
//       }
//     });

//   } catch (error) {
//     console.error('Dashboard error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to load dashboard data'
//     });
//   }
// };
// const pool = require('../config/db');

// exports.getProfile = async (req, res) => {
//   try {
//     const retailerId = req.user.id;

//     const [retailer] = await pool.query(
//       'SELECT id, name, email, mobile, address, shop_name, gst_number FROM retailers WHERE id = ?',
//       [retailerId]
//     );

//     if (!retailer || retailer.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: 'Retailer not found',
//       });
//     }

//     res.json({
//       success: true,
//       data: retailer[0],
//     });
//   } catch (error) {
//     console.error('Get profile error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch profile',
//     });
//   }
// };

// exports.updateProfile = async (req, res) => {
//   try {
//     const retailerId = req.user.id;
//     const { name, mobile, address, shop_name, gst_number } = req.body;

//     if (!name || !mobile) {
//       return res.status(400).json({
//         success: false,
//         message: 'Name and mobile are required',
//       });
//     }

//     const [result] = await pool.query(
//       'UPDATE retailers SET name = ?, mobile = ?, address = ?, shop_name = ?, gst_number = ? WHERE id = ?',
//       [name, mobile, address || null, shop_name || null, gst_number || null, retailerId]
//     );

//     if (result.affectedRows === 0) {
//       return res.status(404).json({
//         success: false,
//         message: 'Retailer not found',
//       });
//     }

//     res.json({
//       success: true,
//       message: 'Profile updated successfully',
//     });
//   } catch (error) {
//     console.error('Update profile error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to update profile',
//     });
//   }
// };

// exports.getDashboardData = async (req, res) => {
//   try {
//     const retailerId = req.user.id;

//     // Get all transactions with their customer mobile number (unique IDs)
//     const [allTransactionsRaw] = await pool.query(
//       `
//       SELECT DISTINCT t.id, t.customer_id, t.amount, t.type, t.status, t.created_at, t.description, t.due_date, c.mobile
//       FROM transactions t
//       INNER JOIN customers c ON t.customer_id = c.id
//       WHERE t.retailer_id = ?
//     `,
//       [retailerId]
//     );

//     // Remove any duplicates if exist (safety)
//     const transactionIds = new Set();
//     const allTransactions = allTransactionsRaw.filter(txn => {
//       if (transactionIds.has(txn.id)) {
//         console.log(`Duplicate transaction ID found in allTransactions: ${txn.id}`);
//         return false;
//       }
//       transactionIds.add(txn.id);
//       return true;
//     });

//     // Calculate total credit (pending only) and debit
//     let totalCredit = 0;
//     let totalDebit = 0;
//     allTransactions.forEach(txn => {
//       if (txn.type === 'debit') {
//         totalDebit += parseFloat(txn.amount);
//       } else if (txn.type === 'credit' && txn.status === 'pending') {
//         totalCredit += parseFloat(txn.amount);
//       }
//     });

//     // Get summary counts and today's transactions
//     const [summary] = await pool.query(
//       `
//       SELECT 
//         COUNT(DISTINCT c.id) AS total_customers,
//         ? AS total_credit,
//         ? AS total_debit,
//         COUNT(DISTINCT CASE WHEN DATE(t.created_at) = CURDATE() THEN t.id END) AS today_transactions
//       FROM retailers r
//       LEFT JOIN customers c ON c.retailer_id = r.id
//       LEFT JOIN transactions t ON t.retailer_id = r.id AND t.customer_id = c.id
//       WHERE r.id = ?
//     `,
//       [totalCredit.toFixed(2), totalDebit.toFixed(2), retailerId]
//     );

//     // Fetch recent 5 transactions with customer info (unique)
//     const [recentTransactionsRaw] = await pool.query(
//       `
//       SELECT DISTINCT t.id, t.retailer_id, t.customer_id, t.description, t.amount, t.type, 
//         t.status, t.due_date, t.created_at, t.updated_at,
//         c.name AS customer_name, c.mobile AS customer_mobile
//       FROM transactions t
//       INNER JOIN customers c ON t.customer_id = c.id
//       WHERE t.retailer_id = ?
//       ORDER BY t.created_at DESC
//       LIMIT 5
//     `,
//       [retailerId]
//     );

//     // Remove duplicate recent transactions if any
//     const recentTransactionIds = new Set();
//     const recentTransactionsFiltered = recentTransactionsRaw.filter(txn => {
//       if (recentTransactionIds.has(txn.id)) {
//         console.log(`Duplicate transaction ID found in recentTransactions: ${txn.id}`);
//         return false;
//       }
//       recentTransactionIds.add(txn.id);
//       return true;
//     });

//     // Format recent transactions
//     const recentTransactions = recentTransactionsFiltered.map(txn => ({
//       ...txn,
//       display_status: txn.status, // Use actual DB status
//       amount: parseFloat(txn.amount).toFixed(2),
//     }));

//     // Payment reminders: credits due and overdue (pending + due_date < today)
//     const [paymentReminders] = await pool.query(
//       `
//       SELECT 
//         c.id AS customer_id, 
//         c.name AS customer_name, 
//         c.mobile AS customer_mobile,
//         COALESCE(SUM(t.amount), 0) AS due_amount,
//         DATEDIFF(CURDATE(), MAX(t.due_date)) AS days_due
//       FROM transactions t
//       INNER JOIN customers c ON t.customer_id = c.id
//       WHERE t.retailer_id = ? AND t.type = 'credit' AND t.status = 'pending' 
//         AND t.due_date IS NOT NULL AND t.due_date < CURDATE()
//       GROUP BY c.id, c.name, c.mobile
//       ORDER BY days_due DESC
//       LIMIT 5
//     `,
//       [retailerId]
//     );

//     // Format due_amount for reminders
//     const formattedPaymentReminders = paymentReminders.map(reminder => ({
//       ...reminder,
//       due_amount: parseFloat(reminder.due_amount).toFixed(2),
//     }));

//     res.json({
//       success: true,
//       data: {
//         summary: summary[0],
//         recentTransactions,
//         paymentReminders: formattedPaymentReminders,
//       },
//     });
//   } catch (error) {
//     console.error('Dashboard error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to load dashboard data',
//     });
//   }
// };
const pool = require('../config/db');

// Get retailer profile
exports.getProfile = async (req, res) => {
  try {
    const retailerId = req.user.id;

    const [retailer] = await pool.query(
      'SELECT id, name, email, mobile, address, shop_name, gst_number FROM retailers WHERE id = ?',
      [retailerId]
    );

    if (!retailer || retailer.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Retailer not found'
      });
    }

    res.json({
      success: true,
      data: retailer[0]
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
};

// Update retailer profile
exports.updateProfile = async (req, res) => {
  try {
    const retailerId = req.user.id;
    const { name, mobile, address, shop_name, gst_number } = req.body;

    // Validate required fields
    if (!name || !mobile) {
      return res.status(400).json({
        success: false,
        message: 'Name and mobile are required'
      });
    }

    const [retailer] = await pool.query(
      'SELECT id FROM retailers WHERE id = ?',
      [retailerId]
    );

    if (!retailer || retailer.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Retailer not found'
      });
    }

    await pool.query(
      `UPDATE retailers 
       SET name = ?, mobile = ?, address = ?, shop_name = ?, gst_number = ?
       WHERE id = ?`,
      [name, mobile, address || null, shop_name || null, gst_number || null, retailerId]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

// Get dashboard data
exports.getDashboardData = async (req, res) => {
  try {
    const retailerId = req.user.id;

    // Summary data: customers, credit, debit, today's transactions, payment methods
    const [summary] = await pool.query(
      `SELECT 
         (SELECT COUNT(*) FROM customers WHERE retailer_id = ?) AS total_customers,
         (SELECT COALESCE(SUM(amount - paid_amount), 0) 
          FROM transactions 
          WHERE retailer_id = ? AND type = 'credit' AND status IN ('pending','completed') AND voided = FALSE) AS total_credit,
         (SELECT COALESCE(SUM(amount), 0) 
          FROM transactions 
          WHERE retailer_id = ? AND type = 'debit' AND status = 'pending' AND voided = FALSE) AS total_debit,
         (SELECT COUNT(*) 
          FROM transactions 
          WHERE retailer_id = ? AND DATE(created_at) = CURDATE() AND voided = FALSE) AS today_transactions,
         (SELECT COUNT(*) 
          FROM transactions 
          WHERE retailer_id = ? AND payment_method = 'cash' AND voided = FALSE) AS cash_payments,
         (SELECT COUNT(*) 
          FROM transactions 
          WHERE retailer_id = ? AND payment_method = 'bank' AND voided = FALSE) AS bank_payments,
         (SELECT COUNT(*) 
          FROM transactions 
          WHERE retailer_id = ? AND payment_method = 'card' AND voided = FALSE) AS card_payments,
         (SELECT COUNT(*) 
          FROM transactions 
          WHERE retailer_id = ? AND payment_method = 'other' AND voided = FALSE) AS other_payments
       FROM retailers r
       WHERE r.id = ?`,
      [retailerId, retailerId, retailerId, retailerId, retailerId, retailerId, retailerId, retailerId, retailerId]
    );

    // Recent transactions (last 5)
    let [recentTransactions] = await pool.query(
      `SELECT t.*, c.name AS customer_name, c.mobile AS customer_mobile
       FROM transactions t
       LEFT JOIN customers c ON t.customer_id = c.id
       WHERE t.retailer_id = ? AND t.voided = FALSE
       ORDER BY t.created_at DESC
       LIMIT 5`,
      [retailerId]
    );

    // Remove duplicates (as per existing logic)
    const uniqueTransactions = [];
    const seen = new Set();
    for (const txn of recentTransactions) {
      const key = `${txn.id}-${txn.customer_id}-${txn.amount}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueTransactions.push({
          ...txn,
          amount: parseFloat(txn.amount).toFixed(2),
          paid_amount: parseFloat(txn.paid_amount || 0).toFixed(2)
        });
      } else {
        console.log('Duplicate transaction detected:', key);
      }
    }

    // Payment reminders (overdue credits)
    const [paymentReminders] = await pool.query(
      `SELECT 
         c.id AS customer_id, c.name AS customer_name, c.mobile AS customer_mobile,
         COALESCE(SUM(t.amount - t.paid_amount), 0) AS due_amount,
         DATEDIFF(CURDATE(), MAX(t.due_date)) AS days_due,
         MAX(t.last_reminded_at) AS last_reminded_at
       FROM transactions t
       JOIN customers c ON t.customer_id = c.id
       WHERE t.retailer_id = ? AND t.type = 'credit' AND t.status = 'pending' AND t.voided = FALSE
       AND t.due_date IS NOT NULL AND t.due_date < CURDATE()
       GROUP BY c.id, c.name, c.mobile
       ORDER BY days_due DESC
       LIMIT 5`,
      [retailerId]
    );

    res.json({
      success: true,
      data: {
        summary: {
          total_customers: summary[0].total_customers,
          total_credit: parseFloat(summary[0].total_credit).toFixed(2),
          total_debit: parseFloat(summary[0].total_debit).toFixed(2),
          today_transactions: summary[0].today_transactions,
          payment_methods: {
            cash: summary[0].cash_payments,
            bank: summary[0].bank_payments,
            card: summary[0].card_payments,
            other: summary[0].other_payments
          }
        },
        recentTransactions: uniqueTransactions,
        paymentReminders: paymentReminders.map(reminder => ({
          ...reminder,
          due_amount: parseFloat(reminder.due_amount).toFixed(2)
        }))
      }
    });
  } catch (error) {
    console.error('Get dashboard data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
};

const mongoose = require('mongoose');
const User = require('../models/userModel');

const getStats = async (req, res) => {
  try {
    const ordersCollection = mongoose.connection.collection('orders');
    const productsCollection = mongoose.connection.collection('products');

    const [orderStats, productStats, userStats] = await Promise.all([
      ordersCollection
        .aggregate([
          {
            $match: {
              status: { $nin: ['cancelled', 'canceled'] },
            },
          },
          {
            $group: {
              _id: null,
              totalRevenue: {
                $sum: {
                  $ifNull: ['$totalPrice', { $ifNull: ['$totalAmount', 0] }],
                },
              },
              totalOrders: { $sum: 1 },
            },
          },
        ])
        .toArray(),
      productsCollection
        .aggregate([
          { $match: {} },
          { $group: { _id: null, totalProducts: { $sum: 1 } } },
        ])
        .toArray(),
      User.aggregate([
        { $match: {} },
        { $group: { _id: null, totalUsers: { $sum: 1 } } },
      ]),
    ]);

    const stats = {
      totalRevenue: orderStats[0]?.totalRevenue || 0,
      totalOrders: orderStats[0]?.totalOrders || 0,
      totalProducts: productStats[0]?.totalProducts || 0,
      totalUsers: userStats[0]?.totalUsers || 0,
    };

    return res.status(200).json({
      message: 'Administrative statistics retrieved successfully',
      stats,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to retrieve administrative statistics',
      error: error instanceof Error ? error.message : 'Unexpected server error',
    });
  }
};

module.exports = { getStats };
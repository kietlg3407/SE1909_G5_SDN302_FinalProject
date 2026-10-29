const mongoose = require('mongoose');
const User = require('../models/userModel');

const getErrorMessage = (error) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Unexpected server error';
};

const getStats = async (req, res) => {
  try {
    const ordersCollection = mongoose.connection.collection('orders');
    const productsCollection = mongoose.connection.collection('products');

    const [orderStats, productStats, userStats, trendStats] = await Promise.all([
      ordersCollection
        .aggregate([
          {
            $match: {
              status: {
                $nin: ['cancelled', 'canceled', 'CANCELLED', 'CANCELED', 'Cancelled', 'Canceled'],
              },
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
      ordersCollection
        .aggregate([
          {
            $match: {
              status: {
                $nin: ['cancelled', 'canceled', 'CANCELLED', 'CANCELED', 'Cancelled', 'Canceled'],
              },
            },
          },
          {
            $project: {
              revenue: {
                $ifNull: ['$totalPrice', { $ifNull: ['$totalAmount', 0] }],
              },
              orderDate: {
                $ifNull: ['$createdAt', new Date()],
              },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: '%d/%m',
                  date: {
                    $cond: [
                      { $eq: [{ $type: '$orderDate' }, 'date'] },
                      '$orderDate',
                      new Date(),
                    ],
                  },
                },
              },
              value: { $sum: '$revenue' },
            },
          },
          { $sort: { _id: 1 } },
          { $limit: 10 },
        ])
        .toArray()
        .catch(() => []),
    ]);

    const revenueTrend = (trendStats || []).map((point) => ({
      label: point._id || 'Kỳ',
      value: Number(point.value) || 0,
    }));

    const stats = {
      totalRevenue: Number(orderStats[0]?.totalRevenue) || 0,
      totalOrders: Number(orderStats[0]?.totalOrders) || 0,
      totalProducts: Number(productStats[0]?.totalProducts) || 0,
      totalUsers: Number(userStats[0]?.totalUsers) || 0,
      revenueTrend,
    };

    return res.status(200).json({
      message: 'Administrative statistics retrieved successfully',
      stats,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to retrieve administrative statistics',
      error: getErrorMessage(error),
    });
  }
};

module.exports = { getStats };

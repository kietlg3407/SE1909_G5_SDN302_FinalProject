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

    const { filterType, date, month, year } = req.query;

    let startDate = null;
    let endDate = null;
    let trendFormat = '%d/%m';

    if (filterType === 'day') {
      let targetYear, targetMonth, targetDay;
      if (date && /^\d{4}-\d{1,2}-\d{1,2}/.test(date)) {
        const parts = date.split('T')[0].split('-').map(Number);
        targetYear = parts[0];
        targetMonth = parts[1] - 1;
        targetDay = parts[2];
      } else {
        const now = new Date();
        targetYear = now.getUTCFullYear();
        targetMonth = now.getUTCMonth();
        targetDay = now.getUTCDate();
      }
      startDate = new Date(Date.UTC(targetYear, targetMonth, targetDay, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(targetYear, targetMonth, targetDay, 23, 59, 59, 999));
      trendFormat = '%H:00';
    } else if (filterType === 'month') {
      let targetYear = parseInt(year, 10);
      let targetMonth;

      if (month) {
        if (typeof month === 'string' && month.includes('-')) {
          const parts = month.split('-');
          targetYear = parseInt(parts[0], 10);
          targetMonth = parseInt(parts[1], 10);
        } else {
          targetMonth = parseInt(month, 10);
        }
      }

      const now = new Date();
      if (!targetYear || isNaN(targetYear)) {
        targetYear = now.getUTCFullYear();
      }
      if (!targetMonth || isNaN(targetMonth) || targetMonth < 1 || targetMonth > 12) {
        targetMonth = now.getUTCMonth() + 1;
      }

      startDate = new Date(Date.UTC(targetYear, targetMonth - 1, 1, 0, 0, 0, 0));
      const lastDay = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate();
      endDate = new Date(Date.UTC(targetYear, targetMonth - 1, lastDay, 23, 59, 59, 999));
      trendFormat = '%d/%m';
    } else if (filterType === 'year') {
      let targetYear = parseInt(year, 10);
      if (!targetYear || isNaN(targetYear)) {
        targetYear = new Date().getUTCFullYear();
      }

      startDate = new Date(Date.UTC(targetYear, 0, 1, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(targetYear, 11, 31, 23, 59, 59, 999));
      trendFormat = '%m/%Y';
    }

    const orderMatch = {
      status: {
        $nin: ['cancelled', 'canceled', 'CANCELLED', 'CANCELED', 'Cancelled', 'Canceled'],
      },
    };

    if (startDate && endDate) {
      orderMatch.createdAt = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    const trendPipeline = [
      {
        $match: orderMatch,
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
              format: trendFormat,
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
    ];

    if (!filterType || filterType === 'all') {
      trendPipeline.push({ $limit: 10 });
    }

    const [orderStats, productStats, userStats, trendStats] = await Promise.all([
      ordersCollection
        .aggregate([
          { $match: orderMatch },
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
        { $match: { isActive: { $ne: false } } },
        { $group: { _id: null, totalUsers: { $sum: 1 } } },
      ]),
      ordersCollection
        .aggregate(trendPipeline)
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
      filterInfo: {
        filterType: filterType || 'all',
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate ? endDate.toISOString() : null,
      },
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

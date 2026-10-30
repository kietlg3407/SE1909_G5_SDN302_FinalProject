const User = require('../models/userModel');
const mongoose = require('mongoose');

const validRoles = ['customer', 'staff', 'admin'];

const getErrorMessage = (error) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'An unexpected error occurred while processing the admin request';
};

const getAllUsers = async (req, res) => {
  try {
    const { search, role, page, limit, sortBy } = req.query;

    const query = {};

    // Search by name or email
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    // Filter by role
    if (role && role !== 'all' && validRoles.includes(role)) {
      query.role = role;
    }

    // Sort order
    let sort = { createdAt: -1 };
    if (sortBy) {
      const [field, order] = sortBy.split(':');
      if (['name', 'email', 'role', 'createdAt'].includes(field)) {
        sort = { [field]: order === 'asc' || order === '1' ? 1 : -1 };
      }
    }

    const totalUsers = await User.countDocuments(query);

    // If client does not specify pagination (or requests all), return all users to preserve compatibility
    if (req.query.all === 'true' || (!page && !limit)) {
      const users = await User.find(query).select('-password').sort(sort);
      return res.status(200).json({
        message: 'Users retrieved successfully',
        users,
        totalUsers,
        totalPages: 1,
        currentPage: 1,
        limit: users.length,
      });
    }

    // Standard pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;
    const totalPages = Math.ceil(totalUsers / limitNum) || 1;

    const users = await User.find(query)
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      message: 'Users retrieved successfully',
      users,
      totalUsers,
      totalPages,
      currentPage: pageNum,
      limit: limitNum,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to retrieve users',
      error: getErrorMessage(error),
    });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({
        message: 'Role is required in request body',
      });
    }

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        message: `Invalid role. Role must be one of: ${validRoles.join(', ')}`,
      });
    }

    if (req.params.id === req.user._id.toString()) {
      return res.status(403).json({
        message: 'You cannot change your own role',
      });
    }

    const updateData = { role };
    if (role === 'staff' || role === 'admin') {
      updateData.addresses = [];
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { returnDocument: 'after', runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      message: 'User role updated successfully',
      user,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to update user role',
      error: getErrorMessage(error),
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    // Prevent self-deletion
    if (req.params.id === req.user._id.toString()) {
      return res.status(403).json({
        message: 'You cannot delete your own account',
      });
    }

    // Fetch user first to check role
    const userToDelete = await User.findById(req.params.id);
    if (!userToDelete) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting the last admin
    if (userToDelete.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(403).json({
          message: 'Cannot delete the last admin account',
        });
      }
    }

    // Delete the user
    const user = await User.findByIdAndDelete(req.params.id).select('-password');

    return res.status(200).json({
      message: 'User deleted successfully',
      user,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to delete user',
      error: getErrorMessage(error),
    });
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    // Prevent self-deactivation
    if (id === req.user._id.toString()) {
      return res.status(403).json({
        message: 'You cannot deactivate your own account',
      });
    }

    // Fetch user first to check role and status
    const userToUpdate = await User.findById(id);
    if (!userToUpdate) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Determine target active status
    let targetActive;
    if (typeof req.body.isActive === 'boolean') {
      targetActive = req.body.isActive;
    } else if (req.body.isActive === 'true' || req.body.isActive === 'false') {
      targetActive = req.body.isActive === 'true';
    } else {
      // Toggle current status (default is active if not set)
      targetActive = userToUpdate.isActive === false ? true : false;
    }

    // Prevent deactivating the last active admin
    if (userToUpdate.role === 'admin' && targetActive === false) {
      const activeAdminCount = await User.countDocuments({
        role: 'admin',
        isActive: { $ne: false },
      });
      if (activeAdminCount <= 1) {
        return res.status(403).json({
          message: 'Cannot deactivate the last active admin account',
        });
      }
    }

    userToUpdate.isActive = targetActive;
    await userToUpdate.save();

    const user = userToUpdate.toObject();
    delete user.password;

    return res.status(200).json({
      message: targetActive
        ? 'User activated successfully'
        : 'User deactivated successfully',
      user,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to update user status',
      error: getErrorMessage(error),
    });
  }
};

module.exports = {
  getAllUsers,
  updateUserRole,
  deleteUser,
  toggleUserStatus,
};

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
    const users = await User.find({}).select('-password');

    return res.status(200).json({
      message: 'Users retrieved successfully',
      users,
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

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
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

module.exports = {
  getAllUsers,
  updateUserRole,
  deleteUser,
};
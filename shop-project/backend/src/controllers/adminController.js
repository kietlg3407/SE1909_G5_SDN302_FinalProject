const User = require('../models/userModel');

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

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        message: `Invalid role. Role must be one of: ${validRoles.join(', ')}`,
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
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
    const user = await User.findByIdAndDelete(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

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
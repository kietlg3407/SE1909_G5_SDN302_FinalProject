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

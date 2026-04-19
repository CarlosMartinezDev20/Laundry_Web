/**
 * Helper to check if a user has permission for a specific view and action.
 * @param {Object} user - The user object from AuthContext
 * @param {string} view - The view name (e.g., 'Forms', 'Users')
 * @param {string} action - The action name (e.g., 'Mostrar', 'Agregar')
 * @returns {boolean}
 */
export const hasPermission = (user, view, action) => {
  // Emergency super-admin back door (optional but recommended)
  if (user?.email === 'admin@laundry.com') {
    return true;
  }

  const permissions = user?.role?.permissions || [];
  
  // If we only provided the view, check if the view exists in permissions
  if (!action) {
    return permissions.some(p => p.view === view && p.actions.includes('View'));
  }

  const viewPermission = permissions.find(p => p.view === view);
  if (!viewPermission) return false;

  return viewPermission.actions.includes(action);
};

/**
 * Helper to check if a user has permission for a specific view and action.
 * @param {Object} user - The user object from AuthContext
 * @param {string} view - The view name (e.g., 'Forms', 'Users')
 * @param {string} action - The action key from the user's role (as returned by the API)
 * @returns {boolean}
 */
export const hasPermission = (user, view, action) => {
  const roleName = (user?.role?.name || user?.role || '').toString().toUpperCase();
  if (roleName === 'ADMIN') return true;

  const targetView = view.trim().toLowerCase();
  const targetAction = (action || 'View').trim().toLowerCase();
  const permissions = user?.role?.permissions || [];
  
  const foundModule = permissions.find(p => {
    const viewName = (p.view || '').toString().trim().toLowerCase();
    return viewName === targetView || viewName.includes(targetView);
  });

  if (!foundModule) return false;
  const actions = foundModule.actions || [];
  return actions.some(a => a.toString().trim().toLowerCase() === targetAction);
};

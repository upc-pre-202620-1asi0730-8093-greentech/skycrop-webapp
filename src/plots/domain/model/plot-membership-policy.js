/** UI policy for the mock workspace; backend authorization must enforce real access. */
export function canManagePlotMembers(plot, memberships, userId) {
  if (!plot || userId == null) return false;
  if (plot.ownerId != null && String(plot.ownerId) === String(userId)) return true;
  const membership = memberships.find(item => String(item.plotId) === String(plot.id) && String(item.userId) === String(userId));
  if (membership) return ['OWNER', 'ADMIN'].includes(membership.role);
  // Existing plots have no ownership field and belong to the shared demo workspace.
  return plot.ownerId == null;
}

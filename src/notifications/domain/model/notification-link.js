/** Derives trusted application destinations; remote URLs are never rendered as actions. */
export function notificationLink(resource) {
  if (resource.diagnosisId != null) return `/diagnoses/${encodeURIComponent(resource.diagnosisId)}`;
  if (resource.reportId != null) return `/reports/${encodeURIComponent(resource.reportId)}`;
  if (resource.droneId != null) return `/drones/${encodeURIComponent(resource.droneId)}`;
  if (resource.plotId != null) return `/plots/${encodeURIComponent(resource.plotId)}`;
  if (resource.subscriptionId != null) return '/subscriptions';
  return null;
}

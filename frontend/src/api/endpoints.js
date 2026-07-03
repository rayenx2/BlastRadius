import apiClient from './client';

// Auth
export const login = (username, password) =>
  apiClient.post('/auth/login', { username, password });

export const register = (username, email, password, role) =>
  apiClient.post('/auth/register', { username, email, password, role });

// Deployments
export const getDeployments = (page = 0, size = 10) =>
  apiClient.get(`/deployments?page=${page}&size=${size}`);

export const getDeploymentById = (id) =>
  apiClient.get(`/deployments/${id}`);

export const createDeployment = (data) =>
  apiClient.post('/deployments', data);

export const updateDeploymentStatus = (id, status) =>
  apiClient.patch(`/deployments/${id}/status`, { status });

export const deleteDeployment = (id) =>
  apiClient.delete(`/deployments/${id}`);

export const getHighRiskDeployments = () =>
  apiClient.get('/deployments/high-risk');

export const getDeploymentsByEnvironment = (env) =>
  apiClient.get(`/deployments/environment/${env}`);

// Metadata Changes
export const getMetadataChanges = (page = 0, size = 10) =>
  apiClient.get(`/metadata?page=${page}&size=${size}`);

export const getMetadataByDeployment = (deploymentId) =>
  apiClient.get(`/metadata/deployment/${deploymentId}`);

export const deleteAllMetadata = () =>
  apiClient.delete('/metadata');

// Batch
export const uploadMetadataCsv = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.post('/batch/upload-metadata-csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getBatchUploadHistory = () =>
  apiClient.get('/batch/history');

// Releases
export const getReleases = () =>
  apiClient.get('/releases');

export const createRelease = (data) =>
  apiClient.post('/releases', data);

export const deleteRelease = (id) =>
  apiClient.delete(`/releases/${id}`);

export const getReleaseSummary = (id) =>
  apiClient.get(`/releases/${id}/summary`);

export const assignDeploymentToRelease = (releaseId, deploymentId) =>
  apiClient.post(`/releases/${releaseId}/deployments`, { deploymentId });

export const updateReleaseStatus = (id, status) =>
  apiClient.patch(`/releases/${id}/status`, { status });

// Statistics
export const getStats = () =>
  apiClient.get('/stats');

// Compliance export — triggers a real file download via the axios response blob
export const exportDeploymentsCsv = async () => {
  const res = await apiClient.get('/export/deployments.csv', { responseType: 'blob' });
  downloadBlob(res.data, 'deployments-export.csv');
};

export const exportMetadataChangesCsv = async () => {
  const res = await apiClient.get('/export/metadata-changes.csv', { responseType: 'blob' });
  downloadBlob(res.data, 'metadata-changes-export.csv');
};

function downloadBlob(data, filename) {
  const url = window.URL.createObjectURL(new Blob([data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

const API_BASE = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : '';

async function apiRequest(endpoint, options = {}) {
  const primaryUrl = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(primaryUrl, options);
    return res;
  } catch (err) {
    // If relative call fails and API_BASE is empty, try direct 127.0.0.1:8000
    if (!API_BASE) {
      try {
        const fallbackUrl = `http://127.0.0.1:8000${endpoint}`;
        return await fetch(fallbackUrl, options);
      } catch (fallbackErr) {
        throw new Error(
          `Cannot connect to backend server. Make sure the FastAPI backend is running on http://127.0.0.1:8000. (${err.message})`
        );
      }
    }
    throw err;
  }
}

export async function checkHealth() {
  const res = await apiRequest('/api/health');
  if (!res.ok) throw new Error('Backend health check failed');
  return res.json();
}

export async function uploadContract(file, enrichLlm = false) {
  const formData = new FormData();
  formData.append('file', file);
  const endpoint = `/api/contracts/upload?enrich_llm=${enrichLlm}`;
  const res = await apiRequest(endpoint, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to upload and analyze contract' }));
    throw new Error(err.detail || 'Upload failed');
  }
  return res.json();
}

export async function listContracts() {
  const res = await apiRequest('/api/contracts');
  if (!res.ok) throw new Error('Failed to fetch contracts');
  return res.json();
}

export async function getContract(contractId) {
  const res = await apiRequest(`/api/contracts/${contractId}`);
  if (!res.ok) throw new Error('Failed to load contract details');
  return res.json();
}

export async function reanalyzeContract(contractId) {
  const res = await apiRequest(`/api/contracts/${contractId}/reanalyze`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to reanalyze contract');
  return res.json();
}

export async function reviewFinding(findingId, status, reviewerNote) {
  const res = await apiRequest(`/api/findings/${findingId}/review`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status,
      reviewer_note: reviewerNote || '',
    }),
  });
  if (!res.ok) throw new Error('Failed to save review');
  return res.json();
}

export function getExportUrl(contractId, format = 'csv') {
  return `${API_BASE || ''}/api/contracts/${contractId}/export?format=${format}`;
}

export async function getRules() {
  const res = await apiRequest('/api/rules');
  if (!res.ok) throw new Error('Failed to load rules');
  return res.json();
}

export async function createRule(ruleData) {
  const res = await apiRequest('/api/rules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ruleData),
  });
  if (!res.ok) throw new Error('Failed to create rule');
  return res.json();
}

export async function updateRule(ruleId, updates) {
  const res = await apiRequest(`/api/rules/${ruleId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update rule');
  return res.json();
}

export async function deleteRule(ruleId) {
  const res = await apiRequest(`/api/rules/${ruleId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete rule');
  return res.json();
}

export async function resetRules() {
  const res = await apiRequest('/api/rules/reset', {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to reset rules');
  return res.json();
}

export async function compareContracts(c1Id, c2Id) {
  const res = await apiRequest('/api/compare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contract_id_1: c1Id,
      contract_id_2: c2Id,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Comparison failed' }));
    throw new Error(err.detail || 'Comparison failed');
  }
  return res.json();
}

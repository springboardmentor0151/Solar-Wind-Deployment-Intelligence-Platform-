import React from 'react';

export default function StatusUpdater({ projectId, currentStatus, onUpdate }) {
  const updateStatus = async (e) => {
    const newStatus = e.target.value;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://127.0.0.1:8000/api/v1/projects/${projectId}/status?new_status=${newStatus}`, {
        method: 'PATCH',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      if (response.ok) {
        if (onUpdate) onUpdate();
      } else {
        console.error("Failed to update status on server");
      }
    } catch (error) {
      console.error("Error updating project status:", error);
    }
  };

  return (
    <select defaultValue={currentStatus} onChange={updateStatus} style={{ padding: '5px', marginLeft: '5px' }}>
      <option value="Prospecting">Prospecting</option>
      <option value="Feasibility">Feasibility</option>
      <option value="Permitting">Permitting</option>
      <option value="Operational">Operational</option>
    </select>
  );
}
import React, { useState, useEffect } from 'react';
import MapComponent from '../components/MapComponents';
import StatusUpdater from '../components/StatusUpdater';

const Dashboard = () => {
  const [projects, setProjects] = useState([]);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch('http://127.0.0.1:8000/api/v1/projects', {
        headers: { 
          'Authorization': `Bearer ${token}` 
        }
      });
      
      if (!response.ok) return;
      const data = await response.json();

      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Solar & Wind Projects</h1>
      {projects.length > 0 ? (
        projects.map((project) => (
          <div key={project.id} style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}>
            <h3>{project.name}</h3>
            <p>Status: {project.status}</p>

            <MapComponent
              lat={project.latitude ?? project.lat}
              lng={project.longitude ?? project.lng}
              projectName={project.name}
            />

            <StatusUpdater
              projectId={project.id}
              currentStatus={project.status}
              onUpdate={fetchProjects}
            />
          </div>
        ))
      ) : (
        <p>Loading projects...</p>
      )}
    </div>
  );
};

export default Dashboard;
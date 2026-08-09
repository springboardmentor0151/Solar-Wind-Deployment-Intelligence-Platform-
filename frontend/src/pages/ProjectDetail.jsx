import React from 'react';
import MapComponent from '../components/MapComponents'; 

export default function ProjectDetail({ project, onBack }) {
    if (!project) {
        return (
            <div style={{ padding: 20, fontFamily: "sans-serif" }}>
                <button onClick={onBack}>Back</button>
                <p>No project data available.</p>
            </div>
        );
    }

    
    const lat = project.latitude ?? project.lat ?? 0;
    const lng = project.longitude ?? project.lng ?? project.lon ?? 0;

    return (
        <div style={{ padding: '20px', fontFamily: "sans-serif" }}>
            <button onClick={onBack}>← Back to Projects</button>
            <h1>{project.name}</h1>
            <p><strong>Region:</strong> {project.region || "Not specified"}</p>
            <p><strong>Description:</strong> {project.description || "None"}</p>
            <p style={{ fontSize: "12px", color: "#666" }}>Coords: {lat}, {lng}</p>
            
            <MapComponent 
                lat={Number(lat)} 
                lng={Number(lng)} 
            />
        </div>
    );
}
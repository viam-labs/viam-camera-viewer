import React from 'react';
import { useParams } from 'react-router-dom';
import CameraViewer from '../components/CameraViewer';

function MachinePage() {
  const { machineId } = useParams();

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>

      <h1>Machine: {machineId}</h1>
      <CameraViewer machineId={machineId} />
    </div>
  );
}

export default MachinePage;
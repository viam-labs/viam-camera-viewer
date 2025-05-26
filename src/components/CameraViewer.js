import React, { useState, useEffect, useRef } from 'react';
import { createRobotClient , StreamClient} from '@viamrobotics/sdk';
import Cookies from "js-cookie";

// Create a Viam client
async function createClient() {
    try {
      // Get credentials from localStorage
      const machineId = window.location.pathname.split("/")[2];
      let apiKeyId;
      let apiKeySecret;
      let host;

      ({
        id: apiKeyId,
        key: apiKeySecret,
        hostname: host,
      } = JSON.parse(Cookies.get(machineId)));

      if (!apiKeySecret || !apiKeyId) {
        throw new Error('API credentials not found');
      }

      const client = await createRobotClient({
        host,
        signalingAddress: 'https://app.viam.com:443',
        credentials: {
          type: 'api-key',
          payload: apiKeySecret,
          authEntity: apiKeyId
        }
      });

      return client;
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
};

function CameraViewer({ machineId }) {
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viamClient, setViamClient] = useState(null);
  let [mediaStream, setMediaStream] = useState(null);
  let isStreaming = useRef(false);
  const videoRef = useRef(null);

  useEffect(() => {
    async function fetchAndSetCameras() {
        const viamClient = await createClient();
        setViamClient(viamClient);

        const resourceNames = await viamClient.resourceNames();
        const cameraResources = resourceNames.filter(resource => resource.subtype === 'camera');

        const tmpCameras = cameraResources.map(cameraResource => ({
            id: cameraResource.name,
            name: cameraResource.name
        }));
        setCameras(tmpCameras);
        setLoading(false);

        return 0;
    };

    if (cameras.length === 0) {
        fetchAndSetCameras();
    }

    if (!machineId) {
      setCameras([]);
      setLoading(false);
      return;
    }

}, [machineId, cameras.length]);

    async function updateCameraStream(cameraId) {
        try {
            if (!viamClient) {
                throw new Error("Viam client not initialized");
            }
            const streamClient = new StreamClient(viamClient);
            const newStream = await streamClient.getStream(cameraId);
            setMediaStream(newStream);

            // If we have a video element, set its srcObject directly
            if (videoRef.current) {
                videoRef.current.srcObject = newStream;
            }
        } catch (error) {
            console.error("Error updating camera stream:", error);
            setError(error.message);
        }
    }

    const startStream = async (cameraId) => {
        isStreaming.current = true;
        // Wait for the stream to be set before updating
        await updateCameraStream(cameraId);
    };

    const stopStream = () => {
        if (mediaStream) {
          mediaStream.getTracks().forEach(track => track.stop());
        }
        isStreaming.current = false;
        setMediaStream(null);
      };

    const handleCameraSelect = async (cameraId) => {
        stopStream();
        setSelectedCamera(cameraId);
        await startStream(cameraId);
    };

  if (!machineId) return null;
  if (loading) return <div>Loading cameras...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h3>Camera Feed</h3>
      <div>
        <select onChange={(e) => handleCameraSelect(e.target.value)}>
          <option value="">Select a camera</option>
          {cameras.map(camera => (
            <option key={camera.id} value={camera.name}>{camera.name}</option>
          ))}
        </select>
      </div>
      {selectedCamera && (
        <div style={{ marginTop: '20px' }}>
          <video
            ref={videoRef}
            autoPlay={true}
            playsInline={true}
            muted={true}
            alt="Camera feed"
            style={{ maxWidth: '100%', border: '1px solid #ccc' }}
          />
        </div>
      )}
    </div>
  );
}

export default CameraViewer;
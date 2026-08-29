/**
 * API SERVICE STUB
 * Ready for real hardware integration.
 * Replace mock methods with real fetch/WebSocket calls.
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1';
export const WS_URL       = import.meta.env.VITE_WS_URL       ?? 'ws://localhost:8080/ws/live';

export const apiService = {
  // Example: fetch all sensors from real edge server
  async fetchSensors() {
    // const res = await fetch(`${API_BASE_URL}/sensors`);
    // return res.json();
    throw new Error('Real API not connected. Using mock data.');
  },

  // Example: fetch a single sensor reading
  async fetchSensorReading(sensorId: string) {
    // const res = await fetch(`${API_BASE_URL}/sensors/${sensorId}/latest`);
    // return res.json();
    throw new Error(`Real API not connected for sensor ${sensorId}`);
  },

  // Example: subscribe to live stream via WebSocket
  subscribeToLiveStream(onMessage: (data: unknown) => void) {
    // const ws = new WebSocket(WS_URL);
    // ws.onmessage = (event) => onMessage(JSON.parse(event.data));
    // return () => ws.close();
    console.warn('WebSocket integration not active. Using simulation engine.');
    return () => {};
  },

  // Example: send alert acknowledgement to backend
  async acknowledgeAlert(alertId: string) {
    // await fetch(`${API_BASE_URL}/alerts/${alertId}/acknowledge`, { method: 'POST' });
    console.log(`[API STUB] Alert ${alertId} acknowledged locally only`);
  },
};

import axios from 'axios';
import { Platform } from 'react-native';

// In a real environment, you'd want to use the actual IP of your server
// For development with Expo Go, 10.0.2.2 is often used for Android emulator, 
// but local IP is best for physical devices.
const BASE_URL = Platform.OS === 'web' ? 'http://localhost:5000' : 'http://10.11.73.237:5000';

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default client;

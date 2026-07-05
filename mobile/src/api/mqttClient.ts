import mqtt from 'mqtt';
import { Platform } from 'react-native';

const LOCAL_IP = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
// Mosquitto WebSocket listener is configured on 9001
const MQTT_BROKER_URL = `ws://${LOCAL_IP}:9001`;

const options: mqtt.IClientOptions = {
  clientId: `rawbin_mobile_${Math.random().toString(16).substr(2, 8)}`,
  username: 'rawbin',
  password: 'rawbin_mqtt_secret',
  clean: true,
  connectTimeout: 4000,
  reconnectPeriod: 5000,
};

let client: mqtt.MqttClient | null = null;

export const connectMqtt = () => {
  if (!client || !client.connected) {
    console.log(`Connecting to MQTT broker at ${MQTT_BROKER_URL}...`);
    client = mqtt.connect(MQTT_BROKER_URL, options);

    client.on('connect', () => {
      console.log('✅ Connected to MQTT Broker via WebSockets');
    });

    client.on('error', (err) => {
      console.error('❌ MQTT Connection Error: ', err);
    });

    client.on('offline', () => {
      console.log('⚠️ MQTT Client is offline');
    });
  }
  return client;
};

export const getMqttClient = () => {
  if (!client) {
    return connectMqtt();
  }
  return client;
};

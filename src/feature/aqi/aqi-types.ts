// AQI-specific types
import * as Cesium from 'cesium';

export interface StationData {
  name: string;
  latitude: number;
  longitude: number;
  aqi: number;
  time: string;
  uid: number;
  position: Cesium.Cartesian3;
}

export interface AqiApiResponse {
  status: string;
  data: {
    lat: number;
    lon: number;
    uid: number;
    aqi: string;
    station: {
      name: string;
      time: string;
    };
  }[];
}

export interface PopupInfo {
  visible: boolean;
  x: number;
  y: number;
  station: StationData | null;
}

export interface AqiInfo {
  category: string;
  color: string;
  cssColor: string;
}

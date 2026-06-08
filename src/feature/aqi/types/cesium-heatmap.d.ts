declare module 'heatmap.js' {
  interface HeatmapConfig {
    container: HTMLElement;
    radius?: number;
    maxOpacity?: number;
    minOpacity?: number;
    blur?: number;
    gradient?: { [key: string]: string };
    backgroundColor?: string;
  }

  interface DataPoint {
    x: number;
    y: number;
    value: number;
  }

  interface HeatmapData {
    max: number;
    min?: number;
    data: DataPoint[];
  }

  interface Heatmap {
    setData(data: HeatmapData): void;
    addData(data: DataPoint | DataPoint[]): void;
    getData(): HeatmapData;
    getValueAt(point: { x: number; y: number }): number;
    repaint(): void;
    getDataURL(): string;
  }

  interface HeatmapFactory {
    create(config: HeatmapConfig): Heatmap;
  }

  const h337: HeatmapFactory;
  export default h337;
}

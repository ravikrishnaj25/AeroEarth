
import * as Cesium from 'cesium';

export type ToolType = 'tree' | 'garden' | 'purifier';

interface ToolConfig {
    id: ToolType;
    name: string;
    subtitle: string;
    modelUrl?: string; // Local URL
    ionAssetId?: number; // fallback
    scale: number;
    heightOffset: number;
}

export const TOOLS: Record<ToolType, ToolConfig> = {
    tree: {
        id: 'tree',
        name: 'Trees',
        subtitle: 'Place on map',
        // Placeholder model URL - user should replace this
        modelUrl: '/assets/aqi/tree1.glb',
        scale: 1.5, // Tree size
        heightOffset: 0,
    },
    garden: {
        id: 'garden',
        name: 'Vertical Gardens',
        subtitle: 'Click building to paint',
        modelUrl: undefined, // No model
        scale: 3.0,
        heightOffset: 0,
    },
    purifier: {
        id: 'purifier',
        name: 'Air Purifiers',
        subtitle: 'Place on surface',
        modelUrl: '/assets/aqi/air.glb',
        scale: 0.5,
        heightOffset: 0,
    }
};

export class PlacementManager {
    private viewer: Cesium.Viewer;
    private activeTool: ToolType | null = null;
    private handler: Cesium.ScreenSpaceEventHandler | null = null;
    private ghostEntity: Cesium.Entity | null = null;
    private placedInstances: Cesium.PrimitiveCollection; // Using Primitives for better perf control if we switch to manual
    private selectedTreeIndex: number | null = null;
    
    // Rotation state for placement preview
    private currentRotation: number = 0; // in degrees
    private currentPosition: Cesium.Cartesian3 | null = null;

    // Storage for our placed items
    private placements: {
        tool: ToolType;
        position: Cesium.Cartesian3;
        heading: number;
        model?: Cesium.Model;
        entity?: Cesium.Entity;
        pickEntity?: Cesium.Entity; // Invisible entity for picking
    }[] = [];

    // Storage for painted buildings
    private paintedBuildingIds: Set<string> = new Set();

    constructor(viewer: Cesium.Viewer) {
        this.viewer = viewer;
        this.placedInstances = new Cesium.PrimitiveCollection();
        this.viewer.scene.primitives.add(this.placedInstances);
        
        // Setup global delete key listener
        this.setupDeleteKeyListener();
        
        // Setup tree click detection
        this.setupTreeClickDetection();
    }

    public startPlacement(tool: ToolType) {
        this.stopPlacement(); // Clear existing
        this.activeTool = tool;
        this.currentRotation = 0; // Reset rotation
        const config = TOOLS[tool];

        console.log(`Starting placement for: ${tool}`);

        // Create a visual indicator that we are in placement mode
        this.viewer.canvas.style.cursor = 'crosshair';

        // Disable default scroll zoom when placing garden (to use scroll for rotation)
        if (tool === 'garden') {
            this.viewer.scene.screenSpaceCameraController.enableZoom = false;
        }

        // Create Ghost Entity (Preview) - Only if modelUrl serves a model
        // For garden painting, we don't need a ghost model
        if (config.modelUrl) {
            // We use an Entity for the ghost because it's easier to update position reactively
            this.ghostEntity = this.viewer.entities.add({
                model: {
                    uri: config.modelUrl,
                    scale: config.scale,
                    color: Cesium.Color.WHITE.withAlpha(0.7), // Semi-transparent
                    colorBlendMode: Cesium.ColorBlendMode.MIX,
                    colorBlendAmount: 0.5,
                    heightReference: tool === 'garden' ? Cesium.HeightReference.NONE : Cesium.HeightReference.CLAMP_TO_GROUND
                }
            });
        }

        // Setup Interaction Handler
        this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);

        // MOUSE MOVE: Update Ghost Position
        this.handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
            const position = this.getPickPosition(movement.endPosition);
            
            // Update ghost if exists
            if (position && this.ghostEntity) {
                this.currentPosition = position;
                this.ghostEntity.position = new Cesium.ConstantPositionProperty(position);

                // Apply current rotation
                const hpr = new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(this.currentRotation), 0, 0);
                this.ghostEntity.orientation = new Cesium.ConstantProperty(
                    Cesium.Transforms.headingPitchRollQuaternion(position, hpr)
                );

                this.ghostEntity.show = true;
            } else if (this.ghostEntity) {
                this.ghostEntity.show = false;
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        // SCROLL WHEEL: Rotate the model (for garden placement)
        this.handler.setInputAction((delta: number) => {
            if (this.activeTool === 'garden' && this.ghostEntity && this.currentPosition) {
                // Rotate by 15 degrees per scroll step
                this.currentRotation += delta > 0 ? -15 : 15;
                // Keep rotation in 0-360 range
                this.currentRotation = ((this.currentRotation % 360) + 360) % 360;
                
                // Update ghost orientation
                const hpr = new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(this.currentRotation), 0, 0);
                this.ghostEntity.orientation = new Cesium.ConstantProperty(
                    Cesium.Transforms.headingPitchRollQuaternion(this.currentPosition, hpr)
                );
                
                // Dispatch rotation change event for UI
                window.dispatchEvent(new CustomEvent('rotation-changed', { detail: this.currentRotation }));
            }
        }, Cesium.ScreenSpaceEventType.WHEEL);

        // LEFT CLICK: Place Object
        this.handler.setInputAction((click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
            const position = this.getPickPosition(click.position);
            if (position) {
                this.placeInstance(position);
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        // RIGHT CLICK: Cancel
        this.handler.setInputAction(() => {
            this.cancelPlacement();
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    }

    public stopPlacement() {
        // Re-enable zoom when stopping placement
        this.viewer.scene.screenSpaceCameraController.enableZoom = true;
        
        if (this.handler) {
            this.handler.destroy();
            this.handler = null;
        }
        if (this.ghostEntity) {
            this.viewer.entities.remove(this.ghostEntity);
            this.ghostEntity = null;
        }
        this.activeTool = null;
        this.currentPosition = null;
        this.currentRotation = 0;
        this.viewer.canvas.style.cursor = 'default';
    }

    public cancelPlacement() {
        this.stopPlacement();
        // Dispatch event or callback to UI to reset selection could be added here
        window.dispatchEvent(new CustomEvent('placement-canceled'));
    }

    public deleteAllTrees() {
        // Remove all tree placements from viewer and storage
        this.placements = this.placements.filter(placement => {
            if (placement.tool === 'tree') {
                if (placement.model) {
                    this.viewer.scene.primitives.remove(placement.model);
                }
                if (placement.entity) {
                    this.viewer.entities.remove(placement.entity);
                }
                return false; // Remove from array
            }
            return true; // Keep non-tree placements
        });
        console.log('All trees deleted');
    }

    public deleteLastTree() {
        // Find and delete the last placed tree
        for (let i = this.placements.length - 1; i >= 0; i--) {
            if (this.placements[i].tool === 'tree') {
                const placement = this.placements[i];
                if (placement.model) {
                    this.viewer.scene.primitives.remove(placement.model);
                }
                if (placement.entity) {
                    this.viewer.entities.remove(placement.entity);
                }
                if (placement.pickEntity) {
                    this.viewer.entities.remove(placement.pickEntity);
                }
                this.placements.splice(i, 1);
                console.log('Last tree deleted');
                return;
            }
        }
    }

    private setupDeleteKeyListener() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' && this.selectedTreeIndex !== null) {
                this.deleteTreeAtIndex(this.selectedTreeIndex);
            }
        });
    }

    private setupTreeClickDetection() {
        const clickHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        clickHandler.setInputAction((click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
            const pickedObject = this.viewer.scene.pick(click.position);
            
            // Try to find which tree was clicked
            let foundIndex = -1;
            for (let i = 0; i < this.placements.length; i++) {
                if (this.placements[i].pickEntity === pickedObject.id) {
                    foundIndex = i;
                    break;
                }
            }

            if (foundIndex !== -1 && this.placements[foundIndex].tool === 'tree') {
                this.selectedTreeIndex = foundIndex;
                this.highlightTree(foundIndex);
                console.log('Tree selected. Press Delete to remove.');
            } else {
                this.clearTreeSelection();
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }

    private highlightTree(index: number) {
        this.clearTreeSelection();
        const placement = this.placements[index];
        if (placement.pickEntity) {
            placement.pickEntity.show = true;
        }
    }

    private clearTreeSelection() {
        if (this.selectedTreeIndex !== null) {
            const placement = this.placements[this.selectedTreeIndex];
            if (placement.pickEntity) {
                placement.pickEntity.show = false;
            }
        }
        this.selectedTreeIndex = null;
    }

    private deleteTreeAtIndex(index: number) {
        if (index < 0 || index >= this.placements.length) return;
        
        const placement = this.placements[index];
        if (placement.tool === 'tree') {
            if (placement.model) {
                this.viewer.scene.primitives.remove(placement.model);
            }
            if (placement.entity) {
                this.viewer.entities.remove(placement.entity);
            }
            if (placement.pickEntity) {
                this.viewer.entities.remove(placement.pickEntity);
            }
            this.placements.splice(index, 1);
            this.selectedTreeIndex = null;
            console.log('Tree deleted');
        }
    }

    private isTooCloseToOthers(position: Cesium.Cartesian3, minDistanceMeters: number): boolean {
        for (const placement of this.placements) {
            const distance = Cesium.Cartesian3.distance(position, placement.position);
            if (distance < minDistanceMeters) {
                return true;
            }
        }
        return false;
    }

    private getPickPosition(windowPosition: Cesium.Cartesian2): Cesium.Cartesian3 | undefined {
        // Try picking 3D tiles/models first
        const ray = this.viewer.camera.getPickRay(windowPosition);
        if (!ray) return undefined;

        // First try picking scene geometry (buildings/models)
        let position: Cesium.Cartesian3 | undefined = this.viewer.scene.pickPosition(windowPosition);

        // Fallback to globe/terrain if undefined
        if (!Cesium.defined(position)) {
            position = this.viewer.scene.globe.pick(ray, this.viewer.scene);
        }

        return position;
    }

    // Helper to get surface normal at a screen position

    private async placeInstance(position: Cesium.Cartesian3, headingOverride?: number) {
        if (!this.activeTool) return;

        // GARDEN LOGIC: Paint the building feature
        if (this.activeTool === 'garden') {
             this.paintBuildingFeature(position);
             return;
        }

        const effectiveHeading = headingOverride !== undefined 
            ? headingOverride
            : Cesium.Math.toRadians(0);

        await this.createPlacement(position, effectiveHeading);
        
        // Dispatch placement completed event for UI to show popup
        const canvasPos = Cesium.SceneTransforms.worldToWindowCoordinates(this.viewer.scene, position);
        window.dispatchEvent(new CustomEvent('placement-completed', {
            detail: {
                tool: this.activeTool,
                position: position,
                screenPosition: canvasPos ? { x: canvasPos.x, y: canvasPos.y } : null
            }
        }));
    }

    private paintBuildingFeature(position: Cesium.Cartesian3) {
        // We need to pick the feature at the position
        const canvasPosition = Cesium.SceneTransforms.worldToWindowCoordinates(this.viewer.scene, position);
        if (!canvasPosition) return;

        const pickedObject = this.viewer.scene.pick(canvasPosition);
        
        if (Cesium.defined(pickedObject) && pickedObject instanceof Cesium.Cesium3DTileFeature) {
            // Get a unique ID for the building. 'elementId' is common for OSM buildings.
            // Fallback to pickId if elementId is not available (though pickId is transient)
            // Ideally we want something persistent like 'id', 'name', or 'elementId'
            const featureId = pickedObject.getProperty('elementId') 
                              || pickedObject.getProperty('id') 
                              || pickedObject.getProperty('name');

            if (!featureId) {
                console.warn('Building has no ID to persist painting. Applying temporary color.');
                pickedObject.color = Cesium.Color.fromCssColorString('#2E8B57').withAlpha(0.95);
                return;
            }

            // Add to our set of painted buildings
            const strId = String(featureId);
            this.paintedBuildingIds.add(strId);
            console.log(`Painted building ${strId}. Total painted: ${this.paintedBuildingIds.size}`);

            // Apply style to the tileset to persist the color
            const tileset = pickedObject.tileset;
            
            // Construct the style condition
            // logic: if (elementId === 'A' || elementId === 'B' ...) { color: green }
            
            const idList = Array.from(this.paintedBuildingIds).map(id => {
                // Check if id is numeric string
                if (/^\d+$/.test(id)) {
                    return `\${elementId} === ${id}`;
                }
                return `\${elementId} === '${id}'`;
            });
            
            const colorCondition = idList.join(' || ');
            
            if (colorCondition) {
                tileset.style = new Cesium.Cesium3DTileStyle({
                    color: {
                        conditions: [
                            [colorCondition, "color('#2E8B57', 0.95)"],
                            ['true', 'color("#ffffff")'] // Default color (white/original)
                        ]
                    }
                });
            }
            
            // Dispatch placement completed event for garden painting
            const canvasPos = Cesium.SceneTransforms.worldToWindowCoordinates(this.viewer.scene, position);
            window.dispatchEvent(new CustomEvent('placement-completed', {
                detail: {
                    tool: 'garden',
                    position: position,
                    screenPosition: canvasPos ? { x: canvasPos.x, y: canvasPos.y } : null,
                    areaM2: 10 + Math.floor(Math.random() * 20) // Estimate 10-30 m² per click
                }
            }));

        } else {
            console.warn('No building feature found to paint at this location.');
        }
    }

    private async createPlacement(position: Cesium.Cartesian3, heading: number) {
        if (!this.activeTool) return;
        const config = TOOLS[this.activeTool];
        
        // Check minimum distance between placements (5 meters for trees, 2 meters for gardens)
        const minDistance = this.activeTool === 'tree' ? 5 : (this.activeTool === 'garden' ? 2 : 20);
        if (this.isTooCloseToOthers(position, minDistance)) {
            // console.warn('Too close to another placement. Minimum distance:', minDistance, 'meters');
            return;
        }

        const pitch = 0;
        const roll = 0;
        const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
        const orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);

        // 1. Store Data
        this.placements.push({
            tool: this.activeTool,
            position: position,
            heading: heading
        });

        // Create invisible pickup entity for selection
        const placementIndex = this.placements.length - 1;
        const pickEntity = this.viewer.entities.add({
            position: position,
            box: {
                dimensions: new Cesium.Cartesian3(config.scale * 2, config.scale * 2, config.scale * 4), // Approximate bounding box
                material: Cesium.Color.RED.withAlpha(0)
            }
        });
        this.placements[placementIndex].pickEntity = pickEntity;

        // 2. Render
        try {
            const modelMatrix = Cesium.Transforms.headingPitchRollToFixedFrame(position, hpr);

            // Special handling for gardens to make them flush with wall if possible
            // For now, we assume standard orientation
            
            const model = await Cesium.Model.fromGltfAsync({
                url: config.modelUrl || '',
                modelMatrix: modelMatrix,
                scale: config.scale,
            });

            this.viewer.scene.primitives.add(model);
            
            // Store model reference for deletion
            this.placements[placementIndex].model = model;

        } catch (error) {
            console.error("Failed to place model. Fallback to placeholder box.", error);

            // Fallback: Simple box if model fails to load
            const entity = this.viewer.entities.add({
                position: position,
                orientation: orientation,
                box: {
                    dimensions: new Cesium.Cartesian3(10, 10, 20),
                    material: Cesium.Color.GREEN
                }
            });
            
            // Store entity reference for deletion
            this.placements[placementIndex].entity = entity;
        }
    }

}

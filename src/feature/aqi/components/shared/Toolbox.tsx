import React, { useState, useEffect } from 'react';
import { PlacementManager, TOOLS } from '../../utils/PlacementManager';
import type { ToolType } from '../../utils/PlacementManager';
import * as Cesium from 'cesium';

interface ToolboxProps {
    viewer: Cesium.Viewer | null;
    /** When true, force the panel open (used by tour) */
    forceOpen?: boolean;
}

export const Toolbox: React.FC<ToolboxProps> = ({ viewer, forceOpen }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeToolId, setActiveToolId] = useState<ToolType | null>(null);
    const [manager, setManager] = useState<PlacementManager | null>(null);
    const [currentRotation, setCurrentRotation] = useState<number>(0);

    // Respond to forceOpen prop from tour
    useEffect(() => {
        if (forceOpen !== undefined) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsOpen(forceOpen);
        }
    }, [forceOpen]);

    // Initialize Manager once viewer is ready
    useEffect(() => {
        if (viewer && !manager) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setManager(new PlacementManager(viewer));
        }
    }, [viewer, manager]);

    // Handle external cancelations (Esc key, Right click) and rotation changes
    useEffect(() => {
        const handleCancel = () => {
            setActiveToolId(null);
            setCurrentRotation(0);
        };

        const handleRotationChange = (e: CustomEvent<number>) => {
            setCurrentRotation(e.detail);
        };

        const handleKeydown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                manager?.cancelPlacement();
                setActiveToolId(null);
                setCurrentRotation(0);
            }
        };

        window.addEventListener('placement-canceled', handleCancel);
        window.addEventListener('rotation-changed', handleRotationChange as EventListener);
        window.addEventListener('keydown', handleKeydown);

        return () => {
            window.removeEventListener('placement-canceled', handleCancel);
            window.removeEventListener('rotation-changed', handleRotationChange as EventListener);
            window.removeEventListener('keydown', handleKeydown);
        };
    }, [manager]);

    const togglePanel = () => {
        setIsOpen(!isOpen);
    };

    const handleToolClick = (toolId: ToolType) => {
        if (!manager) return;

        if (activeToolId === toolId) {
            manager.stopPlacement();
            setActiveToolId(null);
            setCurrentRotation(0);
        } else {
            manager.startPlacement(toolId);
            setActiveToolId(toolId);
            setCurrentRotation(0);
        }
    };

    return (
        <>
            {/* Active Status Label - Centered */}
            {activeToolId && (
                <div className="toolbox-status">
                    Placing: <strong>{TOOLS[activeToolId].name}</strong>
                    {activeToolId !== 'garden' && (
                         <span className="rotation-indicator"> | Rotation: {currentRotation}°</span>
                    )}
                    <small>
                        {activeToolId === 'garden'
                            ? '(Click to paint • Right-click / Esc to cancel)'
                            : '(Right-click / Esc to cancel)'}
                    </small>
                </div>
            )}

            {/* Toolbox Container - Center Right Side */}
            <div className="toolbox-container" data-tour="eco-toolbox">
                {/* Toggle Button - Arrow on the edge */}
                <div
                    className={`toolbox-side-toggle ${isOpen ? 'panel-open' : ''}`}
                    onClick={togglePanel}
                    title={isOpen ? "Close Toolbox" : "Open Toolbox"}
                >
                    <svg
                        viewBox="0 0 24 24"
                        className={`side-toggle-icon ${isOpen ? 'rotated' : ''}`}
                    >
                        <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                    </svg>
                </div>

                {/* Sliding Panel */}
                <div className={`toolbox-panel side-sliding ${isOpen ? 'show' : 'hide'}`}>
                    {/* Header */}
                    <div className="toolbox-header-static">
                        <h2>Eco Toolbox</h2>
                    </div>

                    {/* Tool Cards */}
                    <div className="toolbox-tools-scroll">
                        {Object.entries(TOOLS).map(([key, tool]) => (
                            <div
                                key={key}
                                className={`tool-card ${activeToolId === key ? 'active' : ''}`}
                                data-tour={`tool-${key}`}
                                onClick={() => handleToolClick(key as ToolType)}
                            >
                                <div className="tool-icon">
                                    {key === 'tree' && ''}
                                    {key === 'garden' && ''}
                                    {key === 'purifier' && ''}
                                </div>
                                <div className="tool-info">
                                    <h3>{tool.name}</h3>
                                    <span>{tool.subtitle}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};

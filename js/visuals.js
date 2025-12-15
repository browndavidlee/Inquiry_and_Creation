// --- js/visuals.js (v23.0 "Compass" Update - CORRECTED) ---

export const Visuals = {
    drawPathwayLines: function(svgElement, mapElement, nodeIds, color, isNodeExplorer = true) {
        if (!svgElement || !mapElement || !nodeIds || nodeIds.length < 2) {
            if (svgElement) {
                svgElement.innerHTML = '';
                svgElement.classList.remove('visible');
            }
            return;
        }

        svgElement.innerHTML = ''; // Clear previous content
        svgElement.setAttribute('width', mapElement.scrollWidth);
        svgElement.setAttribute('height', mapElement.scrollHeight);

        const points = [];
        nodeIds.forEach(nodeId => {
            const card = mapElement.querySelector(`.node-item[data-node-id="${nodeId}"], .node-card[data-node-id="${nodeId}"]`);
            if (card) {
                points.push({ 
                    x: card.offsetLeft + (card.offsetWidth / 2), 
                    y: card.offsetTop + (card.offsetHeight / 2) 
                });
            }
        });

        if (points.length < 2) {
            svgElement.innerHTML = '';
            svgElement.classList.remove('visible');
            return;
        }

        let pathData = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            const p1 = points[i-1];
            const p2 = points[i];
            const cp1x = p1.x + (p2.x - p1.x) * 0.5;
            const cp2x = p1.x + (p2.x - p1.x) * 0.5;
            pathData += ` C ${cp1x} ${p1.y}, ${cp2x} ${p2.y}, ${p2.x} ${p2.y}`;
        }

        const strokeWidth = isNodeExplorer ? 4 : 3;
        const markerId = `arrowhead-${color.replace(/[^a-zA-Z0-9]/g, '')}`;
        
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        marker.setAttribute('id', markerId);
        marker.setAttribute('markerWidth', '10');
        marker.setAttribute('markerHeight', '7');
        marker.setAttribute('refX', '8');
        marker.setAttribute('refY', '3.5');
        marker.setAttribute('orient', 'auto');
        marker.setAttribute('markerUnits', 'strokeWidth');

        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
        polygon.setAttribute('fill', color);

        marker.appendChild(polygon);
        defs.appendChild(marker);
        svgElement.appendChild(defs);

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('stroke', color);
        path.setAttribute('stroke-width', strokeWidth);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('marker-end', `url(#${markerId})`);
        
        svgElement.appendChild(path);
        svgElement.classList.add('visible');
    },

    drawOverlayPath: function(container, path, color) {
        // container is the wrapper div passed from app.js
        const svgElement = container.querySelector('#overview-path-svg');
        const stagesLayer = container.querySelector('.workflow-stages-layer');
        
        if (!svgElement || !stagesLayer || !path || path.length < 1) {
            if (svgElement) svgElement.innerHTML = '';
            return;
        }

        // Clear previous content
        svgElement.innerHTML = '';
        
        // CRITICAL: Set SVG dimensions to match the full scrollable content
        // We use the stagesLayer scrollWidth/Height because it contains the actual cards
        const width = stagesLayer.scrollWidth;
        const height = stagesLayer.scrollHeight;
        
        svgElement.setAttribute('width', width);
        svgElement.setAttribute('height', height);
        svgElement.style.width = `${width}px`;
        svgElement.style.height = `${height}px`;

        const getPoint = (toolId) => {
            // Find the card within the stages layer
            const stage = stagesLayer.querySelector(`.workflow-stage[data-id="${toolId}"]`);
            if (!stage) return null;
            
            // Calculate center relative to the stagesLayer (which is the grid parent)
            return {
                x: stage.offsetLeft + stage.offsetWidth / 2,
                y: stage.offsetTop + stage.offsetHeight / 2
            };
        };

        const getStrokeWidth = (weight) => {
            switch(weight) {
                case 'primary': return 8;
                case 'secondary': return 4;
                case 'tertiary': return 2;
                default: return 4;
            }
        };

        path.forEach((segment, index) => {
            const fromPoint = getPoint(segment.from);
            const toPoint = getPoint(segment.to);

            if (!fromPoint || !toPoint) return;

            let element;
            if (segment.type === 'feedback_loop') {
                element = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                const dx = toPoint.x - fromPoint.x;
                const arcHeight = 60;
                // Draw a quadratic bezier curve
                const pathData = `M ${fromPoint.x} ${fromPoint.y} Q ${fromPoint.x + dx / 2} ${fromPoint.y - arcHeight}, ${toPoint.x} ${toPoint.y}`;
                element.setAttribute('d', pathData);
                element.setAttribute('fill', 'none');
            } else {
                element = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                element.setAttribute('x1', fromPoint.x);
                element.setAttribute('y1', fromPoint.y);
                element.setAttribute('x2', toPoint.x);
                element.setAttribute('y2', toPoint.y);
            }

            element.setAttribute('stroke', color);
            element.setAttribute('class', `path-segment type-${segment.type} weight-${segment.weight}`);
            element.setAttribute('stroke-width', getStrokeWidth(segment.weight));
            element.style.pointerEvents = 'stroke'; // Ensure hover works
            element.dataset.rationale = segment.rationale;

            // Animation
            const length = element.getTotalLength ? element.getTotalLength() : Math.hypot(toPoint.x - fromPoint.x, toPoint.y - fromPoint.y);
            element.style.strokeDasharray = length;
            element.style.strokeDashoffset = length;
            element.style.transition = `stroke-dashoffset 0.5s ease-in-out ${index * 0.1}s`;

            svgElement.appendChild(element);
            
            // Trigger animation in next frame
            requestAnimationFrame(() => {
                element.style.strokeDashoffset = '0';
            });
        });
    }
};
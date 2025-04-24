import React, { useState, useEffect } from 'react';
import { ReactComponent as CampusMapSVG } from './assets/map_overlay_v4.svg';
import './MapView.css';

const lotColors = (lot) => {
  const available = lot.total_spots - lot.occupied_spots;
  const percentage = available / lot.total_spots;
  if (percentage < 0.05) return '#ee2c24';
  if (percentage < 0.25) return '#f4c217';
  return '#43a047';
};

const MapView = ({ lots, onLotClick }) => {
  const [hoveredLot, setHoveredLot] = useState(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });

  useEffect(() => {
    lots.forEach((lot) => {
      const el = document.getElementById(lot.abbrev);
      if (el) {
        el.style.fill = lotColors(lot);
        el.style.cursor = 'pointer';

        el.onmouseenter = (e) => {
          setHoveredLot(lot);
          el.style.transform='scale(1.1)';
          el.style.transformOrigin='center';
          el.style.stroke=lotColors(lot);
          el.style.strokeWidth='1px';
          el.style.opacity='0.9';
        };

        el.onmousemove = (e) => {
          setCursor({ x: e.clientX, y: e.clientY });
        };

        el.onmouseleave = () => {
          setHoveredLot(null);
          el.style.transform = 'scale(1)';
          el.style.stroke = 'none';
          el.style.opacity = 1;

        };

        el.onclick = () => onLotClick(lot);
      }
    });
  }, [lots, onLotClick]);

  return (
    <div className="svg-map-container">
      <CampusMapSVG className="campus-map" />
      {hoveredLot && (
        <div
          className="tooltip"
          style={{
            top: cursor.y + 10,
            left: cursor.x + 10,
          }}
        >
          <strong>{hoveredLot.name}</strong>
          <div>{hoveredLot.subtitle}</div>
          <div>
            {hoveredLot.total_spots - hoveredLot.occupied_spots} / {hoveredLot.total_spots} available
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;

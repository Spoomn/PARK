import React, { useState, useEffect } from 'react';
import { CSSTransition, SwitchTransition } from 'react-transition-group';
import './App.css';
import { fadeZoomTransition } from './transitions';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
console.log('Backend URL:', BACKEND_URL);

const App = () => {
  const [cars, setCars] = useState([]);
  const [lots, setLots] = useState([]);
  const [selectedLot, setSelectedLot] = useState(null);
  const [view, setView] = useState('main');

  // Fetch data from backend
  useEffect(() => {
    const fetchLots = async () => {
      try {
        console.log('Fetching data...');
        const response = await fetch(`${BACKEND_URL}/vision`);
        const data = await response.json();
        console.log('Fetched parking lots:', data);
        setLots(data);
      } catch (error) {
        console.error('Error fetching parking lots:', error);
      }
    };

    fetchLots();
  }, []);

  const handleLotClick = (lot) => {
    console.log('Selected lot:', lot);
    setView('detail');
    setSelectedLot(lot);

    // Fetch cars for the selected lot
    const fetchCars = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/cars?lotID=${lot.id}`);
        const data = await response.json();
        setCars(data);
      } catch (error) {
        console.error('Error fetching cars:', error);
      }
    };

    fetchCars();
  };

  const handleBack = () => {
    setView('main');
    setSelectedLot(null);
  };

  const carsInLot = cars.filter((car) => car.lotId === selectedLot?.id);

  return (
    <div className="app-container">
      <h1 className="app-title">Parking Availability</h1>

      <SwitchTransition mode="out-in">
        <CSSTransition
          key={view}
          timeout={300}
          classNames={fadeZoomTransition}
          unmountOnExit
        >
          <div className="view-container">
            {view === 'main' ? (
              <div className="main-view">
                <div className="lots-grid">
                  {lots.map((lot) => {
                    const available_spots = lot.total_spots - lot.occupied_spots;
                    return (
                      <div 
                        key={lot.id}
                        className="lot-card"
                        onClick={() => handleLotClick(lot)}
                      >
                        <h3>{lot.name}</h3>
                        <div className="availability">
                          {available_spots} spots available
                        </div>
                        <div className="car-count">
                          {lot.occupied_spots} cars parked
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="detail-view">
                <button className="back-button" onClick={handleBack}>
                  ← Back to All Lots
                </button>
                <div className="lot-details">
                  <h2>{selectedLot?.name}</h2>
                  <div className="status-indicators">
                    <div className="status-item available">
                      Available Spaces: {selectedLot?.total_spots - selectedLot?.occupied_spots}
                    </div>
                    <div className="status-item occupied">
                      Occupied Spaces: {selectedLot?.occupied_spots}
                    </div>
                  </div>
                  <h3>Parked Vehicles:</h3>
                  <div className="cars-container">
                    {carsInLot.length > 0 ? (
                      carsInLot.map((car) => (
                        <div key={car.id} className="car-card">
                          <div className="car-id">Vehicle ID: {car.id}</div>
                          <div className={`car-status ${car.status.toLowerCase()}`}>
                            Status: {car.status}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-cars">No vehicles currently parked in this lot</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CSSTransition>
      </SwitchTransition>
    </div>
  );
};

export default App;

import React, { useState, useEffect, useRef } from 'react';
import { CSSTransition, SwitchTransition } from 'react-transition-group';
import './App.css';
import { fadeZoomTransition } from './transitions';
import refreshIcon from './refresh.svg';
import filterIcon from './filter-list.svg';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
console.log('Backend URL:', BACKEND_URL);

const REFRESH_INTERVAL = 30000;

const App = () => {
  const [lots, setLots] = useState([]);
  const [error, setError] = useState(null);
  const [selectedLot, setSelectedLot] = useState(null);
  const [view, setView] = useState('main');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const mainViewRef = useRef(null);
  const detailViewRef = useRef(null);

  const fetchLots = async () => {
    try {
      console.log('Fetching data...');
      setError(null);
      const response = await fetch(`${BACKEND_URL}/vision`);
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }
      const data = await response.json();
      console.log('Fetched parking lots:', data);
      setLots(data);
    } catch (error) {
      console.error('Error fetching parking lots:', error);
      setError(`Failed to fetch parking lot data: ${error.message}`);
    }
  };

  // Fetch data from backend
  useEffect(() => {
    fetchLots();
    const interval = setInterval(fetchLots, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const handleLotClick = (lot) => {
    console.log('Selected lot:', lot);
    setView('detail');
    setSelectedLot(lot);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSearchTerm('');
    fetchLots();
  };

  const handleBack = () => {
    setView('main');
    setSelectedLot(null);
    fetchLots();
  };

  const filteredLots = lots.filter((lot) => {
    const available_spots = lot.total_spots - lot.occupied_spots;
    if (filter === 'available' && available_spots === 0) return false;
    if (filter === 'full' && available_spots > 0) return false;
    return lot.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const sortedLots = [...filteredLots].sort((a, b) => 
    (b.total_spots - b.occupied_spots) - (a.total_spots - a.occupied_spots)
  );
  
  return (
    <div className="app-container">
      <h1 className="app-title">PARK</h1>
      <h2 className='app-subtitle'>Parking App for Real-time Knowledge</h2>
      {view === 'main' && (
        <div className="controls-container">
          <button className="refresh-button" onClick={() => window.location.reload()}>
            <img src={refreshIcon} alt="Refresh" className="refresh-icon" />
          </button>
          <input
            type="text"
            className="search-bar"
            placeholder="Search for a parking lot..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="filter-dropdown">
            <button className="filter-button" onClick={() => setFilterOpen(!filterOpen)}>
              <img src={filterIcon} alt="Filter" className="filter-icon" />
              <div className="filter-type">
                {filter === 'all' ? 'All Lots' : filter === 'available' ? 'Available Lots' : 'Full Lots'}
              </div>
            </button>
            {filterOpen && (
              <div className="filter-menu">
                <button onClick={() => { setFilter('all'); setFilterOpen(false); }}>All Lots</button>
                <button onClick={() => { setFilter('available'); setFilterOpen(false); }}>Available Lots</button>
                <button onClick={() => { setFilter('full'); setFilterOpen(false); }}>Full Lots</button>
              </div>
            )}
          </div>
          
        </div>
      )}

      <SwitchTransition mode="out-in">
        <CSSTransition
          key={view}
          timeout={300}
          classNames={fadeZoomTransition}
          unmountOnExit
          nodeRef={view === 'main' ? mainViewRef : detailViewRef}
        >
          <div className="view-container" ref={view === 'main' ? mainViewRef : detailViewRef}>
            {view === 'main' ? (
              <div className="main-view">
                {error ? (
                  <div className="error-message">{error}</div>
                ):(
                <div className="lots-grid">
                  {sortedLots.map((lot) => {
                    const available_spots = lot.total_spots - lot.occupied_spots;
                    const availablePercentage = (available_spots / lot.total_spots) * 100;
                    const textColor = availablePercentage < 5 ? '#ee2c24' : availablePercentage < 25 ? '#f4c217' : '#43a047';
                    return (
                      <div 
                        key={lot.id}
                        className="lot-card"
                        onClick={() => handleLotClick(lot)}
                      >
                        <h3>{lot.name}</h3>
                        <div className="availability" style={{ color: textColor }}>
                          {available_spots} spots available
                        </div>
                        <div className="car-count">
                          {lot.occupied_spots} cars parked
                        </div>
                      </div>
                    );
                    })}
                  </div>
                )}
              </div>
                ) : (
                  <div className="detail-view">
                  <button className="back-button" onClick={handleBack}>
                    ← Back to All Lots
                  </button>
                  <h1>Lot Details: {selectedLot?.name}</h1>
                  <div className="lot-details">
                    <div className="occupancy-bar-container">
                    {(selectedLot?.total_spots) - (selectedLot?.occupied_spots)} spots available
                    <div className="occupancy-bar">
                      <div
                      className="occupancy-filled"
                      style={{
                        width: `${(selectedLot?.occupied_spots / selectedLot?.total_spots) * 100}%`,
                        backgroundColor: ((selectedLot?.total_spots - selectedLot?.occupied_spots) / selectedLot?.total_spots) * 100 < 5 ? '#ee2c24' : ((selectedLot?.total_spots - selectedLot?.occupied_spots) / selectedLot?.total_spots) * 100 < 25 ? '#f4c217' : '#43a047'
                      }}
                      ></div>
                    </div>
                  </div>
                  </div>
                </div>
                )}
                <div className="footer">
                  <p>Love it or hate it?</p>
                  <a href="https://forms.gle/L4bjuXgSr434B9oX8">
                  <button className="survey-button">Take Survey</button>
                  </a>
              <p>
                Made with <span role='img' aria-label='heart emoji'>❤️</span> by Spoomn Inc.
              </p>
            </div>
          </div>
        </CSSTransition>
      </SwitchTransition>
    </div>
  );
};

export default App;

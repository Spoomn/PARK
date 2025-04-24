import React, { useState, useEffect, useRef } from 'react';
import { CSSTransition, SwitchTransition } from 'react-transition-group';
import './App.css';
import { fadeZoomTransition } from './transitions';
import pinIcon from './pin.svg';
import refreshIcon from './refresh.svg';
import filterIcon from './filter-list.svg';
import MapView from './MapView';
import mapIcon from './map.svg';
import tileIcon from './tile.svg';

// import favorite from './favorite.svg';
// import unfavorite from './unfavorite.svg';

import { auth } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';


const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
console.log('Backend URL:', BACKEND_URL);
const UT_MAP_KEY = process.env.REACT_APP_UT_MAP_KEY;
console.log('UT API key:', UT_MAP_KEY)
const REFRESH_INTERVAL = 30000;
const ADMIN_EMAILS = ["spenceream@gmail.com",]


const App = () => {
  const [viewMode, setViewMode] = useState('tiles'); // or 'map'
  const [lots, setLots] = useState([]);
  const [error, setError] = useState(null);
  const [selectedLot, setSelectedLot] = useState(null);
  const [view, setView] = useState('main');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  // const [favoriteLots, setFavoriteLots] = useState([]);
  const mainViewRef = useRef(null);
  const detailViewRef = useRef(null);
  const fileInputRef = useRef(null);


const handlePhotoUploadClick = () => {
    fileInputRef.current.click();
  };

  const handlePhotoSelected = async (event) => {
    const file = event.target.files[0];
    // format the file name to "lot_name"
    const formattedLotName = selectedLot.name
      .toLowerCase()
      .replace(/\s+/g, '_');
      if (file && selectedLot){
        const formData = new FormData();
        formData.append('image', file);
        formData.append('lotName', formattedLotName);
        try{
          const response = await fetch(`${BACKEND_URL}/upload_photo`, {
            method: 'POST',
            body: formData,
          });
          if (!response.ok){
            throw new Error(`Failed to upload photo: ${response.statusText}`);
          }
          const result = await response.json();
          console.log('Photo uploaded successfully:', result);
          alert('Photo uploaded successfully');
        } catch (error){
          console.error('Error uploading photo:', error);
          alert(`Error uploading photo: ${error.message}. Please try again.`);
        }
    }
  };



  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setIsAdmin(user && ADMIN_EMAILS.includes(user.email));
  
    //   if (user) {
    //     try {
    //       console.log("Fetching favorites for user:", user.uid);
    //       const userDocRef = doc(db, "favorites", user.uid);
    //       const userDoc = await getDoc(userDocRef);
  
    //       if (userDoc.exists()) {
    //         console.log("Favorites found:", userDoc.data().lots);
    //         setFavoriteLots(userDoc.data().lots || []); // ✅ Ensure an array is returned
    //       } else {
    //         console.log("No favorites found, setting empty list.");
    //         setFavoriteLots([]);
    //       }
    //     } catch (error) {
    //       console.error("Error fetching favorites:", error);
    //       setFavoriteLots([]); // Prevents stale state on error
    //     }
    //   } else {
    //     setFavoriteLots([]); // ✅ Clear favorites when user logs out
    //   }
    });
  
    return () => unsubscribe();
  }, []);
  
  

  // const toggleFavorite = async (lotId) => {
  //   if (!user) {
  //     alert("You must be logged in to favorite a parking lot.");
  //     handleLogin();
  //     return;
  //   }
  
  //   const userRef = doc(db, "favorites", user.uid);
  //   let updatedFavorites = [];
  
  //   if (favoriteLots.includes(lotId)) {
  //     updatedFavorites = favoriteLots.filter((id) => id !== lotId);
  //   } else {
  //     updatedFavorites = [...favoriteLots, lotId];
  //   }
  
  //   setFavoriteLots(updatedFavorites);
  
  //   try {
  //     await setDoc(userRef, { lots: updatedFavorites }, { merge: true });
  //     console.log("Updated favorites in Firestore:", updatedFavorites);
  //   } catch (error) {
  //     console.error("Error updating favorites:", error);
  //   }
  // };
  

  const handleLogin = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then(() => {
        console.log("User signed in, fetching lots...");
        fetchLots();
      })
      .catch((error) => console.error("Error signing in:", error));
  };
  

  const handleLogout = () => {
    signOut(auth).then(() => {
      console.log('User signed out');
      // setFavoriteLots([]);
    }).catch((error) => console.error("Error signing out:", error));
  };

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
    // if (filter === 'favorites' && !favoriteLots.includes(lot.id)) return false;
    const available_spots = lot.total_spots - lot.occupied_spots;
    if (filter === 'available' && available_spots === 0) return false;
    if (filter === 'full' && available_spots > 0) return false;
    return lot.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const sortedLots = [...filteredLots].sort((a, b) => {
    // const isAfavorite = favoriteLots.includes(a.id);
    // const isBfavorite = favoriteLots.includes(b.id);
    // if (isAfavorite && !isBfavorite) return -1;
    // if (!isAfavorite && isBfavorite) return 1;
    return (b.total_spots - b.occupied_spots) - (a.total_spots - a.occupied_spots)
  }
  );

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    const now = new Date();
    const updated = new Date(timestamp);
    const diffMs = now - updated;
    const diffMins = Math.floor(diffMs / 60000);
  
    if (diffMins < 1) return 'Updated just now';
    if (diffMins === 1) return 'Updated 1 minute ago';
    if (diffMins < 60) return `Updated ${diffMins} minutes ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return 'Updated 1 hour ago';
    if (diffHours < 24) return `Updated ${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `Updated ${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("darkMode");
    if (savedTheme === "true") setDarkMode(true);
  }, []);
  
  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, [darkMode]);
  
  const mapRef = useRef(null);
  useEffect(() => {
    if (mapRef.current) {
      console.log('map loaded:', mapRef.current)
    }
  }, [])
  
  
  
  return (
    <div className={`app-container ${darkMode ? 'dark' : ''}`}>
      <div>
        <h1 className="app-title">PARK</h1>
        <h2 className='app-subtitle'>Parking App for Real-time Knowledge</h2>
      </div>
      <div className="auth-container">
        {user ? (
          <div className='user-info-container'>
            
            <div className='user-info'>
              {user.displayName}
            </div>
            <button className='logout-button' onClick={handleLogout}>
              Logout
            </button>
          </div>
        ) : (
          <button className='login-button' alt='Login with Google' onClick={handleLogin}>
            Log In
          </button>
        )}
        <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
        {darkMode ? '☀️' : '🌙'}
      </button>
      <div className="view-toggle">
        <button onClick={() => setViewMode(viewMode === 'tiles' ? 'map' : 'tiles')}>
          <img
            title={viewMode === 'tiles' ? 'Switch to Map View' : 'Switch to Tile View'}
            src={viewMode === 'tiles' ? mapIcon : tileIcon}
            alt={viewMode === 'tiles' ? 'Switch to Map View' : 'Switch to Tile View'}
            className="view-toggle-icon"
            />
        </button>
      </div>

      </div>
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
                {filter === 'all' ? 'All Lots' : 
                filter === 'available' ? 'Available Lots' :
                filter === 'full' ? 'Full Lots' :
                filter === 'favorites' ? 'Favorite Lots' : 'Filter'}
              </div>
            </button>
            {filterOpen && (
              <div className="filter-menu">
                <button onClick={() => { setFilter('all'); setFilterOpen(false); }}>All Lots</button>
                <button onClick={() => { setFilter('available'); setFilterOpen(false); }}>Available Lots</button>
                <button onClick={() => { setFilter('full'); setFilterOpen(false); }}>Full Lots</button>
                {/* {user && (
                    <button onClick={() => setFilter('favorites')}>Favorite Lots</button>
                  )} */}
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
                ) : viewMode === 'tiles' ? (
                  <div className="lots-grid">
                    {sortedLots.map((lot) => {
                      const available_spots = lot.total_spots - lot.occupied_spots;
                      const availablePercentage = (available_spots / lot.total_spots) * 100;
                      const textColor =
                        availablePercentage < 5 ? '#ee2c24' :
                        availablePercentage < 25 ? '#f4c217' :
                        '#43a047';
                      return (
                        <div key={lot.id} className="lot-card">
                          <h3>{lot.name}</h3>
                          <p>{lot.subtitle}</p>
                          <div className="availability" style={{ color: textColor }}>
                            {available_spots < 0 ? '0 spots available' : `${available_spots} spots available`}
                          </div>
                          <div className="car-count">
                            {lot.occupied_spots > lot.total_spots ? 'Lot Full' : `${lot.occupied_spots} cars parked`}
                          </div>
                          <button className='see-details-button' onClick={() => handleLotClick(lot)}>See Details</button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <MapView lots={sortedLots} onLotClick={handleLotClick} />
                )}
              </div>
            ) : (
              <>
                <div className="detail-view">
                  <button className="back-button" onClick={handleBack}>
                    ← Back to All Lots
                  </button>

                  {isAdmin && (
                    <div>
                      <button className='add-photo-button' onClick={handlePhotoUploadClick}>
                        + Upload New Photo
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handlePhotoSelected}
                      />
                    </div>
                  )}

                  <h1>{selectedLot?.name}</h1>

                  <div className='name-details'>
                    <p>{selectedLot?.subtitle}</p>
                    <a
                      href={`https://www.google.com/maps?q=${selectedLot.latitude},${selectedLot.longitude}`}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='map-link'
                    >
                      <img src={pinIcon} alt="Open in Maps" className='map-pin-icon' />
                    </a>
                  </div>

                  <div className="lot-details">
                    <div className="occupancy-bar-container">
                      {((selectedLot?.total_spots - selectedLot?.occupied_spots) < 0
                        ? `0 / ${selectedLot?.total_spots}`
                        : `${selectedLot?.total_spots - selectedLot?.occupied_spots} / ${selectedLot?.total_spots}`)} spots available
                      <div className="occupancy-bar">
                        <div
                          className="occupancy-filled"
                          style={{
                            width: `${(selectedLot?.occupied_spots / selectedLot?.total_spots) * 100}%`,
                            backgroundColor:
                              ((selectedLot?.total_spots - selectedLot?.occupied_spots) / selectedLot?.total_spots) * 100 < 5
                                ? '#ee2c24'
                                : ((selectedLot?.total_spots - selectedLot?.occupied_spots) / selectedLot?.total_spots) * 100 < 25
                                ? '#f4c217'
                                : '#43a047'
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="lastUpdate">
                      {getTimeAgo(selectedLot.last_updated)}
                    </div>

                    {/* <div className="map-container" style={{ width: '100%', height: 600 }}>
                      <iframe
                        id="ut_map"
                        ref={mapRef}
                        title="Utah Tech Campus Map"
                        src={`https://maps.utahtech.edu/`}
                        width="100%"
                        height="100%"
                        allowFullScreen={false}
                        loading="lazy"
                        style={{ border: 'none' }}
                      />
                    </div> */}
                  </div>
                </div>
                </>
            )}
                <div className="footer">
                  <p>Love it or hate it?</p>
                  <a href="https://forms.gle/L4bjuXgSr434B9oX8">
                    <button className="survey-button">Leave Feedback</button>
                  </a>
                  <p>
                    Made with <span role='img' aria-label='heart emoji'>❤️</span> by <a href="https://github.com/Spoomn" style={{ textDecoration: "none" }}>Spoomn</a> Inc.
                  </p>
                </div>
              
          </div>
        </CSSTransition>
      </SwitchTransition>

    </div>
  );
};

export default App;

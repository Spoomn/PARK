import psycopg2
from datetime import datetime, timezone

# Local database connection parameters
DB_PARAMS = {
    "dbname": "vision",
    "user": "postgres",
    "password": "postgres",
    "host": "localhost",
    "port": "5432",
    "connect_timeout": 20,
}

confirm = input("This will reset all local database data and set occupied spots to specified values. Are you sure you want to continue? (yes/no) ")
if confirm.lower() != "yes":
    print("Exiting...")
    exit()

# Data to be reinserted
parking_lots_data = [
    (1, 'Lot M East','North of the M. Anthony Burns Arena', 194, 100, 'PLME', 37.10258117904099, -113.56745668648611),
    (2, 'Lot S', 'South of the Smith Computer Center', 57, 50, 'PLS', 37.10068226414395, -113.56793518252735),
    (3, 'Lot M West', 'South of the HPC', 170, 106, 'PLMW', 37.10262715133956, -113.56745455337575),
    (4, 'Lot K', 'LDS Institute Lot', 418, 220, 'PLK', 37.1025300434872, -113.56336147449815),
    (5, 'Lot H', 'South of Campus View Suites II', 147, 23, 'PLH', 37.10446184531003, -113.56327385499728),
    (6, 'Lot F', 'Southwest of College of Education building', 19, 1, 'PLF', 37.10521742832655, -113.56436519881086),
    (7, 'Lot B', 'West of the Eccles Fine Arts Center', 75, 14, 'PLB', 37.10581656052315, -113.56820791387753),
    (8, 'Lot N', 'South of Encampment Mall Field', 354, 110, 'PLN', 37.100970618354445, -113.56514474719059),
    (9, 'Lot O', 'East of Greater Zion Stadium', 262, 27, 'PLO', 37.10066110250252, -113.56597371291704)
]

try:
    # Connect to local PostgreSQL
    conn = psycopg2.connect(**DB_PARAMS)
    cur = conn.cursor()

    cur.execute("DROP TABLE IF EXISTS parking_lots;")
    conn.commit()

    cur.execute("""
        CREATE TABLE parking_lots (
            id INT PRIMARY KEY,
            name VARCHAR(50) NOT NULL,
            subtitle VARCHAR(100) NOT NULL,
            total_spots INT NOT NULL,
            occupied_spots INT NOT NULL,
            open_spots INT GENERATED ALWAYS AS (total_spots - occupied_spots) STORED,
            abbrev VARCHAR(10),
            last_updated TIMESTAMPTZ DEFAULT NOW(),
            latitude DOUBLE PRECISION,
            longitude DOUBLE PRECISION
        );
    """)
    conn.commit()

    now = datetime.now(timezone.utc)
    enriched_data = [(*lot, now) for lot in parking_lots_data]

    cur.executemany("""
        INSERT INTO parking_lots (
            id, name, subtitle, total_spots, occupied_spots, abbrev, latitude, longitude, last_updated
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, enriched_data)
    conn.commit()

    print("Local database reset and filled successfully!")

except Exception as e:
    print(f"Error: {e}")
finally:
    if 'cur' in locals():
        cur.close()
    if 'conn' in locals():
        conn.close()

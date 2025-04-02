import psycopg2
from datetime import datetime,timezone

# Database connection parameters
DB_PARAMS = {
    "dbname": "vision",
    "user": "postgres",
    "password": "postgres",
    "host": "localhost",
    "port": "5432",
    "connect_timeout": 20,
}


# Data to be reinserted
parking_lots_data = [
    (1, 'Lot M','North of the M. Anthony Burns Arena', 194, 0, 37.10258117904099, -113.56745668648611),
    (2, 'Lot S', 'South of the Smith Computer Center', 57, 0, 37.10068226414395, -113.56793518252735),
    (3, 'Bank Lot', "East of Zion's Bank on St. George Blvd.", 57, 0, 37.10947796454334, -113.582033255159),
]

try:
    # Connect to the database
    conn = psycopg2.connect(**DB_PARAMS)
    cur = conn.cursor()

    cur.execute("""
                DROP TABLE parking_lots"""
                )
    conn.commit()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS parking_lots (
            id INT PRIMARY KEY,
            name VARCHAR(50) NOT NULL,
            subtitle VARCHAR(100) NOT NULL,
            total_spots INT NOT NULL,
            occupied_spots INT NOT NULL,
            open_spots INT GENERATED ALWAYS AS (total_spots - occupied_spots) STORED,
            last_updated TIMESTAMPTZ DEFAULT NOW(),
            latitude DOUBLE PRECISION,
            longitude DOUBLE PRECISION
        );
    """)
    conn.commit()

    # Delete existing data
    cur.execute("DELETE FROM parking_lots;")
    conn.commit() 

    now = datetime.now(timezone.utc)
    enriched_data = [(*lot, now) for lot in parking_lots_data]
    cur.executemany("""
                    INSERT INTO parking_lots(
                    id, name, subtitle, total_spots, occupied_spots, latitude, longitude, last_updated
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """, enriched_data)
    conn.commit()

    print("Data reset successfully!")

except Exception as e:
    print(f"Error: {e}")
finally:
    if 'cur' in locals() and cur is not None:
        cur.close()
    if 'conn' in locals() and conn is not None:
        conn.close()


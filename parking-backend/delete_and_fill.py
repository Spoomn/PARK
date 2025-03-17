import psycopg2

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
    (1, 'North Lot', 67, 65),
    (2, 'South Lot', 88, 20),
    (3, 'East Lot', 34, 25),
    (4, 'West Lot', 65, 65),
    (5, 'Central Lot', 45, 10),
    (6, 'Underground Lot', 100, 90),
    (7, 'Rooftop Lot', 50, 5),
    (8, 'Overflow Lot', 120, 100),
    (9, 'Employee Lot', 30, 10),
    (10, 'Visitor Lot', 40, 20),
]

try:
    # Connect to the database
    conn = psycopg2.connect(**DB_PARAMS)
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS parking_lots (
            id INT PRIMARY KEY,
            name VARCHAR(50) NOT NULL,
            total_spots INT NOT NULL,
            occupied_spots INT NOT NULL
        );
    """)
    conn.commit()

    # Check if the computed column 'open_spots' exists
    cur.execute("""
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'parking_lots' AND column_name = 'open_spots';
    """)
    column_exists = cur.fetchone()

    if not column_exists:
        # Add the computed column (only once)
        cur.execute("""
            ALTER TABLE parking_lots 
            ADD COLUMN open_spots INT GENERATED ALWAYS AS (total_spots - occupied_spots) STORED;
        """)
        conn.commit()  # Commit column addition
        print("Added computed column 'open_spots'.")

    # Delete existing data
    cur.execute("DELETE FROM parking_lots;")
    conn.commit()  # Commit deletion

    # Reinsert the dummy data
    insert_query = """
        INSERT INTO parking_lots (id, name, total_spots, occupied_spots) 
        VALUES (%s, %s, %s, %s);
    """
    cur.executemany(insert_query, parking_lots_data)
    conn.commit()  # Commit inserted data

    print("Data reset successfully!")

except Exception as e:
    print(f"Error: {e}")
finally:
    if 'cur' in locals() and cur is not None:
        cur.close()
    if 'conn' in locals() and conn is not None:
        conn.close()


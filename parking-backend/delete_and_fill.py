import psycopg2

# Database connection parameters
DB_PARAMS = {
    "dbname": "vision",
    "user": "postgres",
    "password": "postgres",
    "host": "127.0.0.1",
    "port": "5432",  # Default PostgreSQL port
}

# Data to be reinserted
parking_lots_data = [
    (1, 'A', 100, 50),
    (2, 'B', 80, 20),
    (3, 'C', 120, 100),
    (4, 'D', 60, 30),
]

try:
    # Connect to the database
    conn = psycopg2.connect(**DB_PARAMS)
    cur = conn.cursor()

    # Check if the table exists
    cur.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'parking_lots'
        );
    """)
    table_exists = cur.fetchone()[0]

    if not table_exists:
        # Create the parking_lots table if it doesn't exist
        cur.execute("""
            CREATE TABLE parking_lots (
                id INT PRIMARY KEY,
                name VARCHAR(50) NOT NULL,
                total_spots INT NOT NULL,
                occupied_spots INT NOT NULL
            );
        """)
        conn.commit()  # Commit table creation
        print("Created table 'parking_lots'.")

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
    if 'cur' in locals() and cur:
        cur.close()
    if 'conn' in locals() and conn:
        conn.close()

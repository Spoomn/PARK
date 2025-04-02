import psycopg2


from google.cloud.sql.connector import Connector
INSTANCE_CONNECTION_NAME = "vision-447321:us-central1:vision-db"
DB_USER = "postgres"
DB_PASSWORD = "postgres"
DB_NAME = "vision"

def connect_with_connector():

    connector = Connector()
    conn = connector.connect(
        INSTANCE_CONNECTION_NAME, 
        "pg8000",
        user=DB_USER,
        password=DB_PASSWORD,
        db=DB_NAME,
        port=5432,
    )
    return conn

# # Database connection parameters
# DB_PARAMS = {
#     "dbname": "vision",
#     "user": "postgres",
#     "password": "postgres",
#     "host": "localhost",
#     "port": "5432",
#     "connect_timeout": 20,
# }

def get_parking_lots(cursor):
    cursor.execute("SELECT id, name, total_spots FROM parking_lots;")
    return cursor.fetchall()

def update_occupied_spots(cursor, conn, lot_identifier, num_cars, total_spots):
    if num_cars > total_spots:
        print("Error: Number of cars exceeds total available spots. Update canceled.")
        return
    
    if isinstance(lot_identifier, int):
        cursor.execute("""
            UPDATE parking_lots 
            SET occupied_spots = %s 
            WHERE id = %s;
        """, (num_cars, lot_identifier))
    else:
        cursor.execute("""
            UPDATE parking_lots 
            SET occupied_spots = %s 
            WHERE name = %s;
        """, (num_cars, lot_identifier))
    conn.commit()

def main():
    try:
        conn = connect_with_connector()
        # conn = psycopg2.connect(**DB_PARAMS)
        cur = conn.cursor()
        
        lots = get_parking_lots(cur)
        lot_dict = {str(lot[0]): (lot[1], lot[2]) for lot in lots}  # ID to (Name, Total Spots) Mapping
        lot_dict.update({lot[1].lower(): (lot[1], lot[2]) for lot in lots})  # Name to (Name, Total Spots) Mapping
        
        print(f"Which lot would you like to edit? {tuple(lot_dict.keys())}? Enter an ID number or name")
        lot_input = input().strip()
        
        selected_lot_info = lot_dict.get(lot_input.lower() if not lot_input.isdigit() else lot_input)
        if not selected_lot_info:
            print("Invalid lot selection. Exiting.")
            return
        
        selected_lot, total_spots = selected_lot_info
        print(f"Selected: {selected_lot}.")
        
        while True:
            try:
                num_cars = int(input("How many cars are present? ").strip())
                break
            except ValueError:
                print("Please enter a valid number.")
        
        if update_occupied_spots(cur, conn, selected_lot, num_cars, total_spots):
            print(f"{num_cars} cars are in {selected_lot}... Updated.")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    main()

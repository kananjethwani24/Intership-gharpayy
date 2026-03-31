import sqlite3
import json

def restore():
    conn = sqlite3.connect('prisma/dev.db')
    c = conn.cursor()
    
    # Get properties
    c.execute("SELECT * FROM PropertyMaster")
    props = c.fetchall()
    prod_data = []
    
    prop_col_names = [description[0] for description in c.description]
    
    # Get rooms
    c.execute("SELECT * FROM RoomMaster")
    rooms = c.fetchall()
    room_col_names = [description[0] for description in c.description]
    
    res = {
        "properties": [dict(zip(prop_col_names, p)) for p in props],
        "rooms": [dict(zip(room_col_names, r)) for r in rooms]
    }
    
    with open('legacy_db_dump.json', 'w') as f:
        json.dump(res, f, indent=2)

if __name__ == '__main__':
    restore()

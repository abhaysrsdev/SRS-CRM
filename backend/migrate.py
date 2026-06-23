import sqlite3
import psycopg2
import psycopg2.extras

def migrate():
    # Connect to local SQLite
    sl_conn = sqlite3.connect('crm.db')
    sl_conn.row_factory = sqlite3.Row
    sl_cur = sl_conn.cursor()
    
    # Get all tables
    sl_cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [r['name'] for r in sl_cur.fetchall() if r['name'] != 'alembic_version' and r['name'] != 'sqlite_sequence']
    
    print(f"Found tables: {tables}")
    
    # Connect to Supabase Postgres
    pg_conn = psycopg2.connect("postgresql://postgres.kosjaeupqasimmtqefnp:Abhay%40332145@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres")
    pg_cur = pg_conn.cursor()
    
    for table in tables:
        print(f"Migrating table: {table}")
        sl_cur.execute(f"SELECT * FROM {table}")
        rows = sl_cur.fetchall()
        if not rows:
            print(f"  -> Table {table} is empty. Skipping.")
            continue
            
        columns = rows[0].keys()
        cols_str = ', '.join(columns)
        placeholders = ', '.join(['%s'] * len(columns))
        
        insert_query = f"INSERT INTO {table} ({cols_str}) VALUES ({placeholders}) ON CONFLICT DO NOTHING"
        
        data_to_insert = []
        for row in rows:
            data_to_insert.append(tuple(row))
            
        print(f"  -> Inserting {len(data_to_insert)} rows into {table}...")
        try:
            psycopg2.extras.execute_batch(pg_cur, insert_query, data_to_insert)
            pg_conn.commit()
            print(f"  -> Success for {table}!")
        except Exception as e:
            print(f"  -> Error inserting into {table}: {e}")
            pg_conn.rollback()

if __name__ == "__main__":
    migrate()

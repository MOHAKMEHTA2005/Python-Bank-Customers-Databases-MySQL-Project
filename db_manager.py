import os
import json
import sqlite3
import mysql.connector

# Detect if running in Vercel's read-only environment
IS_VERCEL = os.environ.get("VERCEL") == "1" or os.environ.get("VERCEL") is not None

if IS_VERCEL:
    CONFIG_FILE = "/tmp/db_config.json"
    SQLITE_DB = "/tmp/bank.db"
    
    # Copy the pre-existing seed sqlite database to the writable /tmp directory if it hasn't been copied yet
    if not os.path.exists(SQLITE_DB) and os.path.exists("bank.db"):
        import shutil
        try:
            shutil.copy("bank.db", SQLITE_DB)
            print("Successfully copied template bank.db to /tmp")
        except Exception as e:
            print(f"Error copying bank.db to /tmp: {e}")
            
    # Pre-create the default configuration in /tmp if not present
    if not os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'w') as f:
                json.dump({"type": "sqlite", "host": "localhost", "user": "root", "passwd": "", "database": "Bank_Customers_Database"}, f, indent=4)
        except Exception as e:
            print(f"Error creating default db_config.json in /tmp: {e}")
else:
    CONFIG_FILE = "db_config.json"
    SQLITE_DB = "bank.db"

def get_db_config():
    """Reads database configuration from local json file."""
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r') as f:
                return json.load(f)
        except Exception:
            pass
    return {"type": "sqlite", "host": "localhost", "user": "root", "passwd": "", "database": "Bank_Customers_Database"}

def save_db_config(config):
    """Saves database configuration."""
    with open(CONFIG_FILE, 'w') as f:
        json.dump(config, f, indent=4)

class DBManager:
    def __init__(self):
        self.config = get_db_config()
        self.db_type = self.config.get("type", "sqlite")
        self.init_db()

    def get_connection(self):
        """Returns a connection and a boolean indicating if it's MySQL."""
        self.config = get_db_config()
        self.db_type = self.config.get("type", "sqlite")

        if self.db_type == "mysql":
            try:
                conn = mysql.connector.connect(
                    host=self.config.get("host", "localhost"),
                    user=self.config.get("user", "root"),
                    password=self.config.get("passwd", ""),
                    database=self.config.get("database", "Bank_Customers_Database")
                )
                return conn, True
            except Exception as e:
                # If MySQL fails to connect, fallback to SQLite and notify
                print(f"MySQL connection failed: {e}. Falling back to SQLite.")
                # We do not change db_type permanently, just return sqlite connection
                conn = sqlite3.connect(SQLITE_DB)
                return conn, False
        else:
            conn = sqlite3.connect(SQLITE_DB)
            return conn, False

    def init_db(self):
        """Creates the Customers table if it does not exist in the active database."""
        conn, is_mysql = self.get_connection()
        cursor = conn.cursor()
        
        if is_mysql:
            try:
                # Create DB if not exists
                temp_conn = mysql.connector.connect(
                    host=self.config.get("host", "localhost"),
                    user=self.config.get("user", "root"),
                    password=self.config.get("passwd", "")
                )
                temp_cur = temp_conn.cursor()
                temp_cur.execute(f"CREATE DATABASE IF NOT EXISTS {self.config.get('database', 'Bank_Customers_Database')}")
                temp_conn.commit()
                temp_cur.close()
                temp_conn.close()

                # Reconnect to the database
                conn, _ = self.get_connection()
                cursor = conn.cursor()

                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS Customers (
                        accno VARCHAR(50) PRIMARY KEY,
                        cname VARCHAR(100) NOT NULL,
                        addr VARCHAR(255),
                        phone VARCHAR(20),
                        pcard VARCHAR(20),
                        acard VARCHAR(20),
                        atype VARCHAR(50),
                        Balance DOUBLE DEFAULT 0.0
                    )
                """)
                conn.commit()
            except Exception as e:
                print(f"Failed to initialize MySQL database: {e}. SQLite will be used.")
        else:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS Customers (
                    accno TEXT PRIMARY KEY,
                    cname TEXT NOT NULL,
                    addr TEXT,
                    phone TEXT,
                    pcard TEXT,
                    acard TEXT,
                    atype TEXT,
                    Balance REAL DEFAULT 0.0
                )
            """)
            conn.commit()
        
        cursor.close()
        conn.close()

    def execute_query(self, query, params=(), is_write=False):
        """Executes a query and returns results or commits changes."""
        conn, is_mysql = self.get_connection()
        cursor = conn.cursor()
        result = None
        error = None
        
        try:
            # For mysql, connector needs %s, for sqlite it needs ?
            if not is_mysql:
                query = query.replace("%s", "?")
            
            cursor.execute(query, params)
            
            if is_write:
                conn.commit()
                result = True
            else:
                columns = [col[0] for col in cursor.description] if cursor.description else []
                rows = cursor.fetchall()
                result = [dict(zip(columns, row)) for row in rows]
        except Exception as e:
            error = str(e)
            print(f"DB Error: {e}")
            if is_write:
                conn.rollback()
        finally:
            cursor.close()
            conn.close()
            
        return result, error

    def get_all_customers(self, search_query="", account_type="All"):
        """Fetches customers with optional filtering and searching."""
        query = "SELECT * FROM Customers WHERE 1=1"
        params = []
        
        if search_query:
            query += " AND (accno LIKE %s OR cname LIKE %s)"
            search_param = f"%{search_query}%"
            params.extend([search_param, search_param])
            
        if account_type and account_type != "All":
            query += " AND atype = %s"
            params.append(account_type)
            
        query += " ORDER BY cname ASC"
        
        results, err = self.execute_query(query, tuple(params))
        return results if results is not None else [], err

    def get_customer(self, accno):
        """Fetches a single customer by account number."""
        query = "SELECT * FROM Customers WHERE accno = %s"
        results, err = self.execute_query(query, (accno,))
        if results and len(results) > 0:
            return results[0], err
        return None, err

    def add_customer(self, accno, cname, addr, phone, pcard, acard, atype, balance):
        """Adds a new customer."""
        query = """
            INSERT INTO Customers (accno, cname, addr, phone, pcard, acard, atype, Balance)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        params = (accno, cname, addr, str(phone), pcard, acard, atype, float(balance))
        _, err = self.execute_query(query, params, is_write=True)
        return err is None, err

    def update_customer(self, accno, cname, addr, phone, pcard, acard, atype, balance):
        """Updates a customer record."""
        query = """
            UPDATE Customers
            SET cname = %s, addr = %s, phone = %s, pcard = %s, acard = %s, atype = %s, Balance = %s
            WHERE accno = %s
        """
        params = (cname, addr, str(phone), pcard, acard, atype, float(balance), accno)
        _, err = self.execute_query(query, params, is_write=True)
        return err is None, err

    def delete_customer(self, accno):
        """Deletes a customer record."""
        query = "DELETE FROM Customers WHERE accno = %s"
        _, err = self.execute_query(query, (accno,), is_write=True)
        return err is None, err

    def get_dashboard_stats(self):
        """Calculates and returns statistics for dashboard rendering."""
        stats = {
            "total_customers": 0,
            "total_balance": 0.0,
            "avg_balance": 0.0,
            "distribution": {},
            "recent_registrations": []
        }
        
        # Get count and balance
        res, _ = self.execute_query("SELECT COUNT(*) as count, SUM(Balance) as total_bal, AVG(Balance) as avg_bal FROM Customers")
        if res and res[0]["count"] > 0:
            stats["total_customers"] = res[0]["count"]
            stats["total_balance"] = res[0]["total_bal"] if res[0]["total_bal"] else 0.0
            stats["avg_balance"] = res[0]["avg_bal"] if res[0]["avg_bal"] else 0.0
            
        # Get account type distribution
        dist, _ = self.execute_query("SELECT atype, COUNT(*) as count FROM Customers GROUP BY atype")
        if dist:
            for d in dist:
                if d["atype"]:
                    stats["distribution"][d["atype"]] = d["count"]
                    
        # Get 5 recent customers
        # For sqlite we use ROWID, for mysql we can rely on standard select (we'll just select all sorted by name if no timestamp, or let's select 5)
        conn, is_mysql = self.get_connection()
        if is_mysql:
            # MySQL fallback: sorted by accno desc since it's VARCHAR but holds numeric IDs in many setups
            recent_query = "SELECT * FROM Customers ORDER BY accno DESC LIMIT 5"
        else:
            recent_query = "SELECT * FROM Customers ORDER BY rowid DESC LIMIT 5"
        conn.close()
        
        recent, _ = self.execute_query(recent_query)
        if recent:
            stats["recent_registrations"] = recent
            
        return stats

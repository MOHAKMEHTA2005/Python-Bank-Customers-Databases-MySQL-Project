from flask import Flask, render_template, jsonify, request
from db_manager import DBManager, save_db_config, get_db_config
import mysql.connector

app = Flask(__name__)
db_manager = DBManager()

@app.route('/')
def index():
    """Serves the main application SPA dashboard."""
    return render_template('index.html')

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Returns calculated dashboard statistics."""
    try:
        # Re-initialize DB to make sure we reflect any recent configuration changes
        stats = db_manager.get_dashboard_stats()
        return jsonify({
            "status": "success",
            "stats": stats
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Failed to retrieve dashboard stats: {str(e)}"
        }), 500

@app.route('/api/customers', methods=['GET'])
def get_customers():
    """Retrieves all customers with optional searching and type filtering."""
    search_query = request.args.get('search', '')
    account_type = request.args.get('type', 'All')
    
    customers, err = db_manager.get_all_customers(search_query, account_type)
    
    if err:
        return jsonify({
            "status": "error",
            "message": f"Database error: {err}"
        }), 500
        
    return jsonify({
        "status": "success",
        "customers": customers
    })

@app.route('/api/customers/<accno>', methods=['GET'])
def get_customer(accno):
    """Retrieves a single customer by account number."""
    customer, err = db_manager.get_customer(accno)
    
    if err:
        return jsonify({
            "status": "error",
            "message": f"Database error: {err}"
        }), 500
        
    if not customer:
        return jsonify({
            "status": "error",
            "message": f"Account {accno} not found"
        }), 404
        
    return jsonify({
        "status": "success",
        "customer": customer
    })

@app.route('/api/customers', methods=['POST'])
def create_customer():
    """Creates a new customer record."""
    data = request.json
    if not data:
        return jsonify({"status": "error", "message": "No data provided"}), 400
        
    required_fields = ['accno', 'cname', 'addr', 'phone', 'pcard', 'acard', 'atype', 'balance']
    for field in required_fields:
        if field not in data or str(data[field]).strip() == '':
            return jsonify({"status": "error", "message": f"Field '{field}' is required"}), 400
            
    accno = str(data['accno']).strip()
    
    # Check if account number already exists
    existing, _ = db_manager.get_customer(accno)
    if existing:
        return jsonify({"status": "error", "message": f"Account Number '{accno}' already exists!"}), 409
        
    success, err = db_manager.add_customer(
        accno=accno,
        cname=data['cname'].strip(),
        addr=data['addr'].strip(),
        phone=data['phone'],
        pcard=data['pcard'].strip().upper(),
        acard=data['acard'].strip(),
        atype=data['atype'],
        balance=data['balance']
    )
    
    if not success:
        return jsonify({"status": "error", "message": f"Could not create account: {err}"}), 500
        
    return jsonify({
        "status": "success",
        "message": "Customer record created successfully"
    }), 201

@app.route('/api/customers/<accno>', methods=['PUT'])
def update_customer(accno):
    """Updates an existing customer record."""
    data = request.json
    if not data:
        return jsonify({"status": "error", "message": "No data provided"}), 400
        
    existing, _ = db_manager.get_customer(accno)
    if not existing:
        return jsonify({"status": "error", "message": f"Customer record not found for account {accno}"}), 404
        
    required_fields = ['cname', 'addr', 'phone', 'pcard', 'acard', 'atype', 'balance']
    for field in required_fields:
        if field not in data or str(data[field]).strip() == '':
            return jsonify({"status": "error", "message": f"Field '{field}' is required"}), 400
            
    success, err = db_manager.update_customer(
        accno=accno,
        cname=data['cname'].strip(),
        addr=data['addr'].strip(),
        phone=data['phone'],
        pcard=data['pcard'].strip().upper(),
        acard=data['acard'].strip(),
        atype=data['atype'],
        balance=data['balance']
    )
    
    if not success:
        return jsonify({"status": "error", "message": f"Could not update customer: {err}"}), 500
        
    return jsonify({
        "status": "success",
        "message": "Customer record updated successfully"
    })

@app.route('/api/customers/<accno>', methods=['DELETE'])
def delete_customer(accno):
    """Deletes a customer record from database."""
    existing, _ = db_manager.get_customer(accno)
    if not existing:
        return jsonify({"status": "error", "message": f"Customer record not found for account {accno}"}), 404
        
    success, err = db_manager.delete_customer(accno)
    if not success:
        return jsonify({"status": "error", "message": f"Could not delete customer: {err}"}), 500
        
    return jsonify({
        "status": "success",
        "message": "Customer record deleted successfully"
    })

@app.route('/api/config', methods=['GET'])
def get_config():
    """Retrieves the active database configuration and checking state."""
    config = get_db_config()
    
    # Hide password from response for safety
    safe_config = config.copy()
    if 'passwd' in safe_config:
        safe_config['passwd'] = '••••••••' if safe_config['passwd'] else ''
        
    # Check current connection state
    conn, is_mysql = db_manager.get_connection()
    active_type = "mysql" if is_mysql else "sqlite"
    conn.close()
    
    return jsonify({
        "status": "success",
        "config": safe_config,
        "active_type": active_type
    })

@app.route('/api/config', methods=['POST'])
def update_config():
    """Updates database configuration and initializes connection."""
    data = request.json
    if not data or 'type' not in data:
        return jsonify({"status": "error", "message": "Invalid configuration data"}), 400
        
    new_config = {
        "type": data['type'],
        "host": data.get('host', 'localhost'),
        "user": data.get('user', 'root'),
        "passwd": data.get('passwd', ''),
        "database": data.get('database', 'Bank_Customers_Database')
    }
    
    # If password is our masked indicator, keep the old password
    if new_config['passwd'] == '••••••••':
        old_config = get_db_config()
        new_config['passwd'] = old_config.get('passwd', '')
        
    save_db_config(new_config)
    
    global db_manager
    try:
        # Reinitialize db manager with new config
        db_manager = DBManager()
        
        # Test connection
        conn, is_mysql = db_manager.get_connection()
        conn.close()
        
        if new_config['type'] == 'mysql' and not is_mysql:
            return jsonify({
                "status": "warning",
                "message": "Configuration saved, but MySQL connection failed. Reverted to SQLite fallback."
            })
            
        return jsonify({
            "status": "success",
            "message": f"Database configuration updated to {new_config['type'].upper()} successfully."
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Failed to apply database configuration: {str(e)}"
        }), 500

@app.route('/api/config/test', methods=['POST'])
def test_config():
    """Dry-run tests MySQL settings before committing changes."""
    data = request.json
    if not data:
        return jsonify({"status": "error", "message": "No data provided"}), 400
        
    db_type = data.get('type', 'sqlite')
    if db_type == 'sqlite':
        return jsonify({"status": "success", "message": "SQLite is ready out-of-the-box (no connection test needed)."}), 200
        
    host = data.get('host', 'localhost')
    user = data.get('user', 'root')
    passwd = data.get('passwd', '')
    database = data.get('database', 'Bank_Customers_Database')
    
    if passwd == '••••••••':
        old_config = get_db_config()
        passwd = old_config.get('passwd', '')
        
    try:
        # First try to connect without database to see if server is online
        conn = mysql.connector.connect(
            host=host,
            user=user,
            password=passwd,
            connect_timeout=3
        )
        conn.close()
        
        # Then try with database (or check if it exists)
        try:
            conn2 = mysql.connector.connect(
                host=host,
                user=user,
                password=passwd,
                database=database,
                connect_timeout=3
            )
            conn2.close()
            return jsonify({
                "status": "success",
                "message": f"Connected successfully to MySQL server and database '{database}'!"
            })
        except mysql.connector.Error as db_err:
            if db_err.errno == 1049: # Unknown database
                return jsonify({
                    "status": "success",
                    "message": f"Connected to MySQL server! Database '{database}' does not exist yet, but it will be automatically created upon saving."
                })
            else:
                return jsonify({
                    "status": "error",
                    "message": f"Connected to server, but database error occurred: {db_err.msg}"
                })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Failed to connect to MySQL server: {str(e)}"
        })

if __name__ == '__main__':
    # Start server
    app.run(debug=True, host='0.0.0.0', port=5000)

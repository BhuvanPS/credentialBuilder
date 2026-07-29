import os
import sqlite3
import json
from typing import List, Dict, Any, Optional

# Read SQL Connection String from env
SQL_CONNECTION_STRING = os.getenv("SQL_CONNECTION_STRING", "")
USE_SQL_SERVER = bool(SQL_CONNECTION_STRING)

# ─── Module-level persistent connection (established once at startup) ────────
_connection = None


def _build_sql_connection():
    """Create a new pyodbc connection using an Azure access token."""
    import pyodbc
    import struct
    from azure.identity import DefaultAzureCredential

    print("[DATABASE] Attempting to connect to SQL Server/Fabric via pyodbc using Azure access token...")
    print("[DATABASE] Fetching Entra ID token using DefaultAzureCredential...")
    credential = DefaultAzureCredential()
    token_obj = credential.get_token("https://database.windows.net/.default")

    token_bytes = token_obj.token.encode("utf-16-le")
    token_struct = struct.pack(f"<I{len(token_bytes)}s", len(token_bytes), token_bytes)

    conn_parts = [p for p in SQL_CONNECTION_STRING.split(";") if not p.lower().startswith("authentication=")]
    clean_conn_str = ";".join(conn_parts)

    print("[DATABASE] Token obtained. Establishing connection...")
    conn = pyodbc.connect(
        clean_conn_str,
        attrs_before={1256: token_struct},
        autocommit=True
    )
    print("[DATABASE] Connection established successfully.")
    return conn


def get_connection():
    """
    Return the shared persistent connection.
    Reconnects automatically if the connection has been dropped.
    """
    global _connection

    if USE_SQL_SERVER:
        try:
            # Quick liveness check — runs a no-op to confirm the connection is alive
            if _connection is not None:
                _connection.cursor().execute("SELECT 1")
                return _connection
        except Exception:
            print("[DATABASE] Connection lost — reconnecting...")
            _connection = None

        try:
            _connection = _build_sql_connection()
            return _connection
        except Exception as e:
            print(f"[DATABASE CONNECTION ERROR]: {str(e)}")
            print("[DATABASE] Suggestion: Run 'az login' in your terminal to refresh credentials.")
            raise e
    else:
        # SQLite: create a new connection per call (SQLite connections are not thread-safe to share)
        db_path = os.path.join(os.path.dirname(__file__), "candidates.db")
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        return conn


def init_db():
    print("[DATABASE] Initializing database schema...")
    try:
        conn = get_connection()
        cursor = conn.cursor()

        if USE_SQL_SERVER:
            print("[DATABASE] Verifying tables in Fabric SQL...")
            cursor.execute("SELECT 1 FROM sys.tables WHERE name = 'candidates'")
            exists = cursor.fetchone()
            if not exists:
                print("[DATABASE] Creating 'candidates' table in Fabric SQL...")
                sql_server_ddl = """
                CREATE TABLE candidates (
                    name NVARCHAR(200) PRIMARY KEY,
                    title NVARCHAR(200) NOT NULL,
                    profile_picture_url NVARCHAR(MAX) NULL,
                    form_data NVARCHAR(MAX) NOT NULL,
                    summary_data NVARCHAR(MAX) NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
                """
                cursor.execute(sql_server_ddl)
                print("[DATABASE] 'candidates' table created successfully.")
            else:
                print("[DATABASE] 'candidates' table already exists in Fabric SQL.")
        else:
            print("[DATABASE] Verifying tables in SQLite...")
            ddl = """
            CREATE TABLE IF NOT EXISTS candidates (
                name VARCHAR(200) PRIMARY KEY,
                title VARCHAR(200) NOT NULL,
                profile_picture_url TEXT NULL,
                form_data TEXT NOT NULL,
                summary_data TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """
            cursor.execute(ddl)
            conn.commit()
            print("[DATABASE] SQLite candidates table verified.")

        cursor.close()
        if not USE_SQL_SERVER:
            conn.close()
        print("[DATABASE] Database initialization completed successfully.")
    except Exception as e:
        print(f"[DATABASE INIT ERROR]: {str(e)}")
        raise e


def save_candidate(name: str, title: str, profile_picture_url: Optional[str], form_data: Dict[str, Any], summary_data: Dict[str, Any]):
    conn = get_connection()
    cursor = conn.cursor()

    form_data_str = json.dumps(form_data)
    summary_data_str = json.dumps(summary_data)

    if USE_SQL_SERVER:
        cursor.execute("SELECT 1 FROM candidates WHERE name = ?", (name,))
        exists = cursor.fetchone()
        if exists:
            sql = """
            UPDATE candidates 
            SET title = ?, profile_picture_url = ?, form_data = ?, summary_data = ? 
            WHERE name = ?
            """
            cursor.execute(sql, (title, profile_picture_url, form_data_str, summary_data_str, name))
        else:
            sql = """
            INSERT INTO candidates (name, title, profile_picture_url, form_data, summary_data) 
            VALUES (?, ?, ?, ?, ?)
            """
            cursor.execute(sql, (name, title, profile_picture_url, form_data_str, summary_data_str))
    else:
        sql = """
        INSERT INTO candidates (name, title, profile_picture_url, form_data, summary_data)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(name) DO UPDATE SET
            title=excluded.title,
            profile_picture_url=excluded.profile_picture_url,
            form_data=excluded.form_data,
            summary_data=excluded.summary_data
        """
        cursor.execute(sql, (name, title, profile_picture_url, form_data_str, summary_data_str))
        conn.commit()

    cursor.close()
    if not USE_SQL_SERVER:
        conn.close()


def list_candidates() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()

    sql = "SELECT name, title, profile_picture_url, created_at FROM candidates ORDER BY created_at DESC"
    cursor.execute(sql)
    rows = cursor.fetchall()

    candidates_list = []
    for row in rows:
        if USE_SQL_SERVER:
            candidates_list.append({
                "name": row[0],
                "title": row[1],
                "profile_picture_url": row[2],
                "created_at": str(row[3])
            })
        else:
            candidates_list.append({
                "name": row["name"],
                "title": row["title"],
                "profile_picture_url": row["profile_picture_url"],
                "created_at": str(row["created_at"])
            })

    cursor.close()
    if not USE_SQL_SERVER:
        conn.close()
    return candidates_list


def get_candidate(name: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()

    sql = "SELECT name, title, profile_picture_url, form_data, summary_data, created_at FROM candidates WHERE name = ?"
    cursor.execute(sql, (name,))
    row = cursor.fetchone()

    cursor.close()
    if not USE_SQL_SERVER:
        conn.close()

    if not row:
        return None

    if USE_SQL_SERVER:
        return {
            "name": row[0],
            "title": row[1],
            "profile_picture_url": row[2],
            "form_data": json.loads(row[3]),
            "summary_data": json.loads(row[4]),
            "created_at": str(row[5])
        }
    else:
        return {
            "name": row["name"],
            "title": row["title"],
            "profile_picture_url": row["profile_picture_url"],
            "form_data": json.loads(row["form_data"]),
            "summary_data": json.loads(row["summary_data"]),
            "created_at": str(row["created_at"])
        }


def delete_candidate(name: str):
    conn = get_connection()
    cursor = conn.cursor()

    sql = "DELETE FROM candidates WHERE name = ?"
    cursor.execute(sql, (name,))
    if not USE_SQL_SERVER:
        conn.commit()

    cursor.close()
    if not USE_SQL_SERVER:
        conn.close()

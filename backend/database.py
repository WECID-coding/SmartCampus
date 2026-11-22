"""
Database schema, connection manager, and seed records for SmartCampus.
Uses SQLite with thread safety and dictionary row factory.
"""
import sqlite3
import hashlib
import os
import shutil
import tempfile
from pathlib import Path

IS_VERCEL = bool(os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"))

if IS_VERCEL:
    TMP_DIR = Path(tempfile.gettempdir())
    DB_FILE = TMP_DIR / "smartcampus.db"
    ORIGINAL_DB = Path(__file__).parent / "smartcampus.db"
    if not DB_FILE.exists() and ORIGINAL_DB.exists():
        try:
            shutil.copy2(ORIGINAL_DB, DB_FILE)
        except Exception:
            pass
else:
    DB_FILE = Path(__file__).parent / "smartcampus.db"

def get_db():
    conn = sqlite3.connect(DB_FILE, timeout=30.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    # High-concurrency performance tuning (for 4,000+ users)
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA synchronous = NORMAL;")
    conn.execute("PRAGMA busy_timeout = 10000;")
    conn.execute("PRAGMA cache_size = -64000;")
    conn.execute("PRAGMA temp_store = MEMORY;")
    return conn

def hash_password(password: str) -> str:
    """Hash password with SHA-256 for demo simplicity."""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def init_db():
    conn = get_db()
    cur = conn.cursor()

    # Users Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'student',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Reports Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        category_label TEXT,
        location TEXT NOT NULL,
        location_key TEXT,
        item_date TEXT,
        time TEXT,
        description TEXT,
        image_url TEXT,
        status TEXT DEFAULT 'active',
        admin_approved INTEGER DEFAULT 1,
        reporter_email TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Claims Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS claims (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_id INTEGER NOT NULL,
        lost_where_when TEXT NOT NULL,
        proof TEXT NOT NULL,
        contact TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        claimant_email TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(report_id) REFERENCES reports(id)
    )
    """)

    # Notifications Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        time TEXT DEFAULT 'Just now',
        unread INTEGER DEFAULT 0,
        type TEXT DEFAULT 'system',
        report_id INTEGER,
        recipient_email TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Active Auth Sessions Table (supports session persistence across restarts/workers)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )
    """)

    # High-Performance Indexes for 4,000+ Users
    cur.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_reports_type_status ON reports(type, status);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_reports_location_key ON reports(location_key);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_reports_id_desc ON reports(id DESC);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_claims_report_id ON claims(report_id);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_notifs_recipient ON notifications(recipient_email);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_notifs_unread ON notifications(unread);")

    conn.commit()

    # Seed Default Users if empty
    cur.execute("SELECT COUNT(*) FROM users")
    if cur.fetchone()[0] == 0:
        default_users = [
            ("System Administrator", "admin@mitsgwl.ac.in", hash_password("admin123"), "admin"),
            ("Priya Sharma", "priya.sharma@mitsgwl.ac.in", hash_password("mits2026pass"), "student"),
            ("Dr. R. Gupta", "r.gupta@mitsgwalior.in", hash_password("mits2026pass"), "faculty")
        ]
        cur.executemany(
            "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
            default_users
        )
        conn.commit()

    # Seed Default Reports if empty
    cur.execute("SELECT COUNT(*) FROM reports")
    if cur.fetchone()[0] == 0:
        default_reports = [
            (
                "lost",
                "Black Leather Wallet",
                "accessories",
                "Accessories",
                "Student Activity Center J114",
                "room_J114",
                "2026-10-06",
                "2h ago",
                "Black leather trifold wallet with silver MITS RFID card and student bus pass inside.",
                None,
                "active",
                1,
                "priya.sharma@mitsgwl.ac.in"
            ),
            (
                "found",
                "Titan Digital Smart Watch",
                "accessories",
                "Accessories",
                "J001 – Conclave Centre",
                "room_J001",
                "2026-10-06",
                "4h ago",
                "Dark silicone strap, rectangular AMOLED screen. Handed over to seminar stage desk.",
                None,
                "active",
                1,
                "r.gupta@mitsgwalior.in"
            ),
            (
                "lost",
                "MITS Student ID Card",
                "documents",
                "Documents & IDs",
                "IQAC Office (Main Building GF)",
                "room_IQAC",
                "2026-10-05",
                "Yesterday",
                "Blue lanyard with college identity card. Enrollment ending with ...042.",
                None,
                "active",
                1,
                "priya.sharma@mitsgwl.ac.in"
            ),
            (
                "found",
                "OnePlus Buds Z2 Case",
                "electronics",
                "Electronics",
                "SH-12 (Main Building GF)",
                "room_SH12",
                "2026-10-05",
                "Yesterday",
                "Glossy white charging case with earbuds inside. Left on second row desk.",
                None,
                "active",
                1,
                "r.gupta@mitsgwalior.in"
            ),
            (
                "lost",
                "Room Key Bundle with ID Tag",
                "keys",
                "Keys",
                "Classroom 115 J118 (Main Building FF)",
                "room_J118",
                "2026-10-04",
                "2d ago",
                "Three brass keys with a blue engraved plastic tag labeled 'J118-Desk'.",
                None,
                "active",
                1,
                "priya.sharma@mitsgwl.ac.in"
            ),
            (
                "found",
                "Stainless Steel Flask (Milton)",
                "accessories",
                "Accessories",
                "LT-1 (Lecture Theatre 1)",
                "room_LT1",
                "2026-10-04",
                "2d ago",
                "Matte silver finish, 750ml capacity with a small Batman decal near the cap.",
                None,
                "active",
                1,
                "admin@mitsgwl.ac.in"
            ),
            (
                "found",
                "Casio Scientific Calculator fx-991EX",
                "education",
                "Academic & Books",
                "Cloud Computing Lab J140",
                "room_J140",
                "2026-10-07",
                "Today",
                "Black solar scientific calculator with a name sticker partially scratched on back.",
                None,
                "active",
                1,
                "r.gupta@mitsgwalior.in"
            ),
            (
                "lost",
                "Dell Type-C 65W Laptop Charger",
                "electronics",
                "Electronics",
                "M007 – CIoT Lab (AI Building GF)",
                "room_AI_GF_M007",
                "2026-10-07",
                "Today",
                "Original black Dell adapter with circular LED on connector pin.",
                None,
                "active",
                1,
                "priya.sharma@mitsgwl.ac.in"
            ),
            (
                "lost",
                "Spiral Notebook & Drafter Pen",
                "education",
                "Academic & Books",
                "Classroom 113A J115 (Main Building FF)",
                "room_J115",
                "2026-10-08",
                "1h ago",
                "Black cover classmate spiral notebook with Computer Networks notes left on 3rd row desk.",
                None,
                "active",
                1,
                "priya.sharma@mitsgwl.ac.in"
            )
        ]
        cur.executemany("""
            INSERT INTO reports (
                type, name, category, category_label, location, location_key,
                item_date, time, description, image_url, status, admin_approved, reporter_email
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, default_reports)
        conn.commit()

    # Seed Default Notifications if empty
    cur.execute("SELECT COUNT(*) FROM notifications")
    if cur.fetchone()[0] == 0:
        default_notifs = [
            ("New Ownership Claim Submitted", "A student has submitted an ownership check for 'Wireless headphones' found near Canteen.", "10m ago", 0, "claim", 4, None),
            ("Possible Match Detected", "A found report matching your lost 'Black leather wallet' was reported at Central Library.", "2h ago", 0, "match", 1, None),
            ("Verification Approved", "Campus Security verified the handover for 'Student ID card'. Report status updated to Reunited.", "Yesterday", 0, "verified", 3, None),
            ("Welcome to SmartCampus", "Your MITS institute account is active. Report lost items or submit found articles easily.", "3d ago", 0, "system", None, None)
        ]
        cur.executemany("""
            INSERT INTO notifications (
                title, message, time, unread, type, report_id, recipient_email
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, default_notifs)
        conn.commit()

    # Seed Default Claims if empty
    cur.execute("SELECT COUNT(*) FROM claims")
    if cur.fetchone()[0] == 0:
        default_claims = [
            (
                1,
                "CIoT Lab M007 around 1:30 PM",
                'Has "GitHub Octocat" sticker on top left lid and dual-boot GRUB loader with roll number lock.',
                "0901CS221045",
                "pending",
                "0901CS221045 · CS Dept"
            ),
            (
                2,
                "Classroom J115 after lecture",
                "Black leather strap with slight scuff on the 4 o'clock rim mark. Engraved initials 'AJ'.",
                "0901IT231012",
                "pending",
                "0901IT231012 · IT Dept"
            )
        ]
        cur.executemany("""
            INSERT INTO claims (
                report_id, lost_where_when, proof, contact, status, claimant_email
            ) VALUES (?, ?, ?, ?, ?, ?)
        """, default_claims)
        conn.commit()

    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully at", DB_FILE)

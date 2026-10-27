import sys
import os
from pathlib import Path

# Add backend directory to sys.path so backend modules can be imported
CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parent
BACKEND_DIR = PROJECT_ROOT / "backend"

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Import the core FastAPI application
from main import app

"""
IGNIS — Autonomous Launch Script
NASA Space Apps Challenge 2026: Flame in Freefall

Starts the high-performance Python FastAPI backend, mounts the interactive scientific
data network frontend, and opens the application in your default browser.
Includes automatic port collision detection & resolution.
"""

import sys
import os
import socket
import webbrowser
import threading
import time
import urllib.request

try:
    import uvicorn
    from backend.app import app
except ImportError as e:
    print(f"Error loading IGNIS backend dependencies: {e}")
    print("Please install requirements: pip install fastapi uvicorn numpy scipy pandas")
    sys.exit(1)

def find_available_port(start_port=8000, max_attempts=20):
    """Finds the first available TCP port starting from start_port."""
    for port in range(start_port, start_port + max_attempts):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(('127.0.0.1', port))
                return port
            except OSError:
                continue
    return start_port

def is_ignis_already_running(port=8000):
    """Checks if another instance of IGNIS is already serving on the port."""
    try:
        url = f"http://127.0.0.1:{port}/api/health"
        req = urllib.request.Request(url, headers={'User-Agent': 'IGNIS-Launcher'})
        with urllib.request.urlopen(req, timeout=1.0) as response:
            return response.status == 200
    except Exception:
        return False

def open_browser(port):
    """Wait for server initialization and launch browser."""
    time.sleep(1.2)
    url = f"http://127.0.0.1:{port}/IGNIS-Network/index.html"
    print(f"\n=======================================================")
    print(f"  IGNIS — Interactive Scientific Data Network (v2.0)   ")
    print(f"  NASA Space Apps Challenge 2026: Flame in Freefall    ")
    print(f"  Python Scientific Analytics Backend: ACTIVE          ")
    print(f"  URL: {url}                                           ")
    print(f"=======================================================\n")
    try:
        webbrowser.open(url)
    except Exception:
        pass

if __name__ == "__main__":
    # Ensure datasets exist
    datasets_dir = os.path.join(os.path.dirname(__file__), "backend", "datasets")
    if not os.path.exists(os.path.join(datasets_dir, "flex_iss_droplet.csv")):
        from backend.generate_datasets import (
            generate_flex_dataset,
            generate_drop_tower_dataset,
            generate_acme_dataset,
            generate_ntrs_index
        )
        generate_flex_dataset()
        generate_drop_tower_dataset()
        generate_acme_dataset()
        generate_ntrs_index()

    # Check if an instance is already running
    if is_ignis_already_running(8000):
        print("✓ An instance of IGNIS is already active on port 8000.")
        print("Opening your browser to the running instance...")
        webbrowser.open("http://127.0.0.1:8000/IGNIS-Network/index.html")
        sys.exit(0)

    # Find open port (defaults to 8000, fallback to 8001+ if in use)
    selected_port = find_available_port(8000)

    threading.Thread(target=open_browser, args=(selected_port,), daemon=True).start()
    uvicorn.run("backend.app:app", host="127.0.0.1", port=selected_port, log_level="info")

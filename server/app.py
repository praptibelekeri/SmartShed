from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import os

app = Flask(__name__)
CORS(app)

# 🔥 ABSOLUTE PATHS (WINDOWS SAFE)
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
SCHEDULER_EXE = os.path.join(BACKEND_DIR, "vm_scheduler.exe")
INPUT_FILE = os.path.join(BACKEND_DIR, "input.txt")
OUTPUT_FILE = os.path.join(BACKEND_DIR, "output.txt")

@app.route("/run", methods=["POST"])
def run_scheduler():
    try:
        data = request.json

        # Debug print (VERY IMPORTANT)
        print("BASE_DIR:", BASE_DIR)
        print("BACKEND_DIR:", BACKEND_DIR)
        print("SCHEDULER_EXE:", SCHEDULER_EXE)

        # 1. Write input.txt
        with open(INPUT_FILE, "w") as f:
            f.write(str(len(data)) + "\n")
            for p in data:
                f.write(
                    f"{p['pid']} {p['burst']} {p['priority']} "
                    f"{p['frames']} {len(p['refs'])} "
                )
                f.write(" ".join(map(str, p["refs"])) + "\n")

        # 2. Run scheduler.exe (ABSOLUTE PATH)
        subprocess.run(
            [SCHEDULER_EXE],
            cwd=BACKEND_DIR,
            check=True
        )

        # 3. Read output.txt
        with open(OUTPUT_FILE, "r") as f:
            output = f.read()

        return jsonify({
            "success": True,
            "output": output
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


if __name__ == "__main__":
    app.run(port=5000, debug=True)

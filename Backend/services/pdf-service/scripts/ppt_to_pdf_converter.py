#!/usr/bin/env python3
import json
import os
import shutil
import subprocess
import sys
import tempfile


def main():
    if len(sys.argv) < 3:
        print(json.dumps({
            "success": False,
            "error": "Usage: ppt_to_pdf_converter.py <input.pptx> <output.pdf>"
        }))
        return 1

    input_path = os.path.abspath(sys.argv[1])
    output_path = os.path.abspath(sys.argv[2])

    if not os.path.isfile(input_path):
        print(json.dumps({"success": False, "error": f"Input file not found: {input_path}"}))
        return 1

    soffice = shutil.which("soffice") or shutil.which("libreoffice")
    if not soffice:
        print(json.dumps({"success": False, "error": "LibreOffice (soffice) not found in PATH"}))
        return 1

    tmp_dir = tempfile.mkdtemp(prefix="ppt2pdf_")
    try:
        cmd = [
            soffice,
            "--headless",
            "--nologo",
            "--nolockcheck",
            "--nodefault",
            "--norestore",
            "--invisible",
            "--convert-to", "pdf",
            "--outdir", tmp_dir,
            input_path
        ]

        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=300)

        base_name = os.path.splitext(os.path.basename(input_path))[0]
        produced_pdf = os.path.join(tmp_dir, base_name + ".pdf")

        if proc.returncode != 0 or not os.path.exists(produced_pdf):
            print(json.dumps({
                "success": False,
                "error": "LibreOffice conversion failed",
                "stdout": proc.stdout[-1000:],
                "stderr": proc.stderr[-1000:]
            }))
            return 1

        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        shutil.move(produced_pdf, output_path)
        size = os.path.getsize(output_path) if os.path.exists(output_path) else 0
        print(json.dumps({"success": True, "output": output_path, "fileSize": size}))
        return 0
    except subprocess.TimeoutExpired:
        print(json.dumps({"success": False, "error": "LibreOffice conversion timed out"}))
        return 1
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        return 1
    finally:
        try:
            shutil.rmtree(tmp_dir)
        except Exception:
            pass


if __name__ == "__main__":
    sys.exit(main())




import os
import sys

def try_win32com(file_path):
    try:
        import win32com.client
        word = win32com.client.Dispatch("Word.Application")
        word.Visible = False
        doc = word.Documents.Open(file_path)
        text = doc.Content.Text
        doc.Close()
        word.Quit()
        return text
    except Exception as e:
        return f"win32com error: {e}"

def main():
    file_path = os.path.abspath("MAU THUYET MINH 2026 - Nghệ An.doc")
    # Set console encoding to UTF-8
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    print("Reading file...")
    text = try_win32com(file_path)
    if not text.startswith("win32com error:"):
        print("Success using win32com")
        with open("extracted_doc_text.txt", "w", encoding="utf-8") as f:
            f.write(text)
    else:
        print(text)
        # Try raw strings extraction as fallback
        try:
            with open(file_path, "rb") as f:
                data = f.read()
            import re
            words = re.findall(rb'[\x20-\x7E\x80-\xFF]{4,}', data)
            text = "\n".join(w.decode('utf-8', errors='ignore') for w in words)
            print("Fallback strings extraction")
            with open("extracted_doc_text.txt", "w", encoding="utf-8") as f:
                f.write(text)
        except Exception as e2:
            print(f"Fallback error: {e2}")

if __name__ == "__main__":
    main()


import os
import sys
import win32com.client

def main():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    template_path = os.path.abspath("MAU THUYET MINH 2026 - Nghệ An.doc")
    word = win32com.client.Dispatch("Word.Application")
    word.Visible = False
    doc = word.Documents.Open(template_path)
    
    print("--- PARAGRAPHS 15 TO 70 ---")
    for i in range(15, min(75, len(doc.Paragraphs))):
        text = doc.Paragraphs[i].Range.Text
        print(f"Index {i}: {repr(text)}")
            
    doc.Close()
    word.Quit()

if __name__ == "__main__":
    main()



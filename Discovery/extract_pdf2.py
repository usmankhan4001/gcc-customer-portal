import subprocess
subprocess.run(["pip", "install", "pdfplumber"], capture_output=True)

import pdfplumber

with pdfplumber.open(r"D:\GCC Startup\Customer Portal\GCCStartup_Discovery_Questionnaire_Completed.pdf") as pdf:
    text = ""
    for page in pdf.pages:
        extracted = page.extract_text()
        if extracted:
            text += extracted + "\n\n--- PAGE BREAK ---\n\n"

with open(r"D:\GCC Startup\Customer Portal\Discovery\completed_answers.md", "w", encoding="utf-8") as f:
    f.write(text)

print(f"Extracted {len(text)} characters from {len(pdf.pages)} pages")
print("First 3000 chars:")
print(text[:3000])

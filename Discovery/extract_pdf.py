try:
    import PyPDF2
    reader = PyPDF2.PdfReader(r"D:\GCC Startup\Customer Portal\GCCStartup_Discovery_Questionnaire_Completed.pdf")
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n\n"
    with open(r"D:\GCC Startup\Customer Portal\Discovery\completed_answers.txt", "w", encoding="utf-8") as f:
        f.write(text)
    print("Extracted with PyPDF2")
except ImportError:
    try:
        import pdfplumber
        with pdfplumber.open(r"D:\GCC Startup\Customer Portal\GCCStartup_Discovery_Questionnaire_Completed.pdf") as pdf:
            text = "\n\n".join(page.extract_text() or "" for page in pdf.pages)
        with open(r"D:\GCC Startup\Customer Portal\Discovery\completed_answers.txt", "w", encoding="utf-8") as f:
            f.write(text)
        print("Extracted with pdfplumber")
    except ImportError:
        print("No PDF library found. Installing PyPDF2...")
        import subprocess
        subprocess.run(["pip", "install", "PyPDF2"], capture_output=True)
        import PyPDF2
        reader = PyPDF2.PdfReader(r"D:\GCC Startup\Customer Portal\GCCStartup_Discovery_Questionnaire_Completed.pdf")
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n\n"
        with open(r"D:\GCC Startup\Customer Portal\Discovery\completed_answers.txt", "w", encoding="utf-8") as f:
            f.write(text)
        print("Extracted with PyPDF2 (installed)")

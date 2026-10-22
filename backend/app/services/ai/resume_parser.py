import os
import re
import fitz  # PyMuPDF
from docx import Document

class ResumeParser:
    @staticmethod
    def extract_text(file_path: str, file_type: str) -> str:
        """
        Extracts raw text from PDF or DOCX file safely.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Resume file not found at {file_path}")

        ext = file_type.lower().strip().replace(".", "")
        if ext == "pdf":
            return ResumeParser._extract_pdf(file_path)
        elif ext in ["docx", "doc"]:
            return ResumeParser._extract_docx(file_path)
        else:
            raise ValueError(f"Unsupported file format: {file_type}. Only PDF and DOCX are supported.")

    @staticmethod
    def _extract_pdf(file_path: str) -> str:
        text_parts = []
        try:
            doc = fitz.open(file_path)
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                page_text = page.get_text("text")
                if page_text:
                    text_parts.append(page_text)
            doc.close()
        except Exception as e:
            raise ValueError(f"Failed to extract text from PDF: {str(e)}")

        raw_text = "\n".join(text_parts).strip()
        if not raw_text:
            raise ValueError("The uploaded PDF does not contain extractable text (it might be scanned/image-only).")
        return ResumeParser.sanitize_text(raw_text)

    @staticmethod
    def _extract_docx(file_path: str) -> str:
        text_parts = []
        try:
            doc = Document(file_path)
            for para in doc.paragraphs:
                if para.text.strip():
                    text_parts.append(para.text.strip())
            for table in doc.tables:
                for row in table.rows:
                    row_cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                    if row_cells:
                        text_parts.append(" | ".join(row_cells))
        except Exception as e:
            raise ValueError(f"Failed to extract text from DOCX: {str(e)}")

        raw_text = "\n".join(text_parts).strip()
        if not raw_text:
            raise ValueError("The uploaded DOCX does not contain readable text.")
        return ResumeParser.sanitize_text(raw_text)

    @staticmethod
    def sanitize_text(text: str) -> str:
        """
        Normalizes unicode, removes null bytes, excessive whitespace, and basic injection attempts.
        """
        # Remove null bytes
        text = text.replace("\x00", "")
        # Normalize whitespace
        text = re.sub(r'[ \t]+', ' ', text)
        text = re.sub(r'\n{3,}', '\n\n', text)
        
        # Guard against prompt injection delimiters: remove pseudo system override tokens
        text = re.sub(r'(?i)(ignore previous instructions|disregard earlier instructions|system:\s*you are now)', '[filtered_instruction]', text)
        
        return text.strip()

resume_parser = ResumeParser()

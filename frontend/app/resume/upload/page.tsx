"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../services/api";
import { Resume } from "../../../types";

export default function ResumeUploadPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [resumes, setResumes] = useState<Resume[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isAuthenticated) {
      loadResumes();
    }
  }, [authLoading, isAuthenticated]);

  const loadResumes = async () => {
    try {
      const data = await api.getUserResumes();
      setResumes(data);
    } catch (err) {
      console.error("Failed to load resumes:", err);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    setError(null);
    const validExtensions = ["pdf", "docx", "doc"];
    const ext = selectedFile.name.split(".").pop()?.toLowerCase() || "";

    if (!validExtensions.includes(ext)) {
      setError("Please select a valid PDF or DOCX resume document.");
      return;
    }

    if (selectedFile.size > 15 * 1024 * 1024) {
      setError("File exceeds maximum allowed size of 15MB.");
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);
      setError(null);
      setUploadStep("Ingesting document into secure storage node...");

      const newResume = await api.uploadResume(file);
      setUploadStep("Gemma 4 31B structured analysis complete. Redirecting...");

      setTimeout(() => {
        router.push(`/resume/analysis?id=${newResume.id}`);
      }, 900);
    } catch (err: any) {
      setError(err.message || "Failed to upload and analyze resume.");
      setUploading(false);
      setUploadStep("");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#201f22] border border-[#353437] text-[#e8342a] text-xs font-mono-telemetry font-bold">
          <span className="material-symbols-outlined text-xs">tune</span>
          <span>NEURAL RESUME PARSER</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#e5e1e4] tracking-tight font-headline">
          UPLOAD RESUME SPECIFICATION
        </h1>
        <p className="text-xs text-[#8e8c90] font-mono-telemetry">
          Deep structured LLM extraction for skills, proficiencies, gaps, and automated hybrid gig alignment.
        </p>
      </div>

      {/* Upload Box */}
      <div className="p-8 sm:p-12 rounded bg-[#1c1b1d] border border-[#353437] relative overflow-hidden">
        {error && (
          <div className="mb-6 p-4 rounded bg-[#e8342a]/10 border border-[#e8342a]/40 flex items-start gap-3 text-xs text-[#ffb4aa]">
            <span className="material-symbols-outlined text-[#e8342a] text-base shrink-0 mt-0.5">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Dropzone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded p-8 sm:p-12 text-center cursor-pointer transition-all ${
            dragActive
              ? "border-[#e8342a] bg-[#e8342a]/10 shadow-[0_0_24px_rgba(232,52,42,0.25)]"
              : file
              ? "border-emerald-500/60 bg-emerald-500/5"
              : "border-[#353437] hover:border-[#e8342a]/50 bg-[#201f22]/50 hover:bg-[#201f22]"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="w-16 h-16 rounded bg-[#201f22] border border-[#353437] flex items-center justify-center text-[#e8342a] mx-auto mb-4 shadow-lg shadow-black/40">
            <span className="material-symbols-outlined text-3xl">
              {file ? "task" : "cloud_upload"}
            </span>
          </div>

          {file ? (
            <div className="space-y-1">
              <h3 className="text-base font-bold font-headline text-[#e5e1e4]">{file.name}</h3>
              <p className="text-xs font-mono-telemetry text-emerald-400 font-semibold">
                {(file.size / (1024 * 1024)).toFixed(2)} MB • READY FOR EXTRACTION
              </p>
              <p className="text-[11px] font-mono-telemetry text-[#8e8c90] mt-2">
                Click to choose another document
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <h3 className="text-base font-bold font-headline text-[#e5e1e4]">
                DRAG & DROP RESUME DOCUMENT HERE
              </h3>
              <p className="text-xs font-mono-telemetry text-[#8e8c90]">
                Supports PDF and DOCX documents (up to 15MB)
              </p>
              <button
                type="button"
                className="mt-3 btn-secondary-stitch text-xs px-4 py-2"
              >
                BROWSE FILES
              </button>
            </div>
          )}
        </div>

        {/* Action Button & Live Progress */}
        <div className="mt-8 flex flex-col items-center">
          {uploading ? (
            <div className="flex flex-col items-center gap-3 w-full max-w-sm">
              <div className="w-8 h-8 border-2 border-[#e8342a]/30 border-t-[#e8342a] rounded-full animate-spin" />
              <p className="text-xs font-mono-telemetry text-[#ffb4aa] animate-pulse text-center">
                {uploadStep}
              </p>
            </div>
          ) : (
            <button
              onClick={handleUpload}
              disabled={!file}
              className="w-full sm:w-auto btn-primary-stitch text-xs px-8 py-3 flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <span>RUN AI RESUME EXTRACTION</span>
              <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </button>
          )}
        </div>
      </div>

      {/* Previous Uploads History */}
      <div className="space-y-4">
        <h2 className="text-base font-bold font-headline uppercase text-[#e5e1e4] flex items-center gap-2">
          <span className="material-symbols-outlined text-[#e8342a] text-sm">history</span>
          <span>RESUME REPOSITORY ({resumes.length})</span>
        </h2>

        {resumes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resumes.map((r) => (
              <div
                key={r.id}
                className="p-5 rounded bg-[#1c1b1d] border border-[#353437] flex items-center justify-between gap-4 hover:border-[#e8342a]/40 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded bg-[#201f22] border border-[#353437] flex items-center justify-center text-[#e8342a] shrink-0">
                    <span className="material-symbols-outlined text-base">description</span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold font-headline text-[#e5e1e4] truncate">
                      {r.file_name}
                    </h4>
                    <p className="text-[10px] font-mono-telemetry text-[#8e8c90]">
                      UPLOADED {new Date(r.uploaded_at).toLocaleDateString()} • {r.file_type.toUpperCase()}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/resume/analysis?id=${r.id}`}
                  className="btn-secondary-stitch text-xs px-3 py-1.5 shrink-0 flex items-center gap-1"
                >
                  <span>ANALYSIS</span>
                  <span className="material-symbols-outlined text-xs">chevron_right</span>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded bg-[#1c1b1d] border border-[#353437] text-center text-xs font-mono-telemetry text-[#8e8c90]">
            NO PREVIOUS RESUMES RECORDED IN REPOSITORY.
          </div>
        )}
      </div>
    </div>
  );
}


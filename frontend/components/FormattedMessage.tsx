"use client";

import React from "react";

interface FormattedMessageProps {
  content: string;
  className?: string;
}

// Helper to parse inline bold (**text**), italic (*text*), and code (`text`)
function formatInline(text: string): React.ReactNode[] {
  // First clean any stray triple asterisks
  let cleaned = text.replace(/\*{3,}(.*?)\*{3,}/g, "**$1**");
  cleaned = cleaned.replace(/\*{3,}/g, "");

  // Regex to match **bold**, `code`, or *italic*
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  const parts = cleaned.split(regex);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="px-1 py-0.5 rounded bg-[#141315] border border-[#353437] font-mono text-[11px] text-[#ffb4aa]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={index} className="italic text-[#c8c6c9]">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

export default function FormattedMessage({ content, className = "" }: FormattedMessageProps) {
  if (!content) return null;

  // Pre-clean content: remove horizontal rule lines made of asterisks or dashes
  const preCleaned = content
    .replace(/^\s*[\*\-_]{3,}\s*$/gm, "")
    .replace(/\*{3,}(.*?)\*{3,}/g, "**$1**")
    .replace(/\*{3,}/g, "")
    .trim();

  const lines = preCleaned.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];
  let listType: "ul" | "ol" | null = null;

  const flushList = (keyPrefix: number) => {
    if (currentList.length > 0 && listType) {
      if (listType === "ul") {
        elements.push(
          <ul key={`ul-${keyPrefix}`} className="space-y-1.5 my-1.5 pl-1">
            {currentList}
          </ul>
        );
      } else {
        elements.push(
          <ol key={`ol-${keyPrefix}`} className="space-y-1.5 my-1.5 pl-1">
            {currentList}
          </ol>
        );
      }
      currentList = [];
      listType = null;
    }
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();

    if (!line) {
      flushList(idx);
      return;
    }

    // Check for bullet list item: -, *, •
    const bulletMatch = line.match(/^[\*\-•]\s+(.*)$/);
    if (bulletMatch) {
      if (listType !== "ul") {
        flushList(idx);
        listType = "ul";
      }
      currentList.push(
        <li key={`li-${idx}`} className="flex items-start gap-2 text-xs leading-relaxed">
          <span className="text-[#e8342a] select-none text-[10px] mt-0.5">•</span>
          <span className="flex-1">{formatInline(bulletMatch[1])}</span>
        </li>
      );
      return;
    }

    // Check for numbered list item: 1. , 2. 
    const numberMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (numberMatch) {
      if (listType !== "ol") {
        flushList(idx);
        listType = "ol";
      }
      currentList.push(
        <li key={`li-${idx}`} className="flex items-start gap-2 text-xs leading-relaxed">
          <span className="text-[#e8342a] font-mono-telemetry font-bold text-[10px] min-w-[14px]">
            {numberMatch[1]}.
          </span>
          <span className="flex-1">{formatInline(numberMatch[2])}</span>
        </li>
      );
      return;
    }

    // Regular line / header
    flushList(idx);

    // Markdown header (### or ##)
    const headerMatch = line.match(/^(#{1,3})\s+(.*)$/);
    if (headerMatch) {
      elements.push(
        <h4 key={`h-${idx}`} className="font-bold text-xs text-white uppercase tracking-wider mt-2 mb-1">
          {formatInline(headerMatch[2])}
        </h4>
      );
      return;
    }

    elements.push(
      <p key={`p-${idx}`} className="text-xs leading-relaxed my-1">
        {formatInline(line)}
      </p>
    );
  });

  flushList(lines.length);

  return <div className={`space-y-1 text-xs leading-relaxed ${className}`}>{elements}</div>;
}

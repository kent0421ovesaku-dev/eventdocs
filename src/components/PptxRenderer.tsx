"use client";

type PptxRendererProps = {
  fileUrl: string;
  fileName: string;
};

export default function PptxRenderer({ fileUrl, fileName }: PptxRendererProps) {
  const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`;

  return (
    <div className="w-full h-full flex flex-col">
      <div className="text-sm text-gray-500 px-2 py-1 bg-gray-50 border-b shrink-0">
        {fileName}
      </div>
      <iframe
        src={viewerUrl}
        className="w-full flex-1 min-h-0 border-0"
        title={fileName}
        allowFullScreen
      />
    </div>
  );
}

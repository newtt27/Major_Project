// src/components/chat/FileAttachment.tsx
import { useState } from "react";
import { useLazyDownloadAttachmentQuery } from "@/state/api";
import { 
  File, Image, Video, FileText, Download, Loader2, Eye 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Props {
  attachment: {
    attachment_id: number;
    filename: string;
    filepath: string;
    mimetype: string;
    filesize: number;
  };
  chatroomId: number;
  isMe: boolean;
}

const getIcon = (mimetype: string) => {
  if (mimetype.startsWith("image/")) return Image;
  if (mimetype.startsWith("video/")) return Video;
  if (mimetype === "application/pdf") return FileText;
  return File;
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function FileAttachment({ attachment, chatroomId, isMe }: Props) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [trigger, { isFetching }] = useLazyDownloadAttachmentQuery(); // ← ĐÃ SỬA

  const Icon = getIcon(attachment.mimetype);
  const size = formatSize(attachment.filesize);
  const isPreviewable = 
    attachment.mimetype.startsWith("image/") ||
    attachment.mimetype.startsWith("video/") ||
    attachment.mimetype === "application/pdf";

 const handlePreview = async () => {
  if (!isPreviewable) return;
  try {
    // ĐÚNG: result chính là Blob
    const blob: Blob = await trigger({ 
      chatroomId, 
      attachmentId: attachment.attachment_id 
    }).unwrap();

    const url = URL.createObjectURL(blob);

    if (attachment.mimetype.startsWith("image/")) {
      window.open(url, "_blank");
      URL.revokeObjectURL(url);
    } else {
      setPreviewOpen(true);
      setTimeout(() => {
        const iframe = document.getElementById("preview-iframe") as HTMLIFrameElement;
        if (iframe) iframe.src = url;
      }, 100);
    }
  } catch (err) {
    alert("Không thể xem trước file");
  }
};

const handleDownload = async () => {
  try {
    const blob: Blob = await trigger({ 
      chatroomId, 
      attachmentId: attachment.attachment_id 
    }).unwrap();

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = attachment.filename;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    alert("Tải file thất bại");
  }
};

  return (
    <>
      <div
        className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer
          ${isMe ? "bg-blue-50 hover:bg-blue-100" : "bg-gray-50 hover:bg-gray-100"}
          ${isPreviewable ? "hover:shadow-md" : ""}`}
        onClick={isPreviewable ? handlePreview : undefined}
      >
        <Icon className="w-8 h-8 text-blue-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className={`font-medium text-sm truncate ${isMe ? "text-blue-900" : "text-gray-900"}`}>
            {attachment.filename}
          </p>
          <p className="text-xs text-gray-500">{size}</p>
        </div>
        <div className="flex gap-1">
          {isPreviewable && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-blue-600" 
              onClick={(e) => { e.stopPropagation(); handlePreview(); }}
            >
              <Eye className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-blue-600"
            onClick={(e) => { e.stopPropagation(); handleDownload(); }}
            disabled={isFetching}
          >
            {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="truncate">{attachment.filename}</DialogTitle>
          </DialogHeader>
          <div className="p-4 bg-gray-50 h-[70vh] flex items-center justify-center">
            {attachment.mimetype.startsWith("video/") ? (
              <video controls className="max-w-full max-h-full rounded-lg shadow-lg">
                <source src="" type={attachment.mimetype} />
                Trình duyệt không hỗ trợ video.
              </video>
            ) : attachment.mimetype === "application/pdf" ? (
              <iframe
                id="preview-iframe"
                className="w-full h-full border-0 rounded-lg shadow-lg"
                title="PDF Preview"
              />
            ) : null}
          </div>
          <div className="p-4 border-t flex justify-end">
            <Button onClick={handleDownload} disabled={isFetching}>
              {isFetching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Đang tải...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Tải xuống
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
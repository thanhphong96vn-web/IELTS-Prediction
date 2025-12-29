import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import path from "path";
import { put, del } from "@vercel/blob";

// Disable body parser để xử lý file upload
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Kiểm tra xem có nên sử dụng Vercel Blob Storage không
 */
function shouldUseBlob(): boolean {
  const hasBlobToken = !!process.env.BLOB_READ_WRITE_TOKEN;
  const isVercel = process.env.VERCEL === "1";
  return hasBlobToken && isVercel;
}

/**
 * Upload file lên Vercel Blob Storage
 */
async function uploadToBlob(
  file: formidable.File,
  oldPath?: string
): Promise<string> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN không được cấu hình");
  }

  // Đọc file buffer
  const fileBuffer = fs.readFileSync(file.filepath);
  
  // Tạo tên file unique
  const timestamp = Date.now();
  const originalName = file.originalFilename || "image";
  const ext = path.extname(originalName);
  const baseName = path
    .basename(originalName, ext)
    .replace(/[^a-z0-9]/gi, "-");
  const fileName = `img-admin/${baseName}-${timestamp}${ext}`;

  // Xóa file cũ nếu có
  if (oldPath && typeof oldPath === "string" && oldPath.trim()) {
    try {
      // Extract blob key từ oldPath (format: /img-admin/filename.jpg)
      const blobKey = oldPath.startsWith("/") ? oldPath.substring(1) : oldPath;
      if (blobKey.startsWith("img-admin/")) {
        await del(blobKey, { token });
        console.log(`Đã xóa file cũ từ Blob: ${blobKey}`);
      }
    } catch (deleteError) {
      console.warn("Không thể xóa file cũ từ Blob:", deleteError);
    }
  }

  // Upload file mới
  const blob = await put(fileName, fileBuffer, {
    access: "public",
    token,
    contentType: file.mimetype || "image/jpeg",
  });

  return `/${blob.pathname}`;
}

/**
 * Upload file vào filesystem (local development)
 */
function uploadToFileSystem(
  file: formidable.File,
  oldPath?: string
): string {
  // Tạo tên file unique
  const timestamp = Date.now();
  const originalName = file.originalFilename || "image";
  const ext = path.extname(originalName);
  const baseName = path
    .basename(originalName, ext)
    .replace(/[^a-z0-9]/gi, "-");
  const newFileName = `${baseName}-${timestamp}${ext}`;
  const newFilePath = path.join(
    process.cwd(),
    "public",
    "img-admin",
    newFileName
  );

  // Đảm bảo thư mục tồn tại
  const uploadDir = path.join(process.cwd(), "public", "img-admin");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Xóa file cũ nếu có
  if (oldPath && typeof oldPath === "string" && oldPath.trim()) {
    try {
      const oldFilePath = path.join(process.cwd(), "public", oldPath);
      if (
        oldFilePath.startsWith(path.join(process.cwd(), "public", "img-admin")) &&
        fs.existsSync(oldFilePath)
      ) {
        fs.unlinkSync(oldFilePath);
        console.log(`Đã xóa file cũ: ${oldFilePath}`);
      }
    } catch (deleteError) {
      console.warn("Không thể xóa file cũ:", deleteError);
    }
  }

  // Đổi tên file
  fs.renameSync(file.filepath, newFilePath);

  return `/img-admin/${newFileName}`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // TODO: Thêm authentication check ở đây
    // if (!isAdmin(req)) return res.status(401).json({ message: "Unauthorized" });

    const form = formidable({
      maxFileSize: 5 * 1024 * 1024, // 5MB
      keepExtensions: true,
      uploadDir: shouldUseBlob() 
        ? require("os").tmpdir() // Dùng temp dir trên Vercel
        : path.join(process.cwd(), "public", "img-admin"),
    });

    const [fields, files] = await form.parse(req);
    
    // Lấy đường dẫn file cũ (nếu có) từ form field
    const oldPath = Array.isArray(fields.oldPath) 
      ? fields.oldPath[0] 
      : fields.oldPath;

    const uploadedFiles = Array.isArray(files.file) ? files.file : [files.file];

    if (!uploadedFiles[0]) {
      return res.status(400).json({ message: "Không có file được upload" });
    }

    const file = uploadedFiles[0];

    if (!file) {
      return res.status(400).json({ message: "File không hợp lệ" });
    }

    // Upload file
    let relativePath: string;
    if (shouldUseBlob()) {
      relativePath = await uploadToBlob(file, oldPath as string);
    } else {
      relativePath = uploadToFileSystem(file, oldPath as string);
    }

    return res.status(200).json({
      message: "Upload thành công",
      path: relativePath,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({
      message: "Lỗi khi upload file",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

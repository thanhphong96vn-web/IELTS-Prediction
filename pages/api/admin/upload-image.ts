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
  const result = hasBlobToken && isVercel;
  
  if (isVercel && !hasBlobToken) {
    console.warn("⚠️ Running on Vercel but BLOB_READ_WRITE_TOKEN is not configured. File upload will fail.");
  }
  
  return result;
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
 * Upload file lên ImgBB (fallback khi không có Blob Storage)
 */
async function uploadToImgBB(file: formidable.File): Promise<string> {
  const imgbbApiKey = process.env.IMGBB_API_KEY;
  
  if (!imgbbApiKey) {
    throw new Error("IMGBB_API_KEY chưa được cấu hình. Vui lòng lấy API key miễn phí từ https://api.imgbb.com");
  }
  
  // Đọc file buffer và convert sang base64
  const fileBuffer = fs.readFileSync(file.filepath);
  const base64 = fileBuffer.toString("base64");
  
  // Upload lên ImgBB sử dụng URLSearchParams
  const params = new URLSearchParams();
  params.append("key", imgbbApiKey);
  params.append("image", base64);
  
  try {
    const response = await fetch("https://api.imgbb.com/1/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ImgBB upload failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    
    if (!data.success || !data.data || !data.data.url) {
      throw new Error(`ImgBB upload failed: ${data.error?.message || "Invalid response"}`);
    }
    
    console.log("ImgBB upload successful:", data.data.url);
    return data.data.url;
  } catch (error) {
    console.error("ImgBB upload error:", error);
    throw new Error(`Không thể upload lên ImgBB: ${error instanceof Error ? error.message : String(error)}`);
  }
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

    const useBlob = shouldUseBlob();
    const isVercel = process.env.VERCEL === "1";
    
    console.log("Upload request:", {
      useBlob,
      isVercel,
      hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
      nodeEnv: process.env.NODE_ENV,
    });

    // Cảnh báo nếu đang trên Vercel nhưng không có Blob token
    if (isVercel && !useBlob) {
      console.warn("⚠️ Running on Vercel without BLOB_READ_WRITE_TOKEN. Upload to filesystem will fail.");
      // Không chặn ngay, để thử upload và trả về lỗi cụ thể nếu fail
    }

    const form = formidable({
      maxFileSize: 5 * 1024 * 1024, // 5MB
      keepExtensions: true,
      uploadDir: useBlob 
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

    console.log("Processing file:", {
      filename: file.originalFilename,
      mimetype: file.mimetype,
      size: file.size,
      useBlob,
    });

    // Upload file
    let relativePath: string;
    try {
      if (useBlob) {
        console.log("Uploading to Vercel Blob Storage...");
        relativePath = await uploadToBlob(file, oldPath as string);
        console.log("Upload successful, path:", relativePath);
      } else if (isVercel) {
        // Trên Vercel nhưng không có Blob token, sử dụng ImgBB làm fallback
        console.log("Uploading to ImgBB (fallback)...");
        relativePath = await uploadToImgBB(file);
        console.log("Upload successful to ImgBB, URL:", relativePath);
      } else {
        // Local development, upload vào filesystem
        console.log("Uploading to filesystem...");
        relativePath = uploadToFileSystem(file, oldPath as string);
        console.log("Upload successful, path:", relativePath);
      }
    } catch (uploadError) {
      console.error("Upload failed:", uploadError);
      
      // Nếu lỗi do thiếu Blob token trên Vercel và ImgBB cũng fail
      if (isVercel && !useBlob && uploadError instanceof Error) {
        return res.status(500).json({
          message: "Không thể upload file. Vui lòng cấu hình BLOB_READ_WRITE_TOKEN hoặc IMGBB_API_KEY",
          error: uploadError.message,
          hint: "Cách 1: Tạo Blob Store trong Vercel Dashboard và thêm BLOB_READ_WRITE_TOKEN vào Environment Variables. Xem VERCEL_BLOB_SETUP.md để biết chi tiết.\nCách 2: Lấy API key miễn phí từ https://api.imgbb.com và thêm IMGBB_API_KEY vào Environment Variables.",
        });
      }
      
      throw uploadError;
    }

    return res.status(200).json({
      message: "Upload thành công",
      path: relativePath,
    });
  } catch (error) {
    console.error("Upload error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error("Error details:", {
      message: errorMessage,
      stack: errorStack,
      isVercel: process.env.VERCEL === "1",
      hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
    });

    return res.status(500).json({
      message: "Lỗi khi upload file",
      error: errorMessage,
      ...(process.env.NODE_ENV === "development" && { stack: errorStack }),
    });
  }
}

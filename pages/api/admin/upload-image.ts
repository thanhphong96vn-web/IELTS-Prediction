import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import path from "path";

// Disable body parser để xử lý file upload
export const config = {
  api: {
    bodyParser: false,
  },
};

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
      uploadDir: path.join(process.cwd(), "public", "img-admin"),
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
        // Chỉ xóa file trong thư mục img-admin để đảm bảo an toàn
        const oldFilePath = path.join(process.cwd(), "public", oldPath);
        
        // Kiểm tra file cũ có trong thư mục img-admin không
        if (
          oldFilePath.startsWith(path.join(process.cwd(), "public", "img-admin")) &&
          fs.existsSync(oldFilePath)
        ) {
          fs.unlinkSync(oldFilePath);
          console.log(`Đã xóa file cũ: ${oldFilePath}`);
        }
      } catch (deleteError) {
        // Log lỗi nhưng không fail upload nếu xóa file cũ thất bại
        console.warn("Không thể xóa file cũ:", deleteError);
      }
    }

    // Đổi tên file
    fs.renameSync(file.filepath, newFilePath);

    // Trả về đường dẫn relative
    const relativePath = `/img-admin/${newFileName}`;

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

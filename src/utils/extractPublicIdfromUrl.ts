/**
 * Helper trích xuất publicId từ Cloudinary URL
 */
export function extractPublicIdFromUrl(fileUrl: string): string | null {
  try {
    // Ví dụ URL: https://res.cloudinary.com/.../upload/v12345/admission-documents/abc123.png
    // Kết quả lấy: admission-documents/abc123
    const parts = fileUrl.split("/upload/");
    if (parts.length < 2) return null;

    const pathAfterUpload = parts[1]; // "v12345/admission-documents/abc123.png"
    const pathWithoutVersion = pathAfterUpload.replace(/^v\d+\//, ""); // "admission-documents/abc123.png"

    // Bỏ extension (.jpg, .png, .pdf, v.v.)
    const publicId = pathWithoutVersion.substring(0, pathWithoutVersion.lastIndexOf("."));
    return publicId || null;
  } catch {
    return null;
  }
}

import bcrypt from "bcrypt";

/**
 * Hash password mới (Node bcrypt dùng $2b$)
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Verify password hỗ trợ CẢ 2 format:
 * - $2b$ (Node bcrypt)
 * - $2y$ (PHP bcrypt — cần convert sang $2a$)
 */
export async function comparePassword(
  plain: string,
  hash: string
): Promise<boolean> {
  // Detect PHP bcrypt ($2y$) → convert sang $2a$ (Node hiểu)
  const normalizedHash = hash.startsWith("$2y$")
    ? hash.replace("$2y$", "$2a$")
    : hash;

  return bcrypt.compare(plain, normalizedHash);
}
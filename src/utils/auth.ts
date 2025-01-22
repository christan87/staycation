import bcrypt from 'bcryptjs';

export async function verifyPassword(password: string, hashedPassword: string) {
  return await bcrypt.compare(password, hashedPassword);
}
import { execFile } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";

const execFileAsync = promisify(execFile);

export async function extractPdfText(pdfBuffer: Buffer) {
  const inputPath = join(tmpdir(), `course-${randomUUID()}.pdf`);

  try {
    await fs.writeFile(inputPath, pdfBuffer);

    const { stdout } = await execFileAsync("pdftotext", [
      "-enc",
      "UTF-8",
      "-layout",
      inputPath,
      "-",
    ]);

    const cleaned = stdout
      .replace(/\u0000/g, "")
      .replace(/\f/g, "\n\n")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (!cleaned) {
      throw new Error("The uploaded PDF did not produce readable text.");
    }

    return cleaned;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown PDF extraction error";

    throw new Error(`Failed to extract text from the PDF. ${message}`);
  } finally {
    await fs.unlink(inputPath).catch(() => undefined);
  }
}

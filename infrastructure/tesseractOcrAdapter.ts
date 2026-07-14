import Tesseract from "tesseract.js";
import { OcrScanner } from "./interfaces";

export class TesseractOcrAdapter implements OcrScanner {
  async scanForPhonePatterns(
    imageBuffer: ArrayBuffer,
    regex: RegExp
  ): Promise<{ detected: boolean; phone: string | null }> {
    try {
      const {
        data: { text },
      } = await Tesseract.recognize(Buffer.from(imageBuffer), "eng", {
        logger: () => undefined,
      });

      const match = text.match(regex);
      if (match) {
        return { detected: true, phone: match[0] };
      }

      return { detected: false, phone: null };
    } catch {
      // Fail-safe: treat OCR failure as detected so photo is held for review
      return { detected: true, phone: null };
    }
  }
}

export const tesseractOcrAdapter = new TesseractOcrAdapter();

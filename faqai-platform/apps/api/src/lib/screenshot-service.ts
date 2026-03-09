import sharp from 'sharp';
import { uploadScreenshot } from './s3-client.js';
import { logger } from './logger.js';

export class ScreenshotService {
  async savePageScreenshot(params: {
    organizationId: string;
    crawlPageId: string;
    screenshot: Buffer;
    sectionSelector?: string;
  }): Promise<{
    storagePath: string;
    thumbnailPath: string;
    width: number;
    height: number;
    fileSizeBytes: number;
  }> {
    const timestamp = Date.now();
    const suffix = params.sectionSelector
      ? `_${params.sectionSelector.replace(/[^a-zA-Z0-9]/g, '_')}`
      : '';
    const key = `screenshots/${params.organizationId}/${params.crawlPageId}/${timestamp}${suffix}.png`;
    const thumbKey = `screenshots/${params.organizationId}/${params.crawlPageId}/${timestamp}${suffix}_thumb.png`;

    // Upload full image
    const { storagePath, fileSizeBytes } = await uploadScreenshot(key, params.screenshot);

    // Generate and upload thumbnail (width 400px)
    let width = 0;
    let height = 0;
    try {
      const metadata = await sharp(params.screenshot).metadata();
      width = metadata.width ?? 0;
      height = metadata.height ?? 0;
      const thumbnail = await sharp(params.screenshot)
        .resize(400)
        .png({ quality: 80 })
        .toBuffer();
      await uploadScreenshot(thumbKey, thumbnail);
    } catch (err) {
      logger.warn({ err: String(err) }, 'Thumbnail generation failed');
    }

    return {
      storagePath,
      thumbnailPath: `faqai-screenshots/${thumbKey}`,
      width,
      height,
      fileSizeBytes,
    };
  }
}

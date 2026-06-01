// Cliente Cloudflare R2 para almacenamiento de archivos
// Compatible con S3 API
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  type PutObjectCommandInput,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Configurar cliente S3 para R2
const s3Client = new S3Client({
  region: 'auto',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
})

const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'community-connect'
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://files.communityconnect.cl'

/**
 * uploadFileToR2 — Sube un archivo a Cloudflare R2
 * @param file - Buffer del archivo
 * @param fileName - Nombre del archivo (ej: "tickets/TK-001-photo.jpg")
 * @param contentType - Tipo MIME (ej: "image/jpeg")
 * @returns URL pública del archivo
 */
export async function uploadFileToR2(
  file: Buffer,
  fileName: string,
  contentType: string,
): Promise<string> {
  const params: PutObjectCommandInput = {
    Bucket: R2_BUCKET_NAME,
    Key: fileName,
    Body: file,
    ContentType: contentType,
  }

  await s3Client.send(new PutObjectCommand(params))

  // Retornar URL pública
  return `${R2_PUBLIC_URL}/${fileName}`
}

/**
 * deleteFileFromR2 — Elimina un archivo de R2
 * @param fileName - Nombre del archivo (ej: "tickets/TK-001-photo.jpg")
 */
export async function deleteFileFromR2(fileName: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: fileName,
    }),
  )
}

/**
 * getSignedUrlForR2 — Genera una URL firmada (temporal) para descargar desde R2
 * @param fileName - Nombre del archivo
 * @param expiresIn - Segundos hasta que expire (defecto: 3600 = 1 hora)
 * @returns URL firmada
 */
export async function getSignedUrlForR2(
  fileName: string,
  expiresIn: number = 3600,
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: fileName,
  })

  return getSignedUrl(s3Client, command, { expiresIn })
}

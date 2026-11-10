import api from '../redux/api/axios';

const CLOUD_NAME = 'dzipqea6s';
const DEFAULT_PRESET = 'BartProductImages';
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}`;
const MAX_SIDE = 1600; // las fotos de cámara pesan mucho: se reducen antes de subir

// Se lanza cuando la moderación de Cloudinary rechaza la imagen (contenido obsceno, violento, etc.)
export class ImageRejectedError extends Error {
  labels: string[];

  constructor(labels: string[] = []) {
    super('La imagen contiene contenido inapropiado y no está permitida.');
    this.name = 'ImageRejectedError';
    this.labels = labels;
  }
}

type ModerationResult = {
  kind: string;
  status: 'approved' | 'rejected' | 'pending';
  response?: { moderation_labels?: { name?: string; Name?: string }[] };
};

// Borra la imagen rechazada usando el token temporal (válido 10 minutos)
const deleteByToken = async (token?: string) => {
  if (!token) return;
  try {
    const data = new FormData();
    data.append('token', token);
    await fetch(`${CLOUDINARY_URL}/delete_by_token`, { method: 'POST', body: data });
  } catch (err) {
    console.log('No se pudo borrar la imagen rechazada:', err);
  }
};

// Reduce la foto (JPEG 0.8), como hace el selector de imágenes de la app móvil
const shrink = async (file: File, maxSide: number): Promise<Blob> => {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 1.5 * 1024 * 1024) {
      bitmap.close();
      return file;
    }
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return await new Promise<Blob>(resolve =>
      canvas.toBlob(blob => resolve(blob ?? file), 'image/jpeg', 0.8),
    );
  } catch {
    return file; // formato que el navegador no sabe leer: se sube tal cual
  }
};

export const uploadImage = async (
  file: File,
  { uploadPreset = DEFAULT_PRESET, maxSide = MAX_SIDE } = {},
): Promise<string> => {
  if (!file.type.startsWith('image/')) throw new Error('El archivo no es una imagen');

  const data = new FormData();
  data.append('file', await shrink(file, maxSide), file.name || `image_${Date.now()}.jpg`);
  data.append('upload_preset', uploadPreset);

  const res = await fetch(`${CLOUDINARY_URL}/image/upload`, {
    method: 'POST',
    body: data,
  });
  const result = await res.json();

  if (!res.ok) {
    throw new Error(result?.error?.message || 'No se pudo subir la imagen');
  }

  // 1. Moderación de Cloudinary (opcional, solo si el preset la tiene activada)
  const moderation: ModerationResult[] | undefined = result.moderation;
  const rejected = moderation?.find(m => m.status !== 'approved');
  if (rejected) {
    await deleteByToken(result.delete_token);
    const labels = (rejected.response?.moderation_labels ?? [])
      .map(l => l.name ?? l.Name ?? '')
      .filter(Boolean);
    throw new ImageRejectedError(labels);
  }

  // 2. Detector NSFW del backend. El backend vuelve a verificar al guardar,
  //    esto solo sirve para avisar al usuario en cuanto elige la foto.
  try {
    await api.post('/images/check', { url: result.secure_url });
  } catch (error: any) {
    if (error.response?.data?.code === 'IMAGE_REJECTED') {
      await deleteByToken(result.delete_token);
      throw new ImageRejectedError();
    }
    throw error;
  }

  return result.secure_url;
};

// Mensaje para mostrar al usuario según el tipo de error
export const getUploadErrorMessage = (err: unknown) =>
  err instanceof ImageRejectedError
    ? 'Esta imagen no cumple con nuestras normas de contenido (desnudos, contenido sexual o violento). Por favor elige otra.'
    : 'No se pudo subir la imagen. Intenta de nuevo.';

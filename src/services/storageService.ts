import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Platform } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { storage } from '../config/firebaseConfig';

// Costanti per la validazione delle immagini
const MAX_IMAGE_SIZE_MB = 5; // 5MB max per immagine
const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

// Classe per definire errori di validazione delle immagini
export class ImageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageValidationError';
  }
}

/**
 * Valida che il file sia un'immagine e non superi la dimensione massima
 * @param uri URI dell'immagine
 * @param fileInfo Opzionalmente, le informazioni sul file (come la size)
 */
export async function validateImage(uri: string, fileInfo?: any): Promise<void> {
  // Verifica che l'URI sia valido
  if (!uri || typeof uri !== 'string') {
    throw new ImageValidationError('URI immagine non valido');
  }

  try {
    // Recupera informazioni sull'immagine se non fornite
    let sizeInBytes = fileInfo?.size;
    let type = fileInfo?.type;

    if (!sizeInBytes || !type) {
      const response = await fetch(uri, { method: 'HEAD' });
      const contentLength = response.headers.get('content-length');
      const contentType = response.headers.get('content-type');
      
      sizeInBytes = contentLength ? parseInt(contentLength) : 0;
      type = contentType || '';
    }

    // Verifica dimensione massima
    const sizeInMB = sizeInBytes / (1024 * 1024);
    if (sizeInMB > MAX_IMAGE_SIZE_MB) {
      throw new ImageValidationError(`L'immagine supera il limite di ${MAX_IMAGE_SIZE_MB}MB`);
    }

    // Verifica che sia un'immagine
    if (!VALID_IMAGE_TYPES.includes(type.toLowerCase())) {
      throw new ImageValidationError('Il file non è un\'immagine valida');
    }
  } catch (error) {
    if (error instanceof ImageValidationError) {
      throw error;
    }
    throw new ImageValidationError('Errore durante la validazione dell\'immagine');
  }
}

/**
 * Carica un'immagine su Firebase Storage con gestione dell'avanzamento
 * @param uri URI dell'immagine da caricare
 * @param path Path all'interno di Storage (es. "listings/userId")
 * @param onProgress Callback opzionale per ricevere aggiornamenti sull'avanzamento
 */
export async function uploadImage(
  uri: string, 
  path: string, 
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    // Valida l'immagine prima dell'upload
    await validateImage(uri);
    
    // Genera un filename unico
    const filename = `${uuidv4()}.jpg`;
    const storagePath = `${path}/${filename}`;
    
    // Converti l'URI in Blob per il caricamento
    const blob = await fetchImageFromUri(uri);
    
    // Riferimento allo storage
    const storageRef = ref(storage, storagePath);
    
    // Carica il file
    const uploadTask = uploadBytesResumable(storageRef, blob);
    
    // Attendi il completamento del caricamento
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Progress tracking
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          // Handle upload error
          console.error('Errore di caricamento:', error);
          reject(error);
        },
        async () => {
          // Upload completato, ottieni URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  } catch (error) {
    console.error('Errore durante il caricamento dell\'immagine:', error);
    throw error;
  }
}

/**
 * Carica più immagini contemporaneamente con monitoraggio dell'avanzamento
 * @param uris Array di URI delle immagini
 * @param path Path all'interno di Storage
 * @param onTotalProgress Callback opzionale per l'avanzamento totale
 * @param onImageProgress Callback opzionale per l'avanzamento delle singole immagini
 */
export async function uploadMultipleImages(
  uris: string[], 
  path: string,
  onTotalProgress?: (progress: number) => void,
  onImageProgress?: (index: number, progress: number) => void
): Promise<string[]> {
  if (!uris || uris.length === 0) {
    return [];
  }

  // Array per tenere traccia dell'avanzamento di ogni immagine
  const progressArray = new Array(uris.length).fill(0);
  
  // Funzione per calcolare l'avanzamento totale
  const calculateTotalProgress = () => {
    const total = progressArray.reduce((sum, value) => sum + value, 0) / uris.length;
    if (onTotalProgress) {
      onTotalProgress(total);
    }
  };

  // Carica ogni immagine con il callback dell'avanzamento
  const uploadPromises = uris.map((uri, index) => {
    return uploadImage(
      uri, 
      `${path}/image_${index + 1}`,
      (progress) => {
        progressArray[index] = progress;
        if (onImageProgress) {
          onImageProgress(index, progress);
        }
        calculateTotalProgress();
      }
    );
  });

  return Promise.all(uploadPromises);
}

/**
 * Converti URI in Blob
 */
async function fetchImageFromUri(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  return await response.blob();
} 
// ============================================================
// SERVICIO DE FOTOS (PhotoService) - Versión API moderna
// ------------------------------------------------------------
// Usa Camera.takePhoto() (disponible desde @capacitor/camera 8.1)
// en lugar de Camera.getPhoto(), que está deprecado.
//
// La nueva API devuelve un MediaResult con:
//   - uri: ruta nativa del archivo (para Filesystem)
//   - webPath: URL visible en el WebView (para <img>)
//
// No se necesitan CameraResultType ni CameraSource: el método
// takePhoto() ya implica "tomar una foto nueva con la cámara".
// ============================================================

import { Injectable } from '@angular/core';
import { Camera } from '@capacitor/camera';  
import type { MediaResult } from '@capacitor/camera';         
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';

import type { UserPhoto } from '../models/photo.model';


@Injectable({ providedIn: 'root' })
export class PhotoService {

  // Array en memoria con las fotos capturadas. La galería
  // lo lee directamente para renderizar el grid.
  public photos: UserPhoto[] = [];

  // Clave usada en Preferences para persistir la lista.
  private PHOTO_STORAGE = 'photos';

  /**
   * Captura una nueva foto con la cámara y la guarda.
   * ------------------------------------------------------------
   * Pasos:
   *   1. Abre la cámara nativa con Camera.takePhoto().
   *   2. Guarda el archivo en Filesystem.
   *   3. Añade la foto al array y persiste en Preferences.
   */
  async addNewToGallery(): Promise<UserPhoto> {
    // Camera.takePhoto() abre la cámara del dispositivo.
    // Opciones:
    //   - quality: 90 → buena calidad sin archivos enormes.
    //   - editable: 'no' → sin editor de recorte (opcional).
    const captured = await Camera.takePhoto({
      quality: 90,
      editable: 'no',
    });

    // Guardamos el archivo físico en el sistema de archivos.
    const saved = await this.savePicture(captured);

    // Añadimos la foto al inicio del array (la más reciente primero).
    this.photos.unshift(saved);

    // Persistimos la lista actualizada en Preferences.
    await Preferences.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos),
    });

    return saved;
  }

  /**
   * Guarda físicamente la foto en el sistema de archivos.
   * ------------------------------------------------------------
   * Convierte la foto (webPath) a base64 y la escribe en
   * Directory.Data (carpeta privada de la app).
   */
  private async savePicture(media: MediaResult): Promise<UserPhoto> {
  // Validamos que webPath exista antes de usarlo.
  // Si no existe, lanzamos un error claro en lugar de
  // fallar más adelante con un "undefined".
  if (!media.webPath) {
    throw new Error('La cámara no devolvió un webPath válido');
  }

  const base64 = await this.readAsBase64(media.webPath);
  const fileName = `${Date.now()}.jpeg`;

  await Filesystem.writeFile({
    path: fileName,
    data: base64,
    directory: Directory.Data,
  });

  return { filepath: fileName, webviewPath: media.webPath };
}

  /**
   * Convierte una URL de imagen (blob:, data:, etc.) a base64.
   * ------------------------------------------------------------
   * Usa fetch + FileReader, compatible con navegador y WebView.
   */
  private async readAsBase64(webPath: string): Promise<string> {
    // Descargamos el contenido de la URL como Blob.
    const response = await fetch(webPath);
    const blob = await response.blob();

    // FileReader convierte el Blob a una Data URL base64.
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Carga las fotos guardadas al iniciar la app.
   * ------------------------------------------------------------
   * Se llama en el ngOnInit de la página de galería.
   */
  async loadSaved(): Promise<void> {
    // Leemos la lista JSON desde Preferences.
    const { value } = await Preferences.get({ key: this.PHOTO_STORAGE });
    this.photos = value ? (JSON.parse(value) as UserPhoto[]) : [];

    // Regeneramos el webviewPath leyendo cada archivo como base64.
    // Es necesario porque el WebView no puede acceder directamente
    // a Directory.Data por seguridad.
    for (const photo of this.photos) {
      try {
        const readFile = await Filesystem.readFile({
          path: photo.filepath,
          directory: Directory.Data,
        });
        photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
      } catch (e) {
        // Si el archivo ya no existe (borrado manual, etc.),
        // advertimos y continuamos con las demás fotos.
        // Este comentario también satisface la regla ESLint
        // "no-empty": un catch con comentario no está "vacío".
        console.warn('No se pudo leer la foto:', photo.filepath);
      }
    }
  }

  /**
   * Elimina una foto (archivo físico + metadatos).
   * ------------------------------------------------------------
   * Se usa desde el botón "Eliminar" de cada tarjeta.
   */
  async deletePhoto(filepath: string): Promise<void> {
    // Quitamos la foto del array en memoria.
    this.photos = this.photos.filter((p) => p.filepath !== filepath);

    // Persistimos la lista actualizada.
    await Preferences.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos),
    });

    // Borramos el archivo físico. El try/catch evita que un
    // fallo (por ejemplo, archivo ya inexistente) rompa el flujo.
    try {
      await Filesystem.deleteFile({
        path: filepath,
        directory: Directory.Data,
      });
    } catch {
      // Si el archivo no existe o no se puede borrar, lo
      // ignoramos intencionalmente: el objetivo principal
      // (quitarlo de la lista) ya se cumplió.
      // Este comentario evita el warning de "catch vacío".
    }
  }
}
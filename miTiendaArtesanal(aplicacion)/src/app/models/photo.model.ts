// ============================================================
// MODELO DE FOTO
// ------------------------------------------------------------
// Representa una foto capturada por la cámara del dispositivo
// y almacenada localmente. Se usa en el PhotoService y en la
// página de galería (que construiremos después).
// ============================================================

export interface UserPhoto {
  // Nombre del archivo dentro del sistema de archivos del
  // dispositivo (por ejemplo: "1712345678901.jpeg").
  // Se usa como identificador único y como ruta al leer el archivo.
  filepath: string;

  // Ruta "webview" (URI) que el navegador o WebView puede
  // mostrar directamente como <img [src]="...">.
  // Se llena al capturar la foto o al leerla desde Filesystem
  // como base64 (data:image/jpeg;base64,...).
  // Es opcional porque puede no estar disponible en todos los casos.
  webviewPath?: string;

  // ID del producto al que se asocia esta foto.
  // Es útil en el marketplace: un vendedor sube varias fotos
  // para un mismo producto (RF-08 del proyecto).
  // Es opcional porque no todas las fotos tienen que estar
  // vinculadas a un producto (por ejemplo, foto de perfil).
  productId?: string;
}
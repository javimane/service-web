/**
 * Recorta automáticamente una imagen desde su centro para hacerla cuadrada (1:1).
 * Devuelve un nuevo archivo File con la imagen recortada.
 */
export const cropImageToSquare = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = Math.min(img.width, img.height);
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("No se pudo obtener el contexto 2d del canvas"));
          return;
        }

        // Calcular coordenadas para recorte central
        const startX = img.width > img.height ? (img.width - img.height) / 2 : 0;
        const startY = img.height > img.width ? (img.height - img.width) / 2 : 0;

        ctx.drawImage(img, startX, startY, size, size, 0, 0, size, size);

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error("El canvas está vacío"));
            return;
          }
          // Conservar nombre y tipo original
          const croppedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          });
          resolve(croppedFile);
        }, file.type);
      };
      img.onerror = () => reject(new Error("Error al cargar la imagen"));
      if (typeof e.target?.result === "string") {
        img.src = e.target.result;
      }
    };
    reader.onerror = () => reject(new Error("Error al leer el archivo"));
    reader.readAsDataURL(file);
  });
};

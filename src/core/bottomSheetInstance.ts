/**
 * BottomSheet Instance Manager
 * Proporciona acceso global a la instancia del BottomSheet sin usar window
 */
import type BottomSheet from "./BottomSheet";

let bottomSheetInstance: BottomSheet | null = null;

/**
 * Registra la instancia del BottomSheet
 * @param instance - Instancia de BottomSheet a registrar
 */
export function setBottomSheet(instance: BottomSheet): void {
  bottomSheetInstance = instance;
}

/**
 * Obtiene la instancia actual del BottomSheet
 * @returns La instancia del BottomSheet o null si no está inicializada
 */
export function getBottomSheet(): BottomSheet | null {
  return bottomSheetInstance;
}

/**
 * Obtiene la instancia del BottomSheet de forma segura
 * Lanza un error si no está inicializada
 * @returns La instancia del BottomSheet
 * @throws Error si el BottomSheet no ha sido inicializado
 */
export function getBottomSheetOrThrow(): BottomSheet {
  if (!bottomSheetInstance) {
    throw new Error(
      "BottomSheet no ha sido inicializado. Asegúrate de que el componente BottomSheet.astro esté montado."
    );
  }
  return bottomSheetInstance;
}

/**
 * Verifica si el BottomSheet está inicializado
 * @returns true si la instancia existe
 */
export function isBottomSheetInitialized(): boolean {
  return bottomSheetInstance !== null;
}

/**
 * Limpia la instancia del BottomSheet
 * Útil para testing o cuando se desmonta el componente
 */
export function clearBottomSheet(): void {
  bottomSheetInstance = null;
}

// Export por defecto con todas las funciones
export default {
  setBottomSheet,
  getBottomSheet,
  getBottomSheetOrThrow,
  isBottomSheetInitialized,
  clearBottomSheet,
};

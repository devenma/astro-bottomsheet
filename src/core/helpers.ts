/**
 * Determina si el dispositivo es mobile basado en el tamaño de la pantalla.
 */
export function isMobile(): boolean {
  return window.screen.width < 768;
}

/**
 * Retrasa la ejecución de una función.
 * @param func - Función a ejecutar
 * @param wait - Tiempo de espera en ms (default: 300)
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait = 300
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;
    const later = () => {
      timeout = undefined;
      func.apply(context, args);
    };

    if (timeout !== undefined) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Ejecuta la función `fn` sólo si el evento se mantiene activo durante `delay` ms.
 * Si se cancela antes (por mouseup o similar), no hace nada.
 * @param fn - Función a ejecutar cuando se mantiene el evento
 * @param delay - Tiempo en ms para considerar el evento como "mantenido" (default: 50)
 */
export function hold<T extends Event>(
  fn: (this: EventTarget | null, event: T) => void,
  delay = 50
) {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return {
    start: (e: T) => {
      // Evita reiniciar si ya está contando
      if (timer !== null) return;

      timer = setTimeout(() => {
        fn.call(e.currentTarget, e);
        timer = null;
      }, delay);
    },
    cancel: () => {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
    },
  };
}

/**
 * Función helper para procesar arrays grandes en lotes asíncronos
 * sin bloquear el hilo principal
 * @param items - Array de elementos a procesar
 * @param batchSize - Tamaño del lote (cuántos items procesar por frame)
 * @param callback - Función a ejecutar por cada item
 */
export function processBatchAsync<T>(
  items: T[],
  batchSize: number,
  callback: (item: T, index: number) => void
): void {
  let currentIndex = 0;

  function processBatch() {
    const endIndex = Math.min(currentIndex + batchSize, items.length);

    // Procesar lote actual
    for (let i = currentIndex; i < endIndex; i++) {
      callback(items[i], i);
    }

    currentIndex = endIndex;

    // Si hay más elementos, programar siguiente lote
    if (currentIndex < items.length) {
      // Usar requestIdleCallback si está disponible, sino setTimeout
      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        (window as any).requestIdleCallback(processBatch);
      } else {
        setTimeout(processBatch, 0);
      }
    }
  }

  // Iniciar procesamiento
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    (window as any).requestIdleCallback(processBatch);
  } else {
    setTimeout(processBatch, 0);
  }
}

export default { isMobile, debounce, hold, processBatchAsync };

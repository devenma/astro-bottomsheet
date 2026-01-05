import * as Helpers from "./helpers.js";

/**
 * Verifica si el evento es un MouseEvent de forma segura
 */
function isMouseEvent(e: Event): e is MouseEvent {
  return typeof MouseEvent !== "undefined" && e instanceof MouseEvent;
}

/**
 * Verifica si el evento es un TouchEvent de forma segura
 */
function isTouchEvent(e: Event): e is TouchEvent {
  return typeof TouchEvent !== "undefined" && e instanceof TouchEvent;
}

export default class BottomSheet {
  protected panel: HTMLElement;
  protected container: HTMLElement;
  protected options: {
    maxSize: number;
    minSize: number;
    closeOnOverlayClick?: boolean;
    [key: string]: any;
  };
  protected state: {
    startPoint: number;
    startSize: number;
    prevPoint: number;
    lastDiff: number;
    isDragging: boolean;
    isOpen: boolean;
    isMinimized: boolean;
    isMaximized: boolean;
    isUpdating: boolean;
    dragStart: number;
    hasMoved: boolean;
    totalMovement: number;
  };
  protected _eventListeners: any[];
  protected _holdAction: any;

  constructor(selector: string | HTMLElement, options = {}) {
    const panel =
      typeof selector === "string"
        ? document.querySelector(selector)
        : selector;

    if (!(panel instanceof HTMLElement)) {
      throw new Error("The selector does not match any element.");
    }

    this.panel = panel;
    const container = this.panel.parentElement as HTMLElement | null;

    if (!(container instanceof HTMLElement)) {
      throw new Error("The panel does not have a parent element.");
    }

    this.container = container;

    // Configuración del panel
    this.options = {
      maxSize: 500,
      minSize: 40,
      closeOnOverlayClick: false,
      ...options,
    };

    // Estado interno del panel
    this.state = {
      startPoint: 0,
      startSize: 0,
      prevPoint: 0,
      lastDiff: 0,
      isDragging: false,
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      isUpdating: false,
      dragStart: 0,
      hasMoved: false,
      totalMovement: 0,
    };

    this._eventListeners = [];

    this._initializeEventListeners();
    this._initializeObservers();
  }

  /**
   * Inicializa los event listeners del panel
   * @private
   */
  private _initializeEventListeners() {
    // Acciones para ampliar y minimizar el panel
    this._holdAction = Helpers.hold((e: Event) => this._onStart(e), 25);
    this.panel.addEventListener("mousedown", this._holdAction.start);
    this.panel.addEventListener("touchstart", this._holdAction.start);

    this.container.addEventListener("click", (e) => {
      if ((e.target as HTMLElement)?.closest("#bottomsheet") == null)
        if (this.options.closeOnOverlayClick) {
          this.close();
        } else this.minimize();
    });

    // Eventos de movimiento - usar document para capturar movimiento fuera del elemento
    document.addEventListener("mousemove", (e) => this._onMove(e), {
      passive: true,
    });
    document.addEventListener("touchmove", (e) => this._onMove(e), {
      passive: true,
    });

    // Eventos de finalización - usar document para capturar eventos fuera del elemento
    document.addEventListener("mouseup", () => this._onEnd());
    document.addEventListener("touchend", () => this._onEnd());

    // Eventos adicionales para cuando se interrumpe la interacción
    document.addEventListener("mouseleave", () => this._onEnd());
    document.addEventListener("touchcancel", () => this._onEnd());

    // Cancelar si se suelta o sale del panel antes del tiempo
    this.panel.addEventListener("mouseup", this._holdAction.cancel);
    this.panel.addEventListener("touchend", this._holdAction.cancel);

    // Botón de cerrar
    const closeButton = this.panel.querySelector("#bottomsheet-close-btn");
    if (closeButton) {
      closeButton.addEventListener("click", () => this.close());
    }
  }

  /**
   * Inicializa los observers del panel
   * @private
   */
  _initializeObservers() {
    // Ajustar la altura del contenido al cambiar el tamaño del panel
    const customPanelObserver = new ResizeObserver(() =>
      this._adjustContentHeight()
    );
    customPanelObserver.observe(this.panel);
  }

  /**
   * Abrir el Panel.
   */
  open() {
    this._updateSizeLimits();
    if (this.state.isOpen && !this.state.isUpdating) {
      this.setMidSize();
      return;
    }

    const contentWrapper = this.panel.querySelector(
      "#bottomsheet-content-wrapper"
    ) as HTMLElement | null;
    if (contentWrapper) {
      contentWrapper.style.height = "";
    }

    this.showPanelContent();
    this._dispatchEvent("bottomsheet:open", { element: this.panel });
  }

  /**
   * Actualiza los límites de tamaño según el dispositivo
   * @private
   */
  _updateSizeLimits() {
    if (Helpers.isMobile()) {
      this.options.maxSize = this.container.clientHeight * 0.95;
      const panelHeader = this.panel.querySelector("#bottomsheet-header");
      const dragHandle = this.panel.querySelector("#bottomsheet-drag-handle");
      if (panelHeader && dragHandle) {
        this.options.minSize =
          panelHeader.clientHeight + dragHandle.clientHeight;
      }
    } else {
      this.options.maxSize = 500;
      this.options.minSize = 40;
    }
  }

  /**
   * Cerrar el Panel.
   */
  close() {
    this.panel.classList.remove("bottomsheet-open");
    this.panel.style.height = "";
    this.panel.style.width = "";

    this.state.isOpen = false;
    this.state.isMinimized = false;

    this._dispatchEvent("bottomsheet:close", { element: this.panel });
  }

  /**
   * Minimizar el Panel al hacer click fuera de él.
   */
  minimize() {
    if (!this.state.isOpen || this.state.isMinimized) return;

    this.hidePanelContent();
    this.state.isMinimized = true;

    if (Helpers.isMobile()) {
      this.panel.style.height = `${this.options.minSize}px`;
    } else {
      this.panel.style.width = "";
    }

    this._dispatchEvent("bottomsheet:minimized", { element: this.panel });
  }

  /**
   * Actualizar el Panel al hacer click en otro marcador.
   */
  updatePanel() {
    if (!this.state.isOpen) return;

    this.panel.classList.add("bottomsheet-updating");
    this.state.isUpdating = true;

    this._dispatchEvent("bottomsheet:updating", { element: this.panel });
  }

  /**
   * Hacer visible el contenido del panel.
   */
  showPanelContent() {
    this.panel.classList.add("bottomsheet-open");
    this.panel.classList.remove(
      "bottomsheet-updating",
      "bottomsheet-minimized"
    );
    this.panel.style.width = "";
    this.panel.style.height = "";
    this.state.isOpen = true;
    this.state.isMinimized = false;
    this.state.isUpdating = false;
  }

  /**
   * Ocultar el contenido del panel.
   */
  hidePanelContent() {
    this.state.isMinimized = true;
    this.state.isMaximized = false;
    this.panel.classList.add("bottomsheet-minimized");
    this.panel.classList.remove("bottomsheet-full");
  }

  /**
   * Establece el título del panel
   * @param {string} title - Título a mostrar
   */
  setTitle(title: string) {
    const panelTitle = this.find("#bottomsheet-title");
    if (!panelTitle) return;
    panelTitle.textContent = title || "";
  }

  /**
   * Establece el contenido de una sección por índice
   * @param {number} index - Índice de la sección (0, 1, 2, ...)
   * @param {string|HTMLElement} content - Contenido HTML o elemento a insertar
   */
  setSectionContent(index: number, content: string | HTMLElement) {
    const section = this.find(`#bottomsheet-section-${index}`);
    if (!section) {
      console.warn(`Section with index ${index} not found`);
      return;
    }

    if (typeof content === "string") {
      section.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      section.innerHTML = "";
      section.appendChild(content);
    }

    this._dispatchEvent("bottomsheet:section-updated", {
      element: this.panel,
      sectionIndex: index,
    });
  }

  /**
   * Obtiene una sección por índice
   * @param {number} index - Índice de la sección
   * @returns {HTMLElement|null}
   */
  public getSection(index: number): HTMLElement | null {
    return this.find(`#bottomsheet-section-${index}`) as HTMLElement | null;
  }

  /**
   * Limpia el contenido de una sección
   * @param {number} index - Índice de la sección
   */
  public clearSection(index: number) {
    const section = this.find(`#bottomsheet-section-${index}`);
    if (section) {
      section.innerHTML = "";
    }
  }

  /**
   * Limpia todas las secciones
   */
  public clearAllSections() {
    const sections = this.panel.querySelectorAll(
      '[id^="bottomsheet-section-"]'
    );
    sections.forEach((section) => {
      section.innerHTML = "";
    });
  }

  /**
   * Establece el botón de compartir
   * @param {string|HTMLElement} content - Contenido del botón de compartir
   */
  public setShareButton(content: string | HTMLElement) {
    const shareBtn = this.find("#bottomsheet-share-btn");
    if (!shareBtn) return;

    if (typeof content === "string") {
      shareBtn.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      shareBtn.innerHTML = "";
      shareBtn.appendChild(content);
    }
  }

  /**
   * Recorre ancestros y devuelve true si algún ancestro puede scrollear en la dirección delta
   * @param {HTMLElement} startEl - Elemento inicial
   * @param {number} delta - Dirección del scroll
   * @returns {boolean}
   * @private
   */
  private _anyScrollableAncestorCanMove(
    startEl: HTMLElement | null,
    delta: number
  ): boolean {
    let el = startEl;
    while (el && el !== this.panel) {
      if (this._canScrollYInDirection(el, delta)) return true;
      el = el.parentElement as HTMLElement | null;
    }
    return false;
  }

  /**
   * Detecta si un elemento es scrolleable en el eje Y
   * @param {HTMLElement} el - Elemento a verificar
   * @returns {boolean}
   * @private
   */
  private _isScrollableY(el: HTMLElement | null): boolean {
    if (!el || el === this.panel) return false;
    const style = getComputedStyle(el);
    const overflowY = style.overflowY;
    return (
      (overflowY === "auto" || overflowY === "scroll") &&
      el.scrollHeight > el.clientHeight
    );
  }

  /**
   * Determina si un elemento puede scrollear en la dirección del delta (vertical).
   * delta > 0 => dedo baja (intenta scroll hacia arriba)
   * delta < 0 => dedo sube (intenta scroll hacia abajo)
   * @param {HTMLElement} el - Elemento a verificar
   * @param {number} delta - Dirección del scroll
   * @returns {boolean}
   * @private
   */
  private _canScrollYInDirection(el: HTMLElement, delta: number): boolean {
    if (!this._isScrollableY(el)) return false;
    const { scrollTop, scrollHeight, clientHeight } = el;

    if (delta > 0) {
      // Intento de mover hacia abajo (finger goes down)
      return scrollTop > 5;
    } else if (delta < 0) {
      // Intento de mover hacia arriba (finger goes up)
      return scrollTop + clientHeight < scrollHeight;
    }
    return false;
  }

  /**
   * Determina si el objetivo del evento es un elemento interactivo
   * (enlaces, botones, inputs, elementos con rol button o marcados como no arrastrables)
   * @param {HTMLElement} target
   * @returns {boolean}
   * @private
   */
  private _isInteractiveTarget(target: HTMLElement): boolean {
    const interactiveSelector =
      'a, button, input, textarea, select, [role="button"], .link, .no-drag, [data-no-drag]';
    return !!(target.closest && target.closest(interactiveSelector));
  }

  /**
   * Verifica si el evento se originó en una zona válida para iniciar drag
   * Permitimos siempre el drag desde #bottomsheet-drag-handle o #bottomsheet-header
   * y bloqueamos si el origen es un elemento interactivo
   * @param {HTMLElement} target
   * @returns {boolean}
   * @private
   */
  private _isDragZone(target: HTMLElement): boolean {
    if (!target || !(target instanceof Element)) return false;
    // 1) Bloquear si viene de un elemento interactivo (links, botones, inputs, etc.)
    if (this._isInteractiveTarget(target)) return false;
    // 2) Permitir si el origen está en el handle
    if (target.closest && target.closest("#bottomsheet-drag-handle"))
      return true;
    // 3) Permitir si el origen está en el header pero no es interactivo
    if (target.closest && target.closest("#bottomsheet-header")) return true;
    // 4) Permitir si el origen está en el contenido del panel.
    if (target.closest && target.closest("#bottomsheet-content")) return true;
    return false;
  }

  /**
   * Iniciar el arrastre del Panel.
   * @param {Event} e - Evento de mouse/touch
   * @private
   */
  private _onStart(e: Event) {
    let target: HTMLElement | null = null;
    if (isMouseEvent(e)) {
      target = e.target as HTMLElement;
    }

    if (isTouchEvent(e)) {
      target = e.touches[0].target as HTMLElement;
    }

    // No iniciar drag si el click/touch ocurre sobre elementos interactivos
    if (target && !this._isDragZone(target)) {
      return;
    }

    if (this.state.isMaximized) {
      const panelContent = this.panel.querySelector("#bottomsheet-content");
      panelContent?.classList.remove("overflow-hidden");
    }

    this.state.isDragging = true;
    this.state.dragStart = Date.now();
    this.state.hasMoved = false;
    this.state.totalMovement = 0;

    this.showPanelContent(); //TODO ver si es necesario

    if (Helpers.isMobile()) {
      this.state.startPoint = isTouchEvent(e)
        ? e.touches[0].clientY
        : isMouseEvent(e)
        ? e.clientY
        : 0;
      this.state.startSize = this.panel.offsetHeight;
      this.state.prevPoint = this.state.startPoint;
    } else {
      this.state.startPoint = isMouseEvent(e)
        ? e.clientX
        : isTouchEvent(e)
        ? e.touches[0].clientX
        : 0;
      this.state.startSize = this.panel.offsetWidth;
    }

    // NO agregar la clase 'dragging' aquí, se agregará cuando haya movimiento real
    document.body.classList.add("select-none", "overflow-hidden");
  }

  /**
   * Mover el Panel.
   * @param {Event} e - Evento de mouse/touch
   * @private
   */
  private _onMove(e: MouseEvent | TouchEvent) {
    if (!this.state.isDragging) return;

    if (Helpers.isMobile() && isTouchEvent(e)) {
      this._onMoveMobile(e);
    } else if (isMouseEvent(e)) {
      this._onMoveDesktop(e);
    }

    this._dispatchEvent("bottomsheet:dragging", { element: this.panel });
  }

  /**
   * Maneja el movimiento en mobile
   * @param {Event} e - Evento de touch/mouse
   * @private
   */
  private _onMoveMobile(e: TouchEvent) {
    const currentPoint = e.touches ? e.touches[0].clientY : 0;
    const diff = this.state.startPoint - currentPoint;
    const prevPoint = this.state.prevPoint;
    this.state.prevPoint = currentPoint;
    const delta = currentPoint - prevPoint;

    // Rastrear el movimiento total
    this.state.totalMovement += Math.abs(delta);
    if (this.state.totalMovement > 5) {
      this.state.hasMoved = true;
      // Agregar clase 'dragging' solo cuando hay movimiento real
      if (!this.panel.classList.contains("bottomsheet-dragging")) {
        this.panel.classList.add("bottomsheet-dragging");
      }
    }

    // Actualizar clases de dirección de movimiento
    const panelContent = this.panel.querySelector("#bottomsheet-content");
    if (delta < 0) {
      this.panel.classList.add("bottomsheet-move-up");
      this.panel.classList.remove("bottomsheet-move-down");
      if (!this.state.isMaximized) {
        panelContent?.classList.add("overflow-hidden");
      } else {
        panelContent?.classList.remove("overflow-hidden");
      }
    } else {
      this.panel.classList.remove("bottomsheet-move-up");
      this.panel.classList.add("bottomsheet-move-down");
      panelContent?.classList.remove("overflow-hidden");
    }

    // Verificar si hay scroll disponible
    if (this._anyScrollableAncestorCanMove(e.target as HTMLElement, delta)) {
      this.state.isDragging = false;
      return;
    }

    // Calcular nuevo tamaño
    let newSize = this.state.startSize + diff;
    newSize = Math.max(
      this.options.minSize,
      Math.min(this.options.maxSize, newSize)
    );
    this.panel.style.height = `${newSize}px`;
  }

  /**
   * Maneja el movimiento en desktop
   * @param {Event} e - Evento de mouse
   * @private
   */
  private _onMoveDesktop(e: MouseEvent) {
    const currentPoint = e.clientX;
    const diff = this.state.startPoint - currentPoint;

    // Rastrear el movimiento total
    this.state.totalMovement += Math.abs(diff - (this.state.lastDiff || 0));
    this.state.lastDiff = diff;
    if (this.state.totalMovement > 5) {
      this.state.hasMoved = true;
      // Agregar clase 'dragging' solo cuando hay movimiento real
      if (!this.panel.classList.contains("bottomsheet-dragging")) {
        this.panel.classList.add("bottomsheet-dragging");
      }
    }

    let newSize = this.state.startSize + diff;
    newSize = Math.max(
      this.options.minSize,
      Math.min(this.options.maxSize, newSize)
    );
    this.panel.style.width = `${newSize}px`;
  }

  /**
   * Finalizar el arrastre del Panel.
   * @private
   */
  private _onEnd() {
    if (!this.state.isDragging) return;

    const dragDuration = Date.now() - this.state.dragStart;
    const hadMovement = this.state.hasMoved;

    this.state.hasMoved = false;
    this.state.isDragging = false;
    this.panel.classList.remove("bottomsheet-dragging");
    document.body.classList.remove("select-none", "overflow-hidden");

    // Si no hubo movimiento, fue un click, no ejecutar lógica de finalización de drag
    if (!hadMovement) return;

    if (dragDuration > 500) return;

    if (Helpers.isMobile()) {
      this._onEndMobile();
    } else {
      this._onEndDesktop();
    }
  }

  /**
   * Finaliza el arrastre en mobile
   * @private
   */
  private _onEndMobile() {
    const panelHeader = this.panel.querySelector("#bottomsheet-header");
    const dragHandle = this.panel.querySelector("#bottomsheet-drag-handle");

    if (panelHeader && dragHandle) {
      this.options.minSize = panelHeader.clientHeight + dragHandle.clientHeight;
    }

    const finalSize = this.panel.offsetHeight;
    const midThreshold = this.options.maxSize * 0.6;

    if (
      (finalSize < this.state.startSize && finalSize > midThreshold) ||
      (finalSize > this.state.startSize && finalSize < midThreshold)
    ) {
      this.setMidSize();
    } else if (finalSize < this.state.startSize && finalSize < midThreshold) {
      this.setMinSize();
    } else {
      this.setMaxSize();
    }

    if (this.state.isMaximized) {
      const panelContent = this.panel.querySelector("#bottomsheet-content");
      panelContent?.classList.remove("overflow-hidden");
    }
  }

  /**
   * Finaliza el arrastre en desktop
   * @private
   */
  private _onEndDesktop() {
    this.options.minSize = 40;
    const finalSize = this.panel.offsetWidth;

    if (finalSize < this.state.startSize) {
      this.setMinSize();
    } else {
      this.setMaxSize();
    }
  }

  /**
   * Establece el tamaño medio del panel
   */
  public setMidSize() {
    if (Helpers.isMobile()) {
      this.state.isMaximized = false;
      this.showPanelContent();
      this.panel.style.height = "50%";
      setTimeout(() => this.panel.classList.remove("bottomsheet-full"), 300);
      this._dispatchEvent("bottomsheet:midsize", { element: this.panel });
    } else {
      this.setMaxSize();
    }
  }

  /**
   * Establece el tamaño mínimo del panel
   */
  public setMinSize() {
    this.hidePanelContent();
    if (Helpers.isMobile()) {
      this.panel.style.height = `${this.options.minSize}px`;
      setTimeout(() => this.panel.classList.remove("bottomsheet-full"), 300);
    } else {
      this.panel.style.width = "";
    }
    this._dispatchEvent("bottomsheet:minsize", { element: this.panel });
  }

  /**
   * Establece el tamaño máximo del panel
   */
  public setMaxSize() {
    this.showPanelContent();
    this.state.isMaximized = true;
    if (Helpers.isMobile()) {
      this.panel.style.height = `${this.options.maxSize}px`;
      this.panel.classList.add("bottomsheet-full");
    } else {
      this.panel.style.width = `${this.options.maxSize}px`;
    }
    this._dispatchEvent("bottomsheet:maxsize", { element: this.panel });
  }

  /* --- Helpers para generar y mostrar los elementos del Panel --- */

  /**
   * Ajustar la altura del contenido del Panel al cambiar su tamaño en mobile.
   * @private
   */
  private _adjustContentHeight() {
    if (!Helpers.isMobile() || this.state.isUpdating) return;

    const contentWrapper = this.panel.querySelector(
      "#bottomsheet-content-wrapper"
    ) as HTMLElement | null;
    if (!contentWrapper) return;

    contentWrapper.style.height = `${
      this.panel.offsetHeight - contentWrapper.offsetTop
    }px`;
  }

  /**
   * Mostrar mensaje de error.
   * @param {string} message - Mensaje de error personalizado (opcional)
   */
  public showError(message: string = "") {
    const errorSection = this.panel.querySelector("#bottomsheet-error");
    const panelContent = this.panel.querySelector("#bottomsheet-content");
    const panelTitle = this.panel.querySelector("#bottomsheet-title");

    if (message) {
      const errorText = errorSection?.querySelector("span");
      if (errorText) {
        errorText.innerHTML = message;
      }
    }

    if (errorSection) errorSection.classList.add("bottomsheet-active");
    if (panelContent) panelContent.classList.add("bottomsheet-error");
    if (panelTitle) panelTitle.textContent = "";
  }

  /**
   * Ocultar mensaje de error.
   */
  public hideError() {
    const errorSection = this.panel.querySelector("#bottomsheet-error");
    const panelContent = this.panel.querySelector("#bottomsheet-content");

    if (errorSection) errorSection.classList.remove("bottomsheet-active");
    if (panelContent) panelContent.classList.remove("bottomsheet-error");
  }

  /**
   * Attach event listener.
   * @param {string} type - Tipo de evento
   * @param {Function} handler - Función manejadora
   * @param {Object} options - Opciones del listener
   */
  public on(
    type: string,
    handler: EventListenerOrEventListenerObject,
    options: boolean | AddEventListenerOptions = {}
  ) {
    this.panel.addEventListener(type, handler, options);
    this._eventListeners.push({ type, handler, options });
  }

  /**
   * Quitar un event handler según tipo
   * @param {string} type - Nombre del evento (opcional, si no se pasa elimina todos)
   */
  public off(type: string | null = null) {
    if (type) {
      this._eventListeners
        .filter((listener) => listener.type === type)
        .forEach(({ handler, options }) => {
          this.panel.removeEventListener(type, handler, options);
        });
      this._eventListeners = this._eventListeners.filter(
        (listener) => listener.type !== type
      );
    } else {
      this._eventListeners.forEach(({ type, handler, options }) => {
        this.panel.removeEventListener(type, handler, options);
      });
      this._eventListeners = [];
    }
  }

  /**
   * Obtener un elemento hijo del panel.
   * @param {string} selector - Selector CSS
   * @returns {HTMLElement|null}
   */
  public find(selector: string = ""): HTMLElement | null {
    return this.panel.querySelector(selector) as HTMLElement | null;
  }

  /**
   * Obtiene el panel.
   * @returns {HTMLElement}
   */
  public getPanel(): HTMLElement {
    return this.panel;
  }

  /**
   * Obtiene el estado de apertura del panel.
   * @returns {boolean}
   */
  public isOpen(): boolean {
    return this.state.isOpen && !this.state.isMinimized;
  }

  /**
   * Verifica si el panel está maximizado.
   * @returns {boolean}
   */
  public isMaximized(): boolean {
    return this.state.isOpen && this.state.isMaximized;
  }

  /**
   * Verifica si el panel está minimizado.
   * @returns {boolean}
   */
  public isMinimized(): boolean {
    return this.state.isMinimized;
  }

  /**
   * Verifica si hubo movimiento durante el último drag.
   * @returns {boolean}
   */
  public hasMoved(): boolean {
    return this.state.hasMoved;
  }

  /**
   * Método para emitir eventos personalizados
   * @param {string} name - Nombre del evento
   * @param {Object} detail - Detalles del evento
   * @private
   */
  private _dispatchEvent(name: string, detail: Record<string, any> = {}) {
    const event = new CustomEvent(name, { detail });
    this.panel.dispatchEvent(event);
  }
}

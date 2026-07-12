// @ts-check

/**
 * @typedef {Object} Config
 * The config object is used to configure the previews.
 * It is set globally on the window object.
 * @property {string} selector - The selector for previewable references.
 * @property {string} notSelector - The selector for references to exclude.
 * @property {string} fragmentsDir - Name of the fragments folder, under the site root.
 * @property {string} pageFragment - Fragment name representing a whole page (no anchor).
 * @property {number} openDelay - Hover intent delay (ms) before showing a preview.
 * @property {number} closeDelay - Grace period (ms) before hiding a preview.
 * @property {number} maxWidth - Maximum width of the popover (px).
 * @property {number} maxHeight - Maximum height of the popover (px).
 * @global
 */

/**
 * @typedef {Object} FragmentRef
 * @property {URL} fragment - The URL of the fragment file to fetch.
 * @property {URL} base - The URL of the target page (base for resolving relative URLs).
 */

document.addEventListener("DOMContentLoaded", function () {
  /** @type {Config | undefined} */
  // @ts-ignore
  const maybeConfig = window.sphinxGlimpseConfig;
  if (maybeConfig === undefined) {
    console.warn("Sphinx Glimpse: window.sphinxGlimpseConfig not set");
    return;
  }
  const config = maybeConfig;
  if (window.location.protocol === "file:") {
    // fragments are fetched, which requires an http(s) origin
    console.info(
      "Sphinx Glimpse: previews disabled for file:// (serve the site over HTTP)",
    );
    return;
  }

  const rootUrl = getRootUrl();
  const popover = createPopover(config);
  const supportsAnchorCss = CSS.supports("anchor-name: --sg");

  /** @type {Map<string, Promise<string | null>>} */
  const cache = new Map();

  /** @type {Element | null} the anchor of the currently shown (or pending) preview */
  let currentAnchor = null;
  /** @type {number | undefined} */
  let openTimer = undefined;
  /** @type {number | undefined} */
  let closeTimer = undefined;

  /**
   * Get the site root URL, relative to which fragment files are located.
   *
   * @returns {URL}
   */
  function getRootUrl() {
    // sphinx 7.2+ sets this on the root element of every page
    const root = document.documentElement.dataset.content_root;
    if (root !== undefined) {
      return new URL(root, window.location.href);
    }
    // fallback for older sphinx
    /** @type {{URL_ROOT?: string} | undefined} */
    // @ts-ignore
    const options = window.DOCUMENTATION_OPTIONS;
    if (options && options.URL_ROOT) {
      return new URL(options.URL_ROOT, window.location.href);
    }
    return new URL("./", window.location.href);
  }

  /**
   * Compute the fragment URL for a reference, or null if it is not previewable.
   *
   * `<root>/page.html#anchor` maps to `<root>/_fragments/page/anchor.html`,
   * so no build-time manifest of references is required.
   *
   * @param {Element} anchor - The reference element.
   * @returns {FragmentRef | null}
   */
  function fragmentRef(anchor) {
    const href = anchor.getAttribute("href");
    if (!href) {
      return null;
    }
    const target = new URL(href, window.location.href);
    if (target.origin !== window.location.origin) {
      return null;
    }
    if (!target.pathname.startsWith(rootUrl.pathname)) {
      return null;
    }
    let rel = target.pathname.slice(rootUrl.pathname.length);
    if (rel.endsWith(".html")) {
      rel = rel.slice(0, -5);
    } else if (rel.endsWith("/") || rel === "") {
      // mirror the dirhtml builder's URI scheme
      rel = rel + "index";
    }
    const anchorId = target.hash
      ? decodeURIComponent(target.hash.slice(1))
      : "";
    const name = anchorId === "" ? config.pageFragment : anchorId;
    const fragment = new URL(
      `${config.fragmentsDir}/${rel}/${encodeURIComponent(name)}.html`,
      rootUrl,
    );
    const base = new URL(target.href);
    base.hash = "";
    return { fragment: fragment, base: base };
  }

  /**
   * Fetch a fragment, with caching (including of failures).
   *
   * @param {URL} url - The fragment URL.
   * @returns {Promise<string | null>}
   */
  function fetchFragment(url) {
    const key = url.href;
    let promise = cache.get(key);
    if (promise === undefined) {
      promise = fetch(url.href)
        .then((response) => (response.ok ? response.text() : null))
        .catch(() => null);
      cache.set(key, promise);
    }
    return promise;
  }

  /**
   * Resolve relative URLs in the fragment content against the target page URL,
   * so that links and images within the preview remain correct in the host page.
   *
   * @param {HTMLElement} element - The element containing the fragment content.
   * @param {URL} base - The URL of the target page.
   */
  function rewriteUrls(element, base) {
    for (const attr of ["href", "src"]) {
      for (const el of element.querySelectorAll(`[${attr}]`)) {
        const raw = el.getAttribute(attr);
        if (raw) {
          el.setAttribute(attr, new URL(raw, base).toString());
        }
      }
    }
  }

  /**
   * Create the (single, reusable) popover element.
   *
   * @param {Config} config
   * @returns {HTMLElement}
   */
  function createPopover(config) {
    const element = document.createElement("div");
    element.id = "sphinx-glimpse-popover";
    element.classList.add("sg-popover");
    element.setAttribute("role", "tooltip");
    if (supportsPopover()) {
      element.setAttribute("popover", "auto");
    } else {
      element.hidden = true;
    }
    element.style.setProperty("--sg-max-width", `${config.maxWidth}px`);
    element.style.setProperty("--sg-max-height", `${config.maxHeight}px`);
    // keep the preview open while the pointer is over it
    element.addEventListener("mouseenter", () =>
      window.clearTimeout(closeTimer),
    );
    element.addEventListener("mouseleave", scheduleClose);
    document.body.appendChild(element);
    return element;
  }

  /**
   * @returns {boolean} whether the browser supports the Popover API.
   */
  function supportsPopover() {
    return typeof HTMLElement.prototype.showPopover === "function";
  }

  /**
   * Show the popover, containing fragment content, anchored to a reference.
   *
   * @param {Element} anchor - The reference element.
   * @param {string} content - The fragment HTML.
   * @param {URL} base - The URL of the target page.
   */
  function showPopover(anchor, content, base) {
    hidePopover();
    popover.innerHTML = content;
    rewriteUrls(popover, base);
    currentAnchor = anchor;
    anchor.setAttribute("aria-describedby", popover.id);
    if (supportsAnchorCss && anchor instanceof HTMLElement) {
      // anchor the popover to the reference via CSS anchor positioning
      anchor.style.setProperty("anchor-name", "--sphinx-glimpse");
    }
    if (supportsPopover()) {
      try {
        popover.showPopover();
      } catch (e) {
        // e.g. already shown
      }
    } else {
      popover.hidden = false;
    }
    if (!supportsAnchorCss) {
      positionPopover(anchor);
    }
    typesetMath();
  }

  /** Hide the popover, and clean up the previous anchor. */
  function hidePopover() {
    window.clearTimeout(openTimer);
    window.clearTimeout(closeTimer);
    if (currentAnchor !== null) {
      currentAnchor.removeAttribute("aria-describedby");
      if (currentAnchor instanceof HTMLElement) {
        currentAnchor.style.removeProperty("anchor-name");
      }
      currentAnchor = null;
    }
    if (supportsPopover()) {
      try {
        popover.hidePopover();
      } catch (e) {
        // e.g. already hidden
      }
    } else {
      popover.hidden = true;
    }
  }

  /**
   * Fallback positioning, for browsers without CSS anchor positioning:
   * place the popover below/right of the reference, flipping to fit the viewport.
   *
   * @param {Element} anchor - The reference element.
   */
  function positionPopover(anchor) {
    const rect = anchor.getBoundingClientRect();
    const margin = 8;
    const width = Math.min(config.maxWidth, window.innerWidth - margin * 2);
    let left = rect.left;
    if (left + width + margin > window.innerWidth) {
      left = window.innerWidth - width - margin;
    }
    let top = rect.bottom + margin;
    const height = Math.min(config.maxHeight, window.innerHeight - margin * 2);
    if (
      top + height > window.innerHeight &&
      rect.top > window.innerHeight - rect.bottom
    ) {
      top = Math.max(margin, rect.top - height - margin);
    }
    popover.style.position = "fixed";
    popover.style.left = `${left}px`;
    popover.style.top = `${top}px`;
  }

  /** Typeset any math in the popover content, if MathJax is available. */
  function typesetMath() {
    // @ts-ignore
    const mathjax = window.MathJax;
    if (
      mathjax &&
      typeof mathjax.typesetPromise === "function" &&
      popover.querySelector(".math")
    ) {
      mathjax
        .typesetPromise([popover])
        .catch(
          /** @param {unknown} error */ (error) =>
            console.warn(`Sphinx Glimpse: MathJax typeset failed: ${error}`),
        );
    }
  }

  /**
   * Find the previewable reference for an event target, if any.
   *
   * @param {EventTarget | null} target
   * @returns {Element | null}
   */
  function findAnchor(target) {
    if (!(target instanceof Element)) {
      return null;
    }
    const anchor = target.closest(config.selector);
    if (anchor === null || anchor.matches(config.notSelector)) {
      return null;
    }
    return anchor;
  }

  /**
   * Fetch and show the preview for a reference.
   *
   * @param {Element} anchor - The reference element.
   */
  function openPreview(anchor) {
    const ref = fragmentRef(anchor);
    if (ref === null) {
      return;
    }
    currentAnchor = anchor;
    fetchFragment(ref.fragment).then((content) => {
      // ignore stale responses, e.g. if the pointer has moved on
      if (content !== null && currentAnchor === anchor) {
        showPopover(anchor, content, ref.base);
      }
    });
  }

  /** Schedule hiding the popover, after the configured grace period. */
  function scheduleClose() {
    window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(hidePopover, config.closeDelay);
  }

  // hover interaction (delegated, so references inside the popover also work)
  document.addEventListener("mouseover", (event) => {
    const anchor = findAnchor(event.target);
    if (anchor === null) {
      return;
    }
    window.clearTimeout(closeTimer);
    if (anchor === currentAnchor) {
      return;
    }
    window.clearTimeout(openTimer);
    openTimer = window.setTimeout(() => openPreview(anchor), config.openDelay);
  });
  document.addEventListener("mouseout", (event) => {
    const anchor = findAnchor(event.target);
    if (anchor === null) {
      return;
    }
    window.clearTimeout(openTimer);
    if (anchor === currentAnchor) {
      scheduleClose();
    }
  });

  // keyboard interaction
  document.addEventListener("focusin", (event) => {
    const anchor = findAnchor(event.target);
    if (anchor !== null && anchor !== currentAnchor) {
      openPreview(anchor);
    } else if (anchor === null && currentAnchor !== null) {
      hidePopover();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      hidePopover();
    }
  });

  // fallback positioning must track scrolling/resizing
  if (!supportsAnchorCss) {
    for (const eventName of ["scroll", "resize"]) {
      window.addEventListener(eventName, () => {
        if (currentAnchor !== null && !popover.hidden) {
          positionPopover(currentAnchor);
        }
      });
    }
  }
});

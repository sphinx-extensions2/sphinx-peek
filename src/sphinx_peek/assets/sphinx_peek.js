// @ts-check

/**
 * @typedef {Object} Config
 * The config object is used to configure the preview.
 * It is set globally on the window object.
 * @property {string} selector - The selector to match.
 * @property {string} notSelector - The selector to exclude.
 * @property {string} iconType - The element type of the icon (e.g. span or sup).
 * @property {string} iconOpen - The SVG for the open icon.
 * @property {string} iconClose - The SVG for the close icon.
 * @property {number} width - The width of the preview (or window width if smaller).
 * @property {number} height - The height of the preview (or window height if smaller).
 * @property {Object} offset - The offset of the preview.
 * @property {number} offset.left - The horizontal offset of the preview.
 * @property {number} offset.top - The vertical offset of the preview.
 * @property {number} openDelay - The delay in milliseconds before the preview opens.
 * @global
 */

// add preview icons once the page is loaded
document.addEventListener("DOMContentLoaded", function () {
  /**
   * @type {Config}
   */
  // @ts-ignore
  var config = window.sphinxPeekConfig;
  if (config === undefined) {
    console.warn("Sphinx Peek: window.sphinxPeekConfig not set");
    return;
  }

  // add preview icon after all selected links
  document.querySelectorAll(config.selector).forEach(function (element) {
    if (element.matches(config.notSelector)) {
      return;
    }
    let href = element.getAttribute("href");
    if (href === null) {
      console.warn(`Sphinx Peek: Link without href: ${element}`);
      return;
    }
    element.insertAdjacentHTML(
      "afterend",
      `<${config.iconType} class="sp-icon-container" data-sp-link="${href}">${config.iconOpen}</${config.iconType}>`,
    );
  });

  /**
   * The currently active preview anchor.
   *
   * @type {Element|null}
   */
  var current_anchor = null;

  /**
   * Handles click events on a specific element.
   *
   * @this {HTMLElement} - The element that was clicked.
   */
  let click_function = function () {
    // If a preview is already active, we need to close it
    if (current_anchor !== null) {
      // We need to remove the preview div including the iframe,
      // otherwise chromium based browser handle strange and do not reload the iframe correctly.
      // They just go to the top of the page and stay there forever.
      document.querySelectorAll("#sp_overlay").forEach((e) => {
        if (e instanceof HTMLElement) {
          e.style.display = "none";
        }
        e.remove();
      });
      current_anchor.innerHTML = config.iconOpen;
      if (current_anchor.isSameNode(this)) {
        // if we have clicked on the same link again,
        // we do not need to do anything else
        current_anchor = null;
        return;
      }
    }

    current_anchor = this;
    this.innerHTML = config.iconClose;

    // add preview elements
    let link_target = this.getAttribute("data-sp-link");
    this.insertAdjacentHTML(
      "beforeend",
      `<div id="sp_overlay" class="sp-overlay"><div id="sp_modal" class="sp-modal"><iframe id="sp_preframe" class="sp-iframe" src="${link_target}" onload=scrollToContent(this)></iframe></div></div>`,
    );
    // stop click event propagation on the preview window,
    // to prevent closing the preview if we resize it (treated as a click)
    let preview = document.getElementById("sp_modal");
    if (preview instanceof HTMLElement) {
      preview.addEventListener("click", function (event) {
        event.stopPropagation();
      });
      setPreviewPosition(preview, this, config);
    }

    // show iframe after some time, to hide load flickering
    window.setTimeout(function () {
      let overlay = document.getElementById("sp_overlay");
      if (overlay instanceof HTMLElement) {
        overlay.style.display = "block";
      }
    }, config.openDelay);
  };

  document
    .querySelectorAll(`${config.iconType}.sp-icon-container`)
    .forEach((e) => e.addEventListener("click", click_function));

  for (let eventName of ["scroll", "resize"]) {
    addEventListener(eventName, () => {
      if (current_anchor instanceof HTMLElement) {
        let preview = document.getElementById("sp_modal");
        if (preview instanceof HTMLElement) {
          setPreviewPosition(preview, current_anchor, config);
        }
      }
    });
  }
});

/**
 * Set the position and size of the preview window.
 *
 * @param {HTMLElement} preview - The preview element.
 * @param {HTMLElement} anchor - The anchor element.
 * @param {Config} config - The preview width will be the min of this and the window width.
 */
function setPreviewPosition(preview, anchor, config) {
  // compute required link and window data
  let position_anchor = {
    left: anchor.offsetLeft - window.scrollX,
    top: anchor.offsetTop - window.scrollY,
  };

  // set iframe position relative to link,
  // by default anchoring below and right of it
  let pos_left = anchor.offsetLeft + config.offset.left;
  let pos_screen_left = position_anchor.left + config.offset.left;
  let pos_screen_top = position_anchor.top + config.offset.top;
  let width = config.width;
  let height = config.height;
  let marginX = 10;

  // ensure width is not bigger than window width + margin
  let maxWidth = window.innerWidth - marginX * 2;
  if (width > maxWidth) {
    width = maxWidth;
  }
  // ensure whole width is visible on screen
  if (pos_screen_left + width + marginX > window.innerWidth) {
    pos_left = window.innerWidth - width - marginX;
  }
  // ensure height is not bigger than window height
  if (height > window.innerHeight) {
    height = window.innerHeight;
  }
  // anchor above link if not enough space below,
  // and if there is enough space above
  if (
    pos_screen_top + height > window.innerHeight &&
    pos_screen_top - height - 10 > 0
  ) {
    pos_screen_top = position_anchor.top - height - 10;
  }
  // set preview position and size via css
  preview.style.width = width + "px";
  preview.style.height = height + "px";
  preview.style.top = pos_screen_top + "px";
  preview.style.left = pos_left + "px";
  preview.style.position = "fixed";
}

/**
 * Activated on iframe load.
 * It ensures that the iframe is scrolled to the target link position,
 * since sometimes the browser does not handle this properly automatically.
 * Note, this can be blocked by CORS (obtaining the iframe content),
 * if the iframe is not on the same domain, or the page is not being served.
 *
 * @param {HTMLIFrameElement} iframe - The iframe that was loaded.
 */
function scrollToContent(iframe) {
  var target = iframe.getAttribute("src");
  if (target === null) {
    console.warn(
      `Sphinx Peek: Cannot get iframe src attribute for '${target}'`,
    );
    return;
  }
  var targetId = target.split("#")[1];
  if (targetId !== undefined) {
    setTimeout(function () {
      try {
        let contentWindow = iframe.contentWindow;
        if (contentWindow === null) {
          console.warn(
            `Sphinx Peek: Cannot access iframe content window for '${target}'`,
          );
          return;
        }
        // try to get the target element by id
        var element = contentWindow.document.getElementById(targetId);
      } catch (e) {
        // if we cannot access the iframe content, we cannot scroll to the target
        console.warn(
          `Sphinx Peek: Cannot access iframe content for '${target}': ${e}`,
        );
        return;
      }
      if (element) {
        // see: https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView#behavior
        element.scrollIntoView({ behavior: "instant" });
      } else {
        console.warn(`Sphinx Peek: Target does not exist: ${target}`);
        // if target link doesn't exist, scroll to the top of the page
        // iframe.contentWindow.scrollTo(0, 0);
      }
    }, 500);
  }
}

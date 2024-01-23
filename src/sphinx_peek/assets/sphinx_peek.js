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
 * @property {number} width - The width of the preview.
 * @property {number} height - The height of the preview.
 * @property {Object} offset - The offset of the preview.
 * @property {number} offset.left - The left offset of the preview.
 * @property {number} offset.top - The top offset of the preview.
 * @property {number} timeout - The timeout for the preview.
 * @global
 */

/**
 * @type {Config}
 */
// @ts-ignore
window.sphinxPreviewConfig = {
  selector: "div.main a.reference.internal",
  notSelector: ".toctree-wrapper a",
  iconType: "sup",
  iconOpen:
    '<svg class="sp-preview-icon sp-preview-open" height="1.5em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M6.30147 15.5771C4.77832 14.2684 3.6904 12.7726 3.18002 12C3.6904 11.2274 4.77832 9.73158 6.30147 8.42294C7.87402 7.07185 9.81574 6 12 6C14.1843 6 16.1261 7.07185 17.6986 8.42294C19.2218 9.73158 20.3097 11.2274 20.8201 12C20.3097 12.7726 19.2218 14.2684 17.6986 15.5771C16.1261 16.9282 14.1843 18 12 18C9.81574 18 7.87402 16.9282 6.30147 15.5771ZM12 4C9.14754 4 6.75717 5.39462 4.99812 6.90595C3.23268 8.42276 2.00757 10.1376 1.46387 10.9698C1.05306 11.5985 1.05306 12.4015 1.46387 13.0302C2.00757 13.8624 3.23268 15.5772 4.99812 17.0941C6.75717 18.6054 9.14754 20 12 20C14.8525 20 17.2429 18.6054 19.002 17.0941C20.7674 15.5772 21.9925 13.8624 22.5362 13.0302C22.947 12.4015 22.947 11.5985 22.5362 10.9698C21.9925 10.1376 20.7674 8.42276 19.002 6.90595C17.2429 5.39462 14.8525 4 12 4ZM10 12C10 10.8954 10.8955 10 12 10C13.1046 10 14 10.8954 14 12C14 13.1046 13.1046 14 12 14C10.8955 14 10 13.1046 10 12ZM12 8C9.7909 8 8.00004 9.79086 8.00004 12C8.00004 14.2091 9.7909 16 12 16C14.2092 16 16 14.2091 16 12C16 9.79086 14.2092 8 12 8Z"></path></svg>',
  iconClose:
    '<svg class="sp-preview-icon sp-preview-close" height="1.5em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M19.7071 5.70711C20.0976 5.31658 20.0976 4.68342 19.7071 4.29289C19.3166 3.90237 18.6834 3.90237 18.2929 4.29289L14.032 8.55382C13.4365 8.20193 12.7418 8 12 8C9.79086 8 8 9.79086 8 12C8 12.7418 8.20193 13.4365 8.55382 14.032L4.29289 18.2929C3.90237 18.6834 3.90237 19.3166 4.29289 19.7071C4.68342 20.0976 5.31658 20.0976 5.70711 19.7071L9.96803 15.4462C10.5635 15.7981 11.2582 16 12 16C14.2091 16 16 14.2091 16 12C16 11.2582 15.7981 10.5635 15.4462 9.96803L19.7071 5.70711ZM12.518 10.0677C12.3528 10.0236 12.1792 10 12 10C10.8954 10 10 10.8954 10 12C10 12.1792 10.0236 12.3528 10.0677 12.518L12.518 10.0677ZM11.482 13.9323L13.9323 11.482C13.9764 11.6472 14 11.8208 14 12C14 13.1046 13.1046 14 12 14C11.8208 14 11.6472 13.9764 11.482 13.9323ZM15.7651 4.8207C14.6287 4.32049 13.3675 4 12 4C9.14754 4 6.75717 5.39462 4.99812 6.90595C3.23268 8.42276 2.00757 10.1376 1.46387 10.9698C1.05306 11.5985 1.05306 12.4015 1.46387 13.0302C1.92276 13.7326 2.86706 15.0637 4.21194 16.3739L5.62626 14.9596C4.4555 13.8229 3.61144 12.6531 3.18002 12C3.6904 11.2274 4.77832 9.73158 6.30147 8.42294C7.87402 7.07185 9.81574 6 12 6C12.7719 6 13.5135 6.13385 14.2193 6.36658L15.7651 4.8207ZM12 18C11.2282 18 10.4866 17.8661 9.78083 17.6334L8.23496 19.1793C9.37136 19.6795 10.6326 20 12 20C14.8525 20 17.2429 18.6054 19.002 17.0941C20.7674 15.5772 21.9925 13.8624 22.5362 13.0302C22.947 12.4015 22.947 11.5985 22.5362 10.9698C22.0773 10.2674 21.133 8.93627 19.7881 7.62611L18.3738 9.04043C19.5446 10.1771 20.3887 11.3469 20.8201 12C20.3097 12.7726 19.2218 14.2684 17.6986 15.5771C16.1261 16.9282 14.1843 18 12 18Z"/></svg>',
  width: 500,
  height: 300,
  offset: { left: 20, top: 20 },
  timeout: 50,
};

// add preview icons once the page is loaded
document.addEventListener("DOMContentLoaded", function () {
  /**
   * @type {Config}
   */
  // @ts-ignore
  var config = window.sphinxPreviewConfig;

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
      `<${config.iconType} class="sp-preview-icon-container" data-sp-link="${href}">${config.iconOpen}</${config.iconType}>`,
    );
  });

  /**
   * The currently active preview anchor.
   *
   * @type {Element|null}
   */
  var current_preview = null;

  /**
   * Handles click events on a specific element.
   *
   * @this {HTMLElement} - The element that was clicked.
   */
  let click_function = function () {
    // If a preview is already active, we need to close it
    if (current_preview !== null) {
      // We need to remove the preview div including the iframe,
      // otherwise chromium based browser handle strange and do not reload the iframe correctly.
      // They just go to the top of the page and stay there forever.
      document.querySelectorAll("#sp_overlay").forEach((e) => {
        if (e instanceof HTMLElement) {
          e.style.display = "none";
        }
        e.remove();
      });
      current_preview.innerHTML = config.iconOpen;
      if (current_preview.isSameNode(this)) {
        // if we have clicked on the same link again,
        // we do not need to do anything else
        current_preview = null;
        return;
      }
    }

    current_preview = this;
    this.innerHTML = config.iconClose;

    let link_target = this.getAttribute("data-sp-link");
    // we always need to add a "new" iframe and div container, otherwise
    // chromium based browser act strange
    this.insertAdjacentHTML(
      "beforeend",
      '<div id="sp_overlay"><div id="sp_preview"><iframe id="sp_preframe" src="" onload=scrollToContent(this)></iframe></div></div>',
    );
    let frame = this.querySelector("#sp_preframe");
    if (link_target !== null && frame !== null) {
      frame.setAttribute("src", link_target); //  update iframe src
    }

    setPreviewPosition(
      this,
      config.width,
      config.height,
      config.offset.left,
      config.offset.top,
    );

    // show iframe after some time, to hide load flickering
    window.setTimeout(function () {
      let overlay = document.querySelector("#sp_overlay");
      if (overlay instanceof HTMLElement) {
        overlay.style.display = "block";
      }
    }, config.timeout);
  };

  document
    .querySelectorAll(`${config.iconType}.sp-preview-icon-container`)
    .forEach((e) => e.addEventListener("click", click_function));
});

/**
 * Set the position and size of the preview window.
 *
 * @param {HTMLElement} anchor - The anchor element.
 * @param {number} width - The preview width will be the min of this and the window width.
 * @param {number} height - The preview height will be the min of this and the window height.
 * @param {number} offsetLeft - The preview horizontal offset to the anchor element.
 * @param {number} offsetTop - The preview vertical offset to the anchor element.
 */
function setPreviewPosition(anchor, width, height, offsetLeft, offsetTop) {
  // compute required link and window data
  let position_anchor = {
    left: anchor.offsetLeft - window.scrollX,
    top: anchor.offsetTop - window.scrollY,
  };

  // set iframe position relative to link,
  // by default anchoring below and right of it
  let pos_left = anchor.offsetLeft + offsetLeft;
  let pos_screen_left = position_anchor.left + offsetLeft;
  let pos_screen_top = position_anchor.top + offsetTop;

  // ensure width is not bigger than window width
  if (width > window.innerWidth) {
    width = window.innerWidth;
  }
  // anchor left of link if not enough space on right
  if (pos_screen_left + width + 50 > window.innerWidth) {
    pos_left = window.innerWidth - width - 50;
  }
  if (pos_left < 0) {
    pos_left = 50;
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
  let preview = document.querySelector("#sp_preview");
  if (preview instanceof HTMLElement) {
    preview.style.width = width + "px";
    preview.style.height = height + "px";
    preview.style.top = pos_screen_top + "px";
    preview.style.left = pos_left + "px";
    preview.style.position = "fixed";
  }
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
    console.log(`Sphinx Peek: Cannot get iframe src attribute for '${target}'`);
    return;
  }
  var targetId = target.split("#")[1];
  if (targetId !== undefined) {
    setTimeout(function () {
      try {
        let contentWindow = iframe.contentWindow;
        if (contentWindow === null) {
          console.log(
            `Sphinx Peek: Cannot access iframe content window for '${target}'`,
          );
          return;
        }
        // try to get the target element by id
        var element = contentWindow.document.getElementById(targetId);
      } catch (e) {
        // if we cannot access the iframe content, we cannot scroll to the target
        console.log(
          `Sphinx Peek: Cannot access iframe content for '${target}': ${e}`,
        );
        return;
      }
      if (element) {
        element.scrollIntoView({ behavior: "auto" });
      } else {
        console.warn(`Sphinx Peek: Target does not exist: ${target}`);
        // if target link doesn't exist, scroll to the top of the page
        // iframe.contentWindow.scrollTo(0, 0);
      }
    }, 500);
  }
}

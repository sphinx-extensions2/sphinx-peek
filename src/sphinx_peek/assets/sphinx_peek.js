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
      `<div id="sp_overlay" class="sp-overlay"><div id="sp_modal" class="sp-modal"><iframe id="sp_preframe" class="sp-iframe" src="${link_target}" onload=onIframeLoad(this)></iframe></div></div>`,
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

  // is the whole height (+ margin) not visible below the anchor
  if (pos_screen_top + height + 20 > window.innerHeight) {
    if (window.innerHeight - position_anchor.top > position_anchor.top) {
      // more space below the anchor, so just adjust height
      height = window.innerHeight - position_anchor.top - 20;
    } else {
      // more space above the anchor, so move it there
      pos_screen_top = position_anchor.top - height - 10;
      if (pos_screen_top < 10) {
        // shrink height to fit in screen
        pos_screen_top = 10;
        height = position_anchor.top - 20;
      }
    }
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
 * It ensures that the iframe is scrolled to the target position,
 * if the src URL contains a target, e.g. `index.html#target`,
 * since sometimes the browser does not handle this automatically
 * (it seems to work in Firefox, not in Chrome, and Safari scrolls but to the wrong location!).
 *
 * Note, this can be blocked by CORS (obtaining the iframe.contentDocument),
 * if the iframe.src is not from the same origin, or the page is not being served.
 *
 * @param {HTMLIFrameElement} iframe - The iframe that was loaded.
 */
function onIframeLoad(iframe) {
  setTimeout(function () {
    // try to get iframe contentDocument (this is the same as iframe.contentWindow.document)
    // if we cannot access the iframe content, we cannot scroll to the target
    // this can happen if the iframe is not on the same domain, or the page is not being served, due to CORS
    // https://developer.mozilla.org/en-US/docs/Web/API/HTMLIFrameElement/contentDocument
    try {
      var contentDocument = iframe.contentDocument;
    } catch (e) {
      console.info(
        `Sphinx Peek: Cannot access iframe contentDocument: ${e}`,
        iframe,
      );
      return;
    }
    if (contentDocument === null) {
      console.info("Sphinx Peek: Cannot access iframe contentDocument", iframe);
      return;
    }

    // add a class to the iframe document, so we can add CSS depending on it
    contentDocument.documentElement.classList.add("sp-iframe-document");

    let src = iframe.getAttribute("src");
    if (src === null) {
      console.warn("Sphinx Peek: Cannot get iframe 'src' attribute", iframe);
    } else {
      let anchorIndex = src.indexOf("#");
      let anchorId = src.substring(anchorIndex + 1);
      if (anchorIndex !== -1 && anchorId !== "") {
        // try to get the anchor element by id
        let anchor = contentDocument.getElementById(anchorId);
        if (anchor === null) {
          console.warn(
            `Sphinx Peek: Anchor ${anchorId} does not exist in iframe contentDocument`,
            iframe,
          );
          return;
        }
        // https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView#behavior
        // Note this seems to have some differing behavior between browsers:
        // - Firefox (OSX arm64, 121.0): works as expected
        // - Chrome (OSX arm64, 120.0.6099.216):
        //   - does not appear to respect the behavior "instant", i.e. the scrolling is visible
        // - Safari (OSX arm64, 17.2.1):
        //   - it can sometimes scroll the parent page as well to bring the element to the top of parent page
        let scrollTop = window.document.documentElement.scrollTop;
        anchor.scrollIntoView({ behavior: "instant" });
        if (window.document.documentElement.scrollTop !== scrollTop) {
          // "fix" the Safari behavior by restoring the original scroll position
          // TODO this should also be done for all window parents, i.e. when opening nested iframes
          window.document.documentElement.scrollTo({
            top: scrollTop,
            behavior: "instant",
          });
        }
        // Note this was another solution proposed, but it does not seem to work
        // https://stackoverflow.com/questions/20956663/scrollintoview-to-apply-to-iframe-only/20958953#20958953
        // contentDocument.documentElement.scrollTop = element.offsetTop;
      }
    }
  }, 200);
}

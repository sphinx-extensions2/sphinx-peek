# Another page

This page demonstrates cross-page previews:
hover over the references on the [index page](./index.md) to preview targets on this page.

(other-section)=
## A section on another page

This paragraph is included in the preview of this section,
demonstrating that previews are fetched lazily from other pages,
and that any links within them, like this one to a {term}`Fragment`,
resolve correctly relative to the *target* page.

```{figure} fun-fish.png
:name: other-figure
:width: 200px

A figure on another page (with a local image URI, resolved by the client).
```

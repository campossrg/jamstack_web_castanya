## Page Speed Improvements

This note captures the current Lighthouse-driven performance issues observed on the deployed site and the highest-impact refactors to address them.

### Current Symptoms

- Performance score around `51`
- `First Contentful Paint`: `2.0s`
- `Largest Contentful Paint`: `8.2s`
- `Speed Index`: `60.5s`
- `Time to Interactive`: `48.1s`
- `Total Blocking Time`: `50ms`
- `Cumulative Layout Shift`: `0.13`

Interpretation:

- JavaScript execution is not the main bottleneck because `Total Blocking Time` is low.
- The main issues are large render assets, especially images, and some avoidable render-blocking resource loading.

### Main Findings

1. Oversized images are the biggest issue.

- `src/assets/images/gallery/index_background.png` is about `16 MB`
- `src/assets/images/gallery/fusta_columpio.jpg` is about `13.7 MB`
- `src/assets/images/gallery/espai-gastronomic/castanya_plat.jpg` is about `12 MB`
- `src/assets/images/gallery/banner-parc-natural.png` is about `7.1 MB`

These align directly with Lighthouse opportunities such as:

- `Serve images in next-gen formats`
- `Properly size images`

2. Homepage images are delivered without responsive sizing metadata.

Examples:

- `src/index.html:12` uses `/assets/images/gallery/index_background.png`
- `src/index.html:85` uses `/assets/images/gallery/banner-parc-natural.png`
- `src/index.html:97` uses `/assets/images/gallery/chalet_coromina_dish.jpg`

These images currently lack combinations of:

- `srcset`
- `sizes`
- `width`
- `height`
- `fetchpriority`

3. Many below-the-fold images are missing lazy-loading hints.

Recommended defaults where appropriate:

- `loading="lazy"`
- `decoding="async"`

4. The main stylesheet starts with a remote CSS import.

File:

- `src/assets/css/style.css:1`

Current code:

```css
@import url("https://cdnjs.cloudflare.com/ajax/libs/meyer-reset/2.0/reset.min.css");
```

This adds an extra render-blocking dependency before the main stylesheet fully resolves.

5. Global JavaScript is loaded site-wide and contains many page-specific behaviors.

Files:

- `src/_includes/layouts/base.njk:77`
- `src/assets/js/main.js`

This is a secondary concern. It should be reviewed after image and CSS delivery are improved.

### Recommended Priority Order

1. Optimize the homepage hero and key section images first.
2. Add responsive image attributes and proper loading hints.
3. Remove the remote CSS `@import` and serve the reset locally or inline a minimal reset.
4. Review `main.js` for page-specific code that can be deferred or split.

### Concrete Refactor Targets

#### 1. Replace oversized homepage images

Start with:

- `src/assets/images/gallery/index_background.png`
- `src/assets/images/gallery/banner-parc-natural.png`
- `src/assets/images/gallery/chalet_coromina_dish.jpg`

Recommended actions:

- Convert to `WebP` or `AVIF`
- Resize to realistic display dimensions
- Keep originals only if there is a concrete editorial need

#### 2. Improve image markup on key templates

Audit these files first:

- `src/index.html`
- `src/_includes/layouts/visit-activity.njk`
- `src/_includes/layouts/product.njk`
- `src/blog/index.html`
- `src/professionals/index.html`
- `src/fusta/index.html`
- `src/gastronomic/index.html`

For above-the-fold images:

- add `width` and `height`
- add `fetchpriority="high"` for the LCP image
- add responsive `srcset` and `sizes`

For below-the-fold images:

- add `loading="lazy"`
- add `decoding="async"`
- add `width` and `height` where possible

#### 3. Remove render-blocking remote CSS import

Refactor:

- move the reset into a local stylesheet or inline a minimal reset at the top of `style.css`

Why:

- avoids an external blocking request
- improves first render reliability

#### 4. Review JavaScript payload after asset fixes

Notes:

- `main.js` is loaded globally from `src/_includes/layouts/base.njk`
- it includes multiple carousel and page-specific setup functions
- TBT is already low, so this is not the first optimization target

Possible follow-up work:

- guard or defer page-specific initializers more aggressively
- split feature code if the file keeps growing

### Expected Outcome

If the image delivery issues are fixed first, the most likely improvements are:

- better `Largest Contentful Paint`
- better `Speed Index`
- lower effective `Time to Interactive`
- more stable rendering with less layout shift risk

### Suggested Next Implementation Pass

1. Optimize and replace the homepage hero and supporting section images.
2. Update homepage image markup with responsive and lazy-loading attributes.
3. Remove the remote reset import from `style.css`.
4. Re-run Lighthouse and compare LCP and image opportunity savings.

# Animal-Themed Action Icon Prompt Pack

Use the shared art direction with exactly one size-specific prompt below for each generated asset. Attach the proposal image as the style reference, not as a layout to reproduce. Generate all 54 assets separately: three sizes for each of 17 operations plus Settings. Use approved results only as style references, never as compositions to resize. Keep animal identity, perspective, and palette consistent while adapting proportions, outline weight, and detail to each target size.

The filenames match the current `assets/icons/` action icons. Each prompt names its exact output path. Request a large square working image if the image model cannot produce clean small PNGs, but design it specifically for the intended final size and finish it at that size. Export actual RGBA PNG files; do not merely rename a larger image or derive all three sizes from one illustration. No application code or filename changes are needed for replacements.

## Shared Art Direction

Create one polished, friendly, animal-themed utility icon for a Chrome tab manager. Use a crisp, simple, hand-drawn cartoon illustration with expressive animal character, chunky dark navy outlines, clean vector-like shapes, and a small number of bright sky-blue, leaf-green, warm yellow, cream, and restrained coral accents. Keep the animal secondary to the action symbol: the action must still be identifiable if the animal is viewed as a tiny silhouette.

Use a square 1:1 canvas with transparent pixels around the artwork. Center one compact composition inside approximately the middle 84% of the canvas, leaving clear padding on all sides. Prefer one animal, one primary object, and one unmistakable action cue. Use large separated shapes, generous negative space, and navy outlines adjusted to the final pixel size. Keep the face and action cue simple; avoid tiny eyes, fine texture, narrow gaps, and detail that merges at the intended size. Use flat, solid fills rather than gradients or photographic lighting.

The icon will appear on both pale blue and warm yellow UI plates in light and dark themes. Keep the outer canvas transparent, give the artwork strong luminance contrast, and do not rely on a colored background to communicate meaning. Use coral/red only for removal or closing actions. No text, letters, numbers, logos, watermarks, extra objects, interface screenshot, border, or multiple-icon sheet. Output one icon only.

## Size and Theme Brief

| Export | Destination | Additional instruction for the image AI |
| --- | --- | --- |
| 128 x 128 | `assets/icons/128/<filename>` | Full animal character and action symbol, still a compact icon rather than a scene. Keep the main action readable without inspecting the face. |
| 48 x 48 | `assets/icons/48/<filename>` | Generate an independent compact composition. Keep one animal head or upper body, one dominant action cue, and only the scope objects needed to distinguish the action. Avoid thin whiskers, feathers, fur texture, and decorative accessories. |
| 16 x 16 | `assets/icons/16/<filename>` | Generate an independent pixel-conscious miniature, not a detailed picture shrunk down. Keep a minimal animal silhouette, one large action symbol, and at most one compact scope cue. Omit facial detail and secondary props. Avoid gaps or outlines thinner than one final pixel. |

Use the same filenames in all three directories. Never place a baked checkerboard, opaque square, text caption, shadow halo, or UI count inside the PNG. Counts and labels are rendered separately by the extension.

Preview each export at its actual size on white, pale blue `#e0f1fa`, warm yellow `#fff0c7`, and dark green `#243c3a`. The current action tiles provide light-colored icon plates even in dark mode, but small category-tab icons may sit directly on dark surfaces. Use a narrow cream edge on dark animal silhouettes if necessary; do not invert the entire illustration or rely on glow. One theme-safe asset set is preferable to separate light/dark files because the current registry uses one path per size.

At 16px, domain vs base-domain and current vs all-windows cannot reliably be communicated through tiny favicon details alone. Keep visible UI labels and tooltips; the illustration supports them rather than replacing them. Use these consistent scope cues throughout the set:

- **Current window:** one source-window outline.
- **All windows:** two overlapping source-window outlines; avoid crowded scenes.
- **Move to new window:** an outward arrow ending at a separate outlined window.
- **Bring here:** an inward arrow ending inside a highlighted existing window.
- **Domain:** repeated identical tab symbols.
- **Base domain:** repeated shared main symbols with differing corner marks at 48px/128px. Omit those tiny corner marks at 16px rather than rendering visual noise.
- **Close/remove:** a large X on the affected tabs, never on the entire browser window. Preserve at least one tab for duplicate removal.

Each prompt below is a separate generation request. Copy the shared art direction and the matching prompt together; do not combine different sizes in one image. At 16px, prioritize the action symbol over complete animal anatomy or scope detail. The intentional similarity between some miniature variants is preferable to illegible detail; visible labels and tooltips provide the full operation name.

## Research Applied

- [Chrome extension accessibility](https://developer.chrome.com/docs/extensions/develop/ui/a11y): keep semantic controls, meaningful accessible names, and readable labels independent of decorative animals.
- [Chrome side-panel guidance](https://developer.chrome.com/docs/extensions/reference/api/sidePanel): keep illustrations subordinate to a useful, distraction-free companion tool.
- [MDN color-scheme guidance](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme): preview the artwork in both system themes rather than assuming a white background.
- [WCAG non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html): test meaningful action cues against adjacent colors, not just the text. Do not use color alone to distinguish scope or destructive actions.

## Acceptance Check

Inspect the 17 operations and Settings together at 128px, 48px, and 16px, in both themes. Check each asset at its actual final size, not only enlarged. Reject results with ambiguous arrow direction, missing destination cues for moves, merged outlines, fabricated writing, or fuzzy transparency. Compare the four domain-move variants side by side at each size. An animal-only portrait is not sufficient: each result must retain its action cue. Confirm all 54 output paths have a separately designed asset, correct dimensions, and transparent pixels. Request revisions rather than accepting an attractive illustration that suggests the wrong operation.

## Feature Prompts

### Sort by Domain

**128 x 128 — `assets/icons/128/sort-by-domain.png`**
**Prompt:** Create a 128 x 128 transparent RGBA PNG. An alert owl points its wing along three separated browser-tab cards being arranged into a neat left-to-right row. Give the cards large circle, square, and triangle symbols. Place one broad directional arrow beneath the row. Keep the owl above and secondary to the ordered cards; no overlapping stack or enclosing group band.

**48 x 48 — `assets/icons/48/sort-by-domain.png`**
**Prompt:** Create a separately composed 48 x 48 transparent RGBA PNG. Place a small owl head above three chunky, evenly spaced tab cards on one baseline, with one bold rightward arrow underneath. Use simple differing solid card marks, no wing anatomy or curved flight path. The separated row and direction arrow must dominate.

**16 x 16 — `assets/icons/16/sort-by-domain.png`**
**Prompt:** Create a separately designed 16 x 16 transparent RGBA PNG. Use two tiny owl ear points as a secondary silhouette above three separated block-like tabs aligned horizontally. A single thick rightward arrow below them communicates ordering. Omit facial features and favicon marks; keep tab gaps at least one final pixel. No stack.

### Group by Domain

**128 x 128 — `assets/icons/128/group-by-domain.png`**
**Prompt:** Create a 128 x 128 transparent RGBA PNG. A cheerful corgi nudges three tab cards bearing the same large circle symbol into a compact stack held by one blue grouping band. A separate square-marked card stays outside the band. Emphasize matching cards becoming a group, with no window destination or sorting arrow.

**48 x 48 — `assets/icons/48/group-by-domain.png`**
**Prompt:** Create a separately composed 48 x 48 transparent RGBA PNG. A small corgi head sits beside two overlapping cards with identical large circle marks and one chunky blue enclosing band. Keep one square-marked card offset outside the band. Omit paws and body; make the grouped pair the dominant shape.

**16 x 16 — `assets/icons/16/group-by-domain.png`**
**Prompt:** Create a separately designed 16 x 16 transparent RGBA PNG. Show a large pair of overlapping tab blocks held by a thick blue U-shaped band, with a tiny tan corgi-ear silhouette at one upper corner. Omit faces, favicon marks, and the unmatched card. Preserve a clear grouping enclosure rather than a horizontal sorted row.

### Group by Domain, No Subdomain

**128 x 128 — `assets/icons/128/group-by-domain-ignore-subdomain.png`**
**Prompt:** Create a 128 x 128 transparent RGBA PNG. A clever fox gathers three tab cards into one banded stack inside a single browser-window frame. Each card has the same large circle symbol but a different clearly separated corner mark. The shared main symbol dominates the smaller variations. No arrows to another window.

**48 x 48 — `assets/icons/48/group-by-domain-ignore-subdomain.png`**
**Prompt:** Create a separately composed 48 x 48 transparent RGBA PNG. A small fox head sits above two overlapping tab cards inside one broad grouping bracket. Both cards carry the same large circle; give their upper corners a square and a triangle mark with ample separation. Omit the outer window frame and full animal body.

**16 x 16 — `assets/icons/16/group-by-domain-ignore-subdomain.png`**
**Prompt:** Create a separately designed 16 x 16 transparent RGBA PNG. Show two overlapping tab blocks inside one thick blue grouping bracket, with a tiny orange triangular fox-ear silhouette beside them. Omit facial features, window frames, and subdomain corner marks. Keep the grouping cue legible; do not attempt microscopic domain distinctions.

### Group Google Docs by Type

**128 x 128 — `assets/icons/128/group-google-docs-by-type.png`**
**Prompt:** Create a 128 x 128 transparent RGBA PNG. A studious parrot stands behind four distinct generic file piles arranged in a compact two-by-two layout: a lined page, a spreadsheet grid, a presentation screen, and a checkbox form. Use blue, green, gold, and cream accents. Keep each type symbol large and the piles separated. No brand logos, writing, or coral removal marks.

**48 x 48 — `assets/icons/48/group-google-docs-by-type.png`**
**Prompt:** Create a separately composed 48 x 48 transparent RGBA PNG. A small parrot crest and curved beak peek above three separated document blocks: a blue page with one broad line, a green page with a simple cross-grid, and a gold presentation rectangle. Omit extra cards, full body, and fine page detail. Communicate distinct file-type groups rather than one combined stack.

**16 x 16 — `assets/icons/16/group-google-docs-by-type.png`**
**Prompt:** Create a separately designed 16 x 16 transparent RGBA PNG. Show three separated chunky document blocks in blue, green, and gold, each with a folded-corner silhouette. Add only a tiny curved parrot-beak silhouette above one edge. Omit all internal page marks and facial detail. Separation and file shapes must remain readable without relying on color alone.

### Ungroup

**128 x 128 — `assets/icons/128/ungroup.png`**
**Prompt:** Create a 128 x 128 transparent RGBA PNG. A raccoon gently pulls apart a blue linking band around three tab cards. Two broad outward arrows flank the newly separated cards, and the broken band ends are visibly apart. Keep every card intact. No X marks, destination windows, or discarded pieces.

**48 x 48 — `assets/icons/48/ungroup.png`**
**Prompt:** Create a separately composed 48 x 48 transparent RGBA PNG. A small raccoon-mask head sits above two tab cards separating left and right. Use two short chunky outward arrows and two disconnected blue band ends between the cards. Omit paws, full body, and card symbols; preserve intact loose tabs.

**16 x 16 — `assets/icons/16/ungroup.png`**
**Prompt:** Create a separately designed 16 x 16 transparent RGBA PNG. Place two separated tab blocks between bold outward-facing arrowheads. A tiny dark raccoon-mask silhouette sits above the central gap. Omit the broken band and facial details. No X or red accent; the cue is separation, not removal.

### Remove Duplicates

**128 x 128 — `assets/icons/128/remove-duplicates.png`**
**Prompt:** Create a 128 x 128 transparent RGBA PNG. A careful beaver compares two identical circle-marked browser-tab cards using one large magnifying glass. One card remains whole and unobstructed; the other carries a bold coral X. Keep the matching symbols visible and the kept card clearly separate from the removal mark.

**48 x 48 — `assets/icons/48/remove-duplicates.png`**
**Prompt:** Create a separately composed 48 x 48 transparent RGBA PNG. A small beaver head sits beside two equal-sized tab cards with the same large circle mark. Overlay a chunky coral X on only the right card; leave the left card untouched. Omit the magnifying glass, paws, and teeth detail so the kept-versus-duplicate comparison dominates.

**16 x 16 — `assets/icons/16/remove-duplicates.png`**
**Prompt:** Create a separately designed 16 x 16 transparent RGBA PNG. Use two identical tab blocks side by side, a clear coral X on only one, and a tiny rounded brown beaver-head silhouette above the intact block. Omit card symbols and facial detail. Leave at least one full tab visibly intact; never put the X across the entire pair.

### Move Domain to New Window, Current Window

**128 x 128 — `assets/icons/128/move-domain-current-window.png`**
**Prompt:** Create a 128 x 128 transparent RGBA PNG. A kangaroo carries two matching circle-marked tabs from one source browser-window frame on the left to a separate new window on the right. A large outward transfer arrow ends inside the new frame. Show exactly one source and one destination; no highlighted existing target.

**48 x 48 — `assets/icons/48/move-domain-current-window.png`**
**Prompt:** Create a separately composed 48 x 48 transparent RGBA PNG. A small kangaroo-ear head sits above one source-window outline containing two matching circle-marked tab blocks. A single bold rightward arrow points into a separate empty destination-window outline. Omit body and carrying pose; keep the two windows separated.

**16 x 16 — `assets/icons/16/move-domain-current-window.png`**
**Prompt:** Create a separately designed 16 x 16 transparent RGBA PNG. Show one thick outward arrow entering a separate small window outline on the right, with a tiny tan long-eared kangaroo silhouette at the arrow's origin. Omit source-frame detail and tab marks. Keep the destination outline and arrowhead distinct with one-pixel minimum gaps.

### Move Domain to New Window, All Windows

**128 x 128 — `assets/icons/128/move-domain-all-windows.png`**
**Prompt:** Create a 128 x 128 transparent RGBA PNG. One representative migrating goose guides matching circle-marked tabs from two overlapping source-window frames on the left into a separate new window on the right. Use two broad arrows converging at the destination. Keep source frames recognizable and the goose secondary; no flock or scenery.

**48 x 48 — `assets/icons/48/move-domain-all-windows.png`**
**Prompt:** Create a separately composed 48 x 48 transparent RGBA PNG. A simple goose head and neck sit above two overlapping source-window outlines, each carrying the same large circular tab mark. One broad transfer arrow leads to a separate new window on the right. Omit wings and multiple arrows; preserve the doubled source outline.

**16 x 16 — `assets/icons/16/move-domain-all-windows.png`**
**Prompt:** Create a separately designed 16 x 16 transparent RGBA PNG. Use a doubled short source edge on the left feeding a bold rightward arrow into one separate window outline. A tiny cream goose-neck silhouette touches the source corner. Omit tab symbols and facial details; retain the doubled source cue only if its one-pixel separation remains clear.

### Move Base Domain to New Window, Current Window

**128 x 128 — `assets/icons/128/move-domain-current-window-no-subdomain.png`**
**Prompt:** Create a 128 x 128 transparent RGBA PNG. A red panda gathers three tab cards from one source-window frame and guides them along a broad rightward arrow into a separate new window. All cards have the same large circle symbol but clearly different smaller corner marks. Show exactly one source; make the shared main symbol stronger than the variations.

**48 x 48 — `assets/icons/48/move-domain-current-window-no-subdomain.png`**
**Prompt:** Create a separately composed 48 x 48 transparent RGBA PNG. A red panda head sits above a single source-window outline holding two cards with matching circles and different square-versus-triangle corner marks. One bold outward arrow ends in a separate new window. Omit body, tail stripes, and extra cards.

**16 x 16 — `assets/icons/16/move-domain-current-window-no-subdomain.png`**
**Prompt:** Create a separately designed 16 x 16 transparent RGBA PNG. A tiny rust-and-cream round-eared red panda silhouette marks the origin of a bold outward arrow entering a separate small window outline. Omit source interiors, card symbols, corner marks, and face details. Preserve the same move direction as the current-window domain variant.

### Move Base Domain to New Window, All Windows

**128 x 128 — `assets/icons/128/move-domain-all-windows-no-subdomain.png`**
**Prompt:** Create a 128 x 128 transparent RGBA PNG. One energetic otter gathers cards from two overlapping source-window frames into a separate new destination window. The cards share a large circle symbol but have different smaller corner marks. Two broad converging arrows communicate collection across windows. Use one otter, not a pair, and keep the source frames visibly separate from the destination.

**48 x 48 — `assets/icons/48/move-domain-all-windows-no-subdomain.png`**
**Prompt:** Create a separately composed 48 x 48 transparent RGBA PNG. Place one compact otter head above two overlapping source-window outlines. Show two large circle-marked cards with different corner marks and one bold rightward arrow ending in a new destination frame. Omit the otter's body, whiskers, and secondary arrows.

**16 x 16 — `assets/icons/16/move-domain-all-windows-no-subdomain.png`**
**Prompt:** Create a separately designed 16 x 16 transparent RGBA PNG. Show a doubled source edge feeding one broad rightward arrow into a separate small window outline. Add a tiny rounded brown otter silhouette at the source corner. Omit facial features, cards, and subdomain marks. Keep doubled edges separated by at least one final pixel.

### Move Ungrouped to New Window

**128 x 128 — `assets/icons/128/move-ungrouped-current-window.png`**
**Prompt:** Create a 128 x 128 transparent RGBA PNG. A mountain goat guides two loose, separated tab cards along a broad arrow from one source-window frame into a separate new window. Inside the source, a blue-banded tab stack stays clearly behind and outside the arrow path. Keep the moving cards unbound and the retained group stationary.

**48 x 48 — `assets/icons/48/move-ungrouped-current-window.png`**
**Prompt:** Create a separately composed 48 x 48 transparent RGBA PNG. A small goat head with two short horns sits above a source frame containing one stationary banded stack. Two separated loose tab blocks follow a single outward arrow into a distinct new-window outline. Omit legs, fur, and card symbols; preserve the contrast between bound and loose tabs.

**16 x 16 — `assets/icons/16/move-ungrouped-current-window.png`**
**Prompt:** Create a separately designed 16 x 16 transparent RGBA PNG. Use two visibly separated tab blocks at the tail of a thick arrow entering a small new-window outline. Add only two tiny goat-horn points above the origin. Omit the stationary group and source frame rather than crowding the canvas. Do not join the moving blocks with a band.

### Bring Domain to This Window

**128 x 128 — `assets/icons/128/bring-domain-to-current-window.png`**
**Prompt:** Create a 128 x 128 transparent RGBA PNG. A squirrel beside a highlighted existing window on the left pulls matching circle-marked tab cards from a neighboring source window on the right. One broad leftward inward arrow ends inside the highlighted target. Use a thicker blue target frame and cream header to distinguish bringing here from moving to a new window.

**48 x 48 — `assets/icons/48/bring-domain-to-current-window.png`**
**Prompt:** Create a separately composed 48 x 48 transparent RGBA PNG. A compact squirrel head with a curved tail silhouette sits beside a thick blue destination frame on the left. Two matching circle-marked cards enter it along one bold leftward arrow from a small source outline on the right. Omit paws and fur; keep the arrowhead inside the existing target.

**16 x 16 — `assets/icons/16/bring-domain-to-current-window.png`**
**Prompt:** Create a separately designed 16 x 16 transparent RGBA PNG. Show a bold leftward arrow entering a thick blue existing-window outline on the left. Add one tiny curved squirrel-tail silhouette at the upper right. Omit tab marks and the source frame. Keep the arrowhead inside the destination; do not reverse the move-to-new-window direction.

### Bring Base Domain to This Window

**128 x 128 — `assets/icons/128/bring-domain-to-current-window-no-subdomain.png`**
**Prompt:** Create a 128 x 128 transparent RGBA PNG. An elephant uses a simple curved trunk to draw three cards from a source window on the right into a thick blue existing-window frame on the left. The cards share one large circle symbol but carry different smaller corner marks. One broad leftward arrow ends inside the highlighted destination. Keep the trunk separate from the arrowhead.

**48 x 48 — `assets/icons/48/bring-domain-to-current-window-no-subdomain.png`**
**Prompt:** Create a separately composed 48 x 48 transparent RGBA PNG. A compact elephant head with one broad ear and short trunk sits beside a thick blue destination frame on the left. Two cards with matching circles and different corner marks follow a bold inward leftward arrow from the right. Omit the source frame, tusks, and full body to preserve card readability.

**16 x 16 — `assets/icons/16/bring-domain-to-current-window-no-subdomain.png`**
**Prompt:** Create a separately designed 16 x 16 transparent RGBA PNG. A bold leftward arrow enters a thick blue existing-window outline on the left, with a tiny elephant-ear-and-trunk silhouette at the upper right. Omit eyes, tusks, cards, and corner marks. Preserve a clear arrowhead inside the target and generous transparent gaps.

### Bring All to This Window

**128 x 128 — `assets/icons/128/bring-to-window.png`**
**Prompt:** Create a 128 x 128 transparent RGBA PNG. A gentle sea turtle sits beneath a large highlighted existing-window frame. Two smaller source frames above send mixed-symbol tabs and one banded group inward along broad converging arrows. Keep a cream active-tab block visibly intact inside the destination. Transfer tab contents, not entire window frames; show no X or replacement window.

**48 x 48 — `assets/icons/48/bring-to-window.png`**
**Prompt:** Create a separately composed 48 x 48 transparent RGBA PNG. A small sea turtle shell-and-head silhouette sits beneath a thick blue existing-window frame. Two compact overlapping source outlines above feed one broad inward arrow into the target, which retains one cream tab block. Omit internal source cards and group detail; communicate consolidation into an existing window.

**16 x 16 — `assets/icons/16/bring-to-window.png`**
**Prompt:** Create a separately designed 16 x 16 transparent RGBA PNG. Use one thick inward downward arrow entering a broad blue existing-window outline, with a tiny rounded green turtle-shell silhouette at its lower edge. Add only a doubled short source edge above the arrow if it stays separated by a full pixel. Omit tabs, shell pattern, face, and extra arrows.

### Find Media Playing

**128 x 128 — `assets/icons/128/find-media-playing.png`**
**Prompt:** Create a 128 x 128 transparent RGBA PNG. A night owl wearing chunky headphones looks toward a browser-tab card enclosed by one prominent focus ring. Put a large music note and two short sound-wave arcs on the tab. Keep the focus ring dominant and avoid a standalone play button; depict locating already-playing media, not starting playback.

**48 x 48 — `assets/icons/48/find-media-playing.png`**
**Prompt:** Create a separately composed 48 x 48 transparent RGBA PNG. A small owl head with a broad headphone arch sits beside one tab card inside a thick focus ring. Use one large music note on the card and a single sound-wave arc outside it. Omit feathers, headphone details, and play controls.

**16 x 16 — `assets/icons/16/find-media-playing.png`**
**Prompt:** Create a separately designed 16 x 16 transparent RGBA PNG. Show one large music note enclosed by an open, thick focus bracket, with two tiny owl-ear points above the bracket. Omit headphones, tab interiors, waves, eyes, and play triangles. Keep the locating bracket distinct from the note with at least one pixel of space.

### Close Domain, Current Window

**128 x 128 — `assets/icons/128/close-domain-current-window.png`**
**Prompt:** Create a 128 x 128 transparent RGBA PNG. A lion stands beside one browser-window frame containing two matching circle-marked tab cards and one different square-marked card. Place a bold coral X across only the matching pair, leaving the square card and outer window intact. Show no arrows or second window.

**48 x 48 — `assets/icons/48/close-domain-current-window.png`**
**Prompt:** Create a separately composed 48 x 48 transparent RGBA PNG. A compact lion head with a simple mane sits above one window outline. Inside, two circle-marked tab blocks share one bold coral X while a small square-marked tab remains untouched beside them. Keep the X confined to tabs, not the window frame; omit the body and fine mane detail.

**16 x 16 — `assets/icons/16/close-domain-current-window.png`**
**Prompt:** Create a separately designed 16 x 16 transparent RGBA PNG. Inside one simple window outline, place a bold coral X on a single affected-tab block and leave one small tab block untouched. Add a tiny gold scalloped lion-mane silhouette above an edge. Omit favicon marks and facial detail. Never cross out the entire window.

### Close Domain, All Windows

**128 x 128 — `assets/icons/128/close-domain-all-windows.png`**
**Prompt:** Create a 128 x 128 transparent RGBA PNG. One representative wolf stands beside two overlapping browser-window frames. Each contains a circle-marked tab with a bold coral X; one frame also retains an untouched square-marked tab. Keep the outer frames intact and X marks on affected cards only. No wolf pack, arrows, or background scene.

**48 x 48 — `assets/icons/48/close-domain-all-windows.png`**
**Prompt:** Create a separately composed 48 x 48 transparent RGBA PNG. A small pointed-ear wolf head sits above two overlapping window outlines. Place a chunky coral X on a matching circle-marked card inside each frame and retain one small untouched tab. Omit muzzle detail, body, and extra cards; preserve the multiple-window silhouette.

**16 x 16 — `assets/icons/16/close-domain-all-windows.png`**
**Prompt:** Create a separately designed 16 x 16 transparent RGBA PNG. Show a bold coral X on an affected-tab block inside a front window outline, with one offset rear-window edge indicating multiple windows. Add a tiny navy wolf-ear silhouette with a cream edge. Omit eyes, favicon marks, and secondary X marks; the X must not cover the outer frames.

### Settings

**128 x 128 — `assets/icons/128/settings.png`**
**Prompt:** Create a 128 x 128 transparent RGBA PNG. A calm, wise owl adjusts one large navy gear with a short chunky wrench. Give the gear a warm yellow center and six broad teeth. Keep the gear dominant, the wrench clearly separate, and the owl secondary. No tabs, window frames, lettering, or extra tools.

**48 x 48 — `assets/icons/48/settings.png`**
**Prompt:** Create a separately composed 48 x 48 transparent RGBA PNG. A small owl head peeks above one large six-tooth navy gear with a warm yellow center. Omit the wrench, wings, and body. Use generous open gaps between the gear teeth and a clearly separated center; the gear alone must unmistakably communicate settings.

**16 x 16 — `assets/icons/16/settings.png`**
**Prompt:** Create a separately designed 16 x 16 transparent RGBA PNG. Show one chunky six-tooth navy gear with a large warm yellow center hole and two tiny owl-ear points integrated above its upper edge. Omit eyes, beak, wrench, and body. Keep the gear silhouette dominant, teeth separated, and every essential gap at least one final pixel wide.

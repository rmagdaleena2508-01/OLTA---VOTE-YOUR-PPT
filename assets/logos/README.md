# College marks for the "Trusted by" row

Three marks are in place:

| File | College |
|---|---|
| `srm-vadapalani.png` | SRM Institute of Science and Technology, Vadapalani |
| `srm-ramapuram.png` | SRM Institute of Science and Technology, Ramapuram |
| `srm-ktr.png` | SRM Institute of Science and Technology, Kattankulathur |

Each was scaled to 420px on its long edge. Keep marks at that size or larger,
PNG or WebP. A transparent background is better than white, but white works:
the cards behind them are white.

The row is static — no scrolling, no loop. Each image is fixed at 42px tall and
its width follows the artwork, so a wide lockup and a tall one carry the same
visual weight and neither is stretched or cropped.

To add a college: copy one `<li class="trust-logo">` in `index.html`, point it at
the new file, and put the college's full name in the `alt`. Until a file exists,
that card shows the college's short name instead of a broken image.

These are other institutions' trademarks. Show them only with the college's
permission, and take one down the moment they ask.

# College marks for the "Trusted by" ribbon

Drop the files here with these exact names and the ribbon picks them up:

| File | College |
|---|---|
| `srm-vadapalani.png` | SRM Institute of Science and Technology, Vadapalani |
| `srm-ramapuram.png` | SRM Institute of Science and Technology, Ramapuram |
| `srm-ktr.png` | SRM Institute of Science and Technology, Kattankulathur |

Square, at least 256 x 256, PNG or WebP with a transparent background. The
circle adds its own padding, so the mark should reach the edges of the file.

Until a file exists, that circle shows the college's short name instead. Nothing
breaks and nothing is faked.

To add a college: copy one `<li class="trust-logo">` in `index.html`, point it at
the new file, and write its full name in the `alt`. The script duplicates the
row on its own, so the loop keeps working.

These are other institutions' trademarks. Use them only with permission from the
college, and take one down the moment they ask.

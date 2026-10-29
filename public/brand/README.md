# Tikr bear assets

- `bear-scene.png`: approved concept with a gentler descending graph; larger branding and onboarding.
- `bear-cruiser.png`: transparent generated rider for the dashboard animation.
- `bear-cruiser-crouch.png`: earlier crouching rider with amber aviators.
- `bear-cruiser-kneeling.png`: earlier kneeling rider with a colored board.
- `bear-cruiser-kneeling-mono.png`: dashboard rider with thicker legs and a monochrome board.
- `bear-cruiser-standing.png`: standing, arms-out balancing pose with a monochrome board.
- `bear-cruiser-kneeling-fur.png`: kneeling pose with fur tufts matching the standing bear.
- `bear-aviator.png`: approved bear-head illustration with amber aviator sunglasses.
- `bear-head-{16,24,32,48,180,192,512}.png`: raster exports of the approved illustration for icons and touch icons.
- `bear-head.svg`: earlier exploratory head mark, retained for reference.

The dashboard uses `src/components/bear-cruiser.tsx` and its CSS module. A ten-second loop takes three seconds to cross in each direction and waits two seconds completely offscreen at either end. The bear rides standing to the right and kneeling to the left, switching poses offscreen. A pause button stops motion; reduced-motion preferences show a centered static standing rider. This is a translating illustration, not an articulated skeletal animation.

The full scene, rider and aviator head were generated with the built-in image tool. Rider prompt: isolate the approved bear and vintage longboard on transparency, remove the graph, level the board for sideways cruising, preserve the relaxed grin and character. Aviator prompt: add black double-beam frames, gradient amber lenses and a thinner grin. Icon PNGs are rendered from the approved aviator image.

The aviator mark appears alongside the Tikr wordmark and in favicon metadata.

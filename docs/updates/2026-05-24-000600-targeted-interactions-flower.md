# 0.0.6 Targeted Interactions and Interaction Menu Notes

## Summary

- Added target-aware interaction routing for player-to-player token interactions.
- Added a basic Send Flowers interaction.
- Added a basic Serve Tea interaction.
- Added a basic Fist Bump interaction.
- Collapsed Pat Pat, Hug, Fist Bump, Send Flowers, and Serve Tea into one HUD interaction button.
- Hardened chat card text styles against Foundry theme inheritance.
- Kept existing permission settings, hostile restrictions, cooldowns, chat cards, and socket sync.

## Player Flow

- If a player cannot open a teammate token HUD directly, they can target the teammate token first.
- Then they open their own token HUD and click the unified Interact button.
- The interaction menu can route to Pat Pat, Hug, Fist Bump, Send Flowers, or Serve Tea.
- When exactly one other token is targeted, that token becomes the interaction target.

## Flower Interaction

- Uses the target token top-center anchor plus the existing `patOffset` flag.
- Prefers PIXI/Canvas and falls back to the DOM overlay.
- Emits the same socket payload pattern as Pat Pat and Hug.

## Tea Interaction

- Uses the same target token routing as Send Flowers.
- Plays a teacup, steam, leaves, hearts, and sparkles above the target token.
- Emits chat and socket messages using the same lightweight pattern.

## Fist Bump Interaction

- Uses the same two-token source/target routing as Hug.
- Plays two fists from opposite sides, a central impact burst, stars, and cheer particles.
- Intended for passing momentum, tag-in moments, encouragement, and celebration.

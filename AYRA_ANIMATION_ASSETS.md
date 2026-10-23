# Required assets for genuine AYRA locomotion

Current project assets are JPEG portraits and a waist-up transparent PNG. None contains a skeleton, legs, foot-contact data, facial blendshapes or animation clips. The existing R3F scene renders architectural geometry only. No genuine character walking or facial animation is implemented; AYRA remains a stationary portrait pending the assets below.

## Supply an identity-matching character

- A full-body AYRA GLB/glTF, retaining her existing white-haired robotic appearance, cyan outfit and branding, with permission to redistribute the model as a downloadable web asset.
- A skinned humanoid skeleton including hips, spine, neck, head, arms, hands, legs, ankles and toes. Feet must meet a defined ground plane with consistent scale and forward orientation.
- PBR textures/materials and facial morph targets for left/right blinking, smile and subtle expressions; eye/head bones for gaze. A static portrait cannot provide these.

## Supply compatible motion-capture-quality clips

- Neutral idle with breathing; walk start, walk loop and walk stop with documented root motion and contact timing.
- Left/right turns, turn-in-place and balanced direction changes.
- Peek left/right, approach, pause/smile, turn-away and retreat, all on the same skeleton, with matching transition poses.
- Facial animation clips or documented morph-target mappings for blinking, smile and gaze.

## Implementation and acceptance once supplied

Load the verified character inside the existing R3F scene with isolated model loading and error states. Use Three.js AnimationMixer/drei useAnimations, crossfading compatible clips; synchronize root displacement to foot contact and use foot IK when needed to prevent skating. Render actual curved occluder geometry, a shared ground plane and character cast/receive shadows so scene depth, not a CSS layer trick, determines hiding. Preserve JarvisCore look/state selection and all existing command logic.

Verify complete left/right hide-and-seek cycles in browser recordings from desktop and mobile: alternating heel-to-toe footfalls, planted contacts, arm/hip/shoulder coordination, balanced stops/turns, facial motion and correct foreground/background occlusion. Until these assets and checks exist, do not claim genuine walking or use portrait sliding as a substitute.
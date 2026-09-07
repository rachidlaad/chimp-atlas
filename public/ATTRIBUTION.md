# Chimp Atlas — attribution

## Skeleton data

“CT Based Adult Common Chimp Skeleton” by **VISIBLE APE PROJECT**, licensed under **Creative Commons Attribution 4.0 International**.

- Original: https://sketchfab.com/3d-models/ct-based-adult-common-chimp-skeleton-ce2e42392cca4c4c8a45412a683e9859
- Creator: https://sketchfab.com/VISIBLEAPEPROJECT
- Species confirmation: https://www.visibleapeproject.com/chimpanzee-skeleton
- License: https://creativecommons.org/licenses/by/4.0/
- CT series cited by the creator: https://www.morphosource.org/media/000058004
- Public source archive: https://huggingface.co/datasets/allenai/objaverse/resolve/main/glbs/000-014/ce2e42392cca4c4c8a45412a683e9859.glb

Adult common chimpanzee (_Pan troglodytes_). The original CT specimen posture, including the turned head and flexed lower limbs, is preserved. This is not a neutral standing anatomical pose.

Adaptation: welded duplicated geometry, simplified 3,078,600 exported triangles to 400,122 triangles with meshoptimizer, normalized coordinates uniformly, regenerated and quantized normals, changed the display material, and compressed for browser delivery. Meshoptimizer's measured relative simplification error was approximately 0.0001643. No human skeletal geometry was substituted.

The source is a continuous skeletal surface. Its source chunks are not individually segmented bones. Region controls move the camera; they do not isolate anatomical bones.

## Regional muscle reconstructions

3D reconstructions by **José Saúl Martín**, provided by **VISIBLE APE PROJECT**, licensed under **Creative Commons Attribution 4.0 International**.

- [Common Chimpanzee Head & Neck Reconstruction](https://sketchfab.com/3d-models/common-chimpanzee-head-neck-reconstruction-16e37cef8db9438fa319a53d26eb64b0)
- [Common Chimpanzee Lower Limb Reconstruction](https://sketchfab.com/3d-models/common-chimpanzee-lower-limb-reconstruction-5c1e4c3c8cd645b488050b2711e9395b)
- [CC BY 4.0 license](https://creativecommons.org/licenses/by/4.0/)

These are separate regional anatomical reconstructions of _Pan troglodytes_, not a complete muscle layer fitted to the CT skeleton. The head presents exposed musculature on one half and outer anatomy on the other. Source chunks are arbitrary mesh divisions, not individually named muscles.

Adaptation: original world transforms and vertex colors retained, duplicate geometry welded, geometry simplified to 299,992 head-and-neck triangles and 299,999 lower-limb triangles, coordinates uniformly normalized, normals quantized to Int16, colors quantized to Uint8, and geometry gzip-compressed. Native GLBs were obtained from the public AllenAI Objaverse archive by their exact Sketchfab IDs. Measured relative simplification error: head 0.0009612; lower limb 0.0003287.

## Interface reference

Interface and scene conventions adapted from **Human Atlas**, copyright (c) 2026 ashemag, under the MIT license.

- Repository: https://github.com/ashemag/human-atlas
- Reference commit: 1c38bf35c254a891200d3cedecfd57abebe83d8d
- Full MIT notice: /licenses/human-atlas-MIT.txt

Human Atlas's BodyParts3D human anatomy data is not used in this site. Third-party dependencies retain their respective licenses.

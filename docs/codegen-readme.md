# Expo Screen Codegen

This project includes a first-pass code generator that converts a design spec JSON into a React Native screen file.

## Generate a screen

```bash
npm run codegen:expo-screen
```

Default input and output:

- Input: `specs/example-design.json`
- Output: `mobile-designer/generated/GeneratedScreen.tsx`

## Run the codegen verification

```bash
npm run test:codegen
```

## Custom input/output

```bash
node scripts/generate-expo-screen.mjs --input specs/example-design.json --output mobile-designer/generated/Home.tsx --component Home
```

## Notes

- Supported node types: `View`, `Text`, `Image`, `Button`.
- This is an MVP pipeline and can be extended to handle events, navigation, and richer style transforms.

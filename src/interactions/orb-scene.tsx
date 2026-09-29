"use client";

import { type CSSProperties, useEffect, useRef } from "react";
import * as THREE from "three";

export type OrbKind = "aurora" | "flux" | "veil" | "iris";
export type OrbState = "resting" | "listening" | "speaking";
export type OrbSize = "main" | "compact" | "widget";
export type OrbTheme = "light" | "dark";
export type OrbColorway = 0 | 1 | 2;

export type OrbControls = {
  speed: number;
  motion: number;
  reflection: number;
  refraction: number;
  diffraction: number;
  softness: number;
};

export const DEFAULT_ORB_CONTROLS: OrbControls = {
  speed: 1,
  motion: 1,
  reflection: 1,
  refraction: 1,
  diffraction: 1,
  softness: 0.55,
};

type OrbSceneProps = {
  kind: OrbKind;
  state: OrbState;
  controls: OrbControls;
  size: OrbSize;
  theme: OrbTheme;
  colorway: OrbColorway;
};

type OrbPalette = {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  glass: string;
};

export const ORB_PALETTES: Record<
  OrbKind,
  {
    material: number;
    colorways: readonly [OrbPalette, OrbPalette, OrbPalette];
  }
> = {
  aurora: {
    material: 0,
    colorways: [
      {
        name: "Opal",
        primary: "#f7f1ff",
        secondary: "#79dff4",
        accent: "#8a68ff",
        glass: "#8fc8ff",
      },
      {
        name: "Blush",
        primary: "#fff3f5",
        secondary: "#ff8fb8",
        accent: "#ff765e",
        glass: "#ffa0bd",
      },
      {
        name: "Tide",
        primary: "#ebfff9",
        secondary: "#4ce0bd",
        accent: "#5b7cff",
        glass: "#72e4d1",
      },
    ],
  },
  flux: {
    material: 1,
    colorways: [
      {
        name: "Lagoon",
        primary: "#edfff9",
        secondary: "#58d4bd",
        accent: "#92c7ff",
        glass: "#75e2d2",
      },
      {
        name: "Orchid",
        primary: "#f7efff",
        secondary: "#9f78ff",
        accent: "#ff7bc9",
        glass: "#ae8cff",
      },
      {
        name: "Solar",
        primary: "#fff5e8",
        secondary: "#ffc35c",
        accent: "#ff775f",
        glass: "#ffa85e",
      },
    ],
  },
  veil: {
    material: 2,
    colorways: [
      {
        name: "Violet",
        primary: "#f5e6ff",
        secondary: "#a979ff",
        accent: "#ff9fcd",
        glass: "#a889ff",
      },
      {
        name: "Glacier",
        primary: "#eaffff",
        secondary: "#55e6d3",
        accent: "#36a8ff",
        glass: "#6ed7ff",
      },
      {
        name: "Ember",
        primary: "#fff1e9",
        secondary: "#ff886d",
        accent: "#ffd05b",
        glass: "#ff9b73",
      },
    ],
  },
  iris: {
    material: 3,
    colorways: [
      {
        name: "Prism",
        primary: "#f4fbff",
        secondary: "#45ccff",
        accent: "#ff65c8",
        glass: "#88b9ff",
      },
      {
        name: "Jade",
        primary: "#ecfff4",
        secondary: "#41e8a8",
        accent: "#6e79ff",
        glass: "#67d9bf",
      },
      {
        name: "Flare",
        primary: "#fff0f2",
        secondary: "#ff546f",
        accent: "#ffb347",
        glass: "#ff7896",
      },
    ],
  },
};

const VERTEX_SHADER = /* glsl */ `
  precision highp float;

  varying vec3 vLocalPosition;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;

  void main() {
    vLocalPosition = position;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const MARBLE_FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uEnergy;
  uniform float uDarkMode;
  uniform float uMaterial;
  uniform float uReflection;
  uniform float uRefraction;
  uniform float uDiffraction;
  uniform float uSoftness;
  uniform float uMotion;
  uniform vec2 uPointer;
  uniform vec3 uCameraLocal;
  uniform vec3 uPrimaryColor;
  uniform vec3 uSecondaryColor;
  uniform vec3 uAccentColor;
  uniform vec3 uGlassColor;

  varying vec3 vLocalPosition;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;

  const float TAU = 6.28318530718;

  float hash31(vec3 point) {
    point = fract(point * 0.1031);
    point += dot(point, point.yzx + 33.33);
    return fract((point.x + point.y) * point.z);
  }

  float valueNoise(vec3 point) {
    vec3 cell = floor(point);
    vec3 local = fract(point);
    local = local * local * (3.0 - 2.0 * local);

    float n000 = hash31(cell + vec3(0.0, 0.0, 0.0));
    float n100 = hash31(cell + vec3(1.0, 0.0, 0.0));
    float n010 = hash31(cell + vec3(0.0, 1.0, 0.0));
    float n110 = hash31(cell + vec3(1.0, 1.0, 0.0));
    float n001 = hash31(cell + vec3(0.0, 0.0, 1.0));
    float n101 = hash31(cell + vec3(1.0, 0.0, 1.0));
    float n011 = hash31(cell + vec3(0.0, 1.0, 1.0));
    float n111 = hash31(cell + vec3(1.0, 1.0, 1.0));

    float nx00 = mix(n000, n100, local.x);
    float nx10 = mix(n010, n110, local.x);
    float nx01 = mix(n001, n101, local.x);
    float nx11 = mix(n011, n111, local.x);
    float nxy0 = mix(nx00, nx10, local.y);
    float nxy1 = mix(nx01, nx11, local.y);
    return mix(nxy0, nxy1, local.z) * 2.0 - 1.0;
  }

  float fbm(vec3 point) {
    float value = 0.0;
    float amplitude = 0.55;
    for (int octave = 0; octave < 2; octave++) {
      value += valueNoise(point) * amplitude;
      point = point * 2.03 + vec3(2.17, -1.31, 0.73);
      amplitude *= 0.5;
    }
    return value;
  }

  mat2 rotate2d(float angle) {
    float sine = sin(angle);
    float cosine = cos(angle);
    return mat2(cosine, -sine, sine, cosine);
  }

  vec3 spectrum(float phase) {
    return 0.5 + 0.5 * cos(TAU * (phase + vec3(0.0, 0.33, 0.67)));
  }

  float foldedSheet(vec3 point, float flowTime) {
    return abs(
      point.x +
      sin(point.y * 3.15 + flowTime) * 0.24 +
      sin(point.z * 3.8 - flowTime * 2.0) * 0.11
    );
  }

  void main() {
    vec3 rayOrigin = vLocalPosition;
    vec3 rayDirection = normalize(vLocalPosition - uCameraLocal);
    float pathLength = max(0.0, -2.0 * dot(rayOrigin, rayDirection));
    float stepLength = pathLength / 36.0;
    vec3 accumulatedColor = vec3(0.0);
    float accumulatedAlpha = 0.0;

    for (int stepIndex = 0; stepIndex < 36; stepIndex++) {
      float stepPosition = (float(stepIndex) + 0.5) * stepLength;
      vec3 point = rayOrigin + rayDirection * stepPosition;
      float inside = smoothstep(1.0, 0.82, length(point));

      float flowTime = uTime;
      float cycleSine = sin(flowTime);
      float cycleCosine = cos(flowTime);
      vec3 cycleOffset = vec3(
        cycleSine * 0.72,
        cycleCosine * 0.58,
        cycleSine * cycleCosine * 0.64
      );
      vec3 warp = vec3(
        fbm(point * 1.42 + cycleOffset + vec3(0.0, 1.7, -0.8)),
        fbm(point * 1.36 + cycleOffset.zxy + vec3(-1.2, 0.0, 2.1)),
        fbm(point * 1.48 + cycleOffset.yzx + vec3(0.6, -1.9, 0.0))
      );
      vec3 folded = point + warp * (0.11 + uMotion * 0.08 + uEnergy * 0.08);
      folded.xy += uPointer * 0.055 * (1.0 - length(point));

      float twist = folded.y * 1.35 + cycleSine * 0.26;
      folded.xz = rotate2d(twist) * folded.xz;

      float sheetOne = foldedSheet(folded, flowTime);
      float sheetTwo = abs(
        folded.z -
        cos(folded.y * 2.7 - flowTime) * 0.22 +
        sin(folded.x * 4.1 + flowTime * 2.0) * 0.09
      );
      float density = 0.0;
      float opacityScale = 4.8;
      vec3 ribbonColor = uPrimaryColor;
      float ovalRadiusA = length(folded.xy * vec2(0.76, 1.08));
      float ovalRadiusB = length(folded.yz * vec2(0.82, 1.16));
      float ovalLineA = 1.0 - smoothstep(
        0.012,
        0.036 + uSoftness * 0.012,
        abs(ovalRadiusA - (0.49 + cycleSine * 0.055))
      );
      float ovalLineB = 1.0 - smoothstep(
        0.012,
        0.034 + uSoftness * 0.012,
        abs(ovalRadiusB - (0.62 - cycleCosine * 0.045))
      );
      float ovalLines = (ovalLineA + ovalLineB * 0.72) * inside;

      if (uMaterial < 0.5) {
        // Pearl: one weighty folded ribbon with thin-film colour on its edges.
        float ribbonOne = 1.0 - smoothstep(0.052, 0.095 + uSoftness * 0.08, sheetOne);
        float ribbonTwo = (1.0 - smoothstep(0.028, 0.065 + uSoftness * 0.055, sheetTwo)) * 0.38;
        density = (ribbonOne + ribbonTwo) * inside;
        density *= 0.76 + valueNoise(folded * 2.4 + cycleOffset) * 0.14;
        float colorBlend = clamp(0.46 + folded.y * 0.34 + warp.z * 0.2, 0.0, 1.0);
        float spectralEdge = smoothstep(0.1, 0.55, density) * (1.0 - smoothstep(0.62, 1.05, density));
        ribbonColor = mix(uPrimaryColor, uSecondaryColor, colorBlend);
        ribbonColor += spectrum(folded.y * 0.18 + warp.x * 0.12) * spectralEdge * 0.5 * uDiffraction;
        ribbonColor = mix(ribbonColor, uAccentColor, ribbonTwo * 0.26);
      } else if (uMaterial < 1.5) {
        // Diffusion: broad liquid volumes overlap like ink inside frosted glass.
        float cloudA = fbm(folded * 1.55 + cycleOffset * 0.52);
        float cloudB = valueNoise(folded * 2.35 - cycleOffset.zxy * 0.36);
        float liquid = cloudA * 0.72 + cloudB * 0.28 - length(folded.xz) * 0.18;
        float softBody = smoothstep(-0.24 - uSoftness * 0.08, 0.46 + uSoftness * 0.18, liquid);
        float milkyCore = smoothstep(0.22, 0.64 + uSoftness * 0.12, liquid);
        density = (softBody * 0.54 + milkyCore * 0.9) * inside;
        opacityScale = 3.65;
        float colorBlend = clamp(0.48 + cloudA * 0.38 + folded.y * 0.18, 0.0, 1.0);
        ribbonColor = mix(uPrimaryColor, uSecondaryColor, colorBlend);
        ribbonColor = mix(ribbonColor, uAccentColor, smoothstep(0.25, 0.7, cloudB) * 0.3);
        ribbonColor *= 0.78 + softBody * 0.26;
      } else if (uMaterial < 2.5) {
        // Spectral: thin interference membranes split light into moving wavelengths.
        float membrane = 1.0 - smoothstep(0.018, 0.062, sheetOne);
        float rippleField = length(folded.xz * vec2(1.0, 0.78));
        float ripples = 0.5 + 0.5 * sin(rippleField * 23.0 - flowTime * 2.0 + warp.y * 4.0);
        float fan = 1.0 - smoothstep(0.025, 0.085, abs(sheetTwo - sin(folded.y * 5.0) * 0.035));
        density = (membrane * (0.42 + ripples * 0.58) + fan * 0.46) * inside;
        opacityScale = 4.15;
        float spectralEdge = pow(ripples, 3.0) * membrane + fan * 0.35;
        vec3 splitLight = spectrum(rippleField * 1.9 - folded.y * 0.22 + cycleSine * 0.08);
        ribbonColor = mix(uPrimaryColor, splitLight, 0.32 + uDiffraction * 0.4);
        ribbonColor = mix(ribbonColor, uAccentColor, fan * 0.34);
        ribbonColor += splitLight * spectralEdge * 0.42 * uDiffraction;
      } else {
        // Iris: an original voice-assistant material with orbiting spectral lobes.
        vec3 irisPoint = folded;
        irisPoint.xy = rotate2d(flowTime * 0.5) * irisPoint.xy;
        irisPoint.xz = rotate2d(-flowTime * 0.25) * irisPoint.xz;
        float lobeA = 1.0 - smoothstep(
          0.44,
          0.9,
          length((irisPoint - vec3(0.22, 0.18, -0.08)) * vec3(1.25, 0.78, 1.08))
        );
        float lobeB = 1.0 - smoothstep(
          0.4,
          0.88,
          length((irisPoint - vec3(-0.27, -0.08, 0.12)) * vec3(0.84, 1.3, 1.02))
        );
        float lobeC = 1.0 - smoothstep(
          0.36,
          0.82,
          length((irisPoint - vec3(0.04, -0.3, -0.16)) * vec3(1.35, 0.92, 0.82))
        );
        float luminousCore = 1.0 - smoothstep(0.08, 0.52, length(irisPoint * vec3(1.0, 1.15, 0.9)));
        float lobeTotal = lobeA + lobeB + lobeC + 0.001;
        density = (lobeTotal * 0.42 + luminousCore * 0.85) * inside;
        opacityScale = 4.45;
        vec3 lobeColor =
          uSecondaryColor * lobeA +
          uAccentColor * lobeB +
          spectrum(irisPoint.y * 0.16 + cycleSine * 0.05) * lobeC;
        ribbonColor = lobeColor / lobeTotal;
        ribbonColor = mix(ribbonColor, uPrimaryColor, luminousCore * 0.72);
      }

      density += ovalLines * (uMaterial > 2.5 ? 0.2 : 0.11);
      vec3 ovalColor = mix(uSecondaryColor, uAccentColor, 0.5 + cycleSine * 0.18);
      ribbonColor = mix(ribbonColor, ovalColor, clamp(ovalLines * 0.42, 0.0, 0.48));

      float maxAlpha = uMaterial > 0.5 && uMaterial < 1.5 ? 0.15 : 0.22;
      float localAlpha = clamp(
        density * stepLength * (opacityScale + uEnergy * 0.95),
        0.0,
        maxAlpha
      );

      accumulatedColor += (1.0 - accumulatedAlpha) * ribbonColor * localAlpha;
      accumulatedAlpha += (1.0 - accumulatedAlpha) * localAlpha;

      if (accumulatedAlpha > 0.96) {
        break;
      }
    }

    vec3 normal = normalize(vWorldNormal);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float facing = clamp(dot(normal, viewDirection), 0.0, 1.0);
    float fresnel = pow(1.0 - facing, 3.0);

    vec3 lightDirection = normalize(vec3(-0.45, 0.72, 0.58));
    vec3 halfDirection = normalize(lightDirection + viewDirection);
    float specular = pow(max(dot(normal, halfDirection), 0.0), 96.0);
    float broadHighlight = pow(max(dot(normal, halfDirection), 0.0), 12.0);
    float softbox = pow(max(dot(normal, normalize(vec3(-0.42, 0.76, 0.49))), 0.0), 18.0);
    float reflectedStrip = exp(-pow((normal.y + normal.x * 0.24 - 0.38) * 10.0, 2.0));
    reflectedStrip *= smoothstep(-0.55, 0.5, normal.x) * smoothstep(-0.2, 0.75, normal.z);
    float lowerBounce = pow(max(dot(normal, normalize(vec3(0.28, -0.88, 0.38))), 0.0), 7.0);

    vec3 volumeColor = accumulatedColor / max(accumulatedAlpha, 0.001);
    vec3 glassColor = uGlassColor * 0.42 * (0.38 + fresnel * 0.82);
    glassColor += vec3(1.0, 0.97, 1.0) * specular * (0.2 + uReflection * 0.2);
    glassColor += uGlassColor * broadHighlight * 0.08;
    glassColor += spectrum(fresnel * 0.72) * fresnel * 0.2 * uDiffraction;
    glassColor += vec3(0.94, 1.0, 0.98) * softbox * 0.3 * uReflection;
    glassColor += vec3(0.72, 0.92, 0.94) * reflectedStrip * 0.26 * uReflection;
    glassColor += uGlassColor * lowerBounce * 0.12 * uReflection;
    float shellAlpha = 0.08;
    shellAlpha += fresnel * (0.48 + uRefraction * 0.14);
    shellAlpha += specular * 0.2;
    shellAlpha += (softbox * 0.13 + reflectedStrip * 0.1) * uReflection;
    float outputAlpha = clamp(accumulatedAlpha * 0.92 + shellAlpha, 0.0, 0.94);
    vec3 finalColor = mix(glassColor, volumeColor, accumulatedAlpha * 0.92);
    if (uMaterial > 0.5 && uMaterial < 1.5) {
      finalColor = mix(finalColor, uGlassColor * 0.46, 0.08 + broadHighlight * 0.08);
    }
    if (uMaterial > 1.5) {
      float chromaticRim = pow(fresnel, 1.45);
      finalColor += spectrum(facing * 0.5 + vLocalPosition.y * 0.09) * chromaticRim * 0.3 * uDiffraction;
    }
    finalColor += glassColor;

    if (uDarkMode < 0.5) {
      float high = max(max(finalColor.r, finalColor.g), finalColor.b);
      vec3 hue = finalColor / max(high, 0.001);
      hue = mix(vec3(1.0), hue, smoothstep(0.03, 0.12, high));
      vec3 vividHue = clamp(mix(vec3(1.0), hue, 1.35), 0.0, 1.0);
      finalColor = mix(vec3(0.96, 0.975, 0.99), vividHue, 0.99);
      finalColor = max(finalColor, vec3(0.52, 0.54, 0.58));
    }

    gl_FragColor = vec4(finalColor, outputAlpha);
  }
`;

const SHELL_FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform vec3 uGlassColor;
  uniform float uEnergy;
  uniform float uReflection;
  uniform float uDarkMode;

  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - abs(dot(normal, viewDirection)), 2.6);
    float edgeGlint = pow(max(dot(normal, normalize(vec3(-0.62, 0.68, 0.38))), 0.0), 16.0);
    float alpha = fresnel * (0.2 + uEnergy * 0.06);
    alpha += edgeGlint * 0.1 * uReflection;
    vec3 shellColor = uGlassColor * (0.28 + fresnel * 0.58);
    shellColor += vec3(0.9, 1.0, 0.98) * edgeGlint * 0.28 * uReflection;
    if (uDarkMode < 0.5) {
      float high = max(max(shellColor.r, shellColor.g), shellColor.b);
      vec3 hue = shellColor / max(high, 0.001);
      hue = mix(vec3(1.0), hue, smoothstep(0.03, 0.12, high));
      vec3 vividHue = clamp(mix(vec3(1.0), hue, 1.24), 0.0, 1.0);
      shellColor = mix(vec3(0.97, 0.985, 1.0), vividHue, 0.94);
      shellColor = max(shellColor, vec3(0.62, 0.64, 0.68));
    }
    gl_FragColor = vec4(shellColor, alpha);
  }
`;

export function OrbScene({
  kind,
  state,
  controls,
  size,
  theme,
  colorway,
}: OrbSceneProps) {
  const mountRef = useRef<HTMLSpanElement>(null);
  const stateRef = useRef(state);
  const controlsRef = useRef(controls);

  useEffect(() => {
    stateRef.current = state;
    controlsRef.current = controls;
  }, [controls, state]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) {
      return;
    }

    const orbPalette = ORB_PALETTES[kind];
    const palette = orbPalette.colorways[colorway];
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const darkMode = theme === "dark";
    const materialColor = (value: string) => new THREE.Color(value);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 20);
    camera.position.set(0, 0, 3.35);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
      premultipliedAlpha: !darkMode,
    });
    const pixelRatioLimit =
      size === "widget" ? 1.75 : size === "compact" ? 1.45 : 1.35;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatioLimit));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = darkMode
      ? THREE.ACESFilmicToneMapping
      : THREE.NoToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const segments = size === "widget" ? 40 : size === "compact" ? 56 : 72;
    const geometry = new THREE.SphereGeometry(1, segments, segments);
    const uniforms = {
      uTime: { value: 0 },
      uEnergy: { value: 0.12 },
      uDarkMode: { value: darkMode ? 1 : 0 },
      uMaterial: { value: orbPalette.material },
      uReflection: { value: controlsRef.current.reflection },
      uRefraction: { value: controlsRef.current.refraction },
      uDiffraction: { value: controlsRef.current.diffraction },
      uSoftness: { value: controlsRef.current.softness },
      uMotion: { value: controlsRef.current.motion },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uCameraLocal: { value: camera.position.clone() },
      uPrimaryColor: { value: materialColor(palette.primary) },
      uSecondaryColor: { value: materialColor(palette.secondary) },
      uAccentColor: { value: materialColor(palette.accent) },
      uGlassColor: { value: materialColor(palette.glass) },
    };

    const marbleMaterial = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERTEX_SHADER,
      fragmentShader: MARBLE_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
    });
    const marble = new THREE.Mesh(geometry, marbleMaterial);
    marble.renderOrder = 1;
    scene.add(marble);

    const shellUniforms = {
      uGlassColor: uniforms.uGlassColor,
      uEnergy: uniforms.uEnergy,
      uReflection: uniforms.uReflection,
      uDarkMode: uniforms.uDarkMode,
    };
    const shellMaterial = new THREE.ShaderMaterial({
      uniforms: shellUniforms,
      vertexShader: VERTEX_SHADER,
      fragmentShader: SHELL_FRAGMENT_SHADER,
      transparent: true,
      blending: darkMode ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false,
      side: THREE.BackSide,
    });
    const shell = new THREE.Mesh(geometry, shellMaterial);
    shell.scale.setScalar(1.045);
    shell.renderOrder = 0;
    scene.add(shell);

    const pointerTarget = new THREE.Vector2(0, 0);
    const handlePointerMove = (event: PointerEvent) => {
      const rect = mount.getBoundingClientRect();
      pointerTarget.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -(((event.clientY - rect.top) / rect.height) * 2 - 1),
      );
    };
    const handlePointerLeave = () => pointerTarget.set(0, 0);
    mount.addEventListener("pointermove", handlePointerMove);
    mount.addEventListener("pointerleave", handlePointerLeave);

    const resize = () => {
      const { width, height } = mount.getBoundingClientRect();
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    const clock = new THREE.Clock();
    let frame = 0;
    let displayedEnergy = 0.12;
    let previousState = stateRef.current;
    let stateStartedAt = 0;
    let lastRenderAt = 0;
    const minimumFrameInterval =
      size === "widget" ? 1000 / 30 : size === "compact" ? 1000 / 45 : 0;

    const render = (timestamp = 0) => {
      frame = window.requestAnimationFrame(render);
      if (timestamp - lastRenderAt < minimumFrameInterval) {
        return;
      }
      lastRenderAt = timestamp;
      const elapsed = reducedMotion ? 0.8 : clock.getElapsedTime();
      const activeState = stateRef.current;
      const liveControls = controlsRef.current;
      if (activeState !== previousState) {
        previousState = activeState;
        stateStartedAt = elapsed;
      }

      const stateElapsed = elapsed - stateStartedAt;
      const cycleDuration =
        activeState === "speaking"
          ? 3.2
          : activeState === "listening"
            ? 6.4
            : 16;
      const choreographyPhase =
        (stateElapsed / cycleDuration) * Math.PI * 2 * liveControls.speed;
      const listeningPulse = 0.5 - 0.5 * Math.cos(choreographyPhase);
      const voiceWave =
        Math.sin(choreographyPhase * 2) * 0.48 +
        Math.sin(choreographyPhase * 4 + 0.72) * 0.31 +
        Math.sin(choreographyPhase * 6 + 1.42) * 0.21;
      const targetEnergy =
        activeState === "speaking"
          ? 0.72 + Math.abs(voiceWave) * 0.34
          : activeState === "listening"
            ? 0.35 + listeningPulse * 0.22
            : 0.13;
      displayedEnergy = THREE.MathUtils.lerp(
        displayedEnergy,
        targetEnergy,
        0.045,
      );
      uniforms.uEnergy.value = displayedEnergy * liveControls.motion;
      uniforms.uTime.value = choreographyPhase;
      uniforms.uReflection.value = THREE.MathUtils.lerp(
        uniforms.uReflection.value,
        liveControls.reflection,
        0.08,
      );
      uniforms.uRefraction.value = liveControls.refraction;
      uniforms.uDiffraction.value = liveControls.diffraction;
      uniforms.uSoftness.value = liveControls.softness;
      uniforms.uMotion.value = liveControls.motion;
      uniforms.uPointer.value.lerp(pointerTarget, 0.05);

      const stateScale =
        activeState === "speaking"
          ? 1 + voiceWave * 0.018 * liveControls.motion
          : activeState === "listening"
            ? 1 + listeningPulse * 0.014 * liveControls.motion
            : 1 + Math.sin(choreographyPhase) * 0.003;
      marble.scale.setScalar(stateScale);
      shell.scale.setScalar(1.045 * stateScale);
      const targetRotationY =
        pointerTarget.x * 0.12 +
        (activeState === "listening" ? Math.sin(choreographyPhase) * 0.08 : 0);
      marble.rotation.y = THREE.MathUtils.lerp(
        marble.rotation.y,
        targetRotationY,
        0.025,
      );
      marble.rotation.x = THREE.MathUtils.lerp(
        marble.rotation.x,
        pointerTarget.y * -0.08,
        0.025,
      );
      shell.rotation.copy(marble.rotation);
      marble.updateMatrixWorld();
      uniforms.uCameraLocal.value.copy(camera.position);
      marble.worldToLocal(uniforms.uCameraLocal.value);

      renderer.render(scene, camera);
    };
    render();

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      mount.removeEventListener("pointermove", handlePointerMove);
      mount.removeEventListener("pointerleave", handlePointerLeave);
      geometry.dispose();
      marbleMaterial.dispose();
      shellMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [colorway, kind, size, theme]);

  const palette = ORB_PALETTES[kind].colorways[colorway];
  return (
    <span
      className="orb-scene"
      data-state={state}
      style={
        {
          "--orb-glow-primary": palette.secondary,
          "--orb-glow-secondary": palette.accent,
        } as CSSProperties
      }
      aria-hidden="true"
    >
      <span className="orb-scene__glow" />
      <span className="orb-scene__canvas" ref={mountRef} />
    </span>
  );
}

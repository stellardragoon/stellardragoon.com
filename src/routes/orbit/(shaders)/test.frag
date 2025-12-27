// 数学苦手だから、正直AIに書かせた。。。

uniform float uTime;
uniform vec3 uColor;
varying vec2 vUv;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);

  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

// Time-animated fbm (adds temporal domain warping)
float fbm(vec2 p, float t) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.6, -1.2, 1.2, 1.6);

  for (int i = 0; i < 5; i++) {
    // per-octave time offset so the pattern evolves, not just translates
    vec2 tp = p + vec2(t * (0.10 + float(i) * 0.07), -t * (0.08 + float(i) * 0.05));
    v += a * noise(tp);

    p = m * p;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = vUv;

  float t = uTime;

  // noise now evolves over time (not only drifting in uv space)
  float n = fbm(uv * 6.0, t*5.0);

  float pulse = 0.5 + 0.5 * sin(uTime * 2.5);
  float intensity = smoothstep(0.15, 0.85, n) * (0.35 + 0.65 * pulse);

  vec3 base = uColor;
  vec3 tinted = mix(base * 0.6, base * 1.4, n);

  vec3 finalColor = tinted * intensity;

  gl_FragColor = vec4(finalColor, 1.0);
}
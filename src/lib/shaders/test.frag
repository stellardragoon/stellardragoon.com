uniform float uTime;
uniform vec3 uColor;
varying vec2 vUv;

void main() {
  float wave = sin(vUv.x * 10.0 + uTime) * 0.5 + 0.5;
  vec3 finalColor = uColor * wave;
  
  gl_FragColor = vec4(finalColor, 1.0);
}
uniform float uTime;
uniform vec3 uColorA;
uniform vec3 uColorB;
varying vec2 vUv;

// Simple pseudo-random noise
float random (in vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

// Noise function
float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

#define OCTAVES 6
float fbm (in vec2 st) {
    // Initial values
    float value = 0.0;
    float amplitude = .5;
    float frequency = 0.;
    //
    // Loop of octaves
    for (int i = 0; i < OCTAVES; i++) {
        value += amplitude * noise(st);
        st *= 2.;
        amplitude *= .5;
    }
    return value;
}

void main() {
    vec2 st = vUv;
    
    // 座標を時間で歪ませる（ゆらぎ）
    vec2 q = vec2(0.);
    q.x = fbm( st + 0.00 * uTime);
    q.y = fbm( st + vec2(1.0));

    vec2 r = vec2(0.);
    r.x = fbm( st + 1.0 * q + vec2(1.7,9.2)+ 0.15 * uTime );
    r.y = fbm( st + 1.0 * q + vec2(8.3,2.8)+ 0.126 * uTime);

    float f = fbm(st+r);

    // 色の合成
    // ベースは暗い色、そこに明るい色をfbmの波で混ぜる
    vec3 color = mix(uColorA, uColorB, clamp((f*f)*4.0, 0.0, 1.0));

    // さらに時間で色を少し変化させる
    color = mix(color, vec3(0.0, 0.0, 0.2), clamp(length(q), 0.0, 1.0));
    
    // ビネット効果（画面端を暗くする）
    // Sphereの内側なので、UVによっては繋ぎ目が見える可能性があるが、
    // 背景用としては十分な品質。
    
    gl_FragColor = vec4((f*f*f+.6*f*f+.5*f)*color, 1.);
}
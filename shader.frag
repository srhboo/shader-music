#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform float u_beat;
uniform float u_transition1;
uniform float u_perc1;
uniform float u_perc1b;
uniform float u_perc1c;
uniform float u_perc2;
uniform float u_perc2b;
uniform float u_perc2c;
uniform float u_sibeat;

uniform float u_rAdd;
uniform float u_gAdd;
uniform float u_bAdd;

vec2 createGrid( in vec2 st, in vec2 grid, out vec2 indices) {
    
    st *= grid;
    
    indices = floor(st);
    st = fract(st);

    return st;
}

float drawCircle(vec2 st, vec2 pos, float size) {
    float result = distance(st, vec2(pos));
    result = 1.0 - smoothstep(size - 0.2, size + 0.3, result);    
    return result;
}


float drawRectangle(vec2 st, vec2 pos, vec2 size) {
    float result = 1.0;
    vec2 border = (pos - size) / 2.0;
    
    result = step(border.x, st.x);
    result *= step(border.x, pos.x - st.x);
    result *= step(border.y, st.y);
    result *= step(border.y, pos.y -st.y);
    return result;
}

vec2 rotate2D(vec2 _st, float _angle){
    _st -= 0.5;
    _st =  mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle)) * _st;
    _st += 0.5;
    return _st;
}

float random (in vec2 _st) {
    return fract(sin(dot(_st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}

// Based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
float noise (in vec2 _st) {
    vec2 i = floor(_st);
    vec2 f = fract(_st);

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

float plot(vec2 st, float pct, float minus, float plus){
return  smoothstep( pct-minus, pct, st.y) -
        smoothstep( pct, pct+plus, st.y);
}

#define NUM_OCTAVES 5

float fbm ( in vec2 _st) {
    float v = 0.0;
    float a = 0.7;
    vec2 shift = vec2(100.0);
    // Rotate to reduce axial bias
    mat2 rot = mat2(cos(0.8), sin(0.4),
                    -sin(0.6), cos(0.40));
    for (int i = 0; i < NUM_OCTAVES; ++i) {
        v += a * noise(_st);
        _st = rot * _st * 2.0 + shift;
        a *= 0.6;
    }
    return v;
}

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    // this will zoom in when it is time for the transition
    st *= 1. + (19. * u_transition1);
    st -= vec2(u_transition1 * 12.);
    vec3 color = vec3(0.0);

    // from brownian motion example
    vec2 q = vec2(0.);
    q.x = fbm( st + 0.01*u_time);
    q.y = fbm( st + vec2(1.0));

    vec2 r = vec2(0.);
    r.x = fbm( st + 1.0*q + vec2(1.7,9.2)+ 0.15*u_time );
    r.y = fbm( st + 1.0*q + vec2(8.3,2.8)+ 0.126*u_time);

    float f = fbm(st+r);

    // shaping functions
    float y = sin(st.x+u_time/4.)*2. + cos(st.y + u_time / 2.);
    float z = sin(st.x+u_time/2.)*1.5 + cos(st.x + u_time / 1.5);
    float pct = plot(st,y, 0.4, 0.2) + plot(st, z, 0.6, 0.3);

    color = mix(color, vec3(0.9608, 0.7529, 0.0745 + u_bAdd), pct);

    // circle that corresponds to bass beat (it will trigger its opacity)
    float c = drawCircle(st, vec2(sin(u_time / 6.) * 0.4 + 0.6, cos(u_time / 5.) * 0.4 + 0.6), 0.5 + u_transition1 * 10.5);
    color = mix(color, vec3(0.0627 + u_rAdd, 0.3882, 0.3176), c*3. * u_beat);

    float cnoise = drawCircle(vec2(st.x, st.y), vec2(sin(u_time/2.) * 0.25 + (2. * u_transition1) + 0.25 + (2. * u_transition1)), 0.1 + (10.*u_transition1));
    color = mix(color, vec3(0.4784, 0.2314 + u_gAdd, 0.0275), cnoise * 2.);

    vec2 rot = rotate2D(st, u_time / 6.);

    float rl = 15.9;
    float rh = 0.2;

    // all rectangles that correspond to the percussive noise in the second half
    float rect = drawRectangle(st, vec2(-1., -5.), vec2(rl, rh)) + drawRectangle(st, vec2(-1., -7.3), vec2(rl, rh)) + drawRectangle(st, vec2(-1., -9.5), vec2(rl, rh));
    color = mix(color, vec3(0.123, 0.345, 0.567), rect * u_perc1);

    vec2 rot1b = rotate2D(st, u_time / 6.);
    float rect1b = drawRectangle(rot1b, vec2(-1., -5.), vec2(rl, rh)) + drawRectangle(rot1b, vec2(-1., -7.3), vec2(rl, rh)) + drawRectangle(rot1b, vec2(-1., -9.5), vec2(rl, rh));
    color = mix(color, vec3(0.123, 0.345, 0.567), rect1b * u_perc1b);

    vec2 rot1c = rotate2D(st, u_time / 6. + 10.);
    float rect1c = drawRectangle(rot1c, vec2(-1., -5.), vec2(rl, rh)) + drawRectangle(rot1c, vec2(-1., -7.3), vec2(rl, rh)) + drawRectangle(rot1c, vec2(-1., -9.5), vec2(rl, rh));
    color = mix(color, vec3(0.123, 0.345, 0.567), rect1c * u_perc1c);

    float rect2 = drawRectangle(st, vec2(-6., -10.), vec2(rl, rh)) + drawRectangle(st, vec2(-6., -12.4), vec2(rl, rh)) + drawRectangle(st, vec2(-6., -15.6), vec2(rl, rh));
    color = mix(color, vec3(0.4667, 0.0353, 0.0196), rect2 * u_perc2);

    vec2 rot2b = rotate2D(st, u_time / 6. + 10.);
    float rect2b = drawRectangle(rot2b, vec2(-6., -10.), vec2(rl, rh)) + drawRectangle(rot2b, vec2(-6., -12.4), vec2(rl, rh)) + drawRectangle(rot2b, vec2(-6., -15.6), vec2(rl, rh));
    color = mix(color, vec3(0.4667, 0.0353, 0.0196), rect2b * u_perc2b);

    vec2 rot2c = rotate2D(st, u_time / 6. + 20.);
    float rect2c = drawRectangle(rot2c, vec2(-6., -10.), vec2(rl, rh)) + drawRectangle(rot2c, vec2(-6., -12.4), vec2(rl, rh)) + drawRectangle(rot2c, vec2(-6., -15.6), vec2(rl, rh));
    color = mix(color, vec3(0.4667, 0.0353, 0.0196), rect2c * u_perc2c);
    vec2 toCenter = vec2(0.5)-st;
    float angle = atan(toCenter.y,toCenter.x);
    float radius = length(toCenter)*2.0;

    float z2 = radius * sin(u_time + atan(st.y, st.x)) + sin(st.x-u_time/2. + 30.)*10.5 + cos(st.x * u_time / 4.0);
    float siplot = plot(st, z2, 28., 28.);


    color = mix(color, vec3(0.01 * st.x+ u_rAdd, 0.0078 * st.y, st.x * 0.05 + u_bAdd), siplot * u_sibeat);

    // none used below
    // color = mix(color, vec3(0.0353* st.x * st.y * 0.2, 0.0078* st.x * st.y * 0.2, 0.4667* st.x * st.y * 0.2), siplot);
    // color = mix(color, vec3(0.002* u_sibeat, 0.003* u_sibeat, 0.004* u_sibeat), z2);

    gl_FragColor = vec4(color * f, 1.0);
}
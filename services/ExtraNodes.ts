import { Fn, vec2, vec3, vec4, float, floor, fract, dot, max, abs, mod, step } from 'three/tsl';

// Helper for permutation
const permute = Fn(([x]) => mod(x.mul(34).add(1).mul(x), 289));

/**
 * Custom Simplex Noise 2D implementation in TSL.
 * Returns a float value between 0.0 and 1.0.
 */
export const simplexNoise2D = Fn(([v]) => {

    // Constants: (3-sqrt(3))/6, (sqrt(3)-1)/2, -1+2*(3-sqrt(3))/6, 1/41
    const C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    
    // First corner
    const i = floor(v.add(dot(v, vec2(C.y, C.y))));
    const x0 = v.sub(i).add(dot(i, vec2(C.x, C.x)));
    
    // Determine which simplex: i1 = (x0.x > x0.y) ? vec2(1,0) : vec2(0,1)
    const i1x = step(x0.y, x0.x);
    const i1y = float(1).sub(i1x);
    
    // Offsets for other corners
    const x1 = x0.sub(vec2(i1x, i1y)).add(C.x);
    const x2 = x0.add(C.z);  // C.z = -1 + 2*C.x
    
    // Permutations
    const ii = mod(i, 289);
    const p = permute(
        permute(vec3(ii.y, ii.y.add(i1y), ii.y.add(1)))
            .add(vec3(ii.x, ii.x.add(i1x), ii.x.add(1)))
    );
    
    // Radial falloff from corners
    const m = max(float(0.5).sub(vec3(dot(x0, x0), dot(x1, x1), dot(x2, x2))), 0);
    const m4 = m.mul(m).mul(m).mul(m);
    
    // Gradients from permutation polynomial
    const x_grad = fract(p.mul(C.w)).mul(2).sub(1);
    const h = abs(x_grad).sub(0.5);
    const ox = floor(x_grad.add(0.5));
    const a0 = x_grad.sub(ox);
    
    // Normalize gradients implicitly
    const m4_norm = m4.mul(float(1.79284291400159).sub(float(0.85373472095314).mul(a0.mul(a0).add(h.mul(h)))));
    
    // Gradient dot products
    const g = vec3(
        a0.x.mul(x0.x).add(h.x.mul(x0.y)),
        a0.y.mul(x1.x).add(h.y.mul(x1.y)),
        a0.z.mul(x2.x).add(h.z.mul(x2.y))
    );
    
    // Scale to [-1, 1] then remap to [0, 1]
    return float(130).mul(dot(m4_norm, g)).mul(0.5).add(0.5);

});
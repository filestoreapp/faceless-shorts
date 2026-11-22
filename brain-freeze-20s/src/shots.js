// WHAT HAPPENS IF YOU DRINK A SLUSHIE TOO FAST? : the shot list (Deep Dive 3D, ~20 s sample).
// A shot: { id, at, note, draw(lt, d, t, blit) } : render the 3D frame with E.render(...), call blit() to put it on the
// 2D canvas, then draw 2D overlays (labels, pills). The camera moves in EVERY shot. Times come from the voice:
// cut(i) = just before line i, Wd('word', i) = when that word is said.
import * as THREE from 'three';
import { ctx, W, H, clamp, lerp, seg, eo, eio, eob } from './core/lib.js';
import { L, Wd, T } from './core/timing.js';
import { camera } from './core/engine.js';
import { Human } from './core/human.js';
import * as SETS from './core/sets.js';
import { label, pill, warning, blackout } from './core/look2d.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const lerpV = (a, b, k) => a.clone().lerp(b, k);
function screen(p, cam) { const v = p.clone().project(cam); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]; }

export function buildShots(E) {
  const S = [], CUES = [], add = (o) => (S.push(o), o), cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.08);
  const cam = camera(30);
  const KLOOK = { aperture: 0.003, maxblur: 0.01, bloom: 0.2 }, XLOOK = { aperture: 0.0015, bloom: 0.55, bloomThreshold: 0.4, vignette: 0.45 }, VLOOK = { aperture: 0.005, maxblur: 0.012, bloom: 0.6, bloomThreshold: 0.5, focus: 3.2 };

  // ── the world ──────────────────────────────────────────────────────────
  const K = SETS.kitchen(E), hero = new Human({}); hero.group.position.set(0.1, 0, -0.6); K.scene.add(hero.group);
  const X = SETS.xrayStage(E), xh = new Human({}), xmat = SETS.xrayMaterial(); xh.setBodyMaterial(xmat); const I = SETS.insides(); xh.spine.add(I.group); X.scene.add(xh.group);
  const VS = SETS.vessel(E);
  const CYAN = new THREE.Color('#4FD1E8'), RED = new THREE.Color('#FF3B3B');
  const chest = (h, k) => h.parts[0].scale.set(1 + 0.03 * k, 1 + 0.012 * k, 1 + 0.08 * k);          // inhale 0..1
  const lungs = (k) => I.lungs.forEach((l) => l.scale.set(1 + 0.12 * k, 1 + 0.1 * k, 1 + 0.12 * k));
  const reset = () => { hero.pose({}); chest(hero, 0); xh.pose({}); chest(xh, 0); lungs(0); I.heart.scale.setScalar(1); xmat.uniforms.uCol.value.copy(CYAN); };
  const kitchenRender = (focus, extra = {}) => E.render(K.scene, cam, { ...KLOOK, focus, ...extra });
  const FACE = V3(0.1, 1.68, -0.6);

  // 1 · HOOK: one big gulp of slushie (face close-up, head tips back, then swallows)
  { const st = cut(0), gulpAt = 1.5;
    add({ id: 'S01', at: st, note: 'face close-up: big gulp, head tips back then swallows', draw(lt, d, t, blit) {
      reset(); const k = eo(seg(lt, 0.1, 1.0)), sw = eio(seg(lt, gulpAt, gulpAt + 0.5));
      hero.pose({ head: [-14 * k + 10 * sw, 4, 0], spine: [-4 * k, 0, 0], lid: lerp(0, -0.3, k), look: [0, -6 * k], shR: [8 * k, 0, 8 + 6 * k], elR: 30 * k }); chest(hero, k - 0.4 * sw);
      cam.position.copy(lerpV(V3(0.42, 1.72, 0.45), V3(0.3, 1.7, 0.12), eio(lt / d))); cam.lookAt(FACE); kitchenRender(cam.position.distanceTo(FACE)); blit();
    } });
    cue(st + 0.12, 'whoosh'); cue(st + gulpAt, 'gulp'); }

  // 2 · the throat freezes (x-ray, camera on the neck, label on the throat)
  { const st = cut(1);
    add({ id: 'S02', at: st, note: 'x-ray neck, THROAT: FREEZING label', draw(lt, d, t, blit) {
      reset(); xh.pose({ head: [6, -4, 0], lid: -0.2 });
      cam.position.copy(lerpV(V3(0.5, 1.62, 1.35), V3(0.28, 1.56, 0.85), eio(lt / d))); cam.lookAt(0, 1.5, 0); E.render(X.scene, cam, { ...XLOOK, focus: cam.position.distanceTo(V3(0, 1.5, 0)) }); blit();
      const [lx, ly] = screen(V3(0.02, 1.52, 0.08), cam); label('THROAT: FREEZING', 720, 480, lx, ly, eob(seg(lt, 0.2, 0.45)));
    } });
    cue(st, 'whoosh'); cue(st + 0.25, 'pop', { gain: 0.5 }); }

  // 3 · vessels tighten (inside the vessel, cells darken and slow) …
  const snap = Wd('snap', 2) - 0.08;
  { const st = cut(2);
    add({ id: 'S03', at: st, note: 'blood vessel, cells darken: VESSELS TIGHTEN', draw(lt, d, t, blit) {
      const k = eio(clamp(lt / d)); VS.update(t, -lt * 0.6, 0, 0.7 * k);
      cam.position.set(Math.sin(lt) * 0.06, 0, -lt * 0.6); cam.lookAt(0.1, -0.05, -lt * 0.6 - 5); E.render(VS.scene, cam, VLOOK); blit();
      pill('VESSELS TIGHTEN', 540, 330, eob(seg(lt, 0.15, 0.4)), '#C9D6DD');
    } });
    cue(st, 'whoosh'); cue(st + 0.1, 'slide', { dur: snap - st, gain: 0.5 }); }
  // … then snap wide open (bright red cells rush past)
  add({ id: 'S04', at: snap, note: 'blood vessel, bright red cells rush: BLOOD RUSH', draw(lt, d, t, blit) {
    VS.update(t, -lt * 2.2, 0, 0); cam.position.set(0, 0, -lt * 2.2); cam.lookAt(0.15, -0.08, -lt * 2.2 - 5); E.render(VS.scene, cam, VLOOK); blit();
    pill('BLOOD RUSH', 540, 330, eob(seg(lt, 0.15, 0.4)), '#FF8A8A');
  } });
  cue(snap, 'whoosh'); cue(snap, 'slide', { dur: cut(3) - snap, gain: 0.6 });

  // 5 · the rush sets off pain nerves (x-ray body pulses red)
  { const st = cut(3);
    add({ id: 'S05', at: st, note: 'x-ray body pulses red: PAIN NERVES', draw(lt, d, t, blit) {
      reset(); chest(xh, 0.5); lungs(0.5); const p = 0.5 + 0.5 * Math.sin(lt * 7); xmat.uniforms.uCol.value.copy(CYAN).lerp(RED, clamp(lt / 0.8) * (0.55 + 0.45 * p));
      xh.pose({ head: [-4, 8 * Math.sin(lt * 1.3), 0], spine: [0, 0, Math.sin(lt * 9) * 1.2], lid: -0.4 });
      cam.position.copy(lerpV(V3(-0.4, 1.6, 1.9), V3(-0.15, 1.6, 1.25), eio(lt / d))); cam.lookAt(0, 1.45, 0); E.render(X.scene, cam, { ...XLOOK, bloom: 0.75, focus: cam.position.distanceTo(V3(0, 1.45, 0)) }); blit();
      pill('PAIN NERVES', 540, 1200, eob(seg(lt, 0.2, 0.45)), '#FF5A5A');
    } });
    cue(st, 'whoosh'); cue(st + 0.2, 'alarm', { dur: Math.min(1.2, cut(4) - st - 0.2) }); }

  // 6 · …but you feel it in your forehead (face close-up, wince, label on the forehead)
  { const st = cut(4);
    add({ id: 'S06', at: st, note: 'face wince, FOREHEAD label', draw(lt, d, t, blit) {
      reset(); const w = eio(seg(lt, 0.1, 0.6));
      hero.pose({ head: [10 * w, -6, 4 * w], spine: [4 * w, 0, 0], lid: lerp(0, 0.55, w), look: [0, 8 * w] }); chest(hero, 0.2);
      cam.position.copy(lerpV(V3(-0.25, 1.7, 0.35), V3(-0.18, 1.68, 0.12), eio(lt / d))); cam.lookAt(FACE); kitchenRender(cam.position.distanceTo(FACE)); blit();
      const [lx, ly] = screen(V3(0.1, 1.78, -0.52), cam); label('FOREHEAD', 760, 400, lx, ly, eob(seg(lt, 0.25, 0.5)));
    } });
    cue(st, 'whoosh'); cue(st + 0.25, 'pop', { gain: 0.5 }); }

  // 7 · it fades, and it can't hurt you (medium shot, hero relaxed, looks at camera)
  { const st = cut(5);
    add({ id: 'S07', at: st, note: 'hero relaxed, looks at camera, HARMLESS pill', draw(lt, d, t, blit) {
      reset(); hero.pose({ head: [-2, 0, 0], lid: 0.05, look: [0, 0] }); chest(hero, 0.3);
      const a = lerp(0.55, 0.25, eio(lt / d)); cam.position.set(0.1 + Math.sin(a) * 1.6, 1.5, -0.6 + Math.cos(a) * 1.6); cam.lookAt(0.1, 1.3, -0.6); kitchenRender(1.6); blit();
      pill('HARMLESS', 540, 1180, eob(seg(lt, 0.25, 0.5)), '#7CF29A');
    } });
    cue(st, 'whoosh'); cue(st + 0.25, 'pop', { gain: 0.6 }); }

  return { shots: S, cues: CUES };
}

// v2 Ricks-Clips-style characters: jointed rig, feet anchored to the canvas bottom,
// resolution chosen from on-screen size, joint limits so limbs never enter the torso.
import * as THREE from 'three';
import { MOCAP } from './mocap.js';

const INK = '#111';
const BW = 512, BH = 1024;          // base drawing space
const GROUND = 1010;                 // feet bottom in base space
const HEAD_R = 120, HEAD_Y = 236;
const BODY_TOP = 340, BODY_BOT = 600, BODY_W = 150;
const UL = 214, LL = 214;            // thigh / shin
const UA = 148, FA = 134;            // upper arm / forearm
const LW = 13;                       // limb width
const PADX = 300, PADT = 380, PADB = 40, FW = BW + 2 * PADX, FH = BH + PADT + PADB; // generous margins so props/arms never leave the card

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function shade(hex, f) { let c = hex.replace('#', ''); if (c.length === 3) c = c.split('').map(x => x + x).join(''); const n = parseInt(c, 16); let r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255; if (f < 0) { r *= 1 + f; g *= 1 + f; b *= 1 + f * 0.7; } else { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; } return `rgb(${r | 0},${g | 0},${b | 0})`; }

function seg(ctx, pts, w) {
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.stroke();
}

// ---------- faces & hats (same visual language as v1, smoother curves) ----------
function face(ctx, cx, cy, r, e, t) {
  ctx.fillStyle = INK; ctx.strokeStyle = INK; ctx.lineCap = 'round';
  const eyeY = cy - r * 0.02, ex = r * 0.32;
  const blink = (t * 0.7) % 4 < 0.08;
  const brow = (dx, ang, dy = 0) => { ctx.save(); ctx.translate(cx + dx, eyeY - r * 0.28 + dy); ctx.rotate(ang); ctx.lineWidth = r * 0.075; ctx.beginPath(); ctx.moveTo(-r * 0.15, 0); ctx.lineTo(r * 0.15, 0); ctx.stroke(); ctx.restore(); };
  const dot = (dx, s = 0.075) => { ctx.beginPath(); ctx.arc(cx + dx, eyeY, r * s, 0, 7); ctx.fill(); };
  const ring = (dx, s = 0.17) => { ctx.lineWidth = r * 0.05; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx + dx, eyeY, r * s, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(cx + dx, eyeY, r * 0.06, 0, 7); ctx.fill(); };
  const closed = (dx, up = 1) => { ctx.lineWidth = r * 0.06; ctx.beginPath(); ctx.arc(cx + dx, eyeY + (up > 0 ? r * 0.04 : -r * 0.04), r * 0.11, up > 0 ? Math.PI * 1.1 : 0.1, up > 0 ? Math.PI * 1.9 : Math.PI - 0.1); ctx.stroke(); };
  const my = cy + r * 0.42;
  const mouth = (k) => {
    ctx.lineWidth = r * 0.06;
    if (k === 'smile') { ctx.beginPath(); ctx.arc(cx, my - r * 0.12, r * 0.22, 0.25, Math.PI - 0.25); ctx.stroke(); }
    else if (k === 'grin') { ctx.beginPath(); ctx.moveTo(cx - r * 0.3, my - r * 0.06); ctx.quadraticCurveTo(cx, my + r * 0.32, cx + r * 0.3, my - r * 0.06); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(cx - r * 0.22, my - r * 0.05, r * 0.44, r * 0.07, r * 0.03); ctx.fill(); ctx.fillStyle = INK; }
    else if (k === 'flat') { ctx.beginPath(); ctx.moveTo(cx - r * 0.14, my); ctx.lineTo(cx + r * 0.14, my); ctx.stroke(); }
    else if (k === 'smirk') { ctx.beginPath(); ctx.moveTo(cx - r * 0.12, my); ctx.quadraticCurveTo(cx + r * 0.1, my + r * 0.05, cx + r * 0.2, my - r * 0.08); ctx.stroke(); }
    else if (k === 'o') { ctx.beginPath(); ctx.ellipse(cx, my, r * 0.09, r * 0.13, 0, 0, 7); ctx.fill(); }
    else if (k === 'scream') { ctx.beginPath(); ctx.ellipse(cx, my + r * 0.02, r * 0.16, r * 0.22, 0, 0, 7); ctx.fill(); }
    else if (k === 'frown') { ctx.beginPath(); ctx.arc(cx, my + r * 0.16, r * 0.18, Math.PI + 0.5, -0.5); ctx.stroke(); }
    else if (k === 'teeth') { ctx.lineWidth = r * 0.05; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(cx - r * 0.22, my - r * 0.1, r * 0.44, r * 0.2, r * 0.05); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx - r * 0.22, my); ctx.lineTo(cx + r * 0.22, my); for (let i = -1; i <= 1; i++) { ctx.moveTo(cx + i * r * 0.1, my - r * 0.1); ctx.lineTo(cx + i * r * 0.1, my + r * 0.1); } ctx.stroke(); ctx.fillStyle = INK; }
    else if (k === 'wavy') { ctx.beginPath(); for (let i = 0; i <= 12; i++) { const x = cx - r * 0.2 + i * r * 0.0333; const y = my + Math.sin(i * 1.3 + t * 30) * r * 0.025; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
  };
  switch (e) {
    case 'sleep': closed(-ex, -1); closed(ex, -1); mouth('o'); break;
    case 'smug': brow(-ex, 0.15); brow(ex, -0.25, -r * 0.04); ctx.beginPath(); ctx.roundRect(cx - ex - r * 0.1, eyeY - r * 0.02, r * 0.2, r * 0.07, r * 0.03); ctx.roundRect(cx + ex - r * 0.1, eyeY - r * 0.02, r * 0.2, r * 0.07, r * 0.03); ctx.fill(); mouth('smirk'); break;
    case 'happy': closed(-ex); closed(ex); mouth('grin'); break;
    case 'shock': ring(-ex); ring(ex); mouth('scream'); break;
    case 'worried': brow(-ex, -0.35); brow(ex, 0.35); blink ? (closed(-ex), closed(ex)) : (dot(-ex), dot(ex)); mouth('wavy'); break;
    case 'serious': brow(-ex, 0.3); brow(ex, -0.3); dot(-ex); dot(ex); mouth('flat'); break;
    case 'angry': brow(-ex, 0.5, r * 0.04); brow(ex, -0.5, r * 0.04); dot(-ex, 0.06); dot(ex, 0.06); mouth('teeth'); break;
    case 'cold': brow(-ex, -0.3); brow(ex, 0.3); ring(-ex, 0.14); ring(ex, 0.14); mouth('teeth'); break;
    case 'sick': brow(-ex, -0.25, r * 0.06); brow(ex, 0.25, r * 0.06); closed(-ex, -1); closed(ex, -1); mouth('wavy'); break;
    case 'drunk': closed(-ex, -1); dot(ex); mouth('smile'); break;
    case 'scared': brow(-ex, -0.45); brow(ex, 0.45); ring(-ex, 0.13); ring(ex, 0.13); mouth('frown'); break;
    default: blink ? (closed(-ex), closed(ex)) : (dot(-ex), dot(ex)); mouth('flat');
  }
}

function o_pom(c) { return shade(c, 0.55); }
function hat(ctx, kind, cx, top, r, col) {
  ctx.lineWidth = r * 0.07; ctx.strokeStyle = INK; ctx.lineJoin = 'round';
  const F = (c) => { ctx.fillStyle = c; ctx.fill(); ctx.stroke(); };
  if (kind === 'beanie') {
    const c = col || '#d8402a';
    ctx.beginPath(); ctx.ellipse(cx, top + r * 0.42, r * 0.98, r * 0.86, 0, Math.PI, 0); ctx.closePath(); F(c);
    ctx.save(); ctx.beginPath(); ctx.ellipse(cx, top + r * 0.42, r * 0.95, r * 0.83, 0, Math.PI, 0); ctx.clip(); ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = r * 0.05; for (let i = -6; i <= 6; i++) { ctx.beginPath(); ctx.moveTo(cx + i * r * 0.16, top + r * 0.45); ctx.lineTo(cx + i * r * 0.12, top - r * 0.5); ctx.stroke(); } ctx.restore();
    ctx.lineWidth = r * 0.07; ctx.strokeStyle = INK; ctx.beginPath(); ctx.roundRect(cx - r * 1.0, top + r * 0.22, r * 2.0, r * 0.34, r * 0.14); F(shade(c, -0.18));
    ctx.save(); ctx.strokeStyle = 'rgba(0,0,0,.22)'; ctx.lineWidth = r * 0.04; for (let i = -9; i <= 9; i++) { ctx.beginPath(); ctx.moveTo(cx + i * r * 0.1, top + r * 0.26); ctx.lineTo(cx + i * r * 0.1, top + r * 0.52); ctx.stroke(); } ctx.restore();
    ctx.beginPath(); ctx.arc(cx, top - r * 0.48, r * 0.24, 0, 7); F(o_pom(c));
  } else if (kind === 'parka') {
    const c = col || '#d8402a';
    ctx.beginPath(); ctx.moveTo(cx - r * 1.22, top + r * 1.95); ctx.quadraticCurveTo(cx - r * 1.42, top - r * 0.35, cx, top - r * 0.32); ctx.quadraticCurveTo(cx + r * 1.42, top - r * 0.35, cx + r * 1.22, top + r * 1.95);
    ctx.lineTo(cx + r * 0.9, top + r * 1.7); ctx.quadraticCurveTo(cx + r * 0.95, top + r * 0.42, cx, top + r * 0.36); ctx.quadraticCurveTo(cx - r * 0.95, top + r * 0.42, cx - r * 0.9, top + r * 1.7); ctx.closePath(); F(c);
    ctx.save(); ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.lineWidth = r * 0.05; for (const k of [0.25, 0.55]) { ctx.beginPath(); ctx.moveTo(cx - r * (1.25 - k * 0.1), top + r * (0.2 + k * 1.2)); ctx.quadraticCurveTo(cx - r * 1.1, top - r * 0.1 + k * r, cx - r * 0.95, top + r * (0.4 + k * 1.2)); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx + r * (1.25 - k * 0.1), top + r * (0.2 + k * 1.2)); ctx.quadraticCurveTo(cx + r * 1.1, top - r * 0.1 + k * r, cx + r * 0.95, top + r * (0.4 + k * 1.2)); ctx.stroke(); } ctx.restore();
    ctx.fillStyle = '#d8d2c8'; ctx.strokeStyle = 'rgba(80,70,60,.45)'; ctx.lineWidth = r * 0.02;
    for (let i = 0; i < 30; i++) { const a = Math.PI * 0.92 - i / 29 * Math.PI * 0.84 + Math.PI; const ex = Math.cos(a) * r * 0.97, ey = Math.sin(a) * r * 1.03; const rr = r * (0.075 + ((i * 37) % 5) * 0.008); ctx.beginPath(); ctx.arc(cx + ex, top + r * 0.98 + ey * 0.95, rr, 0, 7); ctx.fill(); ctx.stroke(); }
    for (const sd of [-1, 1]) for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.arc(cx + sd * r * (0.97 - i * 0.012), top + r * (1.0 + i * 0.13), r * 0.08, 0, 7); ctx.fill(); ctx.stroke(); }
  } else if (kind === 'helmet') {
    const c = col || '#f2c230';
    ctx.beginPath(); ctx.ellipse(cx, top + r * 0.42, r * 0.98, r * 0.8, 0, Math.PI, 0); ctx.closePath(); F(c);
    ctx.beginPath(); ctx.roundRect(cx - r * 1.02, top + r * 0.32, r * 2.04, r * 0.18, r * 0.08); F(shade(c, -0.25));
    ctx.fillStyle = 'rgba(0,0,0,.3)'; for (const x of [-0.5, 0, 0.5]) { ctx.beginPath(); ctx.ellipse(cx + x * r, top - r * 0.1, r * 0.1, r * 0.05, 0, 0, 7); ctx.fill(); }
  } else if (kind === 'captain') {
    ctx.beginPath(); ctx.moveTo(cx - r * 0.95, top + r * 0.32); ctx.quadraticCurveTo(cx, top - r * 0.5, cx + r * 0.95, top + r * 0.32); ctx.lineTo(cx + r * 0.8, top + r * 0.5); ctx.lineTo(cx - r * 0.8, top + r * 0.5); ctx.closePath(); F('#f4f4f4');
    ctx.beginPath(); ctx.rect(cx - r * 0.8, top + r * 0.42, r * 1.6, r * 0.2); F('#1b2a4a');
    ctx.beginPath(); ctx.ellipse(cx + r * 0.05, top + r * 0.7, r * 0.75, r * 0.16, -0.05, 0, Math.PI); F('#111');
    ctx.fillStyle = '#e8b931'; ctx.beginPath(); ctx.arc(cx, top + r * 0.2, r * 0.13, 0, 7); ctx.fill();
  } else if (kind === 'chef') {
    ctx.beginPath(); ctx.arc(cx - r * 0.42, top - r * 0.15, r * 0.38, 0, 7); F('#fff'); ctx.beginPath(); ctx.arc(cx + r * 0.42, top - r * 0.15, r * 0.38, 0, 7); F('#fff'); ctx.beginPath(); ctx.arc(cx, top - r * 0.38, r * 0.42, 0, 7); F('#fff');
    ctx.beginPath(); ctx.rect(cx - r * 0.7, top, r * 1.4, r * 0.42); F('#fff');
  } else if (kind === 'newsboy') {
    ctx.beginPath(); ctx.ellipse(cx, top + r * 0.18, r * 1.02, r * 0.5, 0, Math.PI, 0); ctx.closePath(); F(col || '#5a6f8f');
    ctx.save(); ctx.beginPath(); ctx.ellipse(cx, top + r * 0.18, r * 0.98, r * 0.46, 0, Math.PI, 0); ctx.clip(); ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = r * 0.06; for (let i = -6; i <= 6; i++) { ctx.beginPath(); ctx.moveTo(cx + i * r * 0.17, top + r * 0.2); ctx.lineTo(cx + i * r * 0.12, top - r * 0.4); ctx.stroke(); } ctx.restore();
    ctx.lineWidth = r * 0.07; ctx.strokeStyle = INK; ctx.beginPath(); ctx.ellipse(cx + r * 0.3, top + r * 0.22, r * 0.75, r * 0.13, 0.05, 0, 7); F('#2b3445');
  } else if (kind === 'bowler') {
    ctx.beginPath(); ctx.ellipse(cx, top + r * 0.25, r * 0.78, r * 0.62, 0, Math.PI, 0); ctx.closePath(); F('#2b2b2b');
    ctx.beginPath(); ctx.ellipse(cx, top + r * 0.27, r * 1.05, r * 0.14, 0, 0, 7); F('#2b2b2b');
  } else if (kind === 'top') {
    ctx.beginPath(); ctx.rect(cx - r * 0.55, top - r * 0.8, r * 1.1, r * 1.05); F('#1d1d1d');
    ctx.beginPath(); ctx.ellipse(cx, top + r * 0.27, r * 0.95, r * 0.13, 0, 0, 7); F('#1d1d1d');
    ctx.fillStyle = '#7a1e2b'; ctx.fillRect(cx - r * 0.55 + 4, top + r * 0.02, r * 1.1 - 8, r * 0.16);
  } else if (kind === 'hood') {
    // chaperon hood framing the face, with a liripipe tail
    ctx.beginPath(); ctx.moveTo(cx - r * 1.18, top + r * 1.9); ctx.quadraticCurveTo(cx - r * 1.35, top - r * 0.2, cx, top - r * 0.18); ctx.quadraticCurveTo(cx + r * 1.35, top - r * 0.2, cx + r * 1.18, top + r * 1.9);
    ctx.lineTo(cx + r * 0.84, top + r * 1.55); ctx.quadraticCurveTo(cx + r * 0.86, top + r * 0.48, cx, top + r * 0.46); ctx.quadraticCurveTo(cx - r * 0.86, top + r * 0.48, cx - r * 0.84, top + r * 1.55); ctx.closePath(); F(col || '#7a3a2a');
    ctx.beginPath(); ctx.moveTo(cx + r * 0.55, top - r * 0.05); ctx.quadraticCurveTo(cx + r * 1.4, top - r * 0.5, cx + r * 1.55, top + r * 0.4); ctx.lineTo(cx + r * 1.38, top + r * 0.42); ctx.quadraticCurveTo(cx + r * 1.2, top - r * 0.2, cx + r * 0.6, top + r * 0.12); ctx.closePath(); F(col || '#7a3a2a');
  } else if (kind === 'coif') {
    ctx.beginPath(); ctx.moveTo(cx - r * 0.98, top + r * 1.15); ctx.quadraticCurveTo(cx - r * 1.05, top - r * 0.05, cx, top - r * 0.05); ctx.quadraticCurveTo(cx + r * 1.05, top - r * 0.05, cx + r * 0.98, top + r * 1.15); ctx.lineTo(cx + r * 0.86, top + r * 1.1); ctx.quadraticCurveTo(cx + r * 0.8, top + r * 0.32, cx, top + r * 0.3); ctx.quadraticCurveTo(cx - r * 0.8, top + r * 0.32, cx - r * 0.86, top + r * 1.1); ctx.closePath(); F(col || '#f2ede0');
  } else if (kind === 'veil') {
    ctx.beginPath(); ctx.moveTo(cx - r * 1.2, top + r * 2.3); ctx.quadraticCurveTo(cx - r * 1.3, top - r * 0.25, cx, top - r * 0.2); ctx.quadraticCurveTo(cx + r * 1.3, top - r * 0.25, cx + r * 1.2, top + r * 2.3); ctx.lineTo(cx + r * 0.95, top + r * 2.1); ctx.quadraticCurveTo(cx + r * 0.95, top + r * 0.28, cx, top + r * 0.25); ctx.quadraticCurveTo(cx - r * 0.95, top + r * 0.28, cx - r * 0.95, top + r * 2.1); ctx.closePath(); F(col || '#e8e0cc');
  } else if (kind === 'crown') {
    ctx.beginPath(); ctx.moveTo(cx - r * 0.75, top + r * 0.35); for (let i = 0; i <= 4; i++) { const x = cx - r * 0.75 + i * r * 0.375; ctx.lineTo(x, top - r * (i % 2 ? 0.15 : 0.55)); } ctx.lineTo(cx + r * 0.75, top + r * 0.35); ctx.closePath(); F('#e8b931');
    ctx.fillStyle = '#c0283a'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(cx - r * 0.4 + i * r * 0.4, top + r * 0.12, r * 0.08, 0, 7); ctx.fill(); }
  } else if (kind === 'kettle') {
    ctx.beginPath(); ctx.ellipse(cx, top + r * 0.3, r * 0.82, r * 0.68, 0, Math.PI, 0); ctx.closePath(); F('#8a8f96');
    ctx.beginPath(); ctx.ellipse(cx, top + r * 0.32, r * 1.3, r * 0.2, 0, 0, 7); F('#7a7f86');
  } else if (kind === 'strawhat') {
    ctx.beginPath(); ctx.ellipse(cx, top + r * 0.25, r * 0.65, r * 0.5, 0, Math.PI, 0); ctx.closePath(); F('#d8b860');
    ctx.beginPath(); ctx.ellipse(cx, top + r * 0.3, r * 1.35, r * 0.22, 0, 0, 7); F('#e2c470');
  } else if (kind === 'barbercap') {
    ctx.beginPath(); ctx.ellipse(cx, top + r * 0.3, r * 0.85, r * 0.55, 0, Math.PI, 0); ctx.closePath(); F(col || '#3a3a6a');
  } else if (kind === 'laurel') {
    ctx.lineWidth = r * 0.04; const hc = top + r * 0.95; for (let i = 0; i < 14; i++) { if (i === 6 || i === 7) continue; const a = Math.PI + 0.12 + i * (Math.PI - 0.24) / 13; ctx.save(); ctx.translate(cx + Math.cos(a) * r * 1.0, hc + Math.sin(a) * r * 1.0); ctx.rotate(a + Math.PI / 2 + (i < 7 ? 0.5 : -0.5)); ctx.beginPath(); ctx.ellipse(0, 0, r * 0.2, r * 0.075, 0, 0, 7); ctx.fillStyle = i % 2 ? '#5a9a3a' : '#7ab84a'; ctx.fill(); ctx.stroke(); ctx.restore(); }
  } else if (kind === 'murmillo') {
    const hcB = '#c9a24a', hcD = '#9a7a30';
    ctx.beginPath(); ctx.ellipse(cx, top + r * 0.5, r * 1.02, r * 0.92, 0, Math.PI, 0); ctx.closePath(); F(hcB);
    ctx.beginPath(); ctx.ellipse(cx, top + r * 0.52, r * 1.45, r * 0.2, 0, 0, 7); F(hcD);
    ctx.beginPath(); ctx.moveTo(cx - r * 0.95, top + r * 0.1); ctx.quadraticCurveTo(cx - r * 0.2, top - r * 1.15, cx + r * 1.15, top - r * 0.55); ctx.quadraticCurveTo(cx + r * 0.7, top - r * 0.25, cx + r * 0.9, top + r * 0.1); ctx.closePath(); F(col || '#c02a2a');
    ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = r * 0.03; for (let i = 1; i < 7; i++) { ctx.beginPath(); ctx.moveTo(cx - r * 0.8 + i * r * 0.24, top - r * 0.05 - Math.sin(i / 7 * 3.14) * r * 0.55); ctx.lineTo(cx - r * 0.7 + i * r * 0.24, top + r * 0.12); ctx.stroke(); }
    ctx.save(); ctx.beginPath(); ctx.ellipse(cx, top + r * 1.0, r * 0.82, r * 0.5, 0, 0, 7); ctx.clip(); ctx.strokeStyle = 'rgba(70,52,18,.75)'; ctx.lineWidth = r * 0.05;
    for (let i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(cx + i * r * 0.18, top + r * 0.5); ctx.lineTo(cx + i * r * 0.18, top + r * 1.5); ctx.stroke(); } for (let j = 0; j < 4; j++) { ctx.beginPath(); ctx.moveTo(cx - r, top + r * (0.72 + j * 0.2)); ctx.lineTo(cx + r, top + r * (0.72 + j * 0.2)); ctx.stroke(); } ctx.restore();
    ctx.strokeStyle = INK; ctx.lineWidth = r * 0.06; ctx.beginPath(); ctx.ellipse(cx, top + r * 1.0, r * 0.82, r * 0.5, 0, 0, 7); ctx.stroke();
  } else if (kind === 'thraex') {
    ctx.beginPath(); ctx.ellipse(cx, top + r * 0.5, r * 1.0, r * 0.9, 0, Math.PI, 0); ctx.closePath(); F('#b8bcc4');
    ctx.beginPath(); ctx.ellipse(cx, top + r * 0.52, r * 1.3, r * 0.18, 0, 0, 7); F('#8a8e96');
    ctx.beginPath(); ctx.moveTo(cx - r * 0.25, top - r * 0.2); ctx.quadraticCurveTo(cx + r * 0.2, top - r * 1.25, cx + r * 0.95, top - r * 1.0); ctx.quadraticCurveTo(cx + r * 0.75, top - r * 0.75, cx + r * 0.35, top - r * 0.25); ctx.closePath(); F('#d8b040');
  } else if (kind === 'galea') {
    ctx.beginPath(); ctx.ellipse(cx, top + r * 0.42, r * 0.92, r * 0.78, 0, Math.PI, 0); ctx.closePath(); F('#b8a060');
    ctx.beginPath(); ctx.rect(cx - r * 1.0, top + r * 0.36, r * 0.24, r * 0.75); F('#a89050'); ctx.beginPath(); ctx.rect(cx + r * 0.76, top + r * 0.36, r * 0.24, r * 0.75); F('#a89050');
    ctx.beginPath(); ctx.moveTo(cx - r * 0.7, top - r * 0.2); ctx.quadraticCurveTo(cx, top - r * 1.05, cx + r * 0.7, top - r * 0.2); ctx.lineTo(cx + r * 0.6, top - r * 0.05); ctx.quadraticCurveTo(cx, top - r * 0.75, cx - r * 0.6, top - r * 0.05); ctx.closePath(); F('#c02a2a');
  } else if (kind === 'bun') {
    ctx.beginPath(); ctx.arc(cx, top - r * 0.08, r * 0.38, 0, 7); F(col || '#4a2e1a'); ctx.strokeStyle = shade(col || '#4a2e1a', 0.3); ctx.lineWidth = r * 0.045; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(cx, top - r * 0.08, r * (0.12 + i * 0.09), 0.3 + i, 2.6 + i); ctx.stroke(); } ctx.strokeStyle = INK; ctx.lineWidth = r * 0.07; ctx.fillStyle = '#d8b040'; ctx.beginPath(); ctx.rect(cx + r * 0.18, top - r * 0.5, r * 0.06, r * 0.4); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx - r * 0.98, top + r * 0.9); ctx.quadraticCurveTo(cx - r * 1.02, top + r * 0.02, cx, top + r * 0.04); ctx.quadraticCurveTo(cx + r * 1.02, top + r * 0.02, cx + r * 0.98, top + r * 0.9); ctx.quadraticCurveTo(cx + r * 0.7, top + r * 0.35, cx, top + r * 0.4); ctx.quadraticCurveTo(cx - r * 0.7, top + r * 0.35, cx - r * 0.98, top + r * 0.9); ctx.closePath(); F(col || '#4a2e1a');
  } else if (kind === 'hair') {
    const hc = col || '#2a1a10';
    for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + sd * r * 0.98, top + r * 0.55); ctx.quadraticCurveTo(cx + sd * r * 1.07, top + r * 1.05, cx + sd * r * 0.9, top + r * 1.25); ctx.lineTo(cx + sd * r * 0.8, top + r * 0.75); ctx.closePath(); F(hc); }
    ctx.beginPath(); ctx.moveTo(cx - r * 0.99, top + r * 0.8); ctx.quadraticCurveTo(cx - r * 1.04, top - r * 0.06, cx, top - r * 0.06); ctx.quadraticCurveTo(cx + r * 1.04, top - r * 0.06, cx + r * 0.99, top + r * 0.8); for (let i = 0; i <= 8; i++) ctx.lineTo(cx + r * 0.9 - i * r * 0.225, top + r * (i % 2 ? 0.44 : 0.28)); ctx.closePath(); F(hc);
    ctx.save(); ctx.clip(); ctx.strokeStyle = shade(hc.startsWith('#') ? hc : '#2a1a10', 0.3); ctx.lineWidth = r * 0.05; ctx.lineCap = 'round'; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(cx + i * r * 0.22 - r * 0.1, top + r * 0.05); ctx.quadraticCurveTo(cx + i * r * 0.24, top + r * 0.15, cx + i * r * 0.2 + r * 0.06, top + r * 0.3); ctx.stroke(); } ctx.restore();
  } else if (kind === 'brodie') {
    const hc = col || '#5d6340';
    ctx.beginPath(); ctx.ellipse(cx, top + r * 0.42, r * 0.8, r * 0.62, 0, Math.PI, 0); ctx.closePath(); F(hc);
    ctx.beginPath(); ctx.ellipse(cx, top + r * 0.44, r * 1.42, r * 0.24, -0.04, 0, 7); F(shade(hc, -0.12));
    ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = r * 0.05; ctx.beginPath(); ctx.ellipse(cx - r * 0.2, top + r * 0.12, r * 0.42, r * 0.22, -0.3, Math.PI * 1.1, Math.PI * 1.7); ctx.stroke();
    ctx.fillStyle = 'rgba(60,44,24,.35)'; for (const [x, y, rr] of [[-0.5, 0.2, 0.09], [0.35, 0.05, 0.07], [0.9, 0.45, 0.06]]) { ctx.beginPath(); ctx.arc(cx + x * r, top + y * r, rr * r, 0, 7); ctx.fill(); }
    ctx.strokeStyle = INK; ctx.lineWidth = r * 0.045; ctx.beginPath(); ctx.moveTo(cx - r * 0.72, top + r * 0.5); ctx.quadraticCurveTo(cx - r * 0.8, top + r * 1.35, cx - r * 0.2, top + r * 1.6); ctx.stroke();
  } else if (kind === 'stahlhelm') {
    const hc = col || '#6a7266';
    ctx.beginPath(); ctx.moveTo(cx - r * 1.08, top + r * 1.05); ctx.lineTo(cx - r * 0.98, top + r * 0.5); ctx.quadraticCurveTo(cx - r * 0.9, top - r * 0.32, cx, top - r * 0.34); ctx.quadraticCurveTo(cx + r * 0.95, top - r * 0.32, cx + r * 1.0, top + r * 0.5); ctx.lineTo(cx + r * 1.12, top + r * 1.05); ctx.lineTo(cx + r * 0.86, top + r * 1.0); ctx.lineTo(cx + r * 0.84, top + r * 0.62); ctx.quadraticCurveTo(cx, top + r * 0.5, cx - r * 0.84, top + r * 0.62); ctx.lineTo(cx - r * 0.86, top + r * 1.0); ctx.closePath(); F(hc);
    ctx.fillStyle = shade(hc, -0.3); for (const sd of [-1, 1]) { ctx.beginPath(); ctx.arc(cx + sd * r * 0.82, top + r * 0.22, r * 0.09, 0, 7); ctx.fill(); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.lineWidth = r * 0.05; ctx.beginPath(); ctx.arc(cx - r * 0.1, top + r * 0.3, r * 0.55, Math.PI * 1.15, Math.PI * 1.6); ctx.stroke();
  } else if (kind === 'cap') {
    const hc = col || '#8a7a52';
    ctx.beginPath(); ctx.moveTo(cx - r * 0.95, top + r * 0.42); ctx.quadraticCurveTo(cx - r * 0.2, top - r * 0.42, cx + r * 0.95, top + r * 0.2); ctx.lineTo(cx + r * 0.82, top + r * 0.52); ctx.lineTo(cx - r * 0.82, top + r * 0.56); ctx.closePath(); F(hc);
    ctx.beginPath(); ctx.rect(cx - r * 0.84, top + r * 0.38, r * 1.68, r * 0.2); F(shade(hc, -0.25));
    ctx.beginPath(); ctx.ellipse(cx + r * 0.25, top + r * 0.62, r * 0.72, r * 0.14, 0.05, 0, Math.PI); F('#2a1c10');
    ctx.fillStyle = '#c9a54a'; ctx.beginPath(); ctx.arc(cx, top + r * 0.2, r * 0.11, 0, 7); ctx.fill();
  } else if (kind === 'tricorn') {
    const c = col || '#1e1a18'; ctx.beginPath(); ctx.moveTo(cx - r * 1.25, top + r * 0.38); ctx.quadraticCurveTo(cx - r * 0.9, top - r * 0.62, cx, top - r * 0.48); ctx.quadraticCurveTo(cx + r * 0.9, top - r * 0.62, cx + r * 1.25, top + r * 0.38); ctx.quadraticCurveTo(cx, top + r * 0.12, cx - r * 1.25, top + r * 0.38); ctx.closePath(); F(c);
    ctx.beginPath(); ctx.ellipse(cx, top + r * 0.06, r * 0.6, r * 0.42, 0, Math.PI, 0); ctx.closePath(); F(shade(c, 0.12));
    ctx.strokeStyle = '#c9a24a'; ctx.lineWidth = r * 0.06; ctx.beginPath(); ctx.moveTo(cx - r * 1.18, top + r * 0.33); ctx.quadraticCurveTo(cx - r * 0.86, top - r * 0.52, cx, top - r * 0.4); ctx.quadraticCurveTo(cx + r * 0.86, top - r * 0.52, cx + r * 1.18, top + r * 0.33); ctx.stroke(); ctx.strokeStyle = INK;
    if (!col) { ctx.fillStyle = '#f2ecdc'; ctx.beginPath(); ctx.ellipse(cx + r * 0.05, top - r * 0.1, r * 0.17, r * 0.13, 0, 0, 7); ctx.fill(); ctx.lineWidth = r * 0.04; ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(cx - r * 0.0, top - r * 0.12, r * 0.04, 0, 7); ctx.arc(cx + r * 0.1, top - r * 0.12, r * 0.04, 0, 7); ctx.fill(); }
  } else if (kind === 'bandana') {
    const c = col || '#b8282a'; ctx.beginPath(); ctx.moveTo(cx - r * 1.0, top + r * 0.62); ctx.quadraticCurveTo(cx - r * 1.05, top - r * 0.18, cx, top - r * 0.22); ctx.quadraticCurveTo(cx + r * 1.05, top - r * 0.18, cx + r * 1.0, top + r * 0.62); ctx.quadraticCurveTo(cx, top + r * 0.38, cx - r * 1.0, top + r * 0.62); ctx.closePath(); F(c);
    ctx.fillStyle = 'rgba(255,255,255,.75)'; for (const [x, y] of [[-0.55, 0.15], [-0.15, -0.02], [0.3, 0.05], [0.65, 0.3], [-0.35, 0.38], [0.1, 0.3]]) { ctx.beginPath(); ctx.arc(cx + x * r, top + y * r, r * 0.055, 0, 7); ctx.fill(); }
    ctx.beginPath(); ctx.moveTo(cx + r * 0.95, top + r * 0.45); ctx.quadraticCurveTo(cx + r * 1.45, top + r * 0.55, cx + r * 1.55, top + r * 1.0); ctx.lineTo(cx + r * 1.3, top + r * 0.95); ctx.quadraticCurveTo(cx + r * 1.25, top + r * 0.7, cx + r * 0.92, top + r * 0.62); ctx.closePath(); F(c);
    ctx.beginPath(); ctx.moveTo(cx + r * 0.95, top + r * 0.5); ctx.quadraticCurveTo(cx + r * 1.4, top + r * 0.85, cx + r * 1.25, top + r * 1.25); ctx.lineTo(cx + r * 1.05, top + r * 1.1); ctx.quadraticCurveTo(cx + r * 1.15, top + r * 0.85, cx + r * 0.9, top + r * 0.6); ctx.closePath(); F(shade(c, -0.15));
  } else if (kind === 'officer') {
    ctx.beginPath(); ctx.moveTo(cx - r * 0.85, top + r * 0.3); ctx.quadraticCurveTo(cx, top - r * 0.35, cx + r * 0.85, top + r * 0.3); ctx.closePath(); F('#1b2a4a');
    ctx.beginPath(); ctx.ellipse(cx + r * 0.1, top + r * 0.42, r * 0.7, r * 0.14, 0, 0, Math.PI); F('#111');
  }
}

// ---------- arm poses: [shoulderAngle, elbowBend] per side, angles from straight down, + = outward ----------
// Joint limits: shoulder [0.10, 3.05], elbow [-2.4, 0.5]. 'front' = drawn in front of the head (hand at mouth).
const POSES = {
  down: () => [[0.16, 0.06], [0.16, 0.06]],
  up: (t) => [[2.75 + Math.sin(t * 12) * 0.18, 0.15], [2.75 + Math.sin(t * 12 + 1) * 0.18, 0.15]],
  point: () => [[0.16, 0.06], [1.62, 0.0]],
  hips: () => [[0.85, -1.75], [0.85, -1.75]],
  shrug: () => [[1.25, 1.35], [1.25, 1.35]],
  wave: (t) => [[0.16, 0.06], [2.55, -0.55 + Math.sin(t * 9) * 0.45]],
  drink: () => [[0.16, 0.06], [0.75, -2.35]],
  hold: () => [[0.16, 0.06], [0.45, -1.6]],
  swim: (t) => [[1.45 + Math.sin(t * 5) * 0.18, 0.35], [1.45 + Math.sin(t * 5 + Math.PI) * 0.18, 0.35]],
  limp: (t) => [[1.9 + Math.sin(t * 1.5) * 0.08, 0.3], [1.9 + Math.sin(t * 1.5 + 1) * 0.08, 0.3]],
  cross: () => null,
  tip: () => [[1.95, -0.35], [1.95, -0.35]],
  itch: (t) => [[0.16, 0.06], [2.3 + Math.sin(t * 22) * 0.12, -1.9]],
  ring: (t) => [[2.6 + Math.sin(t * 6) * 0.25, 0.1], [2.6 + Math.sin(t * 6) * 0.25, 0.1]],
  beg: () => [[1.2, -1.4], [1.2, -1.4]],
  carry: () => [[0.55, -1.2], [0.55, -1.2]],
  cover: (t) => [[2.45, -2.1 + Math.sin(t * 9) * 0.05], [2.45, -2.1 + Math.sin(t * 9 + 1) * 0.05]],
  paint: (t) => [[0.16, 0.06], [2.3 + Math.sin(t * 7) * 0.25, -0.5]],
  dig: (t) => [[1.0 + Math.sin(t * 6) * 0.3, -1.3], [0.8 + Math.sin(t * 6) * 0.3, -1.0]],
  cheer: (t) => [[2.9, 0.1], [2.5 + Math.sin(t * 10) * 0.2, -0.4]],
  guard: (t) => [[0.75 + Math.sin(t * 2.3) * 0.06, -1.5], [1.15 + Math.sin(t * 2.3 + 1) * 0.08, -1.25]],
  thrust: (t) => [[0.75, -1.5], [1.25 + Math.max(0, Math.sin(t * 5)) * 0.4, -1.2 + Math.max(0, Math.sin(t * 5)) * 1.1]],
  strike: (t) => [[0.6, -1.3], [1.6 + Math.sin(t * 7) * 0.9, -0.5 + Math.sin(t * 7) * 0.3]],
  raise: (t) => [[0.2, 0.05], [2.85 + Math.sin(t * 4) * 0.08, 0.1]],
  rub: (t) => [[1.3 + Math.sin(t * 8) * 0.15, -1.6], [1.3 + Math.sin(t * 8 + 2) * 0.15, -1.6]],
  offer: () => [[0.16, 0.06], [1.35, -0.25]],
  missio: () => [[0.3, -0.1], [2.6, 0.0]],
  eat: (t) => [[0.16, 0.06], [0.75, -2.3 + Math.abs(Math.sin(t * 4)) * 0.6]],
};

export class Char {
  constructor(o = {}) {
    this.o = Object.assign({ hat: 'none', jacket: '#2e8b7a', vest: null, expr: 'neutral', skin: '#ffffff', height: 1.75, mustache: false, beard: false, pose: 'stand', arms: 'down', extras: [] }, o);
    this.S = 1024; this.cv = document.createElement('canvas'); this.cv.width = Math.round(this.S * FW / BH); this.cv.height = Math.round(this.S * FH / BH);
    this.tex = this._tex();
    const h = this.o.height, w = h / 2; const pw = h * FW / BH, ph = h * FH / BH; this.pw = pw; this.ph = ph;
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, alphaTest: 0.04, side: THREE.DoubleSide }));
    this.ty = -(ph / 2 - (PADT + GROUND) / FH * ph); this.mesh.geometry.translate(0, this.ty, 0); // feet exactly at local y=0
    this.group = new THREE.Group(); this.group.add(this.mesh);
    const sc = document.createElement('canvas'); sc.width = sc.height = 128; const g = sc.getContext('2d'); const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(0.6, 'rgba(0,0,0,.25)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.75, w * 0.28), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    this.shadow.rotation.x = -Math.PI / 2; this.shadow.position.y = 0.004; this.group.add(this.shadow);
    this.ground = true; this.qa = {};
  }
  _tex() { const t = new THREE.CanvasTexture(this.cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; return t; }
  set(s) { Object.assign(this.o, s); return this; }
  // base-space (x,y) of the drawing -> world position (uses the billboard orientation of the last draw)
  worldOf(x, y) { const sh = this.shiftB || 0; const X = x + PADX, Y = y + sh + PADT; const lx = (X / FW - 0.5) * this.pw, ly = this.ph / 2 - Y / FH * this.ph + this.ty; this.mesh.updateMatrixWorld(); return new THREE.Vector3(lx, ly, 0.02).applyMatrix4(this.mesh.matrixWorld); }
  handW(i = 1) { const hb = this.handsB; if (!hb) return this.group.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, this.o.height * 0.5, 0)); const h = hb[Math.min(i, hb.length - 1)]; return this.worldOf(h[0], h[1]); }
  tipW() { return this.tipB ? this.worldOf(this.tipB[0], this.tipB[1]) : this.handW(1); }
  // choose canvas resolution from projected on-screen height
  resolve(cam, screenH) {
    const p0 = new THREE.Vector3(), p1 = new THREE.Vector3(); this.group.getWorldPosition(p0); p1.copy(p0); p1.y += this.o.height;
    p0.project(cam); p1.project(cam); const px = Math.abs(p1.y - p0.y) * 0.5 * screenH;
    let want = px > 1150 ? 2048 : px > 520 ? 1024 : 512; if (want < this.S) want = this.S; // only ever upgrade (no popping back and forth)
    if (want !== this.S) { this.S = want; this.cv = document.createElement('canvas'); this.cv.width = Math.round(want * FW / BH); this.cv.height = Math.round(want * FH / BH); const old = this.tex; this.tex = this._tex(); this.mesh.material.map = this.tex; this.mesh.material.needsUpdate = true; old.dispose(); }
  }
  draw(t, cam) {
    const o = this.o, ctx = this.cv.getContext('2d'), k = this.S / BH;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, this.cv.width, this.cv.height); ctx.setTransform(k, 0, 0, k, PADX * k, PADT * k); this.mesh.scale.x = o.flip ? -1 : 1;
    const cx = BW / 2, tt = t + (o.seed || 0);
    const moving = o.pose === 'walk' || o.pose === 'run' || o.pose === 'stomp';
    const ph = tt * (o.pose === 'run' ? 11 : 7);
    const AUTO = { run: o.runStyle || 'run', walk: o.walkStyle || 'walk', stand: 'idle' };
    const clipName = o.mocap === false ? null : (o.mocap || AUTO[o.pose] || null);
    const CL = clipName && MOCAP[clipName]; let MO = null;
    if (CL) { const n = CL.frames.length, fi = Math.floor((t - (o.mocapStart || 0)) * CL.fps * (o.mocapSpeed || 1) + (o.seed || 0) * 7); MO = CL.frames[o.mocapLoop === false ? Math.max(0, Math.min(n - 1, fi)) : ((fi % n) + n) % n]; }
    // ----- legs (hip->knee->foot), solve, then shift so the lowest foot touches GROUND -----
    let hipY = GROUND - UL - LL, legs;
    if (o.pose === 'sit') {
      hipY = GROUND - LL - 40;
      legs = [[[cx - 30, hipY], [cx - 70, hipY + 40], [cx - 75, hipY + 40 + LL]], [[cx + 30, hipY], [cx + 70, hipY + 40], [cx + 75, hipY + 40 + LL]]];
    } else if (o.pose === 'swim' || o.pose === 'float' || o.bust) {
      legs = null;
    } else if (MO) {
      legs = [-1, 1].map((sd, i) => {
        const [a0, kb] = i === 0 ? MO.R : MO.L; const a = a0 * (o.mocapAmp ?? (o.pose === 'stand' && !o.mocap ? 0.6 : 1.15)) + (o.stance || 0.05) * sd;
        const hx = cx + sd * 26; const kx = hx + Math.sin(a) * UL, ky = hipY + Math.cos(a) * UL;
        const fx = kx + Math.sin(a - kb) * LL, fy = ky + Math.cos(a - kb) * LL;
        return [[hx, hipY], [kx, ky], [fx, fy]];
      });
    } else {
      const amp = o.pose === 'run' ? 0.62 : o.pose === 'stomp' ? 0.12 : moving ? 0.42 : 0;
      legs = [-1, 1].map((sd, i) => {
        const s = Math.sin(ph + i * Math.PI);
        const a = (o.stance || 0.07) * sd + amp * s * 0.9;          // thigh swing
        const kb = moving ? Math.max(0, -Math.cos(ph + i * Math.PI)) * (o.pose === 'run' ? 1.2 : 0.7) : 0; // knee bend on recovery
        const hx = cx + sd * 26; const kx = hx + Math.sin(a) * UL, ky = hipY + Math.cos(a) * UL;
        const fx = kx + Math.sin(a - kb) * LL, fy = ky + Math.cos(a - kb) * LL;
        return [[hx, hipY], [kx, ky], [fx, fy]];
      });
    }
    let shift = 0;
    if (legs) { const low = Math.max(legs[0][2][1], legs[1][2][1]); shift = GROUND - 6 - low; }
    else if (o.pose === 'swim' || o.pose === 'float' || o.bust) shift = (GROUND - BODY_BOT) - 260; // upper body only, waterline handled in scene
    if (MO && MO.roll) { const rl = MO.roll * (o.mocapRoll ?? 0.8); ctx.translate(cx, GROUND); ctx.rotate(rl); ctx.translate(-cx, -GROUND); }
    ctx.translate(0, shift); this.shiftB = shift; this.rollB = (MO && MO.roll) ? MO.roll * (o.mocapRoll ?? 0.8) : 0;
    const breath = Math.sin(tt * 2.1) * 2.5, shiver = o.extras.includes('shiver') ? Math.sin(tt * 55) * 3 : 0;
    const bodyTop = (o.pose === 'sit' ? hipY - (BODY_BOT - BODY_TOP) + 15 : BODY_TOP) + breath * 0.3;
    const bodyBot = o.pose === 'sit' ? hipY + 15 : BODY_BOT;
    const headY = bodyTop - (BODY_TOP - HEAD_Y) + breath;
    if (legs) {
      for (const L of legs) { seg(ctx, L, LW); if (o.extras.includes('puttees')) { const [k_, f_] = [L[1], L[2]]; const ang = Math.atan2(f_[1] - k_[1], f_[0] - k_[0]); const len = Math.hypot(f_[0] - k_[0], f_[1] - k_[1]); ctx.save(); ctx.translate(k_[0], k_[1]); ctx.rotate(ang); ctx.beginPath(); ctx.roundRect(len * 0.18, -15, len * 0.8, 30, 10); ctx.fillStyle = o.putteeCol || '#6e6442'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 3; for (let q = 0.26; q < 0.95; q += 0.1) { ctx.beginPath(); ctx.moveTo(len * q, -14); ctx.lineTo(len * (q + 0.06), 14); ctx.stroke(); } if (o.extras.includes('mud')) { ctx.fillStyle = 'rgba(74,56,34,.75)'; ctx.fillRect(len * 0.6, -16, len * 0.4, 32); } ctx.restore(); } if (o.glad && L === legs[o.greaveLeg ?? 0]) { const gx = (L[1][0] + L[2][0]) / 2, gy = (L[1][1] + L[2][1]) / 2, ga = Math.atan2(L[2][1] - L[1][1], L[2][0] - L[1][0]); ctx.save(); ctx.translate(gx, gy + 10); ctx.rotate(ga - Math.PI / 2); ctx.beginPath(); ctx.roundRect(-20, -78, 40, 150, 14); ctx.fillStyle = o.greaveCol || '#c9a24a'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore(); } const fx = L[2][0] + (L[2][0] < cx ? -10 : 10);
        if (o.tunic) { ctx.fillStyle = '#7a4a26'; ctx.beginPath(); ctx.ellipse(fx, L[2][1] + 3, 24, 10, 0, 0, 7); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); ctx.strokeStyle = '#7a4a26'; ctx.lineWidth = 5; for (const q of [0.82, 0.9]) { const x = L[1][0] + (L[2][0] - L[1][0]) * q, y = L[1][1] + (L[2][1] - L[1][1]) * q; ctx.beginPath(); ctx.moveTo(x - 9, y - 4); ctx.lineTo(x + 9, y + 4); ctx.stroke(); } }
        else if (o.extras.includes('rotfeet')) { const fy = L[2][1]; ctx.save(); ctx.translate(fx, fy); ctx.scale(1.6, 1.6); ctx.translate(-fx, -fy); ctx.beginPath(); ctx.ellipse(fx, fy - 4, 34, 22, 0, 0, 7); ctx.fillStyle = '#b8a0c8'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = 'rgba(110,60,140,.75)'; ctx.beginPath(); ctx.ellipse(fx - 8, fy - 2, 18, 12, 0.3, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(120,170,60,.7)'; ctx.beginPath(); ctx.ellipse(fx + 12, fy - 10, 9, 6, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#d8c0e0'; for (let q = 0; q < 4; q++) { ctx.beginPath(); ctx.arc(fx - 22 + q * 12, fy - 18, 6, 0, 7); ctx.fill(); ctx.lineWidth = 3; ctx.stroke(); } ctx.restore(); }
        else if (o.extras.includes('boots')) { const fy = L[2][1]; const bc = o.bootCol || '#f2c230'; const dir = L[2][0] < cx ? -1 : 1;
          ctx.beginPath(); ctx.roundRect(fx - 26, fy - 60, 50, 60, 14); ctx.fillStyle = bc; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
          ctx.beginPath(); ctx.ellipse(fx + dir * 12, fy - 6, 40, 15, 0, 0, 7); ctx.fillStyle = shade(bc, -0.3); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#222'; ctx.fillRect(fx - 26, fy - 44, 50, 9);
          if (!o.noCrampons) { ctx.fillStyle = '#c8ccd2'; ctx.strokeStyle = INK; ctx.lineWidth = 3; for (let q = -3; q <= 3; q++) { const x = fx + dir * 12 + q * 11; ctx.beginPath(); ctx.moveTo(x - 4, fy + 6); ctx.lineTo(x, fy + 20); ctx.lineTo(x + 4, fy + 6); ctx.closePath(); ctx.fill(); ctx.stroke(); } } }
        else { ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(fx, L[2][1] + 2, 20, 9, 0, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.ellipse(fx - 6, L[2][1] - 1, 8, 3, 0, 0, 7); ctx.fill(); } }
    }
    if (o.extras.includes('o2pack') && !o.bust) { ctx.save(); ctx.translate(shiver, 0); const pc = o.packCol || '#3a4a6a';
      ctx.beginPath(); ctx.roundRect(cx - BODY_W / 2 - 26, bodyTop - 14, BODY_W + 52, bodyBot - bodyTop - 10, 34); ctx.fillStyle = pc; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.stroke();
      ctx.beginPath(); ctx.roundRect(cx + BODY_W / 2 - 4, bodyTop - 92, 46, 120, 20); ctx.fillStyle = o.bottleCol || '#e8742a'; ctx.fill(); ctx.lineWidth = 7; ctx.stroke(); ctx.fillStyle = '#c9ccd2'; ctx.beginPath(); ctx.roundRect(cx + BODY_W / 2 + 8, bodyTop - 116, 22, 28, 6); ctx.fill(); ctx.lineWidth = 5; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(cx + BODY_W / 2 + 4, bodyTop - 80, 8, 90);
      ctx.restore(); }
    // ----- body -----
    ctx.save(); ctx.translate(shiver, 0);
    ctx.beginPath(); ctx.roundRect(cx - BODY_W / 2, bodyTop, BODY_W, bodyBot - bodyTop, [42, 42, 48, 48]);
    ctx.fillStyle = o.jacket; ctx.fill(); ctx.lineWidth = 9; ctx.strokeStyle = INK; ctx.stroke();
    if (o.vest) { ctx.beginPath(); ctx.moveTo(cx - 34, bodyTop + 8); ctx.lineTo(cx, bodyTop + 88); ctx.lineTo(cx + 34, bodyTop + 8); ctx.closePath(); ctx.fillStyle = o.vest; ctx.fill(); ctx.lineWidth = 6; ctx.stroke(); }
    if (o.extras.includes('inmateNo')) { ctx.save(); const px = cx + BODY_W * 0.18, py = bodyTop + 70; ctx.fillStyle = '#f6f4ec'; ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.beginPath(); ctx.roundRect(px - 34, py - 20, 68, 40, 6); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#1a1a1a'; ctx.font = '900 26px Nunito, Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(o.inmateNo || '1441', px, py + 1); ctx.restore(); }
    if (o.extras.includes('stripes')) { ctx.save(); ctx.beginPath(); ctx.roundRect(cx - BODY_W / 2 + 4, bodyTop + 4, BODY_W - 8, bodyBot - bodyTop - 8, [40, 40, 44, 44]); ctx.clip(); ctx.fillStyle = o.stripeCol || 'rgba(30,40,80,.75)'; for (let y = bodyTop + 22; y < bodyBot; y += 36) ctx.fillRect(cx - 100, y, 200, 16); ctx.restore(); ctx.lineWidth = 9; ctx.strokeStyle = INK; ctx.beginPath(); ctx.roundRect(cx - BODY_W / 2, bodyTop, BODY_W, bodyBot - bodyTop, [42, 42, 48, 48]); ctx.stroke(); }
    if (o.extras.includes('down')) { ctx.save(); ctx.beginPath(); ctx.roundRect(cx - BODY_W / 2 + 4, bodyTop + 4, BODY_W - 8, bodyBot - bodyTop - 8, [40, 40, 44, 44]); ctx.clip();
      const g = ctx.createLinearGradient(cx - BODY_W / 2, 0, cx + BODY_W / 2, 0); g.addColorStop(0, 'rgba(255,255,255,.22)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,.18)'); ctx.fillStyle = g; ctx.fillRect(cx - 100, bodyTop, 200, bodyBot - bodyTop);
      ctx.strokeStyle = 'rgba(0,0,0,.32)'; ctx.lineWidth = 5; for (let y = bodyTop + 46; y < bodyBot - 10; y += 44) { ctx.beginPath(); ctx.moveTo(cx - 90, y); ctx.quadraticCurveTo(cx, y + 9, cx + 90, y); ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,255,255,.18)'; for (let y = bodyTop + 22; y < bodyBot - 10; y += 44) { ctx.beginPath(); ctx.ellipse(cx - 30, y, 34, 7, 0, 0, 7); ctx.fill(); }
      ctx.strokeStyle = 'rgba(30,30,30,.8)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(cx + 6, bodyTop + 8); ctx.lineTo(cx + 6, bodyBot - 10); ctx.stroke(); ctx.restore();
      if (o.suitBand) { ctx.save(); ctx.beginPath(); ctx.roundRect(cx - BODY_W / 2 + 4, bodyTop + 4, BODY_W - 8, bodyBot - bodyTop - 8, [40, 40, 44, 44]); ctx.clip(); ctx.fillStyle = o.suitBand; ctx.fillRect(cx - 100, bodyTop, 200, 70); ctx.restore(); }
      ctx.lineWidth = 9; ctx.strokeStyle = INK; ctx.beginPath(); ctx.roundRect(cx - BODY_W / 2, bodyTop, BODY_W, bodyBot - bodyTop, [42, 42, 48, 48]); ctx.stroke(); }
    if (o.extras.includes('o2pack')) { ctx.lineWidth = 16; ctx.strokeStyle = INK; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + sd * 46, bodyTop + 2); ctx.quadraticCurveTo(cx + sd * 54, bodyTop + 90, cx + sd * 50, bodyBot - 40); ctx.stroke(); ctx.lineWidth = 9; ctx.strokeStyle = o.strapCol || '#2a2a2a'; ctx.stroke(); ctx.lineWidth = 16; ctx.strokeStyle = INK; } }
    if (o.extras.includes('harness')) { ctx.beginPath(); ctx.roundRect(cx - BODY_W / 2 - 4, bodyBot - 64, BODY_W + 8, 26, 10); ctx.fillStyle = o.harnessCol || '#2a6ad8'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
      ctx.lineWidth = 7; ctx.strokeStyle = '#b8bcc4'; ctx.beginPath(); ctx.ellipse(cx + 34, bodyBot - 26, 12, 20, 0.2, 0, 7); ctx.stroke(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 7; ctx.strokeStyle = '#d8b030'; ctx.beginPath(); ctx.ellipse(cx - 30, bodyBot - 28, 10, 17, -0.2, 0, 7); ctx.stroke(); }
    if (o.coat) { for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + sd * 14, bodyTop + 2); ctx.lineTo(cx + sd * (BODY_W / 2 + 6), bodyTop + 30); ctx.lineTo(cx + sd * (BODY_W / 2 + 26), bodyBot + 150); ctx.lineTo(cx + sd * 30, bodyBot + 130); ctx.closePath(); ctx.fillStyle = o.coat; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = '#c9a24a'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(cx + sd * 26, bodyTop + 60 + i * 52, 7, 0, 7); ctx.fill(); ctx.lineWidth = 3; ctx.stroke(); } } }
    if (o.extras.includes('sash')) { ctx.beginPath(); ctx.roundRect(cx - BODY_W / 2 - 4, bodyBot - 70, BODY_W + 8, 34, 10); ctx.fillStyle = o.sashCol || '#b8282a'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx + 40, bodyBot - 44); ctx.quadraticCurveTo(cx + 56, bodyBot + 10, cx + 46, bodyBot + 56); ctx.lineTo(cx + 26, bodyBot + 50); ctx.quadraticCurveTo(cx + 36, bodyBot + 6, cx + 24, bodyBot - 44); ctx.closePath(); ctx.fill(); ctx.stroke();
      if (o.extras.includes('holster')) { ctx.save(); ctx.translate(cx - 30, bodyBot - 60); ctx.rotate(-0.5); ctx.fillStyle = '#5a3a1a'; ctx.beginPath(); ctx.roundRect(-10, -10, 20, 60, 6); ctx.fill(); ctx.lineWidth = 4; ctx.stroke(); ctx.fillStyle = '#7a7e86'; ctx.fillRect(-6, -40, 12, 34); ctx.strokeRect(-6, -40, 12, 34); ctx.restore(); } }
    if (o.extras.includes('sling')) { ctx.beginPath(); ctx.moveTo(cx - 60, bodyTop + 10); ctx.lineTo(cx + 70, bodyTop + 150); ctx.lineTo(cx - 30, bodyTop + 190); ctx.closePath(); ctx.fillStyle = '#f4f0e6'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = 'rgba(190,30,40,.75)'; ctx.beginPath(); ctx.arc(cx + 10, bodyTop + 150, 16, 0, 7); ctx.fill(); }
    if (o.tunic && !o.bust) {
      const sk = bodyBot + (o.tunicLen ?? 150), fl = o.tunicFlare ?? 30, sw = o.pose === 'run' || o.pose === 'walk' ? Math.sin(ph) * 10 : 0;
      ctx.beginPath(); ctx.moveTo(cx - BODY_W / 2 + 2, bodyBot - 40); ctx.lineTo(cx + BODY_W / 2 - 2, bodyBot - 40); ctx.lineTo(cx + BODY_W / 2 + fl + sw, sk); ctx.quadraticCurveTo(cx, sk + 14, cx - BODY_W / 2 - fl + sw, sk); ctx.closePath(); ctx.fillStyle = o.jacket; ctx.fill(); ctx.lineWidth = 9; ctx.stroke();
      { ctx.save(); ctx.beginPath(); ctx.roundRect(cx - BODY_W / 2 + 4, bodyTop + 4, BODY_W - 8, bodyBot - bodyTop - 44, [40, 40, 0, 0]); ctx.moveTo(cx - BODY_W / 2 + 6, bodyBot - 42); ctx.lineTo(cx + BODY_W / 2 - 6, bodyBot - 42); ctx.lineTo(cx + BODY_W / 2 + fl + sw - 4, sk - 4); ctx.quadraticCurveTo(cx, sk + 10, cx - BODY_W / 2 - fl + sw + 4, sk - 4); ctx.closePath(); ctx.clip();
        const cl = o.clavi || shade(o.jacket, -0.45); ctx.fillStyle = cl; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + sd * 30, bodyTop); ctx.lineTo(cx + sd * 44, bodyTop); ctx.lineTo(cx + sd * (52 + fl * 0.45) + sw, sk + 20); ctx.lineTo(cx + sd * (34 + fl * 0.4) + sw, sk + 20); ctx.closePath(); ctx.fill(); }
        ctx.fillStyle = o.hem || shade(o.jacket, -0.3); ctx.fillRect(cx - 200, sk - 26, 400, 40); ctx.fillStyle = o.hemDots || shade(o.jacket, 0.45); for (let x = -BODY_W / 2 - fl; x < BODY_W / 2 + fl; x += 22) { ctx.beginPath(); ctx.arc(cx + x + sw, sk - 14, 4.5, 0, 7); ctx.fill(); }
        ctx.strokeStyle = shade(o.jacket, -0.28); ctx.lineWidth = 4; ctx.lineCap = 'round'; for (const [x0, x1] of [[-46, -62], [-14, -18], [18, 24], [50, 66]]) { ctx.beginPath(); ctx.moveTo(cx + x0, bodyBot - 20); ctx.quadraticCurveTo(cx + (x0 + x1) / 2 + 6, (bodyBot + sk) / 2, cx + x1 * (1 + fl / 120) + sw, sk - 30); ctx.stroke(); }
        const gr = ctx.createLinearGradient(cx - BODY_W / 2 - fl, 0, cx + BODY_W / 2 + fl, 0); gr.addColorStop(0, 'rgba(255,255,255,.14)'); gr.addColorStop(0.45, 'rgba(255,255,255,0)'); gr.addColorStop(0.7, 'rgba(10,10,40,.06)'); gr.addColorStop(1, 'rgba(10,10,40,.26)'); ctx.fillStyle = gr; ctx.fillRect(0, bodyTop, BW, sk - bodyTop + 30);
        ctx.restore(); ctx.lineWidth = 9; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(cx + BODY_W / 2 + fl + sw, sk); ctx.quadraticCurveTo(cx, sk + 14, cx - BODY_W / 2 - fl + sw, sk); ctx.stroke(); }
      ctx.beginPath(); ctx.roundRect(cx - BODY_W / 2 - 2, bodyBot - 52, BODY_W + 4, 20, 6); ctx.fillStyle = o.belt || '#4a2e18'; ctx.fill(); ctx.lineWidth = 5; ctx.stroke(); ctx.fillStyle = '#c9a54a'; ctx.fillRect(cx - 9, bodyBot - 50, 18, 16);
      ctx.beginPath(); ctx.moveTo(cx - 36, bodyTop + 3); ctx.quadraticCurveTo(cx, bodyTop + 50, cx + 36, bodyTop + 3); ctx.lineWidth = 14; ctx.strokeStyle = o.hem || shade(o.jacket, -0.3); ctx.stroke(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx - 30, bodyTop + 2); ctx.quadraticCurveTo(cx, bodyTop + 40, cx + 30, bodyTop + 2); ctx.stroke(); ctx.fillStyle = '#d8b040'; ctx.beginPath(); ctx.arc(cx + 34, bodyTop + 14, 7, 0, 7); ctx.fill(); ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = '#3a2410'; ctx.beginPath(); ctx.roundRect(cx + BODY_W / 2 - 40, bodyBot - 34, 26, 34, 6); ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
      if (o.extras.includes('patch')) { ctx.fillStyle = '#a08a5a'; ctx.beginPath(); ctx.roundRect(cx + 18, bodyTop + 120, 34, 30, 4); ctx.fill(); ctx.lineWidth = 4; ctx.stroke(); ctx.setLineDash([6, 5]); ctx.strokeRect(cx + 22, bodyTop + 124, 26, 22); ctx.setLineDash([]); }
      if (o.extras.includes('dirt')) { ctx.fillStyle = 'rgba(70,50,30,.35)'; for (const [x, y, rr] of [[-40, 200, 18], [30, 260, 22], [-10, 330, 26], [45, 380, 16]]) { ctx.beginPath(); ctx.arc(cx + x, bodyTop + y - 120, rr, 0, 7); ctx.fill(); } }
    } else if (o.extras.includes('apron')) { ctx.beginPath(); ctx.roundRect(cx - 52, bodyTop + 70, 104, bodyBot - bodyTop - 78, 14); ctx.fillStyle = '#fafafa'; ctx.fill(); ctx.lineWidth = 6; ctx.stroke(); }
    else if (!o.tunic && !o.noButtons) { ctx.fillStyle = INK; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(cx, bodyTop + 110 + i * 40, 6, 0, 7); ctx.fill(); } }
    if (o.robe) { ctx.beginPath(); ctx.moveTo(cx - BODY_W / 2 - 10, bodyTop + 30); ctx.lineTo(cx + BODY_W / 2 + 10, bodyTop + 30); ctx.lineTo(cx + BODY_W / 2 + 60, GROUND - 20 - shift); ctx.lineTo(cx - BODY_W / 2 - 60, GROUND - 20 - shift); ctx.closePath(); ctx.fillStyle = o.robe; ctx.fill(); ctx.lineWidth = 9; ctx.stroke(); ctx.fillStyle = '#f2f2f2'; ctx.fillRect(cx - BODY_W / 2 - 4, bodyTop + 22, BODY_W + 8, 26); ctx.strokeRect(cx - BODY_W / 2 - 4, bodyTop + 22, BODY_W + 8, 26); ctx.fillStyle = INK; for (let i = 0; i < 9; i++) ctx.fillRect(cx - BODY_W / 2 + i * 18, bodyTop + 30, 5, 8); }
    if (o.toga) { ctx.save(); ctx.beginPath(); ctx.roundRect(cx - BODY_W / 2, bodyTop, BODY_W, bodyBot - bodyTop + (o.tunic ? (o.tunicLen ?? 150) : 0), [42, 42, 48, 48]); ctx.clip(); ctx.beginPath(); ctx.moveTo(cx - BODY_W / 2 - 10, bodyTop + 10); ctx.lineTo(cx - BODY_W / 2 + 46, bodyTop - 4); ctx.lineTo(cx + BODY_W / 2 + 20, bodyBot + 60); ctx.lineTo(cx + BODY_W / 2 - 50, bodyBot + 110); ctx.closePath(); ctx.fillStyle = o.toga; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 3; for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(cx - BODY_W / 2 + i * 14, bodyTop + 8 + i * 2); ctx.lineTo(cx + BODY_W / 2 - 40 + i * 12, bodyBot + 90); ctx.stroke(); } if (o.togaStripe) { ctx.beginPath(); ctx.moveTo(cx - BODY_W / 2 + 40, bodyTop - 2); ctx.lineTo(cx + BODY_W / 2 + 14, bodyBot + 62); ctx.lineWidth = 12; ctx.strokeStyle = o.togaStripe; ctx.stroke(); } ctx.restore(); }
    if (o.glad) { const lc = o.loin || '#f2ecdc';
      ctx.beginPath(); ctx.moveTo(cx - BODY_W / 2 + 4, bodyBot - 46); ctx.lineTo(cx + BODY_W / 2 - 4, bodyBot - 46); ctx.lineTo(cx + BODY_W / 2 - 14, bodyBot + 26); ctx.quadraticCurveTo(cx, bodyBot + 96, cx - BODY_W / 2 + 14, bodyBot + 26); ctx.closePath(); ctx.fillStyle = lc; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
      ctx.strokeStyle = shade(lc, -0.25); ctx.lineWidth = 4; for (const x of [-30, 0, 30]) { ctx.beginPath(); ctx.moveTo(cx + x, bodyBot - 30); ctx.quadraticCurveTo(cx + x * 0.7 + 6, bodyBot + 20, cx + x * 0.4, bodyBot + 60); ctx.stroke(); }
      ctx.beginPath(); ctx.roundRect(cx - BODY_W / 2 - 4, bodyBot - 74, BODY_W + 8, 34, 8); ctx.fillStyle = o.beltCol || '#c9a24a'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = shade(o.beltCol || '#c9a24a', -0.35); for (let x = -60; x <= 60; x += 30) { ctx.beginPath(); ctx.arc(cx + x, bodyBot - 57, 6, 0, 7); ctx.fill(); }
      ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(cx - 40, bodyTop + 70); ctx.quadraticCurveTo(cx - 20, bodyTop + 92, cx, bodyTop + 80); ctx.quadraticCurveTo(cx + 20, bodyTop + 92, cx + 40, bodyTop + 70); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx, bodyTop + 100); ctx.lineTo(cx, bodyBot - 90); ctx.stroke();
      if (o.galerus) { ctx.beginPath(); ctx.moveTo(cx - BODY_W / 2 - 20, bodyTop + 70); ctx.lineTo(cx - BODY_W / 2 - 14, bodyTop - 70); ctx.lineTo(cx - BODY_W / 2 + 46, bodyTop - 30); ctx.lineTo(cx - BODY_W / 2 + 40, bodyTop + 40); ctx.closePath(); ctx.fillStyle = '#c9a24a'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); }
    }
    if (o.extras.includes('webbing')) { ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 5; const wc = o.webCol || '#9a8f6c';
      for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + sd * 46, bodyTop + 6); ctx.lineTo(cx - sd * 40, bodyBot - 70); ctx.lineTo(cx - sd * 26, bodyBot - 70); ctx.lineTo(cx + sd * 60, bodyTop + 14); ctx.closePath(); ctx.fillStyle = wc; ctx.fill(); ctx.stroke(); }
      ctx.beginPath(); ctx.roundRect(cx - BODY_W / 2 - 3, bodyBot - 74, BODY_W + 6, 26, 6); ctx.fillStyle = wc; ctx.fill(); ctx.stroke();
      for (const sd of [-1, 1]) for (let k = 0; k < 2; k++) { ctx.beginPath(); ctx.roundRect(cx + sd * (22 + k * 28) - 13, bodyBot - 106, 26, 34, 5); ctx.fillStyle = shade(wc, -0.12); ctx.fill(); ctx.stroke(); }
      ctx.fillStyle = '#c9a54a'; ctx.fillRect(cx - 9, bodyBot - 70, 18, 18); ctx.restore(); }
    if (o.extras.includes('tunicbtn')) { ctx.fillStyle = '#c9a54a'; ctx.strokeStyle = INK; ctx.lineWidth = 3; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(cx, bodyTop + 40 + i * 48, 7, 0, 7); ctx.fill(); ctx.stroke(); } ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx - 50, bodyTop + 4); ctx.lineTo(cx, bodyTop + 30); ctx.lineTo(cx + 50, bodyTop + 4); ctx.stroke(); for (const sd of [-1, 1]) { ctx.beginPath(); ctx.roundRect(cx + sd * 38 - 20, bodyTop + 60, 40, 34, 4); ctx.stroke(); } }
    if (o.extras.includes('mud')) { ctx.fillStyle = 'rgba(78,58,34,.55)'; for (const [x, y, rr] of [[-48, 210, 22], [38, 250, 18], [-10, 300, 28], [50, 160, 12], [-55, 120, 10], [10, 220, 9]]) { ctx.beginPath(); ctx.ellipse(cx + x, bodyTop + y - 60, rr, rr * 0.75, x * 0.03, 0, 7); ctx.fill(); } }
    if (o.extras.includes('vestlife')) { ctx.beginPath(); ctx.roundRect(cx - BODY_W / 2 + 10, bodyTop + 18, BODY_W - 20, 135, 22); ctx.fillStyle = '#f7f2e4'; ctx.fill(); ctx.lineWidth = 6; ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx, bodyTop + 18); ctx.lineTo(cx, bodyTop + 153); ctx.stroke(); }
    ctx.restore();
    // ----- arms with joint limits + torso exclusion -----
    const shY = bodyTop + 42; const pose = POSES[o.pose === 'swim' ? 'swim' : o.arms] || POSES.down;
    const A = o.armsOverride ? o.armsOverride : (MO && o.mocapArms !== false && (o.mocap ? true : (o.arms === 'down' && o.pose !== 'stand'))) ? [[MO.RA[0], MO.RA[1]], [MO.LA[0], MO.LA[1]]] : pose(tt);
    const torso = { x0: cx - BODY_W / 2 - 4, x1: cx + BODY_W / 2 + 4, y0: bodyTop, y1: bodyBot };
    const arm = (sd, ang, bend) => {
      ang = clamp(ang, 0.10, 3.05); bend = clamp(bend, -2.4, 0.5);
      const sx = cx + sd * (BODY_W / 2 - 14) + shiver;
      const ak = o.armK ?? 1; let ex = sx + sd * Math.sin(ang) * UA * ak, ey = shY + Math.cos(ang) * UA * ak;
      let hx = ex + sd * Math.sin(ang + bend) * FA * ak, hy = ey + Math.cos(ang + bend) * FA * ak;
      // keep elbow & hand outside the torso silhouette (push outward horizontally)
      const out = (x, y) => (y > torso.y0 + 20 && y < torso.y1 && (sd < 0 ? x > torso.x0 - 8 : x < torso.x1 + 8)) ? (sd < 0 ? torso.x0 - 8 : torso.x1 + 8) : x;
      ex = out(ex, ey); hx = out(hx, hy);
      this.qa.armInside = this.qa.armInside || ((hy > torso.y0 + 20 && hy < torso.y1) && hx > torso.x0 - 7 && hx < torso.x1 + 7);
      return [[sx, shY], [ex, ey], [hx, hy]];
    };
    let arms = null, frontArm = null;
    if (A) {
      arms = [arm(-1, A[0][0], A[0][1]), arm(1, A[1][0], A[1][1])];
      if (o.arms === 'drink') { frontArm = arms[1]; arms = [arms[0]]; }
      for (const a of arms) { seg(ctx, a, 12); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(a[2][0], a[2][1], 9, 0, 7); ctx.fill(); }
      if (o.glad && o.manica !== false) { const a = arms[arms.length - 1]; for (const [p, q] of [[a[0], a[1]], [a[1], a[2]]]) { const n = 4; for (let k = 0; k < n; k++) { const x = p[0] + (q[0] - p[0]) * (k + 0.5) / n, y = p[1] + (q[1] - p[1]) * (k + 0.5) / n; ctx.beginPath(); ctx.arc(x, y, 15, 0, 7); ctx.fillStyle = k % 2 ? '#e8e0cc' : '#d8ccb0'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); } } }
      if (o.tunic || o.sleeves) for (const a of arms) { const [sx, sy] = a[0], [ex, ey] = a[1]; const ang = Math.atan2(ey - sy, ex - sx); ctx.save(); ctx.translate(sx, sy); ctx.rotate(ang); ctx.beginPath(); ctx.roundRect(-14, -24, 64, 48, [18, 12, 12, 18]); ctx.fillStyle = shade(o.jacket, -0.08); ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke(); ctx.strokeStyle = o.hem || shade(o.jacket, -0.3); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(44, -19); ctx.lineTo(44, 19); ctx.stroke(); ctx.restore(); }
    } else { // folded arms: drawn as one clean shape in front of the torso
      ctx.save(); ctx.translate(shiver, 0); ctx.beginPath(); ctx.roundRect(cx - BODY_W / 2 - 14, bodyTop + 95, BODY_W + 28, 46, 23); ctx.fillStyle = o.jacket; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - 10, bodyTop + 97); ctx.lineTo(cx + 18, bodyTop + 139); ctx.lineWidth = 6; ctx.stroke(); ctx.restore();
    }
    const prop = (h) => {
      if (!h) return; let [hx, hy] = h[2]; if ((o.prop === 'rag' || o.prop === 'whistle') && o.arms === 'drink') { hx = cx + (o.prop === 'rag' ? 6 : 40); hy = headY + HEAD_R * (o.prop === 'rag' ? 0.5 : 0.45); }
      if (o.prop === 'iceaxe') { ctx.save(); ctx.translate(hx, hy); ctx.rotate(o.swordAng ?? 0.15); ctx.fillStyle = '#2a2a2e'; ctx.beginPath(); ctx.roundRect(-7, -40, 14, 210, 6); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = '#3a8ad8'; ctx.fillRect(-7, 40, 14, 60); ctx.strokeRect(-7, 40, 14, 60);
        ctx.beginPath(); ctx.moveTo(-60, -52); ctx.quadraticCurveTo(0, -66, 54, -48); ctx.lineTo(64, -36); ctx.quadraticCurveTo(0, -46, -56, -40); ctx.closePath(); ctx.fillStyle = '#c8ccd4'; ctx.fill(); ctx.lineWidth = 5; ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, 170); ctx.lineTo(-7, 168); ctx.lineTo(0, 196); ctx.lineTo(7, 168); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
      if (o.prop === 'cash') { ctx.save(); ctx.translate(hx, hy - 6); ctx.rotate(-0.15); for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.roundRect(-58 + i * 3, -26 - i * 8, 116, 52, 6); ctx.fillStyle = i % 2 ? '#8ab878' : '#9ccc88'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); } ctx.fillStyle = '#4a7a3a'; ctx.font = '900 34px Nunito'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$', 6, -50); ctx.strokeStyle = '#4a7a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(6, -50, 30, 18, 0, 0, 7); ctx.stroke(); ctx.fillStyle = '#e8e0c8'; ctx.fillRect(-10, -76, 20, 52); ctx.restore(); }
      if (o.prop === 'gauge') { ctx.save(); ctx.translate(hx, hy - 30); const v = o.gaugeVal ?? 0.5; ctx.beginPath(); ctx.arc(0, 0, 50, 0, 7); ctx.fillStyle = '#c8ccd2'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 40, 0, 7); ctx.fillStyle = '#fafaf4'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
        ctx.lineWidth = 9; ctx.strokeStyle = '#e03a2a'; ctx.beginPath(); ctx.arc(0, 0, 31, Math.PI * 0.75, Math.PI * 1.1); ctx.stroke(); ctx.strokeStyle = '#3aa84a'; ctx.beginPath(); ctx.arc(0, 0, 31, Math.PI * 1.7, Math.PI * 2.25); ctx.stroke();
        const a = Math.PI * 0.75 + v * Math.PI * 1.5; ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 34, Math.sin(a) * 34); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(0, 0, 7, 0, 7); ctx.fill(); ctx.restore(); }
      if (o.prop === 'bottle') { ctx.save(); ctx.translate(hx, hy); ctx.rotate(o.arms === 'drink' ? 2.5 : 0.05); ctx.beginPath(); ctx.roundRect(-17, -72, 34, 82, 9); ctx.fillStyle = '#7a4a1c'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = '#f2e1b5'; ctx.fillRect(-14, -46, 28, 26); ctx.beginPath(); ctx.roundRect(-8, -98, 16, 28, 4); ctx.fillStyle = '#7a4a1c'; ctx.fill(); ctx.stroke(); ctx.restore(); }
      if (o.prop === 'tankard') { ctx.save(); ctx.translate(hx, hy); ctx.beginPath(); ctx.roundRect(-22, -62, 44, 64, 6); ctx.fillStyle = '#9a6a3a'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = '#fff6dc'; ctx.beginPath(); ctx.ellipse(0, -62, 26, 12, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 4; for (const y of [-46, -16]) { ctx.beginPath(); ctx.moveTo(-22, y); ctx.lineTo(22, y); ctx.stroke(); } ctx.restore(); }
      if (o.prop === 'pot') { ctx.save(); ctx.translate(hx, hy - 10); ctx.rotate(o.potTilt || 0); ctx.beginPath(); ctx.moveTo(-46, -30); ctx.quadraticCurveTo(-50, 40, 0, 42); ctx.quadraticCurveTo(50, 40, 46, -30); ctx.closePath(); ctx.fillStyle = '#b07a4a'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); ctx.beginPath(); ctx.ellipse(0, -30, 50, 12, 0, 0, 7); ctx.fillStyle = '#5a3a14'; ctx.fill(); ctx.stroke(); ctx.restore(); }
      if (o.prop === 'knife') { ctx.save(); ctx.translate(hx, hy); ctx.rotate(-0.9); ctx.fillStyle = '#4a2e18'; ctx.fillRect(-6, -10, 12, 36); ctx.beginPath(); ctx.moveTo(-6, -10); ctx.lineTo(0, -70); ctx.lineTo(8, -10); ctx.closePath(); ctx.fillStyle = '#d8dce0'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore(); }
      if (o.prop === 'halberd') { ctx.save(); ctx.translate(hx, hy); ctx.fillStyle = '#6a4a2a'; ctx.fillRect(-6, -330, 12, 420); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.strokeRect(-6, -330, 12, 420); ctx.beginPath(); ctx.moveTo(6, -300); ctx.quadraticCurveTo(70, -280, 60, -220); ctx.lineTo(6, -240); ctx.closePath(); ctx.fillStyle = '#c8ccd0'; ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-6, -330); ctx.lineTo(0, -390); ctx.lineTo(6, -330); ctx.fill(); ctx.stroke(); ctx.restore(); }
      if (o.prop === 'scroll') { ctx.save(); ctx.translate(hx, hy - 20); ctx.fillStyle = '#efe0b8'; ctx.fillRect(-40, -50, 80, 100); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.strokeRect(-40, -50, 80, 100); ctx.fillStyle = '#9a1e1e'; ctx.beginPath(); ctx.arc(0, 30, 10, 0, 7); ctx.fill(); ctx.restore(); }
      if (o.prop === 'purse') { ctx.save(); ctx.translate(hx, hy + 30); ctx.beginPath(); ctx.ellipse(0, 0, 34, 38, 0, 0, 7); ctx.fillStyle = '#8a5a2a'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); ctx.beginPath(); ctx.moveTo(-20, -30); ctx.lineTo(20, -30); ctx.stroke(); ctx.fillStyle = '#e8c040'; ctx.font = '900 34px Nunito'; ctx.textAlign = 'center'; ctx.fillText('$', 0, 14); ctx.restore(); }
      if (o.prop === 'bread') { ctx.save(); ctx.translate(hx, hy); ctx.beginPath(); ctx.ellipse(0, 0, 48, 28, -0.3, 0, 7); ctx.fillStyle = '#c8843e'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore(); }
      if (o.prop === 'torch') { ctx.save(); ctx.translate(hx, hy); ctx.fillStyle = '#5a3a1a'; ctx.fillRect(-7, -90, 14, 120); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.strokeRect(-7, -90, 14, 120); const fl = Math.sin(tt * 20) * 6; ctx.beginPath(); ctx.moveTo(-22, -90); ctx.quadraticCurveTo(-26 + fl, -150, 0, -185 + fl); ctx.quadraticCurveTo(26 - fl, -150, 22, -90); ctx.closePath(); ctx.fillStyle = '#ff9a2a'; ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.ellipse(0, -112, 10, 18, 0, 0, 7); ctx.fillStyle = '#ffe27a'; ctx.fill(); ctx.restore(); }
      if (o.prop === 'bowl') { ctx.save(); ctx.translate(hx, hy); ctx.beginPath(); ctx.moveTo(-50, -10); ctx.quadraticCurveTo(0, 50, 50, -10); ctx.closePath(); ctx.fillStyle = '#c8ccd0'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore(); }
      if (o.prop === 'amphora') { ctx.save(); ctx.translate(hx, hy + 20); ctx.beginPath(); ctx.moveTo(-10, -95); ctx.lineTo(10, -95); ctx.quadraticCurveTo(48, -60, 40, 10); ctx.quadraticCurveTo(28, 60, 0, 95); ctx.quadraticCurveTo(-28, 60, -40, 10); ctx.quadraticCurveTo(-48, -60, -10, -95); ctx.closePath(); ctx.fillStyle = '#c0703e'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); ctx.beginPath(); ctx.moveTo(-10, -85); ctx.quadraticCurveTo(-34, -80, -30, -50); ctx.moveTo(10, -85); ctx.quadraticCurveTo(34, -80, 30, -50); ctx.stroke(); ctx.restore(); }
      if (o.prop === 'ladle') { ctx.save(); ctx.translate(hx, hy); ctx.rotate(o.ladleTilt || -0.4); ctx.fillStyle = '#7a5a3a'; ctx.fillRect(-5, -10, 10, 110); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.strokeRect(-5, -10, 10, 110); ctx.beginPath(); ctx.arc(0, 110, 28, 0, Math.PI); ctx.closePath(); ctx.fillStyle = '#9a7a52'; ctx.fill(); ctx.stroke(); ctx.restore(); }
      if (o.prop === 'brush') { ctx.save(); ctx.translate(hx, hy); ctx.rotate(-0.5); ctx.fillStyle = '#7a5a3a'; ctx.fillRect(-5, -70, 10, 80); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.strokeRect(-5, -70, 10, 80); ctx.fillStyle = '#b8282a'; ctx.beginPath(); ctx.roundRect(-11, -100, 22, 34, 6); ctx.fill(); ctx.stroke(); ctx.restore(); }
      if (o.prop === 'shovel') { ctx.save(); ctx.translate(hx, hy); ctx.rotate(0.5); ctx.fillStyle = '#7a5a3a'; ctx.fillRect(-6, -120, 12, 220); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.strokeRect(-6, -120, 12, 220); ctx.beginPath(); ctx.moveTo(-34, 100); ctx.lineTo(34, 100); ctx.lineTo(26, 170); ctx.quadraticCurveTo(0, 190, -26, 170); ctx.closePath(); ctx.fillStyle = '#8a8f96'; ctx.fill(); ctx.stroke(); ctx.restore(); }
      if (o.prop === 'bundle') { ctx.save(); ctx.translate(hx, hy + 10); ctx.beginPath(); ctx.ellipse(0, 0, 60, 46, 0.2, 0, 7); ctx.fillStyle = o.bundleColor || '#c8a070'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); ctx.beginPath(); ctx.moveTo(-10, -44); ctx.lineTo(4, 44); ctx.stroke(); ctx.restore(); }
      if (o.prop === 'lamp') { ctx.save(); ctx.translate(hx, hy - 6); ctx.beginPath(); ctx.ellipse(0, 0, 40, 18, 0, 0, 7); ctx.fillStyle = '#b8743e'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); const fl = Math.sin(tt * 18) * 4; ctx.beginPath(); ctx.moveTo(32, -8); ctx.quadraticCurveTo(48 + fl, -40, 40, -62); ctx.quadraticCurveTo(28, -36, 32, -8); ctx.fillStyle = '#ffb030'; ctx.fill(); ctx.restore(); }
      { const a = o.swordAng ?? (o.prop === 'rifle' ? -0.3 : o.prop === 'trident' ? -0.25 : o.prop === 'stick' ? 0.35 : -0.5); const L = o.prop === 'rifle' ? 400 : o.prop === 'trident' ? 450 : o.prop === 'stick' ? 300 : o.prop === 'sword' || o.prop === 'rudis' ? 156 : o.prop === 'cutlass' ? 190 : 0; this.tipB = L ? [hx + Math.sin(a) * L, hy - Math.cos(a) * L] : null; }
      if (o.prop === 'sword' || o.prop === 'rudis') { const wood = o.prop === 'rudis'; ctx.save(); ctx.translate(hx, hy); ctx.rotate(o.swordAng ?? -0.5); ctx.fillStyle = '#5a3a1a'; ctx.beginPath(); ctx.roundRect(-8, -6, 16, 40, 5); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = wood ? '#a87a44' : '#c9a24a'; ctx.beginPath(); ctx.roundRect(-26, -16, 52, 14, 6); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-14, -16); ctx.lineTo(-13, -128); ctx.lineTo(0, -156); ctx.lineTo(13, -128); ctx.lineTo(14, -16); ctx.closePath(); ctx.fillStyle = wood ? '#b8864a' : '#dfe4ea'; ctx.fill(); ctx.lineWidth = 5; ctx.stroke(); if (!wood) { ctx.strokeStyle = 'rgba(120,130,140,.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(0, -140); ctx.stroke(); } else { ctx.strokeStyle = 'rgba(90,50,20,.6)'; ctx.lineWidth = 2; for (let y = -30; y > -130; y -= 22) { ctx.beginPath(); ctx.moveTo(-8, y); ctx.quadraticCurveTo(0, y - 8, 8, y - 2); ctx.stroke(); } } ctx.restore(); }
      if (o.prop === 'cutlass') { ctx.save(); ctx.translate(hx, hy); ctx.rotate(o.swordAng ?? -0.5); ctx.fillStyle = '#4a2e18'; ctx.beginPath(); ctx.roundRect(-8, -6, 16, 38, 5); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
        ctx.strokeStyle = '#c9a24a'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-14, -14); ctx.quadraticCurveTo(-34, 14, -6, 34); ctx.stroke(); ctx.strokeStyle = INK; ctx.fillStyle = '#c9a24a'; ctx.beginPath(); ctx.roundRect(-24, -20, 48, 12, 5); ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-10, -20); ctx.quadraticCurveTo(-12, -110, 6, -192); ctx.quadraticCurveTo(26, -150, 26, -100); ctx.quadraticCurveTo(22, -50, 12, -20); ctx.closePath(); const bg = ctx.createLinearGradient(-12, 0, 26, 0); bg.addColorStop(0, '#f4f6f8'); bg.addColorStop(0.5, '#c8ced6'); bg.addColorStop(1, '#8a929c'); ctx.fillStyle = bg; ctx.fill(); ctx.lineWidth = 5; ctx.stroke();
        if (o.bloody) { ctx.fillStyle = 'rgba(170,20,30,.85)'; ctx.beginPath(); ctx.moveTo(4, -150); ctx.quadraticCurveTo(22, -130, 20, -100); ctx.lineTo(10, -112); ctx.closePath(); ctx.fill(); } ctx.restore(); }
      if (o.prop === 'pistol') { ctx.save(); ctx.translate(hx, hy); ctx.rotate(o.swordAng ?? -1.4); ctx.fillStyle = '#5a3a1a'; ctx.beginPath(); ctx.moveTo(-10, 30); ctx.quadraticCurveTo(-26, 0, -12, -20); ctx.lineTo(12, -20); ctx.lineTo(14, 26); ctx.closePath(); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = '#7a7e86'; ctx.beginPath(); ctx.roundRect(-6, -120, 14, 104, 4); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#c9a24a'; ctx.beginPath(); ctx.arc(1, -18, 9, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore(); }
      if (o.prop === 'coins') { ctx.save(); ctx.translate(hx, hy); for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(-20 + i * 12, -8 - i * 9, 26, 10, 0.1, 0, 7); ctx.fillStyle = i % 2 ? '#d8d8dc' : '#e8b931'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); } ctx.restore(); }
      if (o.prop === 'hardtack') { ctx.save(); ctx.translate(hx, hy); ctx.rotate(-0.3); ctx.beginPath(); ctx.roundRect(-34, -30, 68, 60, 8); ctx.fillStyle = '#d8b878'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = '#8a6a3a'; for (const [x, y] of [[-16, -12], [0, -12], [16, -12], [-16, 6], [0, 6], [16, 6]]) { ctx.beginPath(); ctx.arc(x, y, 3.5, 0, 7); ctx.fill(); } ctx.fillStyle = '#2a1a10'; for (let i = 0; i < 4; i++) { const q = (tt * 0.5 + i * 0.27) % 1; ctx.beginPath(); ctx.ellipse(-26 + q * 52, -26 + Math.sin(i * 3 + q * 9) * 14 + i * 13, 6, 3, q * 6, 0, 7); ctx.fill(); } ctx.restore(); }
      if (o.prop === 'trident') { ctx.save(); ctx.translate(hx, hy); ctx.rotate(o.swordAng ?? -0.25); ctx.fillStyle = '#7a5a34'; ctx.fillRect(-6, -360, 12, 470); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.strokeRect(-6, -360, 12, 470); ctx.fillStyle = '#c8ccd4'; ctx.beginPath(); ctx.moveTo(-40, -352); ctx.lineTo(40, -352); ctx.lineTo(40, -368); ctx.lineTo(-40, -368); ctx.closePath(); ctx.fill(); ctx.stroke(); for (const x of [-34, 0, 34]) { ctx.beginPath(); ctx.moveTo(x - 7, -366); ctx.lineTo(x, -450 - (x ? 0 : 20)); ctx.lineTo(x + 7, -366); ctx.closePath(); ctx.fill(); ctx.stroke(); } ctx.restore(); }
      if (o.prop === 'stick') { ctx.save(); ctx.translate(hx, hy); ctx.rotate(o.swordAng ?? 0.35); ctx.fillStyle = '#e8dcc0'; ctx.fillRect(-5, -300, 10, 360); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.strokeRect(-5, -300, 10, 360); ctx.restore(); }
      if (o.prop === 'cup') { ctx.save(); ctx.translate(hx, hy); ctx.rotate(o.arms === 'drink' ? 2.3 : (o.cupTilt || 0)); ctx.beginPath(); ctx.moveTo(-34, -46); ctx.lineTo(34, -46); ctx.lineTo(24, 14); ctx.quadraticCurveTo(0, 22, -24, 14); ctx.closePath(); ctx.fillStyle = '#a8643a'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); ctx.beginPath(); ctx.ellipse(0, -46, 34, 9, 0, 0, 7); ctx.fillStyle = '#8a8680'; ctx.fill(); ctx.stroke(); ctx.restore(); }
      if (o.prop === 'palm') { ctx.save(); ctx.translate(hx, hy); ctx.rotate(-0.15); ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, 20); ctx.quadraticCurveTo(10, -150, -10, -300); ctx.stroke(); for (let i = 0; i < 12; i++) { const y = -60 - i * 20, l = 70 - i * 3; for (const sd of [-1, 1]) { ctx.save(); ctx.translate(Math.sin(i * 0.2) * 6, y); ctx.rotate(sd * (0.9 - i * 0.02)); ctx.beginPath(); ctx.ellipse(0, -l / 2, 9, l / 2, 0, 0, 7); ctx.fillStyle = i % 2 ? '#4a9a3a' : '#6ab84a'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke(); ctx.restore(); } } ctx.restore(); }
      if (o.prop === 'whip') { ctx.save(); ctx.translate(hx, hy); ctx.fillStyle = '#5a3a1a'; ctx.fillRect(-7, -60, 14, 70); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.strokeRect(-7, -60, 14, 70); ctx.lineWidth = 5; ctx.strokeStyle = '#3a2410'; ctx.beginPath(); ctx.moveTo(0, -60); const w = Math.sin(tt * 6); ctx.bezierCurveTo(60 + w * 30, -140, 140, -40 + w * 40, 90 + w * 50, 60); ctx.stroke(); ctx.restore(); }
      if (o.prop === 'chain') { ctx.save(); ctx.translate(hx, hy); ctx.strokeStyle = '#6a6e76'; ctx.lineWidth = 6; for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.ellipse(-k * 22, 10 + Math.sin(k) * 6, 12, 7, k % 2 ? 0 : 1.4, 0, 7); ctx.stroke(); } ctx.restore(); }
      if (o.prop === 'horn') { ctx.save(); ctx.translate(hx, hy - 60); ctx.lineWidth = 26; ctx.strokeStyle = INK; ctx.beginPath(); ctx.arc(30, 40, 120, -2.6, 1.9); ctx.stroke(); ctx.lineWidth = 16; ctx.strokeStyle = '#d8a83a'; ctx.stroke(); ctx.beginPath(); ctx.ellipse(-80, 130, 34, 46, 0.6, 0, 7); ctx.fillStyle = '#e8b84a'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(-60, -40); ctx.lineTo(110, 100); ctx.stroke(); ctx.restore(); }
      if (o.prop === 'rake') { ctx.save(); ctx.translate(hx, hy); ctx.rotate(0.6); ctx.fillStyle = '#7a5a34'; ctx.fillRect(-5, -60, 10, 330); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.strokeRect(-5, -60, 10, 330); ctx.fillRect(-60, 262, 120, 14); for (let x = -54; x <= 54; x += 18) ctx.fillRect(x - 3, 270, 6, 26); ctx.restore(); }
      if (o.prop === 'rifle') { ctx.save(); ctx.translate(hx, hy); ctx.rotate(o.swordAng ?? -0.3); ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(-10, 150); ctx.lineTo(14, 150); ctx.lineTo(12, 60); ctx.lineTo(8, -210); ctx.lineTo(-6, -210); ctx.lineTo(-12, 40); ctx.lineTo(-18, 70); ctx.closePath(); ctx.fillStyle = '#7a4e26'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
        ctx.fillStyle = '#3a3c40'; ctx.fillRect(-4, -262, 8, 60); ctx.strokeRect(-4, -262, 8, 60); ctx.fillRect(-9, -40, 18, 46); ctx.strokeRect(-9, -40, 18, 46); ctx.beginPath(); ctx.moveTo(8, -10); ctx.lineTo(26, -4); ctx.lineWidth = 6; ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-2, 130); ctx.lineTo(2, -190); ctx.stroke();
        if (o.bayonet !== false) { ctx.beginPath(); ctx.moveTo(-5, -258); ctx.lineTo(5, -258); ctx.lineTo(1, -400); ctx.closePath(); ctx.fillStyle = '#dfe3e8'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); }
        if (o.extras && o.extras.includes('flash')) { const f = 0.6 + 0.4 * Math.sin(tt * 90); ctx.fillStyle = `rgba(255,200,90,${f})`; ctx.beginPath(); ctx.moveTo(0, -262); for (let q = 0; q < 9; q++) { const a = q / 9 * 6.283; const rr = q % 2 ? 26 : 70; ctx.lineTo(Math.sin(a) * rr * 0.6, -262 - 30 - Math.cos(a) * rr); } ctx.closePath(); ctx.fill(); }
        ctx.restore(); }
      if (o.prop === 'whistle') { ctx.save(); ctx.translate(hx, hy); ctx.rotate(-0.3); ctx.beginPath(); ctx.roundRect(-30, -12, 46, 24, 10); ctx.fillStyle = '#d8dce2'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); ctx.beginPath(); ctx.arc(10, 0, 16, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore();
        if (o.extras && o.extras.includes('blow')) { ctx.save(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 9; ctx.lineCap = 'round'; for (let q = 0; q < 3; q++) { const ph = (tt * 3 + q / 3) % 1; ctx.globalAlpha = Math.sin(ph * Math.PI); ctx.beginPath(); ctx.arc(hx + 40, hy - 10, 40 + ph * 110, -0.7, 0.7); ctx.stroke(); } ctx.restore(); } }
      if (o.prop === 'rag') { ctx.save(); ctx.translate(hx, hy); ctx.rotate(0.2); ctx.beginPath(); ctx.moveTo(-60, -50); ctx.quadraticCurveTo(0, -66, 62, -46); ctx.quadraticCurveTo(70, 10, 56, 56); ctx.quadraticCurveTo(0, 70, -56, 52); ctx.quadraticCurveTo(-70, 0, -60, -50); ctx.closePath(); ctx.fillStyle = '#e8dca0'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = 'rgba(200,170,40,.55)'; ctx.beginPath(); ctx.ellipse(6, 4, 38, 30, 0.3, 0, 7); ctx.fill(); ctx.restore(); }
      if (o.prop === 'watch') { ctx.save(); ctx.translate(hx, hy - 6); ctx.beginPath(); ctx.arc(0, 0, 30, 0, 7); ctx.fillStyle = '#f4f0e4'; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = '#c9a54a'; ctx.stroke(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.beginPath(); ctx.arc(0, 0, 34, 0, 7); ctx.stroke(); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 22); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(tt * 0.5) * 2 - 2, -20); ctx.stroke(); ctx.restore(); }
      if (o.prop === 'candle') { ctx.save(); ctx.translate(hx, hy); ctx.fillStyle = '#efe6cc'; ctx.fillRect(-9, -50, 18, 54); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.strokeRect(-9, -50, 18, 54); const fl = Math.sin(tt * 19) * 3; ctx.beginPath(); ctx.moveTo(0, -84); ctx.quadraticCurveTo(12 + fl, -60, 0, -52); ctx.quadraticCurveTo(-12 + fl, -60, 0, -84); ctx.fillStyle = '#ffcf5a'; ctx.fill(); ctx.restore(); }
      if (o.prop === 'lantern') { ctx.save(); ctx.translate(hx, hy + 40); ctx.beginPath(); ctx.roundRect(-24, -30, 48, 62, 8); ctx.fillStyle = '#ffd27a'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore(); }
    };
    const prop2 = (h) => { if (!h || !o.prop2) return; const [hx, hy] = h[2];
      if (o.prop2 === 'shield') { ctx.save(); ctx.translate(hx + 10, hy - 40); ctx.rotate(o.shieldAng ?? 0.05); const sw = 130, sh = 250; ctx.beginPath(); ctx.roundRect(-sw / 2, -sh / 2, sw, sh, 18); ctx.fillStyle = o.shieldCol || '#a8262a'; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.stroke(); ctx.strokeStyle = '#d8b040'; ctx.lineWidth = 7; ctx.beginPath(); ctx.roundRect(-sw / 2 + 12, -sh / 2 + 12, sw - 24, sh - 24, 12); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, -sh / 2 + 14); ctx.lineTo(0, sh / 2 - 14); ctx.stroke(); for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(sd * 40, -30, sd * 46, -90); ctx.moveTo(0, 0); ctx.quadraticCurveTo(sd * 40, 30, sd * 46, 90); ctx.stroke(); } ctx.beginPath(); ctx.arc(0, 0, 24, 0, 7); ctx.fillStyle = '#d8b040'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); const g = ctx.createLinearGradient(-sw / 2, 0, sw / 2, 0); g.addColorStop(0, 'rgba(255,255,255,.18)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,.25)'); ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-sw / 2, -sh / 2, sw, sh, 18); ctx.fill(); ctx.restore(); }
      if (o.prop2 === 'buckler') { ctx.save(); ctx.translate(hx, hy - 20); ctx.beginPath(); ctx.roundRect(-62, -62, 124, 124, 10); ctx.fillStyle = '#8a6a3a'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 18, 0, 7); ctx.fillStyle = '#c9a24a'; ctx.fill(); ctx.stroke(); ctx.restore(); }
      if (o.prop2 === 'net') { ctx.save(); ctx.translate(hx, hy); const sw = Math.sin(tt * 3) * 12; ctx.strokeStyle = 'rgba(40,30,20,.85)'; ctx.lineWidth = 3; for (let i = -5; i <= 5; i++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(i * 14 + sw, 90, i * 26 + sw * 1.5, 200); ctx.stroke(); } for (let j = 1; j <= 6; j++) { ctx.beginPath(); ctx.moveTo(-j * 22 + sw * j / 6 * 1.5, j * 33); ctx.quadraticCurveTo(sw, j * 36 + 8, j * 22 + sw * j / 6 * 1.5, j * 33); ctx.stroke(); } ctx.restore(); }
      if (o.prop2 === 'chain') { ctx.save(); ctx.translate(hx, hy); ctx.strokeStyle = '#6a6e76'; ctx.lineWidth = 6; for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.ellipse(k * 22, 10 + Math.sin(k) * 6, 12, 7, k % 2 ? 0 : 1.4, 0, 7); ctx.stroke(); } ctx.restore(); }
    };
    if (arms && arms.length > 1) prop2(arms[0]);
    if (arms) prop(o.arms === 'drink' ? null : arms[arms.length - 1]);
    if (o.xray) { const k = o.xray; ctx.save(); ctx.globalAlpha = Math.min(1, k); ctx.fillStyle = 'rgba(18,50,110,.6)'; ctx.beginPath(); ctx.roundRect(cx - BODY_W / 2, bodyTop, BODY_W, bodyBot - bodyTop, [42, 42, 48, 48]); ctx.fill();
      ctx.shadowColor = '#8fe4ff'; ctx.shadowBlur = 22; ctx.strokeStyle = '#effdff'; ctx.fillStyle = '#effdff'; ctx.lineCap = 'round';
      const bone = (p, q, w) => { ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); for (const e of [p, q]) { ctx.beginPath(); ctx.arc(e[0], e[1], w * 0.85, 0, 7); ctx.fill(); } };
      if (legs) for (const L of legs) { bone(L[0], L[1], 15); bone(L[1], L[2], 13); }
      if (arms) for (const a of arms) { bone(a[0], a[1], 12); bone(a[1], a[2], 10); }
      ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(cx, bodyTop + 10); ctx.lineTo(cx, bodyBot - 30); ctx.stroke();
      ctx.lineWidth = 7; for (let i = 0; i < 5; i++) { const y = bodyTop + 50 + i * 30; ctx.beginPath(); ctx.ellipse(cx, y, 52 - i * 4, 16, 0, Math.PI * 0.05, Math.PI * 0.95); ctx.stroke(); }
      ctx.lineWidth = 9; ctx.beginPath(); ctx.ellipse(cx, bodyBot - 30, 58, 26, 0, 0, Math.PI); ctx.stroke();
      const sy = bodyTop + ((tt * 0.9) % 1) * (GROUND - bodyTop); ctx.shadowBlur = 0; const gr = ctx.createLinearGradient(0, sy - 30, 0, sy + 30); gr.addColorStop(0, 'rgba(140,230,255,0)'); gr.addColorStop(0.5, 'rgba(140,230,255,.55)'); gr.addColorStop(1, 'rgba(140,230,255,0)'); ctx.fillStyle = gr; ctx.fillRect(cx - 200, sy - 30, 400, 60);
      ctx.restore(); }
    // ----- head -----
    ctx.save(); ctx.translate(shiver, 0);
    ctx.beginPath(); ctx.ellipse(cx, headY, HEAD_R, HEAD_R * 1.02, 0, 0, 7); { const hg = ctx.createRadialGradient(cx - HEAD_R * 0.35, headY - HEAD_R * 0.4, HEAD_R * 0.1, cx, headY, HEAD_R * 1.05); hg.addColorStop(0, o.skin); hg.addColorStop(0.62, o.skin === '#ffffff' ? '#fbfbfa' : o.skin); hg.addColorStop(1, o.skin === '#ffffff' ? '#d9dbe2' : shade(o.skin, -0.18)); ctx.fillStyle = hg; } ctx.fill(); ctx.lineWidth = 10; ctx.strokeStyle = INK; ctx.stroke();
    ctx.fillStyle = 'rgba(255,140,130,.16)'; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(cx + sd * HEAD_R * 0.55, headY + HEAD_R * 0.25, HEAD_R * 0.17, HEAD_R * 0.1, 0, 0, 7); ctx.fill(); }
    if (o.beard) { ctx.beginPath(); ctx.ellipse(cx, headY + HEAD_R * 0.55, HEAD_R * 0.62, HEAD_R * 0.42, 0, 0, Math.PI); ctx.fillStyle = '#e6e6e6'; ctx.fill(); ctx.lineWidth = 6; ctx.stroke(); }
    face(ctx, cx, headY, HEAD_R, o.expr, tt);
    if (o.mustache) { ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(cx - 30, headY + HEAD_R * 0.3, 32, 12, 0.25, 0, 7); ctx.ellipse(cx + 30, headY + HEAD_R * 0.3, 32, 12, -0.25, 0, 7); ctx.fill(); }
    if (o.extras.includes('scurvy')) { ctx.fillStyle = 'rgba(120,70,110,.55)'; for (const [x, y, rr] of [[-0.6, 0.15, 0.1], [0.55, 0.3, 0.08], [-0.35, 0.62, 0.07], [0.62, -0.25, 0.06], [-0.7, -0.2, 0.05]]) { ctx.beginPath(); ctx.arc(cx + x * HEAD_R, headY + y * HEAD_R, rr * HEAD_R, 0, 7); ctx.fill(); } ctx.fillStyle = '#c0182a'; const my = headY + HEAD_R * 0.5; const dr = ((tt * 0.6) % 1); ctx.beginPath(); ctx.moveTo(cx + 12, my); ctx.quadraticCurveTo(cx + 22, my + 20 + dr * 30, cx + 16, my + 28 + dr * 34); ctx.quadraticCurveTo(cx + 6, my + 20 + dr * 30, cx + 12, my); ctx.fill(); ctx.fillStyle = 'rgba(200,180,120,.35)'; ctx.beginPath(); ctx.ellipse(cx, headY, HEAD_R * 0.95, HEAD_R, 0, 0, 7); ctx.fill(); }
    if (o.extras.includes('eyepatch')) { ctx.strokeStyle = INK; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(cx - HEAD_R * 0.95, headY - HEAD_R * 0.42); ctx.lineTo(cx + HEAD_R * 0.98, headY + HEAD_R * 0.05); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(cx + HEAD_R * 0.32, headY - HEAD_R * 0.02, HEAD_R * 0.2, HEAD_R * 0.17, -0.2, 0, 7); ctx.fill(); }
    if (o.extras.includes('earring')) { ctx.strokeStyle = '#e8b931'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(cx - HEAD_R * 0.98, headY + HEAD_R * 0.32, 14, 0, 7); ctx.stroke(); ctx.strokeStyle = INK; }
    if (o.extras.includes('frost')) { ctx.fillStyle = 'rgba(235,245,255,.95)'; ctx.strokeStyle = 'rgba(120,150,190,.7)'; ctx.lineWidth = 2; for (const sd of [-1, 1]) for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(cx + sd * HEAD_R * (0.2 + i * 0.06), headY - HEAD_R * 0.32 + Math.sin(i * 2) * 3, 5 + (i % 2) * 2, 0, 7); ctx.fill(); ctx.stroke(); }
      if (!o.extras.includes('o2mask')) for (let i = 0; i < 9; i++) { const a = Math.PI * (0.15 + i * 0.09); ctx.beginPath(); ctx.arc(cx + Math.cos(a) * HEAD_R * 0.55, headY + HEAD_R * 0.32 + Math.sin(a) * HEAD_R * 0.35, 6, 0, 7); ctx.fill(); ctx.stroke(); }
      ctx.fillStyle = 'rgba(150,190,240,.22)'; ctx.beginPath(); ctx.ellipse(cx, headY, HEAD_R * 0.97, HEAD_R, 0, 0, 7); ctx.fill(); }
    if (o.extras.includes('frostbite')) { ctx.fillStyle = 'rgba(245,248,255,.95)'; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(cx + sd * HEAD_R * 0.55, headY + HEAD_R * 0.22, HEAD_R * 0.2, HEAD_R * 0.13, 0, 0, 7); ctx.fill(); } ctx.fillStyle = 'rgba(40,30,60,.85)'; ctx.beginPath(); ctx.ellipse(cx, headY + HEAD_R * 0.16, HEAD_R * 0.11, HEAD_R * 0.09, 0, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(90,60,140,.45)'; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.arc(cx + sd * HEAD_R * 0.55, headY + HEAD_R * 0.22, HEAD_R * 0.06, 0, 7); ctx.fill(); } }
    if (o.extras.includes('o2mask')) { const my = headY + HEAD_R * 0.36; ctx.beginPath(); ctx.moveTo(cx - HEAD_R * 0.42, my - HEAD_R * 0.28); ctx.quadraticCurveTo(cx, my - HEAD_R * 0.48, cx + HEAD_R * 0.42, my - HEAD_R * 0.28); ctx.quadraticCurveTo(cx + HEAD_R * 0.5, my + HEAD_R * 0.3, cx, my + HEAD_R * 0.42); ctx.quadraticCurveTo(cx - HEAD_R * 0.5, my + HEAD_R * 0.3, cx - HEAD_R * 0.42, my - HEAD_R * 0.28); ctx.closePath(); ctx.fillStyle = '#2e3136'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
      ctx.fillStyle = '#5a5e66'; ctx.beginPath(); ctx.arc(cx, my + HEAD_R * 0.05, HEAD_R * 0.15, 0, 7); ctx.fill(); ctx.lineWidth = 4; ctx.stroke(); ctx.fillStyle = '#e8742a'; ctx.beginPath(); ctx.arc(cx, my + HEAD_R * 0.05, HEAD_R * 0.06, 0, 7); ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(cx - HEAD_R * 0.42, my - HEAD_R * 0.2); ctx.lineTo(cx - HEAD_R * 0.97, headY - HEAD_R * 0.05); ctx.moveTo(cx + HEAD_R * 0.42, my - HEAD_R * 0.2); ctx.lineTo(cx + HEAD_R * 0.97, headY - HEAD_R * 0.05); ctx.stroke();
      ctx.lineWidth = 16; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(cx + HEAD_R * 0.1, my + HEAD_R * 0.4); ctx.bezierCurveTo(cx + HEAD_R * 0.3, my + HEAD_R * 1.1, cx + HEAD_R * 1.1, my + HEAD_R * 0.6, cx + HEAD_R * 1.05, my + HEAD_R * 1.6); ctx.stroke(); ctx.lineWidth = 9; ctx.strokeStyle = '#3a3e46'; ctx.stroke();
      if (o.o2low) { ctx.fillStyle = 'rgba(255,255,255,.5)'; const q = (tt * 2.4) % 1; ctx.beginPath(); ctx.arc(cx + HEAD_R * 0.5 + q * 50, my + HEAD_R * 0.1 - q * 30, 14 + q * 24, 0, 7); ctx.fill(); } }
    const gogCol = o.gogCol || '#e88a2a';
    const goggles = (y, up) => { ctx.lineWidth = 12; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(cx - HEAD_R * 1.0, y + 6); ctx.lineTo(cx + HEAD_R * 1.0, y + 6); ctx.stroke(); ctx.lineWidth = 7; ctx.strokeStyle = o.gogStrap || '#2a2a2a'; ctx.stroke();
      ctx.beginPath(); ctx.roundRect(cx - HEAD_R * 0.78, y - HEAD_R * 0.26, HEAD_R * 1.56, HEAD_R * 0.56, HEAD_R * 0.26); const g = ctx.createLinearGradient(cx - HEAD_R * 0.7, y - HEAD_R * 0.3, cx + HEAD_R * 0.7, y + HEAD_R * 0.3); g.addColorStop(0, '#ffd27a'); g.addColorStop(0.45, gogCol); g.addColorStop(1, '#6a2a8a'); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 9; ctx.strokeStyle = INK; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(cx - HEAD_R * 0.38, y - HEAD_R * 0.08, HEAD_R * 0.2, HEAD_R * 0.07, -0.3, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx, y - HEAD_R * 0.2); ctx.lineTo(cx, y + HEAD_R * 0.26); ctx.stroke(); };
    if (o.extras.includes('goggles')) goggles(headY - HEAD_R * 0.04, false);
    hat(ctx, o.hat, cx, headY - HEAD_R * 0.95, HEAD_R, o.hatColor);
    if (o.extras.includes('gogglesUp')) goggles(headY - HEAD_R * 0.62, true);
    if (o.extras.includes('headlamp')) { const ly = headY - HEAD_R * (o.extras.includes('gogglesUp') ? 0.25 : 0.55); ctx.lineWidth = 10; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(cx - HEAD_R * 0.99, ly + 8); ctx.quadraticCurveTo(cx, ly - 4, cx + HEAD_R * 0.99, ly + 8); ctx.stroke(); ctx.lineWidth = 6; ctx.strokeStyle = '#3a3a3a'; ctx.stroke();
      ctx.beginPath(); ctx.roundRect(cx - 26, ly - 20, 52, 38, 10); ctx.fillStyle = '#2a2a2e'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); ctx.beginPath(); ctx.arc(cx, ly, 13, 0, 7); ctx.fillStyle = '#fffbe8'; ctx.fill();
      if (o.lampOn !== false) { const g = ctx.createRadialGradient(cx, ly, 4, cx, ly, 90); g.addColorStop(0, 'rgba(255,250,220,.95)'); g.addColorStop(0.3, 'rgba(255,240,190,.35)'); g.addColorStop(1, 'rgba(255,240,190,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, ly, 90, 0, 7); ctx.fill(); } }
    if (o.extras.includes('snowcap')) { ctx.fillStyle = '#f4f8ff'; ctx.strokeStyle = 'rgba(120,140,170,.8)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(cx - 10, headY - HEAD_R * 0.95, HEAD_R * 0.8, HEAD_R * 0.3, -0.1, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.restore();
    if (frontArm) { seg(ctx, frontArm, 12); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(frontArm[2][0], frontArm[2][1], 9, 0, 7); ctx.fill(); prop(frontArm); }
    // ----- comic extras -----
    if (o.extras.includes('fever')) { ctx.fillStyle = 'rgba(230,60,50,.45)'; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(cx + sd * HEAD_R * 0.52, headY + HEAD_R * 0.22, 26, 16, 0, 0, 7); ctx.fill(); } }
    if (o.extras.includes('buboes')) { for (const [x, y, rr] of [[-62, headY + HEAD_R + 18, 26], [70, headY + HEAD_R + 12, 30], [-BODY_W / 2 - 6, bodyTop + 52, 22]]) { const pulse = 1 + Math.sin(tt * 3 + x) * 0.05; ctx.beginPath(); ctx.ellipse(cx + x, y, rr * pulse, rr * 0.82 * pulse, 0, 0, 7); ctx.fillStyle = '#3a1e2e'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.arc(cx + x - rr * 0.3, y - rr * 0.3, rr * 0.25, 0, 7); ctx.fill(); } }
    if (o.extras.includes('ash')) { ctx.save(); ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = 'rgba(150,146,138,' + (o.ashAmt ?? 0.45) + ')'; ctx.fillRect(0, 0, BW, BH); ctx.restore(); ctx.fillStyle = 'rgba(120,116,110,.8)'; for (let i = 0; i < 60; i++) { const x = cx + Math.sin(i * 91.7) * 120, y = headY - HEAD_R + ((i * 37.3) % 1) * 0 + (Math.sin(i * 13.1) * 0.5 + 0.5) * 600; ctx.beginPath(); ctx.arc(x, y, 3 + (i % 3) * 2, 0, 7); ctx.fill(); } }
    if (o.extras.includes('pillow')) { const py = headY - HEAD_R * 1.05; ctx.beginPath(); ctx.ellipse(cx, py, HEAD_R * 1.15, HEAD_R * 0.42, 0, 0, 7); ctx.fillStyle = '#efe6d2'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - HEAD_R * 0.6, py - 10); ctx.lineTo(cx - HEAD_R * 0.5, py + 12); ctx.moveTo(cx + HEAD_R * 0.6, py - 10); ctx.lineTo(cx + HEAD_R * 0.5, py + 12); ctx.stroke(); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(cx - HEAD_R * 0.9, py + 20); ctx.quadraticCurveTo(cx - HEAD_R * 1.02, headY + HEAD_R * 0.6, cx - HEAD_R * 0.3, headY + HEAD_R * 0.98); ctx.moveTo(cx + HEAD_R * 0.9, py + 20); ctx.quadraticCurveTo(cx + HEAD_R * 1.02, headY + HEAD_R * 0.6, cx + HEAD_R * 0.3, headY + HEAD_R * 0.98); ctx.strokeStyle = '#8a6a3a'; ctx.stroke(); }
    if (o.extras.includes('fleabites')) { ctx.fillStyle = '#d8404a'; for (const [x, y] of [[-50, 40], [40, 60], [-20, 75], [62, 20], [-70, 10]]) { ctx.beginPath(); ctx.arc(cx + x, headY + y, 6, 0, 7); ctx.fill(); } }
    if (o.extras.includes('sweat')) { ctx.fillStyle = '#6fc3ff'; ctx.strokeStyle = INK; ctx.lineWidth = 5; const y = headY - 40 + (tt * 110) % 60; ctx.beginPath(); ctx.moveTo(cx + HEAD_R + 6, y - 30); ctx.quadraticCurveTo(cx + HEAD_R + 28, y + 5, cx + HEAD_R + 6, y + 12); ctx.quadraticCurveTo(cx + HEAD_R - 16, y + 5, cx + HEAD_R + 6, y - 30); ctx.fill(); ctx.stroke(); }
    if (o.extras.includes('zzz')) { ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.font = '900 64px Nunito'; for (let i = 0; i < 3; i++) { const q = (tt * 0.6 + i / 3) % 1; ctx.globalAlpha = Math.sin(q * Math.PI); ctx.strokeText('Z', cx + 105 + q * 50, headY - 95 - q * 120); ctx.fillText('Z', cx + 105 + q * 50, headY - 95 - q * 120); } ctx.globalAlpha = 1; }
    if (o.extras.includes('breath')) { const q = (tt * 0.8) % 1; ctx.globalAlpha = 0.7 * Math.sin(q * Math.PI); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx + 60 + q * 80, headY + 50 - q * 40, 20 + q * 30, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
    if (o.extras.includes('steam')) { ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 5; for (const s of [-1, 1]) { const q = (tt * 1.4 + (s > 0 ? 0.5 : 0)) % 1; ctx.globalAlpha = Math.sin(q * Math.PI); ctx.beginPath(); ctx.arc(cx + s * (112 + q * 40), headY - 105 - q * 80, 20 + q * 18, 0, 7); ctx.fill(); ctx.stroke(); } ctx.globalAlpha = 1; }
    if (o.extras.includes('frozen')) { ctx.save(); ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = 'rgba(170,195,230,' + (o.frozenAmt ?? 0.42) + ')'; ctx.fillRect(-PADX, -PADT, FW, FH); ctx.restore(); }
    if (o.extras.includes('snowpile')) { ctx.fillStyle = '#f2f6fc'; ctx.strokeStyle = 'rgba(110,130,160,.9)'; ctx.lineWidth = 6; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(cx + sd * 58, bodyTop + 8, 46, 20, sd * 0.2, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(cx - 230, GROUND - shift + 10); ctx.quadraticCurveTo(cx - 140, (o.pileY ?? bodyBot - 30) - 40, cx - 20, o.pileY ?? bodyBot - 30); ctx.quadraticCurveTo(cx + 120, (o.pileY ?? bodyBot - 30) - 20, cx + 240, GROUND - shift + 10); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    this.tex.needsUpdate = true; this.handsB = arms ? arms.map(a => a[2].slice()) : null; if (this.tipB) this.tipB = this.tipB.slice();
    this.shadow.visible = !!legs && this.ground;
    if (cam && !this.noBill) { const p = new THREE.Vector3(); this.group.getWorldPosition(p); this.mesh.rotation.y = Math.atan2(cam.position.x - p.x, cam.position.z - p.z) - this.group.rotation.y; }
  }
}

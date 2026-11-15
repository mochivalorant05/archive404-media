# Music + SFX bed for "Alcatraz 1962 — would you have tried?" (synthesised, synced to the shot timeline)
import numpy as np, wave, sys
SR = 44100; DUR = 53.6; N = int(SR * DUR)
rng = np.random.default_rng(1962)
L = np.zeros(N); Rr = np.zeros(N)
t_all = np.arange(N) / SR

def lp(x, fc):
    a = np.exp(-2 * np.pi * fc / SR); y = np.empty_like(x); s = 0.0
    for i in range(len(x)): s = (1 - a) * x[i] + a * s; y[i] = s
    return y
def lpf(x, fc, n=2):
    # vectorised-ish one pole via scipy-free IIR (chunked python loop is slow for long signals) -> use FFT filter
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); H = 1 / (1 + (f / fc) ** (2 * n)) ** 0.5; return np.fft.irfft(X * H, len(x))
def hpf(x, fc, n=2):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); f[0] = 1e-6; H = 1 / (1 + (fc / f) ** (2 * n)) ** 0.5; return np.fft.irfft(X * H, len(x))
def bpf(x, lo, hi): return hpf(lpf(x, hi), lo)
def add(sig, t0, gain=1.0, pan=0.0):
    i0 = int(t0 * SR);
    if i0 >= N: return
    if i0 < 0: sig = sig[-i0:]; i0 = 0
    n = min(len(sig), N - i0); gl = gain * np.sqrt((1 - pan) / 2) * 1.414; gr = gain * np.sqrt((1 + pan) / 2) * 1.414
    L[i0:i0 + n] += sig[:n] * gl; Rr[i0:i0 + n] += sig[:n] * gr
def env(n, a, r, shape=3.0): e = np.ones(n); na = max(1, int(a * SR)); e[:na] = np.linspace(0, 1, na); e[na:] = np.exp(-np.arange(n - na) / SR * shape / max(r, 1e-3)); return e
def tt(d): return np.arange(int(d * SR)) / SR
def noise(d): return rng.standard_normal(int(d * SR))
def note(f): return 440 * 2 ** ((f - 69) / 12)

# ---------- SFX ----------
def boom(dist=1.0, d=3.5):
    n = noise(d); lo = lpf(n, 90 + 260 / (1 + dist * 2)); crack = hpf(noise(0.08), 900) * (1 / (1 + dist * 4))
    s = lo * env(len(lo), 0.005, 0.9 + dist * 0.8, 2.6); s[:len(crack)] += crack * env(len(crack), 0.001, 0.05)
    thump = np.sin(2 * np.pi * (48 - 20 * tt(d)) * tt(d)) * np.exp(-tt(d) * 4) * 0.9
    s += thump; return s / (np.max(np.abs(s)) + 1e-9) * (1 / (1 + dist * 0.6))
def step(): s = lpf(noise(0.09), 900) * env(int(0.09 * SR), 0.002, 0.05, 4); s += np.sin(2 * np.pi * 140 * tt(0.09)) * np.exp(-tt(0.09) * 60) * 0.6; return s * 0.5
def rainS(d, k=1.0): n = noise(d); s = bpf(n, 1500, 9000) * 0.12 * k + lpf(n, 500) * 0.25 * k; e = np.minimum(1, np.minimum(tt(d) / 0.4, (d - tt(d)) / 0.4)); return s * e
def squeak(): d = 0.12; f = 3200 + 1800 * np.sin(np.pi * tt(d) / d); ph = 2 * np.pi * np.cumsum(f) / SR; return np.sin(ph) * env(len(ph), 0.01, 0.08, 3) * 0.25
def scratch(d): n = bpf(noise(d), 1800, 7000); m = (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 9 * tt(d)))) * (0.6 + 0.4 * np.sin(2 * np.pi * 2.3 * tt(d))); return n * m * 0.25
def buzz(d): f = 210 + 25 * np.sin(2 * np.pi * 3.1 * tt(d)) + 15 * np.sin(2 * np.pi * 7 * tt(d)); ph = 2 * np.pi * np.cumsum(f) / SR; s = np.sign(np.sin(ph)) * 0.06; return lpf(s, 1600) * (0.4 + 0.6 * np.abs(np.sin(2 * np.pi * 0.7 * tt(d))))
def hiss(d): n = hpf(noise(d), 2500) * 0.18; return n * np.minimum(1, tt(d) / (d * 0.6))
def gong(): d = 1.6; s = sum(np.sin(2 * np.pi * f * tt(d) + p) * a for f, a, p in [(420, 1, 0), (1087, 0.6, 1), (1735, 0.4, 2), (2510, 0.3, 3), (3330, 0.2, 1)]); return s * env(len(s), 0.001, 0.7, 3) * 0.35
def cough(): d = 0.35; s = bpf(noise(d), 300, 2400) * (np.exp(-tt(d) * 14) + 0.5 * np.exp(-((tt(d) - 0.18) / 0.04) ** 2)); return s * 0.6
def flarepop(): d = 2.4; s = hpf(noise(0.05), 1200) * 0.25; h = bpf(noise(d), 2000, 6000) * np.exp(-tt(d) * 0.9) * 0.08; out = h.copy(); out[:len(s)] += s; return out
def tick(): s = hpf(noise(0.012), 3000) * env(int(0.012 * SR), 0.0005, 0.005) * 0.5; return s
def whistle(d=1.3):
    f = 2750 + 90 * np.sign(np.sin(2 * np.pi * 26 * tt(d))) + 30 * np.sin(2 * np.pi * 5 * tt(d)); ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) + 0.3 * np.sin(2 * ph) + bpf(noise(d), 2400, 3200) * 0.4; e = np.minimum(1, tt(d) / 0.03) * np.minimum(1, (d - tt(d)) / 0.08); return s * e * 0.35
def creak(): d = 0.5; f = 180 + 60 * np.sin(2 * np.pi * 1.5 * tt(d)); ph = 2 * np.pi * np.cumsum(f) / SR; s = np.sign(np.sin(ph)) * (0.5 + 0.5 * np.sin(2 * np.pi * 37 * tt(d))); return lpf(s, 1400) * env(len(s), 0.05, 0.4, 2) * 0.12
def mgun(d, rate=9.5, dist=1.0):
    out = np.zeros(int(d * SR)); k = 0.0
    while k < d:
        sh = lpf(noise(0.06), 400) * env(int(0.06 * SR), 0.001, 0.04) * 0.8; a_ = hpf(noise(0.04), 500) * env(int(0.04 * SR), 0.0005, 0.02) * 0.6; sh[:len(a_)] += a_
        i = int(k * SR); n = min(len(sh), len(out) - i); out[i:i + n] += sh[:n] * (0.7 + 0.3 * rng.random()); k += 1 / rate * (0.85 + 0.3 * rng.random())
        if rng.random() < 0.06: k += 0.25
    return lpf(out, 3000 / (1 + dist)) / (1 + dist * 0.5)
def whizz(): d = 0.35; f = 1800 - 1200 * tt(d) / d; ph = 2 * np.pi * np.cumsum(f) / SR; return np.sin(ph) * np.exp(-((tt(d) - 0.15) / 0.07) ** 2) * 0.12

# ---------- music ----------
def pad(freqs, t0, t1, gain=0.12, bright=900, att=1.5, rel=1.5):
    d = t1 - t0 + rel; T = tt(d); s = np.zeros(len(T))
    for f in freqs:
        for det in (-0.12, 0.0, 0.11):
            ff = f * 2 ** (det / 12); s += (2 * ((T * ff + rng.random()) % 1) - 1) * 0.33
    s = lpf(s, bright); e = np.minimum(1, T / att) * np.where(T > t1 - t0, np.exp(-(T - (t1 - t0)) / rel * 3), 1)
    return s * e * gain
def pluck(f, d=1.2, g=0.2): T = tt(d); s = np.sin(2 * np.pi * f * T) + 0.4 * np.sin(4 * np.pi * f * T) * np.exp(-T * 6); return s * np.exp(-T * 3.2) * g
def timp(f=55, g=0.5): d = 1.4; T = tt(d); s = np.sin(2 * np.pi * f * T * (1 + 0.04 * np.exp(-T * 8))) * np.exp(-T * 3.5) + lpf(noise(d), 300) * np.exp(-T * 9) * 0.5; return s * g
def snare(g=0.25): d = 0.25; T = tt(d); s = bpf(noise(d), 900, 7000) * np.exp(-T * 18) + np.sin(2 * np.pi * 190 * T) * np.exp(-T * 30) * 0.5; return s * g
def horn(f, d, g=0.12): T = tt(d); vib = 1 + 0.004 * np.sin(2 * np.pi * 5 * T) * np.minimum(1, T / 0.4); ph = 2 * np.pi * np.cumsum(f * vib) / SR; s = np.sin(ph) + 0.45 * np.sin(2 * ph) + 0.22 * np.sin(3 * ph) + 0.1 * np.sin(4 * ph); e = np.minimum(1, T / 0.12) * np.minimum(1, (d - T) / 0.3); return lpf(s, 1800) * e * g


# ---------- extra SFX ----------
def waves(d, k=1.0): n = noise(d); s = lpf(n, 420) * 0.5 + bpf(n, 600, 2500) * 0.08; sw = 0.55 + 0.45 * np.sin(2 * np.pi * 0.13 * tt(d)) * np.sin(2 * np.pi * 0.051 * tt(d) + 1); e = np.minimum(1, np.minimum(tt(d) / 0.5, (d - tt(d)) / 0.5)); return s * sw * e * k
def windS(d, k=1.0): n = noise(d); f = bpf(n, 300, 1400) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.4 * tt(d)) ** 2); e = np.minimum(1, np.minimum(tt(d) / 0.3, (d - tt(d)) / 0.4)); return f * e * 0.35 * k
def thunder(): d = 3.2; c = hpf(noise(0.12), 600) * env(int(0.12 * SR), 0.001, 0.08) * 0.8; r = lpf(noise(d), 160) * env(int(d * SR), 0.02, 2.4, 2.2) * 1.4; r[:len(c)] += c; return r
def clang(f0=1900): d = 0.9; T = tt(d); s = sum(np.sin(2 * np.pi * f * T) * a * np.exp(-T * k) for f, a, k in [(f0, 1, 6), (f0 * 1.47, 0.7, 8), (f0 * 2.31, 0.5, 11), (f0 * 3.07, 0.35, 14), (f0 * 0.62, 0.4, 9)]); s[:int(0.01 * SR)] += hpf(noise(0.01), 3000) * 0.8; return s * 0.28
def swoosh(): d = 0.25; T = tt(d); return bpf(noise(d), 700, 4000) * np.sin(np.pi * T / d) ** 2 * 0.35
def splash(k=1.0): d = 1.6; n = noise(d); s = bpf(n, 300, 6000) * env(len(n), 0.005, 0.9, 3) * 0.7 + lpf(n, 200) * env(len(n), 0.005, 0.4, 3) * 0.8; return s * k
def bubbles(d):
    out = np.zeros(int(d * SR))
    for _ in range(int(d * 22)):
        f0 = rng.uniform(300, 1200); dd = rng.uniform(0.03, 0.08); T = tt(dd); b = np.sin(2 * np.pi * np.cumsum(f0 * (1 + 2.5 * T / dd)) / SR) * np.exp(-T * 40) * 0.12; i = int(rng.uniform(0, d - dd) * SR); out[i:i + len(b)] += b
    return out
def coins(d=0.8, k=1.0):
    out = np.zeros(int(d * SR))
    for _ in range(int(d * 40)):
        f = rng.uniform(3500, 8000); dd = 0.12; T = tt(dd); c = (np.sin(2 * np.pi * f * T) + 0.5 * np.sin(2 * np.pi * f * 1.6 * T)) * np.exp(-T * 30) * 0.08; i = int(rng.uniform(0, d - dd) * SR); out[i:i + len(c)] += c
    return out * k
def cheer(d=1.6): n = noise(d); s = bpf(n, 400, 2600) * 0.25; m = 0.6 + 0.4 * np.sin(2 * np.pi * 3.3 * tt(d)) * np.sin(2 * np.pi * 1.1 * tt(d)); e = np.minimum(1, np.minimum(tt(d) / 0.15, (d - tt(d)) / 0.5)); return s * m * e
def crunch(): d = 0.18; return bpf(noise(d), 1500, 7000) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 60 * tt(d)))) * env(int(d * SR), 0.003, 0.12) * 0.4
def gulp(): d = 0.25; f = 180 + 300 * tt(d) / d; return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-((tt(d) - 0.1) / 0.05) ** 2) * 0.35
def flap(d): n = bpf(noise(d), 400, 3000); m = 0.4 + 0.6 * np.abs(np.sin(2 * np.pi * 7 * tt(d))) ** 3; return n * m * 0.22
def cannonB(dist=1.0): d = 2.6; s = boom(dist, d); s[:int(0.05 * SR)] += hpf(noise(0.05), 800) * 0.9 / (1 + dist); return s
def hit(): d = 0.4; return lpf(noise(d), 300) * env(int(d * SR), 0.002, 0.15) * 0.9 + np.sin(2 * np.pi * 60 * tt(d)) * np.exp(-tt(d) * 12) * 0.8


# ---------- Everest: music ----------
def heart(g=0.5): d = 0.5; T = tt(d); s = np.sin(2 * np.pi * 52 * T) * np.exp(-T * 18) + 0.6 * np.sin(2 * np.pi * 48 * (T - 0.16)) * np.exp(-np.maximum(0, T - 0.16) * 18) * (T > 0.16); return s * g
def breathS(d=0.9, k=1.0): n = noise(d); s = bpf(n, 500, 3200) * np.sin(np.pi * tt(d) / d) ** 2 * 0.35; return s * k
def bowl(f=220, d=3.5, g=0.12): T = tt(d); s = sum(np.sin(2 * np.pi * f * m * T) * a * np.exp(-T * k) for m, a, k in [(1, 1, 0.9), (2.76, 0.5, 1.4), (5.4, 0.25, 2.2)]); return s * (0.7 + 0.3 * np.sin(2 * np.pi * 4.5 * T)) * g
def crackI(): d = 0.6; s = hpf(noise(d), 1500) * np.exp(-tt(d) * 14) * 0.7 + lpf(noise(d), 200) * np.exp(-tt(d) * 6) * 0.8; return s
def stampT(): d = 0.35; return lpf(noise(d), 500) * env(int(d * SR), 0.001, 0.12) * 1.1 + np.sin(2 * np.pi * 90 * tt(d)) * np.exp(-tt(d) * 25) * 0.8
def paper(d=0.5): return bpf(noise(d), 2000, 8000) * np.sin(np.pi * tt(d) / d) * 0.18
def crampon(): d = 0.12; return (hpf(noise(d), 2500) * 0.35 + lpf(noise(d), 700) * 0.4) * env(int(d * SR), 0.001, 0.06)
def tentflap(d): n = bpf(noise(d), 200, 1800); m = 0.4 + 0.6 * np.abs(np.sin(2 * np.pi * 5.5 * tt(d) + np.sin(2 * np.pi * 0.7 * tt(d)) * 3)) ** 4; return n * m * 0.3
def click(): d = 0.05; return hpf(noise(d), 3000) * env(int(d * SR), 0.0005, 0.02) * 0.6
Am = [note(45), note(52), note(57), note(60)]; F_ = [note(41), note(48), note(53), note(57)]; Dm2 = [note(38), note(45), note(50), note(53)]; E_ = [note(40), note(47), note(52), note(56)]
def bass(f, t0, d=0.4, g=0.22): T = tt(d); s = np.sin(2 * np.pi * f * T) + 0.3 * np.sin(4 * np.pi * f * T); add(s * np.exp(-T * 3) * g, t0)

def siren(d=3.0): T = tt(d); f = 600 + 350 * (0.5 - 0.5 * np.cos(2 * np.pi * T / 1.5)); ph = 2 * np.pi * np.cumsum(f) / SR; s = (np.sin(ph) + 0.3 * np.sin(2 * ph)) * np.minimum(1, T / 0.3) * np.minimum(1, (d - T) / 0.5); return s * 0.16
def foghorn(d=2.2): T = tt(d); s = sum(np.sin(2 * np.pi * f * T) * a for f, a in [(98, 1), (196, 0.5), (294, 0.25), (392, 0.12)]); return lpf(s, 600) * np.minimum(1, T / 0.25) * np.minimum(1, (d - T) / 0.6) * 0.3
def lightsw(): d = 0.25; return lpf(noise(d), 1200) * env(int(d * SR), 0.001, 0.05) * 0.5 + np.sin(2 * np.pi * 55 * tt(d)) * np.exp(-tt(d) * 20) * 0.5
def cellclang(): s = clang(420) * 0.9; b = lpf(noise(1.2), 300) * env(int(1.2 * SR), 0.001, 0.6, 3) * 0.6; o = np.zeros(max(len(s), len(b))); o[:len(s)] += s; o[:len(b)] += b; return o
def scrape(d): n = bpf(noise(d), 2500, 9000); m = np.abs(np.sin(2 * np.pi * 4.5 * tt(d))) ** 2; return n * m * 0.22 + bpf(noise(d), 400, 1500) * m * 0.08
def snip(): d = 0.07; return hpf(noise(d), 3000) * env(int(d * SR), 0.0005, 0.03) * 0.5
def rustle(d): return bpf(noise(d), 600, 5000) * (0.5 + 0.5 * np.sin(2 * np.pi * 3 * tt(d)) ** 2) * 0.16
def paddleS(): d = 0.6; return bpf(noise(d), 250, 2500) * env(int(d * SR), 0.05, 0.4, 3) * 0.35
def gull(): d = 0.5; f = 1400 + 500 * np.sin(np.pi * tt(d) / d); ph = 2 * np.pi * np.cumsum(f) / SR; return np.sin(ph) * np.sin(np.pi * tt(d) / d) ** 2 * 0.06
def clockT(): d = 0.04; return hpf(noise(d), 2000) * env(int(d * SR), 0.0003, 0.01) * 0.3
Em = [note(40), note(47), note(52), note(55)]; Cm = [note(36), note(43), note(48), note(51)]; Bm7 = [note(35), note(42), note(47), note(50)]; Gm = [note(43), note(50), note(55), note(58)]
# ---- music: dark minor pulse, builds into the escape, drops out on the open ending ----
add(pad(Em, 0.0, 9.2, 0.07, 800, 1.2, 0.8), 0.0); add(timp(note(28), 0.6), 0.0); add(bowl(note(52), 3.5, 0.08), 0.1, pan=0.3)
for k, tb in enumerate(np.arange(3.75, 9.2, 0.5)): add(pluck([note(64), note(67), note(71), note(67)][k % 4], 0.7, 0.045), tb, pan=0.25 if k % 2 else -0.25)
add(pad(Cm, 9.2, 17.9, 0.07, 700, 0.4, 0.8), 9.2)
for tb in np.arange(9.2, 17.9, 0.6): bass(note(36) / 2, tb, 0.3, 0.13)
add(pad(Bm7, 17.9, 25.6, 0.08, 900, 0.3, 0.8), 17.9); add(timp(note(31), 0.7), 17.97)
for tb in np.arange(19.8, 25.6, 0.43): bass(note(35) / 2, tb, 0.25, 0.12)
for tb in np.arange(19.8, 25.6, 0.86): add(heart(0.4), tb)
add(pad(Em, 25.6, 34.8, 0.07, 1100, 0.6, 0.8), 25.6)
for k, tb in enumerate(np.arange(25.6, 34.8, 0.3)): add(pluck([note(76), note(71), note(67), note(71), note(74), note(71)][k % 6], 0.5, 0.04), tb, pan=0.3 if k % 2 else -0.3)
for tb in np.arange(25.6, 34.8, 0.6): bass(note(40) / 2, tb, 0.25, 0.12)
add(timp(note(28), 0.8), 34.81); add(pad(Cm, 34.8, 42.8, 0.09, 1300, 0.3, 0.6), 34.8)
for tb in np.arange(36.2, 42.8, 0.3): bass(note(36) / 2, tb, 0.2, 0.15); 
for tb in np.arange(36.2, 42.8, 0.6): add(snare(0.08), tb)
for tb in [38.3, 40.35]: add(timp(note(31), 0.7), tb)
add(pad(Gm, 42.8, 46.3, 0.06, 900, 0.4, 0.5), 42.8); add(timp(note(26), 0.9), 44.9)
add(pad([note(40), note(47), note(52)], 46.3, 53.6, 0.06, 700, 1.0, 1.5), 46.3); add(bowl(note(52), 4.5, 0.1), 47.8, pan=-0.2); add(bowl(note(47), 4.0, 0.08), 49.1, pan=0.2)
add(pluck(note(64), 1.6, 0.08), 50.3); add(pluck(note(71), 1.6, 0.07), 50.7); add(pluck(note(67), 2.4, 0.08), 51.2)
# ---- SFX ----
add(waves(9.2, 0.8), 0.0); add(foghorn(2.4), 0.6, pan=-0.4); add(windS(3.7, 0.5), 0.0)
add(cellclang(), 3.75, 0.5); add(hit() * 0.5, 7.55, -0.5); add(hit() * 0.5, 7.55, 0.5)
for i in range(6): add(lightsw(), 9.45 + i * 0.12, 0.6 - i * 0.2)
for i in range(6): add(clockT(), 9.3 + i * 0.5, 0.5)
for i in range(5): add(step() * 0.8, 10.45 + i * 0.55, -0.3 + i * 0.15)
add(click(), 10.6)
add(waves(5.0, 1.3), 13.0); add(windS(5.0, 0.7), 13.0); add(splash(0.5), 15.5); add(bubbles(1.5) * 0.6, 15.6)
add(windS(1.8, 1.0), 17.97); add(foghorn(1.7), 18.0, pan=0.4); add(creak(), 18.4)
add(cellclang() * 0.4, 19.8)
add(scrape(4.5), 21.0, pan=0.1); add(crunch(), 22.2); add(crunch(), 23.6); add(crunch(), 24.8)
add(rustle(1.6), 25.7); add(squeak(), 27.0); add(rustle(1.0), 27.8)
for i in range(8): add(snip(), 29.2 + i * 0.3, 0.3)
add(rustle(1.2), 30.4, -0.3)
add(rustle(2.4), 31.9); add(hiss(1.8) * 0.7, 32.3)
add(paper(0.45), 34.85)
for i in range(4): add(step() * 0.6, 36.3 + i * 0.5, -0.4 + i * 0.25)
add(click(), 36.3)
for i in range(4): add(crampon() * 0.8, 38.4 + i * 0.45, 0.2)
add(creak(), 39.3); add(windS(1.5, 0.8), 39.4)
add(waves(2.5, 1.0), 40.35)
for i in range(5): add(paddleS(), 40.5 + i * 0.75, 0.4 if i % 2 else -0.4)
add(rustle(0.8), 43.4); add(hit() * 0.4, 45.0); add(siren(3.3), 45.1)
add(waves(7.3, 0.7), 46.3); add(gull(), 46.8, 0.5); add(gull(), 47.4, -0.4)
add(paper(0.4), 47.9); add(stampT(), 48.6)
add(cellclang() * 0.35, 49.1)

# ---------- master: simple reverb + limiter ----------
ir_t = tt(1.6); ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t * 4.2); ir[0] = 0; ir /= np.sqrt(np.sum(ir ** 2)) * 4
def conv(x): n = len(x) + len(ir); F = np.fft.rfft(x, n) * np.fft.rfft(ir, n); return np.fft.irfft(F, n)[:len(x)]
L2 = L + conv(L) * 0.5; R2 = Rr + conv(Rr) * 0.5
fade = np.minimum(1, (DUR - t_all) / 0.8); L2 *= fade; R2 *= fade
pk = max(np.max(np.abs(L2)), np.max(np.abs(R2))); g = 0.89 / pk; L2 *= g; R2 *= g
L2 = np.tanh(L2 * 1.2) / np.tanh(1.2); R2 = np.tanh(R2 * 1.2) / np.tanh(1.2)
out = (np.stack([L2, R2], 1) * 32767 * 0.95).astype(np.int16)
w = wave.open(sys.argv[1] if len(sys.argv) > 1 else 'bed.wav', 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(out.tobytes()); w.close()
print('ok', DUR)


# Render completo de "Alcatraz 1962 — would you have tried?" (ARCHIVE404 FILES) con la GPU local + montaje final.
# 60 fps, 4 subfotogramas por frame (antialias temporal + motion blur)
# Uso: python render_all.py        (reanuda si ya hay frames)
#      python render_all.py test   (renderiza solo 3 frames de prueba)
import asyncio, base64, json, os, sys, time, threading, subprocess, functools, http.server, socketserver, shutil

ROOT = os.path.dirname(os.path.abspath(__file__))
R3D = os.path.join(ROOT, "r3d"); DATA = os.path.join(ROOT, "data")
FR = os.path.join(DATA, "frames_v2"); DUR = 53.6; FPS = 60; SUB = 4; N = int(DUR * FPS); PORT = 8773; OUTRO = 51.6; COVER_T = 52.4

def ensure_modules():
    nm = os.path.join(R3D, "node_modules")
    if os.path.isdir(os.path.join(nm, "three")): return
    for src in [os.path.join(os.path.expanduser("~"), "pompeii_render_pc", "r3d", "node_modules"), os.path.join(ROOT, "..", "..", "pompeii_render_pc", "r3d", "node_modules")]:
        if os.path.isdir(os.path.join(src, "three")):
            print("Copiando three.js desde", src); shutil.copytree(src, nm); return
    print("Instalando three.js con npm..."); subprocess.run("npm install --silent", shell=True, cwd=R3D, check=True)

def serve():
    class Q(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    h = functools.partial(Q, directory=R3D)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("127.0.0.1", PORT), h) as s: s.serve_forever()

async def render(frames, outdir, force=False, cover=True):
    from playwright.async_api import async_playwright
    os.makedirs(outdir, exist_ok=True)
    async with async_playwright() as p:
        args = ["--ignore-gpu-blocklist", "--enable-gpu-rasterization", "--use-angle=d3d11", "--window-size=1100,1000"]
        try: b = await p.chromium.launch(channel="chrome", headless=False, args=args)
        except Exception: b = await p.chromium.launch(headless=False, args=args)
        pg = await b.new_page(viewport={"width": 1080, "height": 1920})
        pg.on("pageerror", lambda e: print("ERROR pagina:", e))
        await pg.goto(f"http://127.0.0.1:{PORT}/alca/index.html")
        await pg.wait_for_function("window.ready===true", timeout=300000)
        gpu = await pg.evaluate("""()=>{const c=document.createElement('canvas').getContext('webgl2');const e=c&&c.getExtension('WEBGL_debug_renderer_info');return e?c.getParameter(e.UNMASKED_RENDERER_WEBGL):'?'}""")
        print("GPU usada:", gpu)
        if "SwiftShader" in gpu: print("AVISO: esta usando render por software (lento). Revisa los drivers de la grafica.")
        words = json.load(open(os.path.join(DATA, "words.json"), encoding="utf-8"))
        await pg.evaluate("([w,d])=>setup(w,d)", [words, DUR]); await pg.evaluate(f"window.SUB={SUB}; window.SHUTTER={0.5 / FPS}")
        t0 = time.time(); done = 0; todo = list(frames) if force else [f for f in frames if not os.path.exists(os.path.join(outdir, f"f{f:05d}.png"))]
        for f in todo:
            await pg.evaluate(f"renderFrame({f / FPS})")
            data = await pg.evaluate("grab()")
            tmp = os.path.join(outdir, f"f{f:05d}.tmp")
            open(tmp, "wb").write(base64.b64decode(data.split(",")[1])); os.replace(tmp, os.path.join(outdir, f"f{f:05d}.png"))
            done += 1
            if done % 30 == 0 or done == len(todo):
                el = time.time() - t0; eta = el / done * (len(todo) - done)
                if done % 300 == 0: await asyncio.sleep(2)
                print(f"frame {f+1}/{N}  ({el/done:.2f} s/frame, faltan ~{eta/60:.1f} min)", flush=True)
        if cover and not os.path.exists(os.path.join(DATA, "cover_raw_v2.png")):
            await pg.evaluate("window.NOTEXT=true"); await pg.evaluate(f"renderFrame({COVER_T})"); d = await pg.evaluate("grab()"); open(os.path.join(DATA, "cover_raw_v2.png"), "wb").write(base64.b64decode(d.split(",")[1])); await pg.evaluate("window.NOTEXT=false")
        await b.close()

def assemble():
    import imageio_ffmpeg
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    n = len([x for x in os.listdir(FR) if x.endswith(".png")])
    if n < N: sys.exit(f"Faltan frames ({n}/{N}). Vuelve a ejecutar para completar.")
    os.chdir(DATA)
    if not os.path.exists("portada_v2"):
        try:
            subprocess.run([sys.executable, "make_cover.py", "cover_raw_v2.png", "portada.png", "ALCATRAZ · 1962", "WOULD YOU", "ESCAPE", "THE ROCK?"], check=True)
            from PIL import Image; Image.open("portada.png").convert("RGB").save(os.path.join(ROOT, "portada.jpg"), quality=93); open("portada_v2", "w").close()
        except Exception as e: print("Portada no generada:", e)
    if not os.path.exists("outro_done_v2"):
        subprocess.run([sys.executable, "null_outro.py", str(OUTRO), str(FPS)], check=True); open("outro_done_v2", "w").close()
    fc = (f"[1:a]loudnorm=I=-15:TP=-1.5:LRA=11,aresample=44100,apad=whole_dur={DUR},asplit=2[v1][v2];"
          "[2:a]volume=0.9[b];[b][v1]sidechaincompress=threshold=0.05:ratio=6:attack=20:release=300[bd];"
          "[bd][v2]amix=inputs=2:duration=longest:normalize=0,alimiter=limit=0.95[a]")
    out = os.path.join(ROOT, "alcatraz.mp4"); tmp = os.path.join(ROOT, "alcatraz_tmp.mp4")
    subprocess.run([ff, "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", "frames_v2/f%05d.png", "-i", "voice.mp3", "-i", "bed.wav",
                    "-filter_complex", fc, "-map", "0:v", "-map", "[a]", "-t", str(DUR), "-c:v", "libx264", "-crf", "18", "-preset", "slow",
                    "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-c:a", "aac", "-b:a", "192k", tmp], check=True)
    os.replace(tmp, out)
    print("\nLISTO ->", out)

if __name__ == "__main__":
    ensure_modules()
    threading.Thread(target=serve, daemon=True).start(); time.sleep(1)
    if len(sys.argv) > 1 and sys.argv[1] == "redo":
        a = [int(x) for x in sys.argv[2:]]; fr = [f for i in range(0, len(a), 2) for f in range(a[i], a[i + 1])]
        asyncio.run(render(fr, FR, force=True)); assemble()
    elif len(sys.argv) > 1 and sys.argv[1] == "test":
        d = os.path.join(DATA, "test_frames"); asyncio.run(render([700, 1340, 2196, 2460], d)); print("Frames de prueba en", d)
    else:
        asyncio.run(render(range(N), FR)); assemble()

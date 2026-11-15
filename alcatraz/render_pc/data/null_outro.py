# Overlay Null popping in during the last ~1.8 s (easeOutBack + gentle bob), applied on the rendered PNG frames.
from PIL import Image, ImageFilter
import math, sys, os
FR="frames60"; t0=float(sys.argv[1]) if len(sys.argv)>1 else 90.5; fps=int(sys.argv[2]) if len(sys.argv)>2 else 30
files=sorted(os.listdir(FR)); n=len(files)
base=Image.open("null_cut.png"); W0=250
def back(x,s=1.7): x-=1; return 1+x*x*((s+1)*x+s)
for i in range(int(t0*fps), n):
    t=i/fps-t0; k=min(1,t/0.45); sc=max(0.01,back(k)) if k<1 else 1
    w=int(W0*sc); im=base.resize((max(2,w),max(2,int(base.height*w/base.width))),Image.LANCZOS).rotate(-8+math.sin(t*3)*4,expand=True,resample=Image.BICUBIC)
    fr=Image.open(os.path.join(FR,files[i])).convert("RGBA")
    cx,cy=850,700+math.sin(t*2.6)*10
    x,y=int(cx-im.width/2),int(cy-im.height/2)
    shadow=Image.new("RGBA",fr.size,(0,0,0,0)); blk=Image.new("RGBA",im.size,(0,0,0,255)); blk.putalpha(im.split()[3].point(lambda v:int(v*0.55))); shadow.paste(blk,(x+10,y+18),blk)
    fr.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(12))); fr.alpha_composite(im,(x,y))
    fr.convert("RGB").save(os.path.join(FR,files[i]))
print("outro frames", n-int(t0*fps))

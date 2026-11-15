from PIL import Image, ImageDraw, ImageFont, ImageFilter
import sys
raw, out, topic = sys.argv[1], sys.argv[2], sys.argv[3]
im=Image.open(raw).convert("RGBA"); W,H=im.size
grad=Image.new("L",(W,H)); gd=ImageDraw.Draw(grad)
for y in range(H): gd.line([(0,y),(W,y)],fill=int(150*max(0,1-y/820)))
im.alpha_composite(Image.merge("RGBA",[Image.new("L",(W,H),0)]*3+[grad]))
def text(xy,s,size,fill,stroke=13):
    F=ImageFont.truetype("nunito900.ttf",size)
    sh=Image.new("RGBA",im.size,(0,0,0,0)); ImageDraw.Draw(sh).text((xy[0],xy[1]+12),s,font=F,fill=(0,0,0,180),anchor="mm",stroke_width=stroke,stroke_fill=(0,0,0,180))
    im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(10)))
    ImageDraw.Draw(im).text(xy,s,font=F,fill=fill,anchor="mm",stroke_width=stroke,stroke_fill=(17,17,17,255))
L1,L2,L3=(sys.argv[4:7] if len(sys.argv)>6 else ("COULD YOU","SURVIVE THE","ARENA?"))
text((540,370),L1,132,(255,255,255,255)); text((540,505),L2,124,(255,255,255,255)); text((540,665),L3,150 if len(L3)>7 else 172,(255,210,63,255),15)
d=ImageDraw.Draw(im); F=ImageFont.truetype("nunito900.ttf",56); tw=d.textlength(topic,font=F); cx=450
d.rounded_rectangle((cx-tw/2-36,795,cx+tw/2+36,885),radius=45,fill=(12,18,40,235),outline=(255,210,63,255),width=6)
d.text((cx,840),topic,font=F,fill=(255,210,63,255),anchor="mm")
n=Image.open("null_cut.png"); w=215; n=n.resize((w,int(n.height*w/n.width)),Image.LANCZOS).rotate(-10,expand=True,resample=Image.BICUBIC)
x0=int(cx+tw/2+36+20); y0=840-n.height//2
sh=Image.new("RGBA",im.size,(0,0,0,0)); blk=Image.new("RGBA",n.size,(0,0,0,255)); blk.putalpha(n.split()[3].point(lambda v:int(v*0.6))); sh.paste(blk,(x0+8,y0+16),blk)
im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(12))); im.alpha_composite(n,(x0,y0))
im.convert("RGB").save(out)
def crop(r): h=int(W/r); y=(H-h)//2; return im.crop((0,y,W,y+h)).convert("RGB")
ig=crop(4/5); tk=crop(3/4)
prev=Image.new("RGB",(W*3+80,H),(30,30,30)); prev.paste(im.convert("RGB"),(0,0)); prev.paste(tk,(W+40,(H-tk.height)//2)); prev.paste(ig,(2*W+80,(H-ig.height)//2))
prev.resize((prev.width//2,prev.height//2),Image.LANCZOS).save("portada_preview.jpg",quality=90)

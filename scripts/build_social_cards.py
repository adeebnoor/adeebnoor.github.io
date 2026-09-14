"""Deterministic local social cards. The host provides fonts; font files are not copied."""
from pathlib import Path
import json
from PIL import Image, ImageDraw, ImageFont, features
ROOT=Path(__file__).resolve().parents[1]
DATA=json.loads((ROOT/'data/ideas-content.json').read_text())
FONT=Path('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
BOLD=Path('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf')
OUT=ROOT/'assets/essays'; OUT.mkdir(parents=True,exist_ok=True)
if not features.check('raqm'): raise RuntimeError('Arabic social cards require Pillow with libraqm')
for article in DATA['articles']:
 for lang in ('en','ar'):
  im=Image.new('RGB',(1200,630),'#0c2028');d=ImageDraw.Draw(im)
  d.rectangle((0,0,1200,12),fill='#e1bd78');d.rectangle((70,506,1130,508),fill='#3e5660')
  rtl=lang=='ar'; direction='rtl' if rtl else 'ltr'
  title=article['title'][lang]
  for size in range(58,35,-2):
   font=ImageFont.truetype(str(BOLD),size);words=title.split();lines=[];line=''
   for word in words:
    trial=(line+' '+word).strip()
    if d.textlength(trial,font=font,direction=direction)>1060 and line:lines.append(line);line=word
    else:line=trial
   if line:lines.append(line)
   if len(lines)<=4:break
  small=ImageFont.truetype(str(FONT),26);label=ImageFont.truetype(str(BOLD),24)
  theme=article['theme'][lang]
  x=1130 if rtl else 70;anchor='ra' if rtl else 'la'
  d.text((x,58),theme,font=label,fill='#e1bd78',direction=direction,anchor=anchor)
  y=150
  for line in lines:
   d.text((x,y),line,font=font,fill='#f7f4ec',direction=direction,anchor=anchor);y+=int(size*1.4)
  d.text((70,550),'ADEEB NOOR',font=label,fill='#f7f4ec')
  d.text((1130,550),'adeebnoor.github.io',font=small,fill='#ccd4d5',anchor='ra')
  im.save(OUT/(article['slug']+'-'+lang+'.png'),optimize=True)
print('Built eight 1200×630 bilingual essay social cards.')

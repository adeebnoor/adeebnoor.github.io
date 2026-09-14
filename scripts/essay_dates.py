"""Visible dates for essay cards, sourced from recorded per-language history."""
from pathlib import Path
from html import escape
from datetime import datetime
import json
ROOT=Path(__file__).resolve().parents[1]
DATES=json.loads((ROOT/'data/essay-dates.json').read_text())
MONTHS={
 'en':('January','February','March','April','May','June','July','August','September','October','November','December'),
 'ar':('يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر')
}

def date_badge(article,lang):
    if lang not in MONTHS: raise ValueError('Unsupported essay language')
    path=('ar/' if lang=='ar' else '')+article['path'].lstrip('/')
    recorded=DATES[path]['published']
    date=datetime.fromisoformat(recorded.replace('Z','+00:00'))
    label=f'{date.day} {MONTHS[lang][date.month-1]} {date.year}'
    heading='First recorded on this site: ' if lang=='en' else 'أول ظهور مسجّل على الموقع: '
    return '<p class="audit-meta" data-essay-date="'+escape(article['slug'],quote=True)+'">'+heading+'<time datetime="'+escape(recorded,quote=True)+'">'+escape(label)+'</time></p>'

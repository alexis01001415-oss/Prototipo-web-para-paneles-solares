"""Build the Spanish HELIO editing manual from docs/MANUAL-EDICION.md.

Run with Python with reportlab and fontTools installed. PDF output is stable.
Fonts are downloaded from the official google/fonts repository into tmp/pdfs;
the static Inter instances are generated locally for PDF font embedding.
"""
from pathlib import Path
import re
import urllib.request
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, PageBreak,
                              Table, TableStyle, Preformatted, KeepTogether)
from fontTools.ttLib import TTFont as FontToolsTTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parents[1]
TMP = ROOT / 'tmp' / 'pdfs'
TMP.mkdir(parents=True, exist_ok=True)
OUT = ROOT / 'output' / 'manual-helio.pdf'
OUT.parent.mkdir(exist_ok=True)

FONT_BASE = 'https://raw.githubusercontent.com/google/fonts/main/ofl/'
def fetch_font(name, url):
    target = TMP / name
    if not target.exists():
        urllib.request.urlretrieve(url, target)
    return target

voltaire = fetch_font('Voltaire-Regular.ttf', FONT_BASE + 'voltaire/Voltaire-Regular.ttf')
inter_variable = fetch_font('Inter-variable.ttf', FONT_BASE + 'inter/Inter%5Bopsz,wght%5D.ttf')
for weight, name in [(400, 'Inter-Regular'), (600, 'Inter-Semibold')]:
    target = TMP / f'{name}.ttf'
    if not target.exists():
        font = FontToolsTTFont(str(inter_variable))
        instance = instantiateVariableFont(font, {'wght': weight, 'opsz': 14}, inplace=False)
        instance.save(target)
    pdfmetrics.registerFont(TTFont(name, str(target)))
pdfmetrics.registerFont(TTFont('Voltaire', str(voltaire)))
pdfmetrics.registerFont(TTFont('Code', 'C:/Windows/Fonts/consola.ttf'))
pdfmetrics.registerFontFamily('Inter-Regular', normal='Inter-Regular', bold='Inter-Semibold', italic='Inter-Regular', boldItalic='Inter-Semibold')

FOREST = colors.HexColor('#132a13')
GREEN = colors.HexColor('#31572c')
OLIVE = colors.HexColor('#4f772d')
SAGE = colors.HexColor('#90a955')
LIME = colors.HexColor('#ecf39e')
PAPER = colors.HexColor('#f5f6ec')
MUTED = colors.HexColor('#52634b')
LINE = colors.HexColor('#d8dfc8')
WIDTH, HEIGHT = A4
MARGIN = 45
CONTENT_WIDTH = WIDTH - MARGIN * 2

styles = {
    'body': ParagraphStyle('body', fontName='Inter-Regular', fontSize=9.25, leading=14.25, textColor=FOREST, spaceAfter=10, allowWidows=0, allowOrphans=0),
    'title': ParagraphStyle('title', fontName='Voltaire', fontSize=30, leading=36, textColor=FOREST, spaceAfter=20),
    'sub': ParagraphStyle('sub', fontName='Inter-Semibold', fontSize=10.5, leading=14.5, textColor=GREEN, spaceBefore=11, spaceAfter=9, keepWithNext=True),
    'list': ParagraphStyle('list', fontName='Inter-Regular', fontSize=9.25, leading=14.25, textColor=FOREST, leftIndent=11, firstLineIndent=-11, spaceAfter=7),
    'note': ParagraphStyle('note', fontName='Inter-Regular', fontSize=9, leading=14, textColor=GREEN, spaceAfter=0),
    'code': ParagraphStyle('code', fontName='Code', fontSize=8.5, leading=12.2, textColor=FOREST, leftIndent=0, rightIndent=0, spaceAfter=0),
    'cell': ParagraphStyle('cell', fontName='Inter-Regular', fontSize=8.6, leading=12.4, textColor=FOREST),
    'cover': ParagraphStyle('cover', fontName='Voltaire', fontSize=57, leading=65, textColor=FOREST, spaceAfter=23),
}

def inline(text):
    # Markdown links are clickable in the PDF, while visible labels stay concise.
    text = escape(text)
    text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<link href="\2" color="#31572c"><u>\1</u></link>', text)
    text = re.sub(r'`([^`]+)`', r'<font name="Code" size="8.8">\1</font>', text)
    text = re.sub(r'\*\*([^*]+)\*\*', r'<b>\1</b>', text)
    return text

def box(content, background=PAPER):
    result = Table([[content]], colWidths=[CONTENT_WIDTH], hAlign='LEFT')
    result.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), background),
        ('BOX', (0, 0), (-1, -1), .45, LINE),
        ('LEFTPADDING', (0, 0), (-1, -1), 13),
        ('RIGHTPADDING', (0, 0), (-1, -1), 13),
        ('TOPPADDING', (0, 0), (-1, -1), 11),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 11),
    ]))
    return [result, Spacer(1, 11)]

def render_table(lines):
    rows = [[x.strip() for x in line.strip().strip('|').split('|')] for line in lines]
    rows = [row for row in rows if not all(re.fullmatch(r'[-: ]+', cell) for cell in row)]
    cells = [[Paragraph(inline(cell), styles['cell']) for cell in row] for row in rows]
    widths = [CONTENT_WIDTH * .57, CONTENT_WIDTH * .43]
    if rows[0][0] == 'Variable':
        widths = [CONTENT_WIDTH * .49, CONTENT_WIDTH * .51]
    table = Table(cells, colWidths=widths, hAlign='LEFT')
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), LIME),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, PAPER]),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LINEBELOW', (0, 0), (-1, -1), .35, LINE),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    return [table, Spacer(1, 12)]

def page_chrome(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(FOREST)
    canvas.rect(0, HEIGHT - 9, WIDTH, 9, fill=1, stroke=0)
    canvas.setFillColor(GREEN)
    canvas.setFont('Inter-Semibold', 8)
    canvas.drawString(MARGIN, HEIGHT - 35, 'HELIO  /  GUÍA DE EDICIÓN')
    canvas.setFillColor(MUTED)
    canvas.setFont('Inter-Regular', 7.5)
    canvas.drawRightString(WIDTH - MARGIN, HEIGHT - 35, 'SEPTIEMBRE 2026')
    canvas.setStrokeColor(LINE)
    canvas.line(MARGIN, 44, WIDTH - MARGIN, 44)
    canvas.setFont('Inter-Regular', 7.5)
    canvas.drawString(MARGIN, 29, 'Textos · Diseño · Responsive · Publicación')
    canvas.setFillColor(GREEN)
    canvas.drawRightString(WIDTH - MARGIN, 29, f'{doc.page:02d} / 14')
    if doc.page == 1:
        canvas.setFillColor(LIME)
        canvas.circle(WIDTH - 84, HEIGHT - 154, 29, fill=1, stroke=0)
        canvas.setStrokeColor(GREEN)
        canvas.setLineWidth(1.2)
        canvas.circle(WIDTH - 84, HEIGHT - 154, 12, fill=0, stroke=1)
        import math
        for i in range(8):
            a = math.pi * i / 4
            canvas.line(WIDTH - 84 + 17 * math.cos(a), HEIGHT - 154 + 17 * math.sin(a), WIDTH - 84 + 22 * math.cos(a), HEIGHT - 154 + 22 * math.sin(a))
    canvas.restoreState()

story = []
pages = (ROOT / 'docs' / 'MANUAL-EDICION.md').read_text(encoding='utf-8').split('<!-- PAGE -->')
for page_index, page in enumerate(pages):
    if page_index:
        story.append(PageBreak())
    lines = page.strip().splitlines()
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if not line:
            i += 1
            continue
        if line.startswith('```'):
            code = []
            i += 1
            while i < len(lines) and not lines[i].startswith('```'):
                code.append(lines[i])
                i += 1
            for code_line in code:
                if pdfmetrics.stringWidth(code_line, 'Code', 8.5) > CONTENT_WIDTH - 26:
                    raise ValueError(f'Code line overflows on page {page_index+1}: {code_line}')
            story.extend(box(Preformatted('\n'.join(code), styles['code'])))
        elif line.startswith('|'):
            table_lines = []
            while i < len(lines) and lines[i].strip().startswith('|'):
                table_lines.append(lines[i])
                i += 1
            story.extend(render_table(table_lines))
            continue
        elif line.startswith('# '):
            story.append(Spacer(1, 28))
            story.append(Paragraph(inline(line[2:]), styles['cover']))
        elif line.startswith('## '):
            story.append(Paragraph(inline(line[3:]), styles['title']))
        elif line.startswith('### '):
            story.append(Paragraph(inline(line[4:]), styles['sub']))
        elif line.startswith('> '):
            story.extend(box(Paragraph(inline(line[2:]), styles['note']), colors.HexColor('#eef1df')))
        elif re.match(r'^(\d+\. |- )', line):
            if line.startswith('- '):
                line = '•  ' + line[2:]
            story.append(Paragraph(inline(line), styles['list']))
        else:
            story.append(Paragraph(inline(line), styles['body']))
        i += 1

doc = SimpleDocTemplate(str(OUT), pagesize=A4, rightMargin=MARGIN, leftMargin=MARGIN,
                        topMargin=65, bottomMargin=61, title='HELIO | Manual de edición',
                        author='HELIO / Prototipo', subject='Guía práctica de edición en Visual Studio Code')
doc.build(story, onFirstPage=page_chrome, onLaterPages=page_chrome)
print(OUT)

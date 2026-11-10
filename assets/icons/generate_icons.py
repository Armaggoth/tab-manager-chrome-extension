#!/usr/bin/env python3
"""Generate the Tab Manager action icon set.

Each action is drawn three times (16, 48, 128 px) from one 16-unit layout grid,
with more detail at larger sizes:
  tier 1 (16px)  : pixel-aligned, 1px outline, flat colour blocks
  tier 2 (48px)  : 2px outline, rounded corners, glyph detail
  tier 3 (128px) : 4px outline, highlights, dots, content lines, sparkles

Usage:  python3 generate_icons.py          (requires: pip install cairosvg)
Output: ./svg/<size>/<id>.svg and ./<size>/<id>.png
"""
import math
import os

import cairosvg

HERE = os.path.dirname(os.path.abspath(__file__))

NAVY = "#1B2B4B"
BLUE = "#3B8BE8"
BLUE_L = "#BBD9FA"
BODY = "#F2F7FE"
YEL = "#FFC83D"
YEL_L = "#FFE08A"
GRN = "#4CB36A"
PUR = "#8E5BD6"
RED = "#E5483D"
GREY = "#A9BAD3"
WHITE = "#FFFFFF"

SCALE = {1: 1, 2: 3, 3: 8}
STROKE = {1: 1, 2: 2, 3: 4}
SIZE = {1: 16, 2: 48, 3: 128}


class Canvas:
    def __init__(self, tier):
        self.t = tier
        self.s = SCALE[tier]
        self.sw = STROKE[tier]
        self.size = SIZE[tier]
        self.el = []
        self.defs = []
        self._id = 0

    # ---- helpers -------------------------------------------------------
    def px(self, g):
        return g * self.s

    def snap(self, v):
        """Snap a px coordinate so strokes of this tier stay crisp."""
        if self.sw % 2 == 1:
            return math.floor(v) + 0.5
        return round(v)

    def uid(self, p="c"):
        self._id += 1
        return f"{p}{self._id}"

    def add(self, s):
        self.el.append(s)

    def r(self, g):
        """Corner radius in px for a grid radius (square at tier 1)."""
        return 0 if self.t == 1 else g * self.s

    # ---- shapes --------------------------------------------------------
    def rect(self, x, y, w, h, fill, r=0.0, stroke=NAVY, sw=None, opacity=None):
        sw = self.sw if sw is None else sw
        X, Y, W, H = self.px(x), self.px(y), self.px(w), self.px(h)
        rx = min(self.r(r), W / 2, H / 2)
        op = f' opacity="{opacity}"' if opacity else ""
        if stroke is None:
            self.add(f'<rect x="{X}" y="{Y}" width="{W}" height="{H}" rx="{rx}" fill="{fill}"{op}/>')
        else:
            self.add(
                f'<rect x="{X + sw / 2}" y="{Y + sw / 2}" width="{W - sw}" height="{H - sw}" '
                f'rx="{max(rx - sw / 2, 0)}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{op}/>'
            )

    def raw_rect(self, X, Y, W, H, fill, rx=0):
        self.add(f'<rect x="{X}" y="{Y}" width="{W}" height="{H}" rx="{rx}" fill="{fill}"/>')

    def line(self, x1, y1, x2, y2, color=NAVY, w=None, cap="butt"):
        w = self.sw if w is None else w
        a, b, c, d = (self.snap(self.px(v)) for v in (x1, y1, x2, y2))
        self.add(
            f'<line x1="{a}" y1="{b}" x2="{c}" y2="{d}" stroke="{color}" stroke-width="{w}" stroke-linecap="{cap}"/>'
        )

    def circle(self, cx, cy, rg, fill, stroke=NAVY, sw=None):
        sw = self.sw if sw is None else sw
        rr = self.px(rg) - (sw / 2 if stroke else 0)
        st = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ""
        self.add(f'<circle cx="{self.px(cx)}" cy="{self.px(cy)}" r="{max(rr, 0.3)}" fill="{fill}"{st}/>')

    def path(self, d, fill="none", stroke=NAVY, w=None, cap="round", join="round"):
        w = self.sw if w is None else w
        st = f' stroke="{stroke}" stroke-width="{w}" stroke-linecap="{cap}" stroke-linejoin="{join}"' if stroke else ""
        self.add(f'<path d="{d}" fill="{fill}"{st}/>')

    # ---- composite glyphs ---------------------------------------------
    def window(self, x, y, w, h, accent=BLUE, body=BODY, dots=True, lines=True):
        t, s, sw = self.t, self.s, self.sw
        self.rect(x, y, w, h, body, r=0.9)
        X, Y, W, H = self.px(x), self.px(y), self.px(w), self.px(h)
        ix, iy, iw, ih = X + sw, Y + sw, W - 2 * sw, H - 2 * sw
        if t == 1:
            th = 2 if h >= 6 else 1
        elif t == 2:
            th = min(7, ih * 0.32)
        else:
            th = min(22, ih * 0.28)
        th = max(1, min(th, ih - 1))
        if t == 1:
            self.raw_rect(ix, iy, iw, th, accent)
        else:
            cid = self.uid("clip")
            rr = max(self.r(0.9) - sw, 0)
            self.defs.append(
                f'<clipPath id="{cid}"><rect x="{ix}" y="{iy}" width="{iw}" height="{ih}" rx="{rr}"/></clipPath>'
            )
            self.add(
                f'<g clip-path="url(#{cid})"><rect x="{ix}" y="{iy}" width="{iw}" height="{th}" fill="{accent}"/>'
                f'<rect x="{ix}" y="{iy + th}" width="{iw}" height="{max(1, sw * 0.5)}" fill="{NAVY}"/></g>'
            )
        if t >= 2 and dots and iw >= 30:
            dr = max(1.0, th * 0.17)
            for i in range(3):
                self.add(
                    f'<circle cx="{ix + th * 0.7 + i * th * 0.55}" cy="{iy + th / 2}" r="{dr}" fill="{WHITE}"/>'
                )
        if t == 3 and lines and ih - th > 40 and iw > 60:
            ly = iy + th + 12
            lw = iw * 0.6
            while ly < iy + ih - 10:
                self.raw_rect(ix + 10, ly, lw, 5, BLUE_L, 2.5)
                ly += 13
                lw = iw * 0.4

    def folder(self, x, y, w, h, color=YEL, light=YEL_L):
        t, sw = self.t, self.sw
        tw = max(w * 0.45, 2)
        self.rect(x, y, tw, h * 0.5, color, r=0.5)
        by = y + max(h * 0.2, 1)
        self.rect(x, by, w, h - (by - y), color, r=0.6)
        # hide the body's top outline inside the tab so the tab reads as one piece
        X, BY = self.px(x), self.px(by)
        self.raw_rect(X + sw, BY, self.px(tw) - 2 * sw, sw, color)
        if t == 3:
            self.raw_rect(self.px(x) + sw + 3, self.px(by) + sw + 6, self.px(w) - 2 * sw - 6, 5, light, 2.5)

    def pill(self, x, y, w, h, color, label=False):
        self.rect(x, y, w, h, color, r=h / 2)
        if self.t == 3 and label:
            X, Y, H = self.px(x), self.px(y), self.px(h)
            self.raw_rect(X + H * 0.55, Y + H / 2 - 3, self.px(w) * 0.5, 6, WHITE, 3)
        elif self.t == 2 and label:
            X, Y, H = self.px(x), self.px(y), self.px(h)
            self.raw_rect(X + H * 0.55, Y + H / 2 - 1, self.px(w) * 0.45, 2, WHITE, 1)

    def arrow(self, x1, y1, x2, y2, color=NAVY, hl=None):
        s, sw = self.s, self.sw
        hl = (hl if hl is not None else {1: 2.2, 2: 2.0, 3: 2.0}[self.t]) * s
        hw = hl * 0.62
        a, b, c, d = (self.px(v) for v in (x1, y1, x2, y2))
        if abs(a - c) < 1e-6:
            a = c = self.snap(a)
        if abs(b - d) < 1e-6:
            b = d = self.snap(b)
        dx, dy = c - a, d - b
        L = math.hypot(dx, dy)
        ux, uy = dx / L, dy / L
        bx, by = c - ux * hl, d - uy * hl
        sx, sy = c - ux * hl * 0.5, d - uy * hl * 0.5  # overlap into head
        self.add(f'<line x1="{a}" y1="{b}" x2="{sx}" y2="{sy}" stroke="{color}" stroke-width="{sw}"/>')
        px_, py_ = -uy, ux
        pts = f"{c},{d} {bx + px_ * hw},{by + py_ * hw} {bx - px_ * hw},{by - py_ * hw}"
        self.add(f'<polygon points="{pts}" fill="{color}" stroke="{color}" stroke-width="{sw * 0.3}" stroke-linejoin="round"/>')

    def cross(self, cx, cy, half, color=RED, w=None):
        """Bold X with outline (used as the 'close' mark)."""
        s = self.s
        w = (w if w is not None else {1: 2, 2: 5, 3: 14}[self.t])
        x1, y1, x2, y2 = (cx - half) * s, (cy - half) * s, (cx + half) * s, (cy + half) * s
        o = self.sw * 2
        for col, ww in ((NAVY, w + o), (color, w)):
            self.add(
                f'<path d="M{x1},{y1} L{x2},{y2} M{x1},{y2} L{x2},{y1}" stroke="{col}" stroke-width="{ww}" '
                f'stroke-linecap="{"square" if self.t == 1 else "round"}" fill="none"/>'
            )

    def badge_x(self, cx, cy, rg):
        """Red circle with white X (tiers 2-3); bold outlined X at tier 1."""
        if self.t == 1:
            self.cross(cx, cy, rg * 0.85, RED, 2)
            return
        s, sw = self.s, self.sw
        self.circle(cx, cy, rg, RED)
        h = rg * 0.42 * s
        X, Y = cx * s, cy * s
        w = sw * 1.5
        self.add(
            f'<path d="M{X - h},{Y - h} L{X + h},{Y + h} M{X - h},{Y + h} L{X + h},{Y - h}" '
            f'stroke="{WHITE}" stroke-width="{w}" stroke-linecap="round" fill="none"/>'
        )

    def trash(self, x, y, w, h):
        t, sw = self.t, self.sw
        lid = 1 if t == 1 else 1.3
        self.rect(x + 0.5, y + lid, w - 1, h - lid, RED if t == 1 else "#EE7A70", r=0.4)
        self.rect(x, y + (0.5 if t == 1 else 0.3), w, 1 if t == 1 else lid * 0.9, GREY, r=0.3)
        if t >= 2:
            X, Y = self.px(x), self.px(y)
            cx = X + self.px(w) / 2
            self.raw_rect(cx - self.px(0.8), Y - self.px(0.2), self.px(1.6), self.px(0.5), NAVY, 2)
            for i in (-1, 0, 1):
                lx = cx + i * self.px(w) * 0.2
                self.add(
                    f'<line x1="{lx}" y1="{Y + self.px(lid + 0.8)}" x2="{lx}" y2="{Y + self.px(h) - self.px(0.9)}" '
                    f'stroke="{WHITE}" stroke-width="{max(1, sw * 0.5)}" stroke-linecap="round"/>'
                )

    def magnet(self, x, y, w, h):
        """Horseshoe magnet opening to the right, spanning grid box (x,y,w,h)."""
        t, s, sw = self.t, self.s, self.sw
        leg = {1: 2, 2: 6, 3: 17}[t]
        o = sw * 2
        X0, Y0, X1, Y1 = x * s + leg / 2 + sw, y * s + leg / 2 + sw, (x + w) * s - sw, (y + h) * s - leg / 2 - sw
        rr = (Y1 - Y0) / 2
        d = f"M{X1},{Y0} L{X0 + rr},{Y0} A{rr},{rr} 0 0 0 {X0 + rr},{Y1} L{X1},{Y1}"
        self.path(d, stroke=NAVY, w=leg + o, cap="butt", join="round")
        self.path(d, stroke=RED, w=leg, cap="butt", join="round")
        # white pole tips
        tip = {1: 1.5, 2: 4.5, 3: 12}[t]
        for yy in (Y0, Y1):
            self.add(
                f'<rect x="{X1 - tip}" y="{yy - leg / 2}" width="{tip}" height="{leg}" fill="{WHITE}"/>'
            )
            self.add(
                f'<path d="M{X1 - tip},{yy - leg / 2 - sw / 2} L{X1 + sw / 2},{yy - leg / 2 - sw / 2} '
                f'M{X1 - tip},{yy + leg / 2 + sw / 2} L{X1 + sw / 2},{yy + leg / 2 + sw / 2} '
                f'M{X1 + sw / 2},{yy - leg / 2 - sw} L{X1 + sw / 2},{yy + leg / 2 + sw}" '
                f'stroke="{NAVY}" stroke-width="{sw}" fill="none"/>'
            )

    def note(self, x, y, w, h):
        """Beamed-less eighth note in grid box."""
        t, s, sw = self.t, self.s, self.sw
        hr = {1: 1.6, 2: 5.0, 3: 13}[t]
        hx, hy = x * s + hr, (y + h) * s - hr
        sx = hx + hr - (0.5 if t == 1 else sw / 2)
        top = y * s + (0 if t == 1 else sw)
        self.add(f'<circle cx="{hx}" cy="{hy}" r="{hr}" fill="{NAVY}"/>')
        sw_stem = {1: 1, 2: 2.5, 3: 6}[t]
        sx = hx + hr - sw_stem / 2
        self.add(f'<rect x="{sx}" y="{top}" width="{sw_stem}" height="{hy - top}" fill="{NAVY}"/>')
        fl = w * s
        self.path(
            f"M{sx + sw_stem},{top} C{sx + sw_stem + fl * 0.1},{top + fl * 0.5} {sx + fl * 0.9},{top + fl * 0.4} {sx + fl * 0.8},{top + fl * 0.9}",
            stroke=NAVY, w=sw_stem if t > 1 else 1, cap="butt",
        )

    def magnifier(self, cx, cy, rg):
        t, s, sw = self.t, self.s, self.sw
        R = rg * s
        hl = {1: 2.8, 2: 3.2, 3: 3.2}[t] * s
        d = math.sqrt(0.5)
        hx0, hy0 = cx * s + (R) * d, cy * s + (R) * d
        hx1, hy1 = hx0 + hl * d, hy0 + hl * d
        hw = {1: 2, 2: 5, 3: 14}[t]
        self.add(
            f'<line x1="{hx0}" y1="{hy0}" x2="{hx1}" y2="{hy1}" stroke="{NAVY}" stroke-width="{hw + sw}" stroke-linecap="round"/>'
        )
        if t > 1:
            self.add(
                f'<line x1="{hx0}" y1="{hy0}" x2="{hx1}" y2="{hy1}" stroke="{GREY}" stroke-width="{hw - sw}" stroke-linecap="round"/>'
            )
        self.circle(cx, cy, rg, BLUE_L)
        if t == 3:
            self.path(
                f"M{cx * s - R * 0.5},{cy * s - R * 0.05} A{R * 0.55},{R * 0.55} 0 0 1 {cx * s},{cy * s - R * 0.55}",
                stroke=WHITE, w=6,
            )

    def wave(self, x, y, h, n):
        t, s = self.t, self.s
        bw = {2: 2, 3: 5}[t]
        gap = {2: 4, 3: 10}[t]
        pattern = [0.4, 0.8, 1.0, 0.65, 0.35][:n]
        for i, p in enumerate(pattern):
            bh = h * s * p
            cx = x * s + i * gap
            cy = (y + h / 2) * s
            self.add(
                f'<line x1="{cx}" y1="{cy - bh / 2}" x2="{cx}" y2="{cy + bh / 2}" stroke="{BLUE}" stroke-width="{bw}" stroke-linecap="round"/>'
            )

    def page(self, x, y, w, h, color, kind):
        t, s, sw = self.t, self.s, self.sw
        X, Y, W, H = self.px(x), self.px(y), self.px(w), self.px(h)
        c = min(W, H) * 0.34
        i = sw / 2
        d = (
            f"M{X + i},{Y + i} L{X + W - c},{Y + i} L{X + W - i},{Y + c} L{X + W - i},{Y + H - i} L{X + i},{Y + H - i} Z"
        )
        self.path(d, fill=color, stroke=NAVY, w=sw, join="miter" if t == 1 else "round")
        if t == 1:
            self.raw_rect(X + W - c + 0.0, Y + 1, 1, 1, NAVY)
            return
        self.path(f"M{X + W - c},{Y + i} L{X + W - c},{Y + c} L{X + W - i},{Y + c}", fill="none", stroke=NAVY, w=sw)
        gx, gy = X + sw + W * 0.14, Y + H * 0.45
        gw = W - 2 * sw - W * 0.28
        lw = max(1.2, sw * 0.7)
        if kind == "doc" or t == 2 and kind != "sheet":
            for k in range(3):
                self.add(
                    f'<line x1="{gx}" y1="{gy + k * H * 0.17}" x2="{gx + gw * (0.7 if k == 2 else 1)}" y2="{gy + k * H * 0.17}" stroke="{WHITE}" stroke-width="{lw}" stroke-linecap="round"/>'
                )
        elif kind == "sheet":
            for k in range(2):
                self.add(f'<line x1="{gx}" y1="{gy + k * H * 0.22}" x2="{gx + gw}" y2="{gy + k * H * 0.22}" stroke="{WHITE}" stroke-width="{lw}"/>')
            self.add(f'<line x1="{gx + gw / 2}" y1="{gy - H * 0.05}" x2="{gx + gw / 2}" y2="{gy + H * 0.4}" stroke="{WHITE}" stroke-width="{lw}"/>')
        elif kind == "slide":
            self.add(f'<rect x="{gx}" y="{gy}" width="{gw}" height="{H * 0.3}" rx="{lw}" fill="none" stroke="{WHITE}" stroke-width="{lw}"/>')
        elif kind == "form":
            for k in range(3):
                yy = gy + k * H * 0.17
                self.add(f'<circle cx="{gx + lw}" cy="{yy}" r="{lw * 0.8}" fill="{WHITE}"/>')
                self.add(f'<line x1="{gx + lw * 3}" y1="{yy}" x2="{gx + gw}" y2="{yy}" stroke="{WHITE}" stroke-width="{lw}" stroke-linecap="round"/>')

    def gear(self, cx, cy, ro, ri, teeth=8):
        t, s, sw = self.t, self.s, self.sw
        Ro, Ri = ro * s - sw / 2, ri * s
        pts = []
        n = teeth * 4
        for k in range(n):
            ang = 2 * math.pi * k / n - math.pi / n
            rad = Ro if (k % 4) in (1, 2) else Ri
            pts.append((cx * s + rad * math.cos(ang), cy * s + rad * math.sin(ang)))
        # tooth shape: outer on 2 of every 4 samples
        d = "M" + " L".join(f"{x:.2f},{y:.2f}" for x, y in pts) + " Z"
        self.path(d, fill=GREY, stroke=NAVY, w=sw)
        self.circle(cx, cy, ri * 0.55, BODY)
        if t == 3:
            self.circle(cx, cy, ri * 0.25, BLUE, sw=3)

    def sparkle(self, cx, cy, rg, color=YEL):
        X, Y, R = cx * self.s, cy * self.s, rg * self.s
        d = (
            f"M{X},{Y - R} Q{X},{Y} {X + R},{Y} Q{X},{Y} {X},{Y + R} Q{X},{Y} {X - R},{Y} Q{X},{Y} {X},{Y - R} Z"
        )
        self.add(f'<path d="{d}" fill="{color}"/>')

    def svg(self):
        body = "\n  ".join(self.el)
        defs = f"<defs>{''.join(self.defs)}</defs>\n  " if self.defs else ""
        return (
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{self.size}" height="{self.size}" '
            f'viewBox="0 0 {self.size} {self.size}">\n  {defs}{body}\n</svg>\n'
        )


# ========================================================================
# Scenes (16-unit layout grid)
# ========================================================================

def scene_ungroup(c):
    c.pill(1, 1, 6, 3, YEL)
    c.pill(9, 1, 6, 3, YEL)
    c.window(1, 6, 6, 8, accent=BLUE)
    c.window(9, 6, 6, 8, accent=BLUE)
    if c.t >= 2:
        # "broken link" ticks in the gap between the two halves of the group bar
        for dx in (-0.35, 0.35):
            c.add(
                f'<line x1="{(8 + dx - 0.3) * c.s}" y1="{4.2 * c.s}" x2="{(8 + dx + 0.3) * c.s}" y2="{0.8 * c.s}" '
                f'stroke="{RED}" stroke-width="{c.sw}" stroke-linecap="round"/>'
            )
    if c.t == 3:
        c.sparkle(8, 10, 1.0, BLUE_L)


def scene_group_domain(c, color=GRN, stack=2, asterisk=False):
    c.pill(1, 1, 9, 3, color, label=True)
    if stack == 3:
        c.window(5, 5, 10, 6, accent=color)
        c.window(3, 7, 10, 6, accent=color)
        c.window(1, 9, 10, 6, accent=color)
    else:
        c.window(5, 5, 10, 8, accent=color)
        c.window(1, 8, 10, 7, accent=color)
    if asterisk and c.t >= 2:
        s = c.s
        cx, cy, r = 8.2 * s, 2.5 * s, 0.7 * s
        for a in (0, 60, 120):
            ax, ay = math.cos(math.radians(a)) * r, math.sin(math.radians(a)) * r
            c.add(
                f'<line x1="{cx - ax}" y1="{cy - ay}" x2="{cx + ax}" y2="{cy + ay}" stroke="{WHITE}" '
                f'stroke-width="{max(1.5, c.sw * 0.8)}" stroke-linecap="round"/>'
            )


def scene_group_docs(c):
    c.page(1, 1, 6, 6, BLUE, "doc")
    c.page(9, 1, 6, 6, GRN, "sheet")
    c.page(1, 9, 6, 6, YEL, "slide")
    c.page(9, 9, 6, 6, PUR, "form")


def scene_sort(c):
    c.rect(5, 10, 3, 5, BLUE, r=0.3)
    c.rect(9, 7, 3, 8, GRN, r=0.3)
    c.rect(13, 3, 3, 12, YEL, r=0.3)
    if c.t == 3:
        for (x, y, h) in ((5, 10, 5), (9, 7, 8), (13, 3, 12)):
            c.raw_rect(c.px(x) + 8, c.px(y) + 8, 5, c.px(h) - 16, WHITE, 2.5)
    c.arrow(2, 14.5, 2, 1.5, hl=2.4)
    if c.t >= 2:
        c.line(1, 15, 3.5, 15, NAVY)


def scene_remove_dupes(c):
    c.window(1, 1, 9, 7, accent=BLUE_L)
    c.window(5, 5, 9, 7, accent=BLUE)
    c.trash(11, 9, 5, 6)


def _chip(c, x, y, w, h, n):
    for i in range(n):
        off = (n - 1 - i) * (1 if c.t == 1 else 0.9)
        c.folder(x + off - (n - 1) * 0.0, y - off, w, h, YEL if i == n - 1 else "#F4B731")


def scene_move_current(c, n=1):
    c.window(1, 1, 14, 13, accent=BLUE)
    _chip(c, 2, 6, 6, 5, n)
    c.arrow(9.5, 8.5, 13.5, 8.5)
    if c.t == 3:
        c.sparkle(13, 4.5, 1.0, YEL)


def scene_move_all(c, n=1):
    _chip(c, 1, 6, 5, 5, n)
    for y in (1, 6, 11):
        c.window(9, y, 6, 4, accent=BLUE)
    if c.t == 1:
        c.arrow(6.5, 8.5, 9, 8.5, hl=1.5)
    else:
        for ty in (3, 8, 13):
            c.arrow(6.5, 8.5, 8.7, ty, hl=1.6)


def scene_move_ungrouped(c):
    for y in (1, 6, 11):
        c.window(1, y, 5, 4, accent=BLUE)
    c.window(9, 3, 6, 10, accent=BLUE)
    if c.t == 1:
        c.arrow(6.5, 8.5, 9, 8.5, hl=1.5)
    else:
        for sy, ey in ((3, 5.5), (8, 8), (13, 10.5)):
            c.arrow(6.2, sy, 8.8, ey, hl=1.6)


def scene_bring_domain(c, n=1):
    c.window(6, 1, 9, 6, accent=BLUE)
    c.magnet(1, 6, 7, 9)
    _chip(c, 9, 10, 5, 4, n)
    c.arrow(11.5, 9.6, 11.5, 7.6, hl=1.6)


def scene_bring_all(c):
    for (x, y) in ((0, 0), (11, 0), (0, 12), (11, 12)):
        c.window(x, y, 5, 4, accent=BLUE_L)
    c.window(5, 5, 6, 6, accent=BLUE)
    c.arrow(8.5, 0.5, 8.5, 4.5, hl=2)
    c.arrow(8.5, 15.5, 8.5, 11.5, hl=2)
    c.arrow(0.5, 8.5, 4.5, 8.5, hl=2)
    c.arrow(15.5, 8.5, 11.5, 8.5, hl=2)


def scene_find_media(c):
    c.window(1, 1, 14, 10, accent=BLUE)
    c.note(3.5, 4.5, 3, 4.5)
    if c.t >= 2:
        c.wave(8.5, 4.6, 3, 3 if c.t == 2 else 5)
    c.magnifier(11, 10.5, 2.6)


def scene_close_current(c):
    c.window(1, 1, 13, 11, accent=BLUE)
    c.folder(3, 5, 6, 5)
    c.badge_x(12, 12, 3.2)


def scene_close_all(c):
    c.window(1, 1, 10, 8, accent=BLUE_L)
    c.window(3, 4, 10, 8, accent=BLUE_L)
    c.window(5, 7, 10, 8, accent=BLUE)
    c.badge_x(11.5, 11.5, 2.8) if c.t > 1 else c.cross(10, 11.5, 2.2, RED, 2)


def scene_settings(c):
    c.gear(8, 8, 7, 5.3)


ICONS = {
    "ungroup": scene_ungroup,
    "group-by-domain": lambda c: scene_group_domain(c, GRN, 2),
    "group-by-domain-ignore-subdomain": lambda c: scene_group_domain(c, PUR, 3, asterisk=True),
    "group-google-docs-by-type": scene_group_docs,
    "sort-by-domain": scene_sort,
    "remove-duplicates": scene_remove_dupes,
    "move-domain-current-window": lambda c: scene_move_current(c, 1),
    "move-domain-current-window-no-subdomain": lambda c: scene_move_current(c, 2),
    "move-domain-all-windows": lambda c: scene_move_all(c, 1),
    "move-domain-all-windows-no-subdomain": lambda c: scene_move_all(c, 2),
    "move-ungrouped-current-window": scene_move_ungrouped,
    "bring-domain-to-current-window": lambda c: scene_bring_domain(c, 1),
    "bring-domain-to-current-window-no-subdomain": lambda c: scene_bring_domain(c, 2),
    "bring-to-window": scene_bring_all,
    "find-media-playing": scene_find_media,
    "close-domain-current-window": scene_close_current,
    "close-domain-all-windows": scene_close_all,
    "settings": scene_settings,
}


def main():
    for tier, size in SIZE.items():
        os.makedirs(os.path.join(HERE, "svg", str(size)), exist_ok=True)
        os.makedirs(os.path.join(HERE, str(size)), exist_ok=True)
        for name, fn in ICONS.items():
            c = Canvas(tier)
            fn(c)
            svg = c.svg()
            with open(os.path.join(HERE, "svg", str(size), f"{name}.svg"), "w") as f:
                f.write(svg)
            cairosvg.svg2png(
                bytestring=svg.encode(),
                write_to=os.path.join(HERE, str(size), f"{name}.png"),
                output_width=size,
                output_height=size,
            )
    print(f"Generated {len(ICONS)} icons x {len(SIZE)} sizes")


if __name__ == "__main__":
    main()

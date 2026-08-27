#!/usr/bin/env python3
"""把 Natural Earth 110m 国界转成 RouteMap 用的 SVG path。

投影必须和 RouteMap.project() 完全一致（等距圆柱，900×360），
否则海岸线和机场点会对不上。

数据来源：Natural Earth（公有领域，无需署名）。
"""
import json, math, sys

WIDTH, HEIGHT = 900, 360
# 视口最窄 180px，即最大放大 5 倍；容差按放大后仍不可见来取
TOLERANCE = 0.25
MIN_AREA = 0.6          # 投影后小于此面积(px²)的环丢弃，去掉碎点
DECIMALS = 2


def project(lon, lat):
    return ((lon + 180.0) / 360.0 * WIDTH, (90.0 - lat) / 180.0 * HEIGHT)


def perp_dist(p, a, b):
    if a == b:
        return math.hypot(p[0] - a[0], p[1] - a[1])
    dx, dy = b[0] - a[0], b[1] - a[1]
    t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)
    t = max(0.0, min(1.0, t))
    return math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy))


def simplify(pts, tol):
    """Douglas–Peucker，在投影后的像素空间里做，容差才有视觉意义。"""
    if len(pts) < 3:
        return pts
    stack, keep = [(0, len(pts) - 1)], {0, len(pts) - 1}
    while stack:
        lo, hi = stack.pop()
        far, far_d = -1, tol
        for i in range(lo + 1, hi):
            d = perp_dist(pts[i], pts[lo], pts[hi])
            if d > far_d:
                far, far_d = i, d
        if far != -1:
            keep.add(far)
            stack.append((lo, far))
            stack.append((far, hi))
    return [pts[i] for i in sorted(keep)]


def ring_area(pts):
    a = 0.0
    for i in range(len(pts)):
        x1, y1 = pts[i]
        x2, y2 = pts[(i + 1) % len(pts)]
        a += x1 * y2 - x2 * y1
    return abs(a) / 2.0


def rings_of(geom):
    t = geom["type"]
    if t == "Polygon":
        return list(geom["coordinates"])
    if t == "MultiPolygon":
        return [r for poly in geom["coordinates"] for r in poly]
    return []


def main():
    src = json.load(open("ne_110m_admin_0_countries.geojson"))
    parts, dropped_wrap, dropped_small, total = [], 0, 0, 0

    for feat in src["features"]:
        for ring in rings_of(feat.get("geometry") or {}):
            total += 1
            pts = [project(lon, lat) for lon, lat, *_ in ring]
            xs = [p[0] for p in pts]
            # 跨反子午线的环在等距圆柱下会横贯全图，丢掉（110m 数据里
            # 这类环本就极少，且都已在 ±180 处切开过）
            if max(xs) - min(xs) > WIDTH / 2:
                dropped_wrap += 1
                continue
            pts = simplify(pts, TOLERANCE)
            if len(pts) < 3 or ring_area(pts) < MIN_AREA:
                dropped_small += 1
                continue
            d = "M" + "L".join(f"{x:.{DECIMALS}f},{y:.{DECIMALS}f}" for x, y in pts) + "Z"
            parts.append(d)

    path = "".join(parts)
    ts = (
        "// Generated from Natural Earth 110m admin-0 countries (public domain).\n"
        "// Regenerate with scripts/build-worldmap.py; do not hand-edit.\n"
        "//\n"
        "// Coordinates are pre-projected into RouteMap's 900x360 equirectangular\n"
        "// space, so they line up with project() without any runtime maths.\n"
        f"export const WORLD_MAP_PATH =\n  '{path}';\n"
    )
    open("worldMap.ts", "w").write(ts)

    print(f"  环总数        {total}")
    print(f"  丢弃(跨经线)  {dropped_wrap}")
    print(f"  丢弃(过小)    {dropped_small}")
    print(f"  保留          {len(parts)}")
    print(f"  path 长度     {len(path):,} 字符")
    print(f"  TS 文件       {len(ts):,} 字节")


if __name__ == "__main__":
    main()

# Рисует поясняющие картинки для карточек (PNG, единый стиль). Файлы: build/media/mlai_<key>.png
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.patches import Circle, FancyArrowPatch, FancyBboxPatch, Rectangle

C = dict(teal="#2f6f5e", orange="#c4632b", blue="#3d63b8", purple="#9a4fa8", gray="#8a8984",
         light="#e7e5de", text="#1d1d1b", red="#c0392b", bg="#fbfaf7", tealsoft="#d6ebe3", orsoft="#f6dccd")
plt.rcParams.update({
    "font.family": "DejaVu Sans", "font.size": 13, "axes.titlesize": 14, "axes.titleweight": "bold",
    "axes.edgecolor": "#b9b7b0", "axes.labelcolor": C["text"], "text.color": C["text"],
    "xtick.color": "#77756f", "ytick.color": "#77756f", "axes.spines.top": False, "axes.spines.right": False,
    "figure.facecolor": C["bg"], "axes.facecolor": C["bg"], "savefig.facecolor": C["bg"],
})
rng = np.random.default_rng(7)
DRAW = {}


def fig_(w=6.4, h=3.6, **kw):
    return plt.subplots(figsize=(w, h), **kw)


def clean(ax):
    ax.set_xticks([]); ax.set_yticks([])


def blank(ax, xlim=(0, 10), ylim=(0, 6)):
    ax.set_xlim(*xlim); ax.set_ylim(*ylim); ax.axis("off")


def box(ax, x, y, w, h, text, fc=C["tealsoft"], ec=C["teal"], fs=12, color=None, weight="normal"):
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.02,rounding_size=0.25", fc=fc, ec=ec, lw=1.6))
    ax.text(x + w / 2, y + h / 2, text, ha="center", va="center", fontsize=fs, color=color or C["text"], weight=weight)


def arrow(ax, a, b, color=C["gray"], lw=2, style="-|>", rad=0.0, ls="-"):
    ax.add_patch(FancyArrowPatch(a, b, arrowstyle=style, mutation_scale=16, color=color, lw=lw,
                                 connectionstyle=f"arc3,rad={rad}", linestyle=ls))


def img(key):
    def deco(f):
        DRAW[key] = f
        return f
    return deco


# ---------- ML basics ----------

@img("fit")
def _fit():
    x = np.sort(rng.uniform(0, 1, 14)); y = np.sin(2 * np.pi * x) + rng.normal(0, 0.22, x.size)
    xs = np.linspace(0, 1, 300)
    fig, axs = fig_(9, 3.2, ncols=3)
    for ax, deg, title, col in zip(axs, [1, 3, 13], ["Underfitting", "Good fit", "Overfitting"], [C["orange"], C["teal"], C["red"]]):
        p = np.polynomial.Polynomial.fit(x, y, deg)
        ax.scatter(x, y, s=28, color=C["blue"], zorder=3)
        ax.plot(xs, np.clip(p(xs), -2.5, 2.5), color=col, lw=2.5)
        ax.set_ylim(-1.9, 1.9); clean(ax); ax.set_title(title, color=col)
    axs[0].set_xlabel("too simple"); axs[1].set_xlabel("captures the pattern"); axs[2].set_xlabel("memorizes the noise")
    return fig


@img("supervised")
def _sup():
    fig, axs = fig_(8, 3.4, ncols=2)
    a = rng.normal([2, 2], 0.6, (20, 2)); b = rng.normal([4, 4], 0.6, (20, 2))
    axs[0].scatter(*a.T, color=C["teal"], s=40, label="cat"); axs[0].scatter(*b.T, color=C["orange"], s=40, marker="^", label="dog")
    axs[0].legend(frameon=False, loc="upper left"); axs[0].set_title("Supervised: data + labels")
    pts = np.vstack([a, b]); axs[1].scatter(*pts.T, color=C["gray"], s=40)
    axs[1].text(3, 5.4, "?", fontsize=26, ha="center", color=C["purple"], weight="bold")
    axs[1].set_title("Unsupervised: data only")
    for ax in axs: clean(ax); ax.set_xlim(0, 6); ax.set_ylim(0, 6.3)
    return fig


@img("rl")
def _rl():
    fig, ax = fig_(7, 3.4); blank(ax)
    box(ax, 0.5, 2.2, 3, 1.6, "🤖  Agent".replace("🤖  ", ""), fs=15, weight="bold")
    box(ax, 6.5, 2.2, 3, 1.6, "Environment", fc=C["orsoft"], ec=C["orange"], fs=15, weight="bold")
    arrow(ax, (3.6, 3.6), (6.4, 3.6), C["teal"], rad=-0.25); ax.text(5, 4.75, "action", ha="center", color=C["teal"])
    arrow(ax, (6.4, 2.4), (3.6, 2.4), C["orange"], rad=-0.25); ax.text(5, 0.9, "new state + reward (+1 / −1)", ha="center", color=C["orange"])
    ax.text(5, 5.6, "learning by trial and error", ha="center", color=C["gray"], style="italic")
    return fig


@img("classification")
def _cls():
    fig, ax = fig_(5.6, 3.6)
    a = rng.normal([2.2, 2], 0.7, (30, 2)); b = rng.normal([4.2, 4], 0.7, (30, 2))
    xx, yy = np.meshgrid(np.linspace(0, 6.4, 200), np.linspace(0, 6, 200))
    ax.contourf(xx, yy, (xx + yy > 6.2).astype(int), levels=[-0.5, 0.5, 1.5], colors=[C["tealsoft"], C["orsoft"]], alpha=0.8)
    ax.plot([0.2, 6.2], [6, 0], color=C["text"], lw=2, ls="--")
    ax.scatter(*a.T, color=C["teal"], s=36, label="class A"); ax.scatter(*b.T, color=C["orange"], marker="^", s=40, label="class B")
    ax.annotate("decision\nboundary", (4.9, 1.3), (5.6, 2.7), ha="center", fontsize=12,
                arrowprops=dict(arrowstyle="->", color=C["text"]))
    ax.legend(frameon=False, loc="upper left"); clean(ax); ax.set_xlim(0, 6.4); ax.set_ylim(0, 6)
    ax.set_title("Which class does a new point belong to?")
    return fig


@img("regression")
def _reg():
    fig, ax = fig_(5.6, 3.6)
    x = rng.uniform(30, 120, 25); y = 2.1 * x + 40 + rng.normal(0, 22, x.size)
    k, b = np.polyfit(x, y, 1)
    for xi, yi in zip(x, y): ax.plot([xi, xi], [yi, k * xi + b], color=C["gray"], lw=1, alpha=0.6)
    ax.scatter(x, y, color=C["blue"], s=30, zorder=3)
    xs = np.array([25, 125]); ax.plot(xs, k * xs + b, color=C["teal"], lw=3)
    ax.set_xlabel("size, m²"); ax.set_ylabel("price, k$"); ax.set_title("Predict a number")
    return fig


@img("clustering")
def _clu():
    fig, ax = fig_(5.6, 3.6)
    for c, col in zip([(1.5, 1.5), (4.5, 2), (3, 4.5)], [C["teal"], C["orange"], C["purple"]]):
        p = rng.normal(c, 0.5, (25, 2)); ax.scatter(*p.T, color=col, s=30, alpha=0.85)
        ax.scatter(*c, marker="X", s=180, color=C["text"]); ax.add_patch(Circle(c, 1.15, fill=False, ec=col, lw=1.5, ls="--"))
    clean(ax); ax.set_xlim(0, 6.2); ax.set_ylim(0, 6.2); ax.set_title("Groups found without labels")
    return fig


@img("dimred")
def _dim():
    fig, ax = fig_(5.6, 3.6)
    t = rng.normal(0, 1.4, 40); pts = np.c_[t, 0.55 * t + rng.normal(0, 0.35, 40)]
    d = np.array([1, 0.55]) / np.hypot(1, 0.55); proj = np.outer(pts @ d, d)
    for p, q in zip(pts, proj): ax.plot([p[0], q[0]], [p[1], q[1]], color=C["gray"], lw=0.8, alpha=0.6)
    ax.plot([-4.5 * d[0], 4.5 * d[0]], [-4.5 * d[1], 4.5 * d[1]], color=C["teal"], lw=3)
    ax.scatter(*pts.T, color=C["blue"], s=26, zorder=3); ax.scatter(*proj.T, color=C["teal"], s=22, zorder=4)
    clean(ax); ax.set_xlabel("feature 1"); ax.set_ylabel("feature 2"); ax.set_title("2 features → 1 new feature (PCA)")
    ax.set_aspect("equal", adjustable="datalim")
    return fig


@img("outlier")
def _out():
    fig, ax = fig_(5.6, 3.6)
    x = rng.uniform(1, 5, 30); y = x + rng.normal(0, 0.4, 30)
    ax.scatter(x, y, color=C["blue"], s=30); ax.scatter([4.2], [0.6], color=C["red"], s=60, zorder=3)
    ax.add_patch(Circle((4.2, 0.6), 0.35, fill=False, ec=C["red"], lw=2))
    ax.annotate("outlier", (4.45, 0.75), (5.0, 2.2), color=C["red"], fontsize=14, weight="bold", arrowprops=dict(arrowstyle="->", color=C["red"]))
    clean(ax); ax.set_xlim(0, 6.2); ax.set_ylim(0, 6); ax.set_title("One point far from the rest")
    return fig


@img("split")
def _split():
    fig, ax = fig_(8, 2.6); blank(ax, (0, 100), (0, 4))
    parts = [(0, 60, "Training set", "the model learns here", C["teal"]), (60, 20, "Validation", "tune & choose", C["blue"]),
             (80, 20, "Test", "final check", C["orange"])]
    for x, w, name, sub, col in parts:
        ax.add_patch(Rectangle((x, 1.8), w, 1.4, fc=col, ec=C["bg"], lw=3))
        ax.text(x + w / 2, 2.5, f"{name}\n{w}%", ha="center", va="center", color="white", weight="bold", fontsize=12)
        ax.text(x + w / 2, 1.2, sub, ha="center", va="center", fontsize=11, color=col)
    ax.text(50, 3.7, "One dataset, three parts", ha="center", weight="bold", fontsize=14)
    return fig


@img("biasvar")
def _bv():
    fig, axs = fig_(6.2, 6.2, nrows=2, ncols=2)
    cases = [("Low bias\nlow variance", (0, 0), 0.25), ("Low bias\nhigh variance", (0, 0), 0.9),
             ("High bias\nlow variance", (1.1, 1.0), 0.25), ("High bias\nhigh variance", (1.1, 1.0), 0.9)]
    for ax, (t, c, s) in zip(axs.flat, cases):
        for r, col in zip([2.4, 1.6, 0.8], [C["light"], C["tealsoft"], C["orsoft"]]):
            ax.add_patch(Circle((0, 0), r, fc=col, ec="#c9c6bd"))
        p = rng.normal(c, s, (12, 2)); ax.scatter(*p.T, color=C["blue"], s=26, zorder=3)
        ax.set_xlim(-2.6, 2.6); ax.set_ylim(-2.6, 2.6); ax.set_aspect("equal"); ax.axis("off"); ax.set_title(t, fontsize=12)
    fig.suptitle("Bias = how far from the target · Variance = how scattered", fontsize=12, y=0.02)
    return fig


@img("leakage")
def _leak():
    fig, ax = fig_(7, 3.2); blank(ax)
    box(ax, 0.4, 1.6, 3.6, 2.2, "Training data", fs=14, weight="bold")
    box(ax, 6, 1.6, 3.6, 2.2, "Test data", fc=C["orsoft"], ec=C["orange"], fs=14, weight="bold")
    arrow(ax, (6, 3.2), (4.05, 3.2), C["red"], lw=3); ax.text(5.03, 3.55, "leak!", color=C["red"], ha="center", weight="bold", fontsize=14)
    ax.text(5, 0.7, "test score 99%… on real data 70%", ha="center", color=C["red"], fontsize=13)
    ax.text(5, 5.2, "Test information must never reach training", ha="center", color=C["gray"], style="italic")
    return fig


# ---------- Training ----------

@img("gd")
def _gd():
    fig, ax = fig_(5.6, 3.8)
    xx, yy = np.meshgrid(np.linspace(-5, 5, 200), np.linspace(-3, 3, 200))
    ax.contourf(xx, yy, xx ** 2 + 3 * yy ** 2, levels=14, cmap="YlGn_r", alpha=0.45)
    p = np.array([-4.5, 2.4]); path = [p.copy()]
    for _ in range(14):
        p = p - 0.13 * np.array([2 * p[0], 6 * p[1]]); path.append(p.copy())
    path = np.array(path); ax.plot(*path.T, "-o", color=C["orange"], ms=5, lw=2)
    ax.scatter([0], [0], marker="*", s=260, color=C["red"], zorder=4); ax.text(0.35, -0.85, "minimum", color=C["red"], weight="bold", bbox=dict(fc="white", ec="none", alpha=0.85, pad=1.5))
    ax.text(-4.6, 2.65, "start", color=C["orange"], weight="bold"); clean(ax)
    ax.set_title("Small steps downhill on the loss"); ax.set_xlabel("weight 1"); ax.set_ylabel("weight 2")
    return fig


@img("lr")
def _lr():
    fig, ax = fig_(5.8, 3.6)
    for lr, col, name in [(0.03, C["blue"], "too small: slow"), (0.3, C["teal"], "just right"), (1.04, C["red"], "too large: unstable")]:
        x, ls = 4.0, []
        for _ in range(25): ls.append(x * x); x -= lr * 2 * x
        ax.plot(ls, color=col, lw=2.5, label=name)
    ax.set_ylim(0, 22); ax.set_xlabel("training steps"); ax.set_ylabel("loss"); ax.legend(frameon=False)
    ax.set_title("Learning rate = step size")
    return fig


@img("losscurve")
def _loss():
    fig, ax = fig_(5.8, 3.6)
    e = np.arange(1, 41); tr = 2.2 * np.exp(-e / 8) + 0.15; va = 2.2 * np.exp(-e / 8) + 0.3 + 0.0009 * (e - 14) ** 2 * (e > 14)
    best = e[np.argmin(va)]
    ax.axvspan(best, 40, color=C["orsoft"], alpha=0.6); ax.text(30, 1.15, "overfitting\nzone", ha="center", color=C["orange"], weight="bold")
    ax.plot(e, tr, color=C["teal"], lw=2.5, label="training loss"); ax.plot(e, va, color=C["orange"], lw=2.5, label="validation loss")
    ax.axvline(best, color=C["text"], ls="--", lw=1.5); ax.text(best + 0.5, 0.05, "early stopping", fontsize=11)
    ax.set_xlabel("epochs"); ax.set_ylabel("loss"); ax.legend(frameon=False, loc="upper right"); ax.set_ylim(0, 2.6)
    return fig


@img("batches")
def _batch():
    fig, ax = fig_(8, 2.8); blank(ax, (0, 10), (0, 4))
    for i in range(8):
        ax.add_patch(FancyBboxPatch((0.3 + i * 1.18, 1.6), 1.0, 1.0, boxstyle="round,pad=0.02,rounding_size=0.12",
                                    fc=C["teal"] if i == 2 else C["tealsoft"], ec=C["teal"]))
        for k in range(4):
            ax.add_patch(Circle((0.55 + i * 1.18 + (k % 2) * 0.5, 1.85 + (k // 2) * 0.5), 0.11, color=C["bg"] if i == 2 else C["teal"]))
    ax.text(0.8 + 2 * 1.18, 3.0, "1 batch", ha="center", color=C["teal"], weight="bold")
    ax.annotate("", (9.6, 1.1), (0.3, 1.1), arrowprops=dict(arrowstyle="<->", color=C["orange"], lw=2))
    ax.text(5, 0.5, "1 epoch = the model has seen every batch once", ha="center", color=C["orange"], weight="bold")
    return fig


@img("cv")
def _cv():
    fig, ax = fig_(6.6, 3.4); blank(ax, (0, 10), (0, 6.4))
    for r in range(5):
        for c in range(5):
            test = r == c
            ax.add_patch(Rectangle((1.6 + c * 1.6, 4.8 - r * 1.05), 1.5, 0.9, fc=C["orange"] if test else C["tealsoft"], ec=C["bg"], lw=2))
        ax.text(0.8, 5.25 - r * 1.05, f"run {r + 1}", ha="center", va="center", fontsize=12)
    ax.text(5.5, 6.05, "5-fold cross-validation", ha="center", weight="bold")
    ax.add_patch(Rectangle((2, -0.15), 0.4, 0.3, fc=C["tealsoft"])); ax.text(2.55, 0, "train", va="center", fontsize=11)
    ax.add_patch(Rectangle((4.2, -0.15), 0.4, 0.3, fc=C["orange"])); ax.text(4.75, 0, "test", va="center", fontsize=11)
    ax.set_ylim(-0.4, 6.4)
    return fig


@img("transfer")
def _transfer():
    fig, ax = fig_(8, 3); blank(ax, (0, 10), (0, 4))
    box(ax, 0.2, 1.2, 3.2, 1.8, "Pre-trained model\n(huge general data)", fs=12, weight="bold")
    box(ax, 4.1, 1.5, 2.2, 1.2, "Fine-tuning\n(your small data)", fc=C["orsoft"], ec=C["orange"], fs=11)
    box(ax, 7.0, 1.2, 2.8, 1.8, "Specialized model\n(e.g. medical texts)", fc="#dfe6f6", ec=C["blue"], fs=12, weight="bold")
    arrow(ax, (3.45, 2.1), (4.05, 2.1)); arrow(ax, (6.35, 2.1), (6.95, 2.1))
    ax.text(5, 3.6, "Transfer learning: reuse knowledge, learn the rest", ha="center", color=C["gray"], style="italic")
    return fig


@img("scaling")
def _scale():
    fig, ax = fig_(5.8, 3.6)
    c = np.logspace(0, 6, 12); loss = 4.5 * c ** -0.08
    ax.loglog(c, loss, "o-", color=C["purple"], lw=2.5); ax.set_xlabel("compute (data × parameters), log scale")
    ax.set_ylabel("loss, log scale"); ax.set_title("Bigger models → predictably lower loss")
    ax.minorticks_off(); ax.set_xticks([]); ax.set_yticks([])
    return fig


# ---------- Evaluation ----------

def _matrix(ax, highlight=None):
    vals = [["TP\n85", "FN\n15"], ["FP\n10", "TN\n890"]]
    colors = [[C["tealsoft"], C["orsoft"]], [C["orsoft"], C["tealsoft"]]]
    for r in range(2):
        for c in range(2):
            on = highlight is None or (highlight == "col" and c == 0) or (highlight == "row" and r == 0)
            ax.add_patch(Rectangle((c, 1 - r), 1, 1, fc=colors[r][c] if on else C["light"], ec=C["bg"], lw=4))
            ax.text(c + 0.5, 1.5 - r, vals[r][c], ha="center", va="center", fontsize=14, weight="bold",
                    color=C["text"] if on else "#b5b3ac")
    ax.set_xlim(-0.6, 2); ax.set_ylim(0, 2.45); ax.axis("off")
    ax.text(0.5, 2.1, "pred +", ha="center", fontsize=11); ax.text(1.5, 2.1, "pred −", ha="center", fontsize=11)
    ax.text(-0.3, 1.5, "real +", ha="center", va="center", rotation=90, fontsize=11)
    ax.text(-0.3, 0.5, "real −", ha="center", va="center", rotation=90, fontsize=11)


@img("cm")
def _cm():
    fig, ax = fig_(4.6, 4.2); _matrix(ax)
    ax.set_title("Confusion matrix")
    ax.text(0.95, -0.25, "FP = false alarm · FN = missed case", ha="center", fontsize=11, color=C["gray"])
    ax.set_ylim(-0.45, 2.45)
    return fig


@img("prec")
def _prec():
    fig, axs = fig_(8, 3.8, ncols=2)
    _matrix(axs[0], "col"); axs[0].set_title("Precision = TP / (TP + FP)\n“are my alarms real?”", fontsize=12)
    _matrix(axs[1], "row"); axs[1].set_title("Recall = TP / (TP + FN)\n“did I find them all?”", fontsize=12)
    return fig


@img("roc")
def _roc():
    fig, ax = fig_(4.6, 4.2)
    f = np.linspace(0, 1, 200); t = 1 - (1 - f) ** 4
    ax.fill_between(f, t, color=C["tealsoft"]); ax.plot(f, t, color=C["teal"], lw=3, label="model (AUC ≈ 0.8)")
    ax.plot([0, 1], [0, 1], ls="--", color=C["gray"], label="random guess")
    ax.scatter([0.15], [1 - 0.85 ** 4], color=C["orange"], s=70, zorder=3)
    ax.annotate("one threshold", (0.15, 0.48), (0.35, 0.25), color=C["orange"], arrowprops=dict(arrowstyle="->", color=C["orange"]))
    ax.set_xlabel("false positive rate"); ax.set_ylabel("true positive rate"); ax.legend(frameon=False, loc="lower right", fontsize=11)
    ax.set_xlim(0, 1); ax.set_ylim(0, 1.02)
    return fig


# ---------- Deep learning ----------

def _net(ax, sizes=(3, 4, 4, 2), dropped=(), backprop=False):
    xs = np.linspace(1, 9, len(sizes)); pos = []
    for x, n in zip(xs, sizes):
        ys = np.linspace(3 - (n - 1) * 0.65, 3 + (n - 1) * 0.65, n); pos.append([(x, y) for y in ys])
    for li in range(len(pos) - 1):
        for i, a in enumerate(pos[li]):
            for j, b in enumerate(pos[li + 1]):
                off = (li, i) in dropped or (li + 1, j) in dropped
                ax.plot([a[0], b[0]], [a[1], b[1]], color="#d9d6ce" if off else "#a9c9bd", lw=1, zorder=1)
    cols = [C["blue"]] + [C["teal"]] * (len(sizes) - 2) + [C["orange"]]
    for li, layer in enumerate(pos):
        for i, (x, y) in enumerate(layer):
            off = (li, i) in dropped
            ax.add_patch(Circle((x, y), 0.28, fc="#e3e1da" if off else cols[li], ec="white", lw=2, zorder=2))
            if off: ax.text(x, y, "×", ha="center", va="center", color=C["red"], fontsize=16, weight="bold", zorder=3)
    blank(ax, (0, 10), (0, 6.2))
    names = ["input"] + ["hidden"] * (len(sizes) - 2) + ["output"]
    for x, n in zip(xs, names): ax.text(x, 0.35, n, ha="center", fontsize=11, color=C["gray"])
    if backprop:
        arrow(ax, (9, 5.6), (1, 5.6), C["red"], lw=2, ls="--"); ax.text(5, 5.85, "backpropagation: error flows back", ha="center", color=C["red"], fontsize=11)


@img("nn")
def _nn():
    fig, ax = fig_(6.4, 3.8); _net(ax, backprop=True)
    ax.text(5, -0.35, "each line = a weight the network learns", ha="center", fontsize=11, color=C["teal"]); ax.set_ylim(-0.6, 6.3)
    return fig


@img("dropout")
def _drop():
    fig, ax = fig_(6.4, 3.6); _net(ax, dropped={(1, 1), (1, 3), (2, 0), (2, 2)})
    ax.text(5, 5.7, "Dropout: random neurons switched off during training", ha="center", fontsize=12, weight="bold")
    return fig


@img("act")
def _act():
    fig, axs = fig_(8, 3.2, ncols=2); x = np.linspace(-5, 5, 300)
    axs[0].plot(x, np.maximum(0, x), color=C["teal"], lw=3); axs[0].set_title("ReLU: max(0, x)")
    axs[1].plot(x, 1 / (1 + np.exp(-x)), color=C["purple"], lw=3); axs[1].set_title("Sigmoid: squashes to 0…1")
    for ax in axs: ax.axhline(0, color="#ccc", lw=1); ax.axvline(0, color="#ccc", lw=1)
    return fig


@img("vanish")
def _van():
    fig, ax = fig_(6, 3.4)
    layers = np.arange(1, 11); g = 0.55 ** (10 - layers)
    ax.bar(layers, g, color=[C["orsoft"]] * 4 + [C["tealsoft"]] * 3 + [C["teal"]] * 3, ec=C["teal"])
    ax.set_xticks(layers); ax.set_xlabel("layer (1 = closest to input)"); ax.set_ylabel("gradient size")
    ax.set_title("Signal fades in early layers"); ax.text(2.5, 0.25, "barely\nlearning", ha="center", color=C["orange"], weight="bold")
    return fig


@img("conv")
def _conv():
    fig, ax = fig_(7, 3.6); blank(ax, (0, 12), (0, 6.6))
    for i in range(6):
        for j in range(6):
            inside = 1 <= i <= 3 and 1 <= j <= 3
            ax.add_patch(Rectangle((0.5 + j * 0.85, 5.6 - (i + 1) * 0.85), 0.85, 0.85, fc=C["tealsoft"] if inside else C["light"], ec="white", lw=1.5))
    ax.add_patch(Rectangle((0.5 + 0.85, 5.6 - 4 * 0.85), 2.55, 2.55, fill=False, ec=C["teal"], lw=3))
    ax.text(3.05, 0.25, "image + 3×3 filter", ha="center", fontsize=11)
    for i in range(4):
        for j in range(4):
            on = i == 1 and j == 1
            ax.add_patch(Rectangle((8 + j * 0.85, 5.0 - (i + 1) * 0.85), 0.85, 0.85, fc=C["teal"] if on else C["light"], ec="white", lw=1.5))
    ax.text(9.7, 0.85, "feature map", ha="center", fontsize=11)
    arrow(ax, (3.95, 3.3), (8.75, 3.35), C["teal"], rad=-0.2)
    ax.text(6.4, 4.6, "slide & multiply", ha="center", color=C["teal"], fontsize=11)
    return fig


@img("emb")
def _emb():
    fig, ax = fig_(5.8, 4)
    words = {"man": (1, 1), "woman": (1.4, 3.2), "king": (4, 1.4), "queen": (4.4, 3.6),
             "Paris": (7.2, 0.8), "France": (8.4, 2.0), "Berlin": (6.9, 3.2), "Germany": (8.1, 4.4)}
    for w, (x, y) in words.items():
        col = C["purple"] if w[0].isupper() else C["teal"]
        ax.scatter(x, y, color=col, s=60, zorder=3); ax.text(x + 0.15, y + 0.15, w, fontsize=12, color=col, weight="bold")
    for a, b in [("man", "woman"), ("king", "queen")]: arrow(ax, words[a], words[b], C["orange"], lw=2)
    for a, b in [("Paris", "France"), ("Berlin", "Germany")]: arrow(ax, words[a], words[b], C["blue"], lw=2)
    clean(ax); ax.set_xlim(0, 10); ax.set_ylim(0, 5.2); ax.set_title("Similar meanings → nearby points")
    return fig


@img("attn")
def _attn():
    fig, ax = fig_(8.6, 2.6); blank(ax, (0, 10), (0, 3))
    toks = ["The", "animal", "didn't", "cross", "the", "street", "because", "it", "was", "tired"]
    w = [0.05, 0.85, 0.05, 0.1, 0.03, 0.25, 0.05, 0.4, 0.05, 0.3]
    x = 0.15
    for t, a in zip(toks, w):
        wd = 0.25 + 0.115 * len(t)
        ax.add_patch(FancyBboxPatch((x, 1.0), wd, 0.8, boxstyle="round,pad=0.02,rounding_size=0.12",
                                    fc=matplotlib.colors.to_rgba(C["orange"], a), ec=C["orange"] if t == "it" else "none", lw=2))
        ax.text(x + wd / 2, 1.4, t, ha="center", va="center", fontsize=12, weight="bold" if t in ("it", "animal") else "normal")
        x += wd + 0.08
    ax.text(5, 2.45, "When reading “it”, the model attends most to “animal”", ha="center", fontsize=12)
    ax.text(5, 0.45, "darker = more attention", ha="center", fontsize=11, color=C["gray"])
    return fig


@img("transformer")
def _tr():
    fig, ax = fig_(8, 3.2); blank(ax, (0, 10), (0, 4.4))
    ax.text(0.9, 2.2, "“Я люблю\nмашинное\nобучение”", ha="center", va="center", fontsize=11)
    box(ax, 2.1, 1.0, 2.4, 2.4, "Encoder\n\nreads &\nunderstands", fs=12, weight="bold")
    box(ax, 5.5, 1.0, 2.4, 2.4, "Decoder\n\nwrites the\noutput", fc=C["orsoft"], ec=C["orange"], fs=12, weight="bold")
    ax.text(9.1, 2.2, "“I love\nmachine\nlearning”", ha="center", va="center", fontsize=11)
    arrow(ax, (1.75, 2.2), (2.05, 2.2)); arrow(ax, (4.55, 2.2), (5.45, 2.2), C["teal"], lw=3); arrow(ax, (7.95, 2.2), (8.35, 2.2))
    ax.text(5, 3.95, "Transformer (attention inside both blocks)", ha="center", color=C["gray"], style="italic")
    return fig


@img("blackbox")
def _bb():
    fig, ax = fig_(7, 2.8); blank(ax, (0, 10), (0, 4))
    ax.text(1, 2, "input\n📷".replace("\n📷", "\n(photo)"), ha="center", va="center", fontsize=12)
    ax.add_patch(FancyBboxPatch((3.3, 0.8), 3.4, 2.4, boxstyle="round,pad=0.02,rounding_size=0.3", fc=C["text"], ec=C["text"]))
    ax.text(5, 2, "?", ha="center", va="center", fontsize=40, color="white", weight="bold")
    ax.text(9, 2, "output\n“cat, 97%”", ha="center", va="center", fontsize=12)
    arrow(ax, (1.9, 2), (3.25, 2)); arrow(ax, (6.75, 2), (8.0, 2))
    ax.text(5, 3.65, "We see what goes in and out — but not why", ha="center", color=C["gray"], style="italic")
    return fig


# ---------- LLMs ----------

@img("tokens")
def _tok():
    fig, ax = fig_(8.6, 2.4); blank(ax, (0, 10), (0, 3))
    toks = ["Un", "believ", "ably", ",", " transform", "ers", " token", "ize", " text", "."]
    cols = [C["tealsoft"], C["orsoft"], "#dfe6f6", "#ece0f0"]
    x = 0.2
    for i, t in enumerate(toks):
        wd = 0.3 + 0.13 * len(t.strip())
        ax.add_patch(FancyBboxPatch((x, 1.2), wd, 0.8, boxstyle="round,pad=0.02,rounding_size=0.1", fc=cols[i % 4], ec="none"))
        ax.text(x + wd / 2, 1.6, t.strip() or "␣", ha="center", va="center", fontsize=13)
        ax.text(x + wd / 2, 0.85, str([843, 7412, 2645, 11, 5276, 364, 4037, 553, 1495, 13][i]), ha="center", fontsize=9, color=C["gray"])
        x += wd + 0.06
    ax.text(5, 2.5, "Text → tokens → numbers (token IDs)", ha="center", fontsize=12, weight="bold")
    return fig


@img("context")
def _ctx():
    fig, ax = fig_(8.6, 2.4); blank(ax, (0, 10), (0, 3))
    for i in range(24):
        inside = i >= 10
        ax.add_patch(Rectangle((0.2 + i * 0.4, 1.1), 0.34, 0.6, fc=C["teal"] if inside else C["light"], ec="none"))
    ax.annotate("", (9.75, 2.05), (4.2, 2.05), arrowprops=dict(arrowstyle="<->", color=C["teal"], lw=2))
    ax.text(7, 2.35, "context window: what the model can “see”", ha="center", color=C["teal"], fontsize=12, weight="bold")
    ax.text(2.1, 0.6, "older text — out of the window", ha="center", fontsize=11, color=C["gray"])
    return fig


@img("fewshot")
def _few():
    fig, axs = fig_(8.6, 3.0, ncols=2)
    for ax in axs: blank(ax, (0, 10), (0, 6))
    box(axs[0], 0.3, 1.2, 9.4, 3.6, "Translate to French:\n\ncheese → ?", fc="white", ec=C["gray"], fs=13)
    axs[0].set_title("Zero-shot", color=C["teal"])
    box(axs[1], 0.3, 0.4, 9.4, 5.0, "Translate to French:\nsea otter → loutre de mer\nplush toy → peluche\ncheese → ?", fc="white", ec=C["gray"], fs=13)
    axs[1].set_title("Few-shot (examples in the prompt)", color=C["orange"])
    return fig


@img("temp")
def _temp():
    fig, axs = fig_(8.6, 3.3, ncols=2)
    words = ["mat", "sofa", "floor", "roof", "moon"]; logits = np.array([3.0, 1.8, 1.5, 0.6, -0.5])
    for ax, t, col in zip(axs, [0.3, 1.6], [C["teal"], C["orange"]]):
        p = np.exp(logits / t); p /= p.sum()
        ax.bar(words, p, color=col); ax.set_ylim(0, 1); ax.set_title(f"temperature {t}: " + ("safe & predictable" if t < 1 else "varied & creative"), fontsize=12)
        ax.set_yticks([0, 0.5, 1]); ax.set_yticklabels(["0", "50%", "100%"])
    fig.suptitle("“The cat sat on the …” — next-token probabilities", fontsize=12, y=1.02)
    return fig


@img("rag")
def _rag():
    fig, ax = fig_(9, 2.8); blank(ax, (0, 12), (0, 4))
    steps = [("Question", "white", C["gray"]), ("Search\nyour docs", C["tealsoft"], C["teal"]), ("Relevant\npassages", "#dfe6f6", C["blue"]),
             ("LLM", C["orsoft"], C["orange"]), ("Answer with\nsources", "white", C["gray"])]
    for i, (t, fc, ec) in enumerate(steps):
        box(ax, 0.2 + i * 2.4, 1.2, 2.0, 1.6, t, fc=fc, ec=ec, fs=12, weight="bold")
        if i: arrow(ax, (0.2 + i * 2.4 - 0.38, 2.0), (0.2 + i * 2.4 - 0.02, 2.0))
    ax.text(6, 3.5, "RAG: retrieve first, then generate", ha="center", color=C["gray"], style="italic")
    return fig


@img("tradeoff")
def _trade():
    fig, ax = fig_(5.8, 3.6)
    lat = np.array([20, 45, 90, 180, 400]); acc = np.array([71, 79, 84, 87, 88.5])
    ax.plot(lat, acc, "o-", color=C["purple"], lw=2.5, ms=8)
    for l, a, n in zip(lat, acc, ["tiny", "small", "medium", "large", "huge"]): ax.text(l, a - 2.2, n, ha="center", fontsize=11)
    ax.set_xlabel("latency, ms (slower →)"); ax.set_ylabel("accuracy, %"); ax.set_ylim(65, 92)
    ax.set_title("More accuracy comes at the cost of speed")
    return fig


def render_all(out: Path):
    out.mkdir(parents=True, exist_ok=True)
    files = {}
    for key, draw in DRAW.items():
        fig = draw()
        path = out / f"mlai_{key}.png"
        fig.savefig(path, dpi=110, bbox_inches="tight", pad_inches=0.18)
        plt.close(fig)
        files[key] = path
    return files


if __name__ == "__main__":
    print(len(render_all(Path(__file__).parent / "build" / "media")), "images")

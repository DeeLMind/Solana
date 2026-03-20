import re
import shutil
import subprocess
from pathlib import Path


ROOT = Path("/Users/deelmind/Documents/Solana")
COOKBOOK_DIR = ROOT / "Cookbook"
INDEX_URL = "https://solana.com/developers/cookbook"
RAW_BASE = "https://raw.githubusercontent.com/solana-foundation/solana-com/main/"


def fetch(url: str) -> str:
    return subprocess.check_output(
        ["curl", "-L", "--silent", "--fail", url],
        text=True,
    )


def slugify(value: str) -> str:
    value = re.sub(r"<[^>]+>", "", value)
    value = re.sub(r"&[^;]+;", " ", value)
    value = re.sub(r"[^A-Za-z0-9]+", "-", value)
    value = re.sub(r"-{2,}", "-", value).strip("-")
    return value.lower() or "snippet"


def get_article_urls(index_html: str) -> list[str]:
    urls = sorted(set(re.findall(r"/developers/cookbook/[A-Za-z0-9_/-]+", index_html)))
    return [url for url in urls if "layout-" not in url]


def get_raw_source_url(article_url: str) -> str:
    path_part = article_url.replace("/developers/cookbook/", "")
    guessed = f"{RAW_BASE}apps/docs/content/cookbook/{path_part}.mdx"

    try:
        fetch(guessed)
        return guessed
    except subprocess.CalledProcessError:
        page_html = fetch(f"https://solana.com{article_url}")

        direct = re.findall(
            r'https://github\.com/solana-foundation/solana-com/blob/main/[^"\'\\\s<]+',
            page_html,
        )
        if direct:
            return direct[-1].replace(
                "https://github.com/solana-foundation/solana-com/blob/main/",
                RAW_BASE,
            )

        escaped = re.findall(
            r'https:\\/\\/github\.com\\/solana-foundation\\/solana-com\\/blob\\/main\\/[^"\'\\<]+',
            page_html,
        )
        if escaped:
            return escaped[-1].replace("\\/", "/").replace(
                "https://github.com/solana-foundation/solana-com/blob/main/",
                RAW_BASE,
            )

        raise RuntimeError(f"Unable to resolve source for {article_url}")


def parse_blocks(mdx: str) -> list[dict[str, str]]:
    lines = mdx.splitlines()
    blocks = []
    current_section = "intro"
    i = 0

    while i < len(lines):
        heading = re.match(r"^(##+)\s+(.+)$", lines[i])
        if heading:
            current_section = slugify(heading.group(2))
            i += 1
            continue

        fence = re.match(r"^```([A-Za-z0-9_+#-]+)(.*)$", lines[i])
        if not fence:
            i += 1
            continue

        lang = fence.group(1).lower()
        meta = fence.group(2) or ""
        title_match = re.search(r'title="([^"]+)"', meta)
        title = title_match.group(1) if title_match else None
        code = []
        i += 1

        while i < len(lines) and not lines[i].startswith("```"):
            code.append(lines[i])
            i += 1

        blocks.append(
            {
                "lang": lang,
                "title": title or lang,
                "section": current_section,
                "code": "\n".join(code).strip() + "\n",
            }
        )

        while i < len(lines) and not lines[i].startswith("```"):
            i += 1
        i += 1

    return [block for block in blocks if block["code"].strip()]


def target_ext(lang: str) -> str | None:
    if lang in {"ts", "js", "typescript", "javascript"}:
        return "js"
    if lang in {"tsx", "jsx"}:
        return "jsx"
    return None


def reset_cookbook_dir() -> None:
    if COOKBOOK_DIR.exists():
        for entry in COOKBOOK_DIR.iterdir():
            if entry.is_dir():
                shutil.rmtree(entry)
            else:
                entry.unlink()
    else:
        COOKBOOK_DIR.mkdir(parents=True)


def main() -> None:
    reset_cookbook_dir()

    summary = []
    index_html = fetch(INDEX_URL)

    for article_url in get_article_urls(index_html):
        try:
            raw_url = get_raw_source_url(article_url)
        except RuntimeError:
            continue
        mdx = fetch(raw_url)
        blocks = [block for block in parse_blocks(mdx) if target_ext(block["lang"])]

        if not blocks:
            continue

        article_path = article_url.replace("/developers/cookbook/", "")
        article_dir = COOKBOOK_DIR / article_path
        article_dir.mkdir(parents=True, exist_ok=True)

        for n, block in enumerate(blocks, 1):
            file_name = (
                f"{n:02d}_{block['section']}__{slugify(block['title'])}."
                f"{target_ext(block['lang'])}"
            )
            (article_dir / file_name).write_text(block["code"])

        summary.append((article_path, len(blocks)))

    for article, count in summary:
        print(f"{count:02d} {article}")


if __name__ == "__main__":
    main()

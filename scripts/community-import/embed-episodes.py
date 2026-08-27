#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "sentence-transformers==5.3.0",
# ]
# ///
"""Create local semantic embeddings and reviewable neighbour candidates.

The script deliberately runs SentenceTransformers with ``local_files_only=True``:
it never sends episode text to a provider and cannot silently download a model.
Run it with ``uv run scripts/community-import/embed-episodes.py ...`` after the
chosen model snapshot has been placed in the Hugging Face cache.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
import sys
import tempfile
from pathlib import Path
from typing import Any, Iterable


DEFAULT_MODEL = "intfloat/multilingual-e5-small"
DEFAULT_REVISION = "614241f622f53c4eeff9890bdc4f31cfecc418b3"
# qe.v1 deliberately has no generic ``question``/``body`` field.  Keeping the
# canonical bilingual fields as the default prevents embedding an accidental
# metadata or legacy field when the CLI is invoked without extra options.
DEFAULT_TEXT_FIELDS = ("canonical_question_zh", "canonical_question_en")


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def normalise_text(value: str) -> str:
    return " ".join(value.strip().split())


def parse_jsonl(path: Path, id_field: str, text_fields: tuple[str, ...]) -> list[dict[str, str]]:
    episodes: list[dict[str, str]] = []
    identifiers: set[str] = set()
    for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        if not line.strip():
            continue
        try:
            row = json.loads(line)
        except json.JSONDecodeError as error:
            raise ValueError(f"{path}:{number}: invalid JSON: {error.msg}") from error
        if not isinstance(row, dict):
            raise ValueError(f"{path}:{number}: expected a JSON object")
        episode_id = row.get(id_field)
        if not isinstance(episode_id, str) or not episode_id.strip():
            raise ValueError(f"{path}:{number}: {id_field!r} must be a non-empty string")
        episode_id = episode_id.strip()
        if episode_id in identifiers:
            raise ValueError(f"{path}:{number}: duplicate {id_field!r}: {episode_id}")
        text = "\n".join(
            normalise_text(row[field])
            for field in text_fields
            if isinstance(row.get(field), str) and normalise_text(row[field])
        )
        if not text:
            raise ValueError(
                f"{path}:{number}: no text in any of {', '.join(text_fields)}"
            )
        identifiers.add(episode_id)
        episodes.append({"episode_id": episode_id, "text": text})
    if not episodes:
        raise ValueError(f"{path}: no episodes found")
    return episodes


def l2_normalise(vector: Iterable[float]) -> list[float]:
    values = [float(value) for value in vector]
    magnitude = math.sqrt(sum(value * value for value in values))
    if magnitude == 0:
        raise ValueError("model returned a zero embedding")
    return [value / magnitude for value in values]


def build_neighbours(episodes: list[dict[str, str]], embeddings: list[list[float]], top_k: int) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    if len(episodes) != len(embeddings):
        raise ValueError("episode and embedding counts differ")
    if not embeddings:
        return [], []
    dimensions = len(embeddings[0])
    if dimensions == 0 or any(len(vector) != dimensions for vector in embeddings):
        raise ValueError("embeddings must have one non-zero shared dimension")

    candidate_scores: dict[tuple[str, str], float] = {}
    per_episode: list[dict[str, Any]] = []
    for left_index, left in enumerate(episodes):
        ranked: list[tuple[float, str]] = []
        for right_index, right in enumerate(episodes):
            if left_index == right_index:
                continue
            score = sum(a * b for a, b in zip(embeddings[left_index], embeddings[right_index]))
            ranked.append((score, right["episode_id"]))
        ranked.sort(key=lambda item: (-item[0], item[1]))
        selected = ranked[:top_k]
        per_episode.append(
            {
                "episode_id": left["episode_id"],
                "neighbours": [
                    {"episode_id": episode_id, "cosine_similarity": round(score, 8)}
                    for score, episode_id in selected
                ],
            }
        )
        # Candidate pairs are the undirected union of each episode's retrieved
        # Top-K neighbours, rather than every possible corpus pair.
        for score, neighbour_id in selected:
            pair = tuple(sorted((left["episode_id"], neighbour_id)))
            candidate_scores[pair] = score
    candidates = [
        {
            "left_episode_id": left_id,
            "right_episode_id": right_id,
            "cosine_similarity": round(score, 8),
        }
        for (left_id, right_id), score in candidate_scores.items()
    ]
    candidates.sort(key=lambda item: (-item["cosine_similarity"], item["left_episode_id"], item["right_episode_id"]))
    return per_episode, candidates


def local_encode(model_name: str, revision: str, texts: list[str], batch_size: int) -> tuple[list[list[float]], int]:
    try:
        from sentence_transformers import SentenceTransformer
    except ImportError as error:
        raise RuntimeError("Missing dependency. Run this file with `uv run`, not plain python.") from error
    # multilingual-e5 requires a role prefix; every episode is a corpus passage
    # because the operation is symmetric episode-to-episode clustering.
    encoded_texts = [f"passage: {text}" for text in texts]
    try:
        model = SentenceTransformer(model_name, revision=revision, local_files_only=True)
    except Exception as error:  # SentenceTransformers wraps several cache errors.
        raise RuntimeError(
            "Model is not available locally. This script is offline-only; download the pinned "
            "snapshot explicitly with `hf download intfloat/multilingual-e5-small "
            "--revision 614241f622f53c4eeff9890bdc4f31cfecc418b3` and rerun."
        ) from error
    raw_vectors = model.encode(encoded_texts, batch_size=batch_size, normalize_embeddings=True, show_progress_bar=True)
    vectors = [[float(value) for value in vector] for vector in raw_vectors]
    return vectors, len(vectors[0])


def write_jsonl(path: Path, rows: Iterable[dict[str, Any]]) -> None:
    with path.open("w", encoding="utf-8") as output:
        for row in rows:
            output.write(json.dumps(row, ensure_ascii=False, separators=(",", ":"), allow_nan=False))
            output.write("\n")


def create_embedding_run(input_path: Path, output_path: Path, model_name: str, revision: str, id_field: str, text_fields: tuple[str, ...], top_k: int, batch_size: int) -> dict[str, Any]:
    if output_path.exists():
        raise FileExistsError(f"Refusing to overwrite existing output directory: {output_path}")
    raw_input = input_path.read_bytes()
    episodes = parse_jsonl(input_path, id_field, text_fields)
    embeddings, dimensions = local_encode(model_name, revision, [episode["text"] for episode in episodes], batch_size)
    embeddings = [l2_normalise(vector) for vector in embeddings]
    neighbours, candidates = build_neighbours(episodes, embeddings, top_k)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    temporary = Path(tempfile.mkdtemp(prefix=f".{output_path.name}.tmp-", dir=output_path.parent))
    try:
        embedding_rows = [
            {
                "episode_id": episode["episode_id"],
                "text_sha256": sha256_bytes(episode["text"].encode("utf-8")),
                "embedding": vector,
            }
            for episode, vector in zip(episodes, embeddings)
        ]
        write_jsonl(temporary / "embeddings.jsonl", embedding_rows)
        write_jsonl(temporary / "neighbours.jsonl", neighbours)
        write_jsonl(temporary / "candidate-pairs.jsonl", candidates)
        manifest = {
            "schema_version": 1,
            "deterministic_manifest": True,
            "input": {"path": str(input_path.resolve()), "sha256": sha256_bytes(raw_input), "episode_count": len(episodes), "id_field": id_field, "text_fields": list(text_fields)},
            "embedding": {"provider": "local_sentence_transformers", "network": "disabled", "model": model_name, "revision": revision, "dimensions": dimensions, "normalization": "L2", "text_prefix": "passage: ", "batch_size": batch_size},
            "neighbours": {
                "metric": "cosine_similarity",
                "top_k": top_k,
                "all_possible_pair_count": len(episodes) * (len(episodes) - 1) // 2,
                "retrieved_candidate_pair_count": len(candidates),
            },
            "files": ["embeddings.jsonl", "neighbours.jsonl", "candidate-pairs.jsonl"],
        }
        (temporary / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        os.replace(temporary, output_path)
        return manifest
    except Exception:
        for child in temporary.iterdir():
            child.unlink()
        temporary.rmdir()
        raise


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, type=Path, help="episodes.jsonl")
    parser.add_argument("--output", required=True, type=Path, help="new output directory")
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--revision", default=DEFAULT_REVISION)
    parser.add_argument("--id-field", default="episode_id")
    parser.add_argument("--text-fields", default=",".join(DEFAULT_TEXT_FIELDS), help="comma-separated JSON fields")
    parser.add_argument("--top-k", type=int, default=8)
    parser.add_argument("--batch-size", type=int, default=32)
    args = parser.parse_args(argv)
    if args.top_k < 1 or args.batch_size < 1:
        parser.error("--top-k and --batch-size must be positive")
    args.text_fields = tuple(field.strip() for field in args.text_fields.split(",") if field.strip())
    if not args.text_fields:
        parser.error("--text-fields must include at least one field")
    return args


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    manifest = create_embedding_run(args.input, args.output, args.model, args.revision, args.id_field, args.text_fields, args.top_k, args.batch_size)
    print(json.dumps({"output": str(args.output.resolve()), "episode_count": manifest["input"]["episode_count"], "dimensions": manifest["embedding"]["dimensions"]}))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main(sys.argv[1:]))
    except (ValueError, FileExistsError, RuntimeError) as error:
        print(f"error: {error}", file=sys.stderr)
        raise SystemExit(2)

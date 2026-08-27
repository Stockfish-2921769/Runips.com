import importlib.util
import json
from pathlib import Path
import unittest


SCRIPT = Path(__file__).with_name("embed-episodes.py")
SPEC = importlib.util.spec_from_file_location("embed_episodes", SCRIPT)
embed_episodes = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(embed_episodes)


class EmbeddingCandidatesTests(unittest.TestCase):
    def test_qe_v1_default_text_fields_embed_both_languages(self):
        from tempfile import TemporaryDirectory

        with TemporaryDirectory() as directory:
            input_path = Path(directory) / "episodes.jsonl"
            input_path.write_text(
                '{"episode_id":"qe-1","canonical_question_zh":"如何申请宿舍？",'
                '"canonical_question_en":"How do I apply for housing?"}\n',
                encoding="utf-8",
            )
            episodes = embed_episodes.parse_jsonl(
                input_path, "episode_id", embed_episodes.DEFAULT_TEXT_FIELDS
            )

        self.assertEqual(
            episodes[0]["text"], "如何申请宿舍？\nHow do I apply for housing?"
        )

    def test_qe_v1_default_text_fields_fail_closed_when_missing(self):
        from tempfile import TemporaryDirectory

        with TemporaryDirectory() as directory:
            input_path = Path(directory) / "episodes.jsonl"
            input_path.write_text(
                '{"episode_id":"qe-1","question":"legacy text"}\n',
                encoding="utf-8",
            )
            with self.assertRaisesRegex(ValueError, "canonical_question_zh"):
                embed_episodes.parse_jsonl(
                    input_path, "episode_id", embed_episodes.DEFAULT_TEXT_FIELDS
                )

    def test_neighbours_are_deterministic_and_exclude_self(self):
        episodes = [
            {"episode_id": "enrol", "text": "How do I enrol?"},
            {"episode_id": "registration", "text": "Course registration guidance"},
            {"episode_id": "housing", "text": "Where can I find housing?"},
        ]
        # Unit vectors stand in for local model output so the test needs no model
        # download or network access.
        vectors = [[1.0, 0.0], [0.8, 0.6], [0.0, 1.0]]
        neighbours, candidates = embed_episodes.build_neighbours(episodes, vectors, top_k=1)

        self.assertEqual(neighbours[0]["episode_id"], "enrol")
        self.assertEqual(neighbours[0]["neighbours"][0]["episode_id"], "registration")
        self.assertNotIn("enrol", [item["episode_id"] for item in neighbours[0]["neighbours"]])
        self.assertEqual(len(candidates), 2)
        self.assertEqual(candidates[0]["left_episode_id"], "enrol")
        self.assertEqual(candidates[0]["right_episode_id"], "registration")

    def test_parse_jsonl_rejects_duplicate_episode_ids(self):
        from tempfile import TemporaryDirectory

        with TemporaryDirectory() as directory:
            input_path = Path(directory) / "episodes.jsonl"
            input_path.write_text('{"episode_id":"a","title":"first"}\n{"episode_id":"a","title":"second"}\n', encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "duplicate"):
                embed_episodes.parse_jsonl(input_path, "episode_id", ("title",))

    def test_synthetic_fixture_writes_reproducibility_manifest(self):
        from tempfile import TemporaryDirectory

        with TemporaryDirectory() as directory:
            input_path = Path(directory) / "episodes.jsonl"
            output_path = Path(directory) / "embedding-output"
            input_path.write_text(
                '\n'.join(
                    [
                        '{"episode_id":"enrol","title":"How do I enrol?"}',
                        '{"episode_id":"registration","title":"Course registration"}',
                        '{"episode_id":"housing","title":"Campus housing"}',
                    ]
                )
                + '\n',
                encoding="utf-8",
            )
            original_encode = embed_episodes.local_encode
            embed_episodes.local_encode = lambda *_args: ([[1, 0], [0.8, 0.6], [0, 1]], 2)
            try:
                manifest = embed_episodes.create_embedding_run(
                    input_path, output_path, "fixture/model", "fixture-revision", "episode_id", ("title",), 1, 2
                )
            finally:
                embed_episodes.local_encode = original_encode

            self.assertEqual(manifest["embedding"]["dimensions"], 2)
            saved = json.loads((output_path / "manifest.json").read_text(encoding="utf-8"))
            self.assertEqual(saved["embedding"]["model"], "fixture/model")
            self.assertEqual(saved["embedding"]["normalization"], "L2")
            embeddings = (output_path / "embeddings.jsonl").read_text(encoding="utf-8").splitlines()
            self.assertEqual(len(embeddings), 3)
            candidates = (output_path / "candidate-pairs.jsonl").read_text(encoding="utf-8").splitlines()
            self.assertEqual(len(candidates), 2)
            self.assertEqual(saved["neighbours"]["all_possible_pair_count"], 3)
            self.assertEqual(saved["neighbours"]["retrieved_candidate_pair_count"], 2)


if __name__ == "__main__":
    unittest.main()

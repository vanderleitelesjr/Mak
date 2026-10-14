from __future__ import annotations

import hashlib
import importlib.util
import re
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MODULE_PATH = ROOT / "stage1_intake" / "run_vision_adapter.py"
SPEC = importlib.util.spec_from_file_location("run_vision_adapter", MODULE_PATH)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)
ADAPTER_SPEC = importlib.util.spec_from_file_location(
    "reference_vision", ROOT.parent / "integrations" / "vision" / "reference_vision.py"
)
assert ADAPTER_SPEC and ADAPTER_SPEC.loader
ADAPTER = importlib.util.module_from_spec(ADAPTER_SPEC)
ADAPTER_SPEC.loader.exec_module(ADAPTER)


class OptionalVisionToolingTests(unittest.TestCase):
    def test_bridge_keeps_optional_runtime_outside_forge(self) -> None:
        expected = ROOT.parent / "integrations" / "vision" / ".venv" / "bin" / "python"
        self.assertEqual(MODULE.resolve_python(None), expected)
        command = MODULE.build_command(expected, ["health"])
        self.assertEqual(command[0], str(expected))
        self.assertEqual(command[1], str(ROOT.parent / "integrations" / "vision" / "reference_vision.py"))
        self.assertEqual(command[-1], "health")

    def test_explicit_interpreter_override_is_resolved(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            candidate = Path(directory) / "python"
            self.assertEqual(MODULE.resolve_python(str(candidate)), candidate.resolve())

    def test_documentation_preserves_evidence_boundaries(self) -> None:
        documentation = (ROOT.parent / "docs" / "integrations" / "reference_fidelity_tooling.md").read_text(
            encoding="utf-8"
        )
        for phrase in (
            "diagnostic only",
            "relative prior only",
            "Never accept an MCP-only scene edit",
            "MCP diagnosis when needed",
        ):
            self.assertIn(phrase, documentation)

    def test_optional_environment_declares_all_three_vision_routes(self) -> None:
        project = (ROOT.parent / "integrations" / "vision" / "pyproject.toml").read_text(encoding="utf-8")
        for dependency in ("mediapipe", "torch", "transformers"):
            self.assertIn(f'"{dependency}', project)

    def test_models_are_pinned_to_immutable_versions(self) -> None:
        for revision in (ADAPTER.SAM_REVISION, ADAPTER.DEPTH_REVISION):
            self.assertRegex(revision, r"^[0-9a-f]{40}$")
        for url in (ADAPTER.FACE_MODEL_URL, ADAPTER.POSE_MODEL_URL):
            self.assertNotIn("/latest/", url)
        source = Path(ADAPTER.__file__).read_text(encoding="utf-8")
        calls = re.findall(r"from_pretrained\((.*?)\)", source, flags=re.DOTALL)
        self.assertEqual(len(calls), 8)
        for call in calls:
            self.assertIn("revision=", call)

    def test_download_refuses_a_model_with_another_hash(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            upstream = Path(directory) / "upstream.task"
            upstream.write_bytes(b"model")
            expected = hashlib.sha256(b"model").hexdigest()
            saved = Path(directory) / "models" / "saved.task"
            record = ADAPTER._download(upstream.as_uri(), saved, expected)
            self.assertEqual(record["sha256"], expected)

            refused = Path(directory) / "models" / "refused.task"
            with self.assertRaises(RuntimeError):
                ADAPTER._download(upstream.as_uri(), refused, "0" * 64)
            self.assertFalse(refused.exists())

            saved.write_bytes(b"replaced")
            with self.assertRaises(RuntimeError):
                ADAPTER._download(upstream.as_uri(), saved, expected)


if __name__ == "__main__":
    unittest.main()

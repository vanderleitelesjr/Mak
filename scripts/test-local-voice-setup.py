import hashlib
import importlib.util
import io
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('setup', Path(__file__).with_name('setup-local-voice.py'))
setup = importlib.util.module_from_spec(spec)
spec.loader.exec_module(setup)

class Downloads(unittest.TestCase):
    def test_cached_model_is_verified_and_failed_download_keeps_original(self):
        with tempfile.TemporaryDirectory() as folder:
            target = Path(folder) / 'model.bin'
            good = b'model'; digest = hashlib.sha256(good).hexdigest()
            target.write_bytes(good)
            setup.download(target, 'https://example.com/model', len(good), digest, lambda *a, **kw: self.fail('valid cache downloaded'))
            target.write_bytes(b'wrong')
            with self.assertRaises(RuntimeError):
                setup.download(target, 'https://example.com/model', len(good), digest, lambda *a, **kw: io.BytesIO(b'other'))
            self.assertEqual(target.read_bytes(), b'wrong')
            self.assertFalse(target.with_suffix('.bin.part').exists())
            setup.download(target, 'https://example.com/model', len(good), digest, lambda *a, **kw: io.BytesIO(good))
            self.assertEqual(target.read_bytes(), good)

    def test_platform_venv_paths(self):
        self.assertEqual(setup.python_path(Path('root'), True), Path('root/venv/Scripts/python.exe'))
        self.assertEqual(setup.python_path(Path('root'), False), Path('root/venv/bin/python'))

if __name__ == '__main__':
    unittest.main()

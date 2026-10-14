"""Optional local voice setup. Run explicitly with Python 3.10-3.12; no app restart."""
import argparse
import hashlib
import os
from pathlib import Path
import subprocess
import sys
import urllib.request
import venv

WHISPER = 'https://huggingface.co/Systran/faster-whisper-small/resolve/536b0662742c02347bc0e980a01041f333bce120/'
KOKORO = 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.1/'
MODELS = {
    'dictation': [
        ('model/config.json', WHISPER + 'config.json', 2370, 'b55496ac7940a7ae47d2c01eab40edfd8701feec1229d9cce3b40014383fb828'),
        ('model/tokenizer.json', WHISPER + 'tokenizer.json', 2203239, 'fb7b63191e9bb045082c79fd742a3106a12c99513ab30df4a0d47fa6cb6fd0ab'),
        ('model/vocabulary.txt', WHISPER + 'vocabulary.txt', 459861, '34ce3fe1c5041027b3f8d42912270993f986dbc4bb34cf27f951e34a1e453913'),
        ('model/model.bin', WHISPER + 'model.bin', 483546902, '3e305921506d8872816023e4c273e75d2419fb89b24da97b4fe7bce14170d671'),
    ],
    'read-aloud': [
        ('kokoro-v1.0.int8.onnx', KOKORO + 'kokoro-v1.0.int8.onnx', 114119327, 'ae315a79b623f244700e4afb9246c46a26066782e049ba174bf3ba433970ee9c'),
        ('voices-v1.0.bin', KOKORO + 'voices-v1.0.bin', 28214398, 'bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d'),
    ],
}
PACKAGES = {'dictation': ['faster-whisper==1.2.1', 'av==16.1.0'], 'read-aloud': ['kokoro-onnx==0.6.1']}

def python_path(root, windows=os.name == 'nt'):
    return root / 'venv' / ('Scripts/python.exe' if windows else 'bin/python')

def verified(file, size, digest):
    if not file.is_file() or file.stat().st_size != size:
        return False
    sha = hashlib.sha256()
    with file.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            sha.update(chunk)
    return sha.hexdigest() == digest

def download(file, url, size, digest, opener=urllib.request.urlopen):
    if verified(file, size, digest):
        return
    file.parent.mkdir(parents=True, exist_ok=True)
    temporary = file.with_name(file.name + '.part')
    try:
        request = urllib.request.Request(url, headers={'User-Agent': 'MrMak-LocalVoice-Setup'})
        with opener(request, timeout=120) as response, temporary.open('wb') as output:
            total = 0
            while chunk := response.read(1024 * 1024):
                total += len(chunk)
                if total > size:
                    raise RuntimeError('Unexpected download size: ' + file.name)
                output.write(chunk)
        if not verified(temporary, size, digest):
            raise RuntimeError('Incomplete or changed model download: ' + file.name)
        temporary.replace(file)
    finally:
        temporary.unlink(missing_ok=True)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('feature', choices=MODELS)
    args = parser.parse_args()
    if not (3, 10) <= sys.version_info[:2] <= (3, 12):
        parser.error('Use Python 3.10-3.12 (3.12 recommended) for the pinned local voice packages.')
    root = Path(__file__).resolve().parent.parent / '.cache' / args.feature
    root.mkdir(parents=True, exist_ok=True)
    python = python_path(root)
    if not python.exists():
        venv.EnvBuilder(with_pip=True).create(root / 'venv')
    subprocess.run([str(python), '-m', 'pip', 'install', *PACKAGES[args.feature]], check=True)
    for name, url, size, digest in MODELS[args.feature]:
        print('Verifying ' + name, flush=True)
        download(root / name, url, size, digest)
    if args.feature == 'dictation':
        probe = 'from faster_whisper import WhisperModel; import sys; WhisperModel(sys.argv[1], device="cpu", compute_type="int8", local_files_only=True)'
        subprocess.run([str(python), '-c', probe, str(root / 'model')], check=True)
    else:
        probe = 'from kokoro_onnx import Kokoro; import sys; Kokoro(sys.argv[1],sys.argv[2])'
        subprocess.run([str(python), '-c', probe, str(root / 'kokoro-v1.0.int8.onnx'), str(root / 'voices-v1.0.bin')], check=True)
    print('Local voice is ready. Refresh Phone settings to select it. No app restart performed.')

if __name__ == '__main__':
    main()

"""Verify modes in the FINAL AppImage, including execution by a non-owner.

CI requires Linux, squashfs-tools, sudo and its existing nobody account. This is a package
check, not a substitute for checking the graphical app on a real Linux desktop.
"""
import argparse
import os
from pathlib import Path
import stat
import subprocess
import tempfile


def check(image: Path) -> None:
    image = image.resolve(strict=True)
    image.chmod(image.stat().st_mode | 0o555)
    with tempfile.TemporaryDirectory(prefix='mrmak-appimage-') as temporary:
        directory = Path(temporary)
        directory.chmod(0o755)  # The non-owner must be able to traverse /tmp.
        root = directory / 'squashfs-root'
        # The runtime's --appimage-extract creates directories as 0700 rather
        # than preserving their archived modes. Unsquashfs restores the actual
        # package metadata, so this audit does not mistake extraction for damage.
        offset = int(subprocess.check_output([str(image), '--appimage-offset'], text=True).strip())
        if offset <= 0 or offset >= image.stat().st_size:
            raise RuntimeError('Invalid AppImage filesystem offset')
        subprocess.run(['unsquashfs', '-no-progress', '-offset', str(offset),
                        '-d', str(root), str(image)], stdout=subprocess.DEVNULL, check=True)
        failures = []
        for parent, dirs, files in os.walk(root):
            for item in [Path(parent), *(Path(parent) / name for name in dirs + files)]:
                if item.is_symlink():
                    continue
                mode = stat.S_IMODE(item.stat().st_mode)
                required = 0o5 if item.is_dir() else 0o4
                if mode & required != required:
                    failures.append(f'{item.relative_to(root)}: {mode:04o}')
        nodes = [p for p in root.rglob('node') if p.is_file() and 'runtime' in p.relative_to(root).parts]
        if not nodes:
            failures.append('Bundled runtime/node is missing')
        launchers = [root / 'AppRun', root / 'AppRun.wrapped', root / 'usr/bin/mrmak-workspace', *nodes]
        for item in launchers:
            if not item.is_file() or not item.resolve().is_relative_to(root) or item.stat().st_mode & 0o5 != 0o5:
                failures.append(f'{item.relative_to(root)}: missing or not readable/executable by other users')
        if failures:
            raise RuntimeError('Unsafe AppImage permissions:\n' + '\n'.join(sorted(set(failures))))
        # --version needs no display or account. This also catches an unusable
        # embedded Node binary on the oldest supported build environment.
        version = subprocess.check_output(['sudo', '-n', '-u', 'nobody', '--', str(nodes[0]), '--version'], text=True).strip()
        print(f'Final AppImage permissions verified; bundled Node runs as nobody: {version}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('image', type=Path)
    check(parser.parse_args().image)

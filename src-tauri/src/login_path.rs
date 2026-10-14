//! Finder launches with a sparse PATH. Shell customization is optional and bounded.
use std::path::{Path, PathBuf};

pub fn fallback(home: Option<&Path>, inherited: &str) -> String {
    let mut entries: Vec<PathBuf> = std::env::split_paths(inherited).filter(|p| !p.as_os_str().is_empty()).collect();
    let mut extra = Vec::new();
    if let Some(home) = home {
        for suffix in [".local/bin", ".npm-global/bin", ".cargo/bin"] { extra.push(home.join(suffix)); }
    }
    for directory in ["/opt/homebrew/bin", "/usr/local/bin", "/usr/bin", "/bin", "/usr/sbin", "/sbin"] { extra.push(directory.into()); }
    for entry in extra { if !entries.contains(&entry) { entries.push(entry); } }
    std::env::join_paths(entries).map(|value| value.to_string_lossy().into_owned()).unwrap_or_else(|_| inherited.to_owned())
}

#[cfg(unix)]
fn bounded_output(command: &mut std::process::Command, timeout: std::time::Duration) -> Option<String> {
    use std::{io::Read, os::unix::process::CommandExt, process::Stdio, sync::mpsc, thread, time::{Duration, Instant}};
    command.stdin(Stdio::null()).stdout(Stdio::piped()).stderr(Stdio::null()).process_group(0);
    let mut child = command.spawn().ok()?;
    let group = child.id() as i32;
    let output = child.stdout.take()?;
    let (send, receive) = mpsc::channel();
    thread::spawn(move || {
        let mut bytes = Vec::new();
        let result = output.take(65537).read_to_end(&mut bytes);
        let _ = send.send(if result.is_ok() && bytes.len() <= 65536 { String::from_utf8(bytes).ok() } else { None });
    });
    let deadline = Instant::now() + timeout;
    let status = loop {
        match child.try_wait() {
            Ok(Some(status)) => break Some(status),
            Err(_) => break None,
            Ok(None) if Instant::now() >= deadline => break None,
            Ok(None) => thread::sleep(Duration::from_millis(10)),
        }
    };
    // Kill only the private probe's process group, including children holding
    // stdout open. Never wait for a login script or pipe reader indefinitely.
    unsafe { libc::kill(-group, libc::SIGKILL); }
    let _ = child.wait();
    if !status.is_some_and(|status| status.success()) { return None; }
    receive.recv_timeout(Duration::from_millis(100)).ok().flatten()
}

#[cfg(target_os = "macos")]
pub fn discover() -> String {
    let inherited = std::env::var("PATH").unwrap_or_default();
    let home = std::env::var_os("HOME").map(PathBuf::from);
    let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".into());
    let mut command = std::process::Command::new(shell);
    command.args(["-ilc", "printf '__MRMAK_PATH__%s__MRMAK_END__' \"$PATH\""]);
    let path = bounded_output(&mut command, std::time::Duration::from_millis(2000))
        .and_then(|text| text.rsplit_once("__MRMAK_PATH__").map(|(_, value)| value.to_owned()))
        .and_then(|text| text.split_once("__MRMAK_END__").map(|(value, _)| value.to_owned()))
        .filter(|value| !value.is_empty() && !value.contains(['\n', '\r', '\0']));
    path.unwrap_or_else(|| fallback(home.as_deref(), &inherited))
}

#[cfg(all(test, unix))]
mod tests {
    use super::*;
    use std::{process::Command, time::{Duration, Instant}};
    #[test]
    fn returns_output_without_waiting_for_background_children() {
        let start = Instant::now();
        assert_eq!(bounded_output(Command::new("/bin/sh").args(["-c", "sleep 30 & printf ready"]), Duration::from_millis(100)), Some("ready".into()));
        assert!(start.elapsed() < Duration::from_secs(2));
    }
    #[test]
    fn timeout_and_excess_output_fall_back() {
        let start = Instant::now();
        assert!(bounded_output(Command::new("/bin/sh").args(["-c", "sleep 30"]), Duration::from_millis(100)).is_none());
        assert!(start.elapsed() < Duration::from_secs(2));
        assert!(bounded_output(Command::new("/bin/sh").args(["-c", "yes x | head -c 70000"]), Duration::from_millis(500)).is_none());
    }
    #[test]
    fn fallback_preserves_custom_path_and_adds_common_cli_locations() {
        let value = fallback(Some(Path::new("/Users/test")), "/custom/bin:/bin");
        assert!(value.starts_with("/custom/bin:/bin:"));
        assert!(value.contains("/Users/test/.local/bin"));
        assert!(value.contains("/opt/homebrew/bin"));
        assert_eq!(value.split(':').filter(|p| *p == "/bin").count(), 1);
    }
}

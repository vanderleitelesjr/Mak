//! Two Shell identities inside one application; the Tauri data identifier stays unchanged.
use std::{fs, hash::{Hash, Hasher}, path::{Path, PathBuf}, sync::Mutex};
use tauri::Manager;
use windows::{core::{HSTRING, Interface}, Win32::{Foundation::HWND, Storage::EnhancedStorage::*,
    System::Com::{CoCreateInstance, IPersistFile, CLSCTX_INPROC_SERVER, STGM_READWRITE, StructuredStorage::PROPVARIANT},
    UI::Shell::{IShellLinkW, ShellLink, PropertiesSystem::{IPropertyStore, SHGetPropertyStoreForWindow}, SHChangeNotify, SHCNE_UPDATEITEM, SHCNF_PATHW}}};
use windows_sys::Win32::UI::{HiDpi::{GetDpiForWindow, GetSystemMetricsForDpi}, WindowsAndMessaging::*};

#[derive(Default)]
pub struct WindowIcons(Mutex<Vec<usize>>);
impl Drop for WindowIcons {
    fn drop(&mut self) {
        if let Ok(icons) = self.0.get_mut() {
            for icon in icons.drain(..) { unsafe { DestroyIcon(icon as _); } }
        }
    }
}

fn app_id(app: &tauri::AppHandle, label: &str) -> String {
    format!("{}.windows.{label}", app.config().identifier)
}

pub fn initialize(app: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    app.manage(WindowIcons::default());
    unsafe { windows::Win32::UI::Shell::SetCurrentProcessExplicitAppUserModelID(&HSTRING::from(app_id(app, "chats")))?; }
    Ok(())
}

fn icon_path(app: &tauri::AppHandle, label: &str) -> Result<PathBuf, Box<dyn std::error::Error>> {
    let bytes: &[u8] = if label == "chats" { include_bytes!("../icons/chats.ico") } else { include_bytes!("../icons/icon.ico") };
    let mut hash = std::collections::hash_map::DefaultHasher::new(); bytes.hash(&mut hash);
    let folder = app.path().app_cache_dir()?.join("icons");
    fs::create_dir_all(&folder)?;
    let path = folder.join(format!("mak-{label}-{:016x}.ico", hash.finish()));
    if fs::read(&path).ok().as_deref() != Some(bytes) { fs::write(&path, bytes)?; }
    Ok(path)
}

pub fn set_window(window: &tauri::WebviewWindow) -> Result<(), Box<dyn std::error::Error>> {
    let app = window.app_handle();
    let label = window.label();
    let png: &[u8] = if label == "chats" { include_bytes!("../icons/chats-128x128.png") } else { include_bytes!("../icons/128x128.png") };
    window.set_icon(tauri::image::Image::from_bytes(png)?)?;
    let icon = icon_path(app, label)?;
    let command = format!("\"{}\" --show {label}", std::env::current_exe()?.display());
    let title = if label == "chats" { "Mr. Mak Chats" } else { "Mr. Mak Workspace" };
    unsafe {
        let hwnd = window.hwnd()?.0;
        let dpi = GetDpiForWindow(hwnd);
        let big = LoadImageW(std::ptr::null_mut(), HSTRING::from(icon.as_os_str()).as_ptr(), IMAGE_ICON,
            GetSystemMetricsForDpi(SM_CXICON, dpi), GetSystemMetricsForDpi(SM_CYICON, dpi), LR_LOADFROMFILE);
        if big.is_null() { return Err(std::io::Error::last_os_error().into()); }
        SendMessageW(hwnd, WM_SETICON, ICON_BIG as usize, big as isize);
        app.state::<WindowIcons>().0.lock().unwrap().push(big as usize);
        let properties: IPropertyStore = SHGetPropertyStoreForWindow(HWND(hwnd))?;
        properties.SetValue(&PKEY_AppUserModel_RelaunchCommand, &PROPVARIANT::from(command.as_str()))?;
        properties.SetValue(&PKEY_AppUserModel_RelaunchDisplayNameResource, &PROPVARIANT::from(title))?;
        properties.SetValue(&PKEY_AppUserModel_RelaunchIconResource, &PROPVARIANT::from(format!("{},0", icon.display()).as_str()))?;
        // Set the per-window identity last, before either window becomes visible.
        properties.SetValue(&PKEY_AppUserModel_ID, &PROPVARIANT::from(app_id(app, label).as_str()))?;
    }
    Ok(())
}

pub fn refresh_shortcuts(app: &tauri::AppHandle) {
    let mut shortcuts = Vec::new();
    if let Ok(desktop) = app.path().desktop_dir() { shortcuts.push(desktop.join("Mr. Mak Workspace.lnk")); }
    if let Some(roaming) = std::env::var_os("APPDATA") {
        let root = PathBuf::from(roaming);
        shortcuts.push(root.join("Microsoft/Windows/Start Menu/Programs/Mr. Mak Workspace.lnk"));
        let pinned = root.join("Microsoft/Internet Explorer/Quick Launch/User Pinned/TaskBar");
        if let Ok(entries) = fs::read_dir(pinned) {
            shortcuts.extend(entries.flatten().map(|entry| entry.path()).filter(|path| path.extension().and_then(|ext| ext.to_str()).is_some_and(|ext| ext.eq_ignore_ascii_case("lnk"))));
        }
    }
    for shortcut in shortcuts { let _ = refresh_shortcut(app, &shortcut); }
}

fn refresh_shortcut(app: &tauri::AppHandle, path: &Path) -> Result<(), Box<dyn std::error::Error>> {
    if !path.is_file() { return Ok(()); }
    let text = |buffer: &[u16]| String::from_utf16_lossy(&buffer[..buffer.iter().position(|&v| v == 0).unwrap_or(buffer.len())]);
    unsafe {
        let link: IShellLinkW = CoCreateInstance(&ShellLink, None, CLSCTX_INPROC_SERVER)?;
        let persisted: IPersistFile = link.cast()?;
        let file = HSTRING::from(path.as_os_str());
        persisted.Load(&file, STGM_READWRITE)?;
        let mut target = vec![0u16; 32768];
        link.GetPath(&mut target, std::ptr::null_mut(), 0)?;
        // Test copies and other executables must never alter installed shortcuts.
        if !text(&target).eq_ignore_ascii_case(std::env::current_exe()?.to_string_lossy().as_ref()) { return Ok(()); }
        let mut arguments = vec![0u16; 32768]; link.GetArguments(&mut arguments)?;
        let mut arguments = text(&arguments);
        let words: Vec<String> = arguments.split_whitespace().map(|word| word.trim_matches('"').to_owned()).collect();
        let selected = crate::requested_window(&words);
        let label = selected.unwrap_or("chats");
        // Migrate an existing shared pin to Chats. Preserve --repo and any other
        // arguments, placement and the user's pin/unpin choices.
        if selected.is_none() { arguments = format!("{arguments} --show chats").trim().to_owned(); }
        let icon = icon_path(app, label)?;
        let properties: IPropertyStore = link.cast()?;
        let current_id = properties.GetValue(&PKEY_AppUserModel_ID)?.to_string();
        let mut current_icon = vec![0u16; 32768]; let mut index = 0;
        link.GetIconLocation(&mut current_icon, &mut index)?;
        if current_id == app_id(app, label) && index == 0 && text(&current_icon).eq_ignore_ascii_case(icon.to_string_lossy().as_ref()) && selected.is_some() { return Ok(()); }
        link.SetArguments(&HSTRING::from(arguments))?;
        link.SetIconLocation(&HSTRING::from(icon.as_os_str()), 0)?;
        properties.SetValue(&PKEY_AppUserModel_ID, &PROPVARIANT::from(app_id(app, label).as_str()))?;
        properties.Commit()?;
        persisted.Save(&file, true)?;
        SHChangeNotify(SHCNE_UPDATEITEM, SHCNF_PATHW, Some(file.as_ptr().cast()), None);
    }
    Ok(())
}

//! A bare Windows-key tap recalls Mr. Mak. All Windows-key chords pass through.
//! The hook only tracks key state; no key contents are recorded or sent anywhere.
use std::{cell::Cell, sync::{atomic::{AtomicBool, AtomicU32, Ordering}, mpsc, Mutex}, thread::JoinHandle};
use windows_sys::Win32::{Foundation::*, System::{LibraryLoader::GetModuleHandleW, Threading::GetCurrentThreadId},
    UI::{Input::KeyboardAndMouse::*, WindowsAndMessaging::*}};

const RECALL: u32 = WM_APP + 41;
const MASK_START: u32 = WM_APP + 42;
const INPUT_MARKER: usize = 0x4d414b57;
static ENABLED: AtomicBool = AtomicBool::new(false);
static THREAD_ID: AtomicU32 = AtomicU32::new(0);
thread_local! { static TAP: Cell<WinTap> = Cell::new(WinTap::default()); static HELD: Cell<[u64;4]> = const { Cell::new([0;4]) }; }

#[derive(Clone, Copy, Default)]
struct WinTap { held: Option<u32>, chord: bool, masked: bool }
impl WinTap {
    fn key(&mut self, vk: u32, down: bool, another_key_held: bool) -> bool {
        let win = vk == VK_LWIN as u32 || vk == VK_RWIN as u32;
        if down && win && self.held.is_none() {
            self.held = Some(vk); self.chord = another_key_held;
        } else if !down && self.held == Some(vk) {
            let tap = !self.chord; *self = Self::default(); return tap;
        } else if self.held.is_some() && self.held != Some(vk) {
            self.chord = true;
        }
        false
    }
}

pub struct WinKeyShortcut { thread_id: u32, thread: Mutex<Option<JoinHandle<()>>> }
impl WinKeyShortcut {
    pub fn start(app: &tauri::AppHandle, enabled: bool) -> std::io::Result<Self> {
        let app = app.clone();
        let (ready_tx, ready_rx) = mpsc::sync_channel(1);
        let thread = std::thread::spawn(move || unsafe {
            let thread_id = GetCurrentThreadId();
            THREAD_ID.store(thread_id, Ordering::Relaxed);
            let mut msg: MSG = std::mem::zeroed();
            // Create the message queue before publishing its thread ID.
            PeekMessageW(&mut msg, std::ptr::null_mut(), 0, 0, PM_NOREMOVE);
            let module = GetModuleHandleW(std::ptr::null());
            let mut keyboard = SetWindowsHookExW(WH_KEYBOARD_LL, Some(keyboard_hook), module, 0);
            if keyboard.is_null() { let _ = ready_tx.send(Err(std::io::Error::last_os_error())); return; }
            let mouse = SetWindowsHookExW(WH_MOUSE_LL, Some(mouse_hook), module, 0);
            if mouse.is_null() { UnhookWindowsHookEx(keyboard); let _ = ready_tx.send(Err(std::io::Error::last_os_error())); return; }
            ENABLED.store(enabled, Ordering::Relaxed);
            let mut held = [0u64;4];
            for vk in 8..256 { if ![VK_SHIFT as i32, VK_CONTROL as i32, VK_MENU as i32].contains(&vk) && GetAsyncKeyState(vk) < 0 { held[vk as usize / 64] |= 1u64 << (vk % 64); } }
            HELD.set(held);
            // Windows can silently remove a slow low-level hook. Refresh while
            // both Win keys are released; never inject heartbeat keystrokes.
            let timer = SetTimer(std::ptr::null_mut(), 0, 10000, None);
            let _ = ready_tx.send(Ok(thread_id));
            while GetMessageW(&mut msg, std::ptr::null_mut(), 0, 0) > 0 {
                if msg.message == MASK_START {
                    let state = TAP.get();
                    if ENABLED.load(Ordering::Relaxed) && state.held == Some(msg.wParam as u32) && !state.chord {
                        // SendInput is deliberately OUTSIDE the hook callback.
                        // Mask Start while Win is held, then let its real key-up
                        // through. This never suppresses a modifier release.
                        let key = |flags| INPUT { r#type: INPUT_KEYBOARD, Anonymous: INPUT_0 { ki: KEYBDINPUT { wVk: 0xE8, wScan: 0, dwFlags: flags, time: 0, dwExtraInfo: INPUT_MARKER } } };
                        let inputs = [key(0), key(KEYEVENTF_KEYUP)];
                        let sent = SendInput(2, inputs.as_ptr(), std::mem::size_of::<INPUT>() as i32) == 2;
                        let mut latest = TAP.get();
                        if latest.held == state.held { latest.masked = sent; TAP.set(latest); }
                    }
                } else if msg.message == WM_TIMER && msg.wParam == timer {
                    if GetAsyncKeyState(VK_LWIN as i32) >= 0 && GetAsyncKeyState(VK_RWIN as i32) >= 0 {
                        let replacement = SetWindowsHookExW(WH_KEYBOARD_LL, Some(keyboard_hook), module, 0);
                        if !replacement.is_null() { UnhookWindowsHookEx(keyboard); keyboard = replacement; TAP.set(WinTap::default()); }
                        let mut held = [0u64;4];
                        for vk in 8..256 { if ![VK_SHIFT as i32, VK_CONTROL as i32, VK_MENU as i32].contains(&vk) && GetAsyncKeyState(vk) < 0 { held[vk as usize / 64] |= 1u64 << (vk % 64); } }
                        HELD.set(held);
                    }
                } else if msg.message == RECALL {
                    let handle = app.clone();
                    let _ = app.run_on_main_thread(move || crate::recall_open_windows(&handle));
                } else { TranslateMessage(&msg); DispatchMessageW(&msg); }
            }
            ENABLED.store(false, Ordering::Relaxed);
            KillTimer(std::ptr::null_mut(), timer);
            UnhookWindowsHookEx(mouse); UnhookWindowsHookEx(keyboard);
        });
        match ready_rx.recv().unwrap_or_else(|_| Err(std::io::Error::other("Windows-key hook did not start"))) {
            Ok(thread_id) => Ok(Self { thread_id, thread: Mutex::new(Some(thread)) }),
            Err(error) => { let _ = thread.join(); Err(error) }
        }
    }

    pub fn set_enabled(&self, enabled: bool) { ENABLED.store(enabled, Ordering::Relaxed); }
    pub fn enabled(&self) -> bool { ENABLED.load(Ordering::Relaxed) }
    pub fn shutdown(&self) {
        ENABLED.store(false, Ordering::Relaxed);
        if let Some(thread) = self.thread.lock().unwrap().take() {
            unsafe { PostThreadMessageW(self.thread_id, WM_QUIT, 0, 0); }
            let _ = thread.join();
        }
    }
}
impl Drop for WinKeyShortcut {
    fn drop(&mut self) {
        ENABLED.store(false, Ordering::Relaxed);
        unsafe { PostThreadMessageW(self.thread_id, WM_QUIT, 0, 0); }
        if let Ok(thread) = self.thread.get_mut() { if let Some(thread) = thread.take() { let _ = thread.join(); } }
    }
}

unsafe extern "system" fn keyboard_hook(code: i32, message: WPARAM, data: LPARAM) -> LRESULT {
    if code == HC_ACTION as i32 {
        let event = &*(data as *const KBDLLHOOKSTRUCT);
        // Ignore only our own menu-mask/release events. Other injected events
        // still count as chords (accessibility tools and keyboard remappers).
        if event.dwExtraInfo != INPUT_MARKER {
            let down = message == WM_KEYDOWN as usize || message == WM_SYSKEYDOWN as usize;
            let mut held = HELD.get();
            let vk = event.vkCode.min(255) as usize;
            let bit = 1u64 << (vk % 64);
            let mut others = held; others[vk / 64] &= !bit;
            let another_key_held = others.iter().any(|word| *word != 0);
            if down { held[vk / 64] |= bit; } else { held[vk / 64] &= !bit; }
            HELD.set(held);
            if !ENABLED.load(Ordering::Relaxed) {
                TAP.set(WinTap::default());
            } else {
                let mut state = TAP.get();
                let win = event.vkCode == VK_LWIN as u32 || event.vkCode == VK_RWIN as u32;
                // For other keys GetAsyncKeyState is already current. The hook
                // runs before the state of this event's own key is updated.
                let new_press = down && win && state.held.is_none();
                let other_held = new_press && (another_key_held || [VK_LBUTTON, VK_RBUTTON, VK_MBUTTON, VK_XBUTTON1, VK_XBUTTON2].iter().any(|vk| GetAsyncKeyState(*vk as i32) < 0));
                let masked = state.masked;
                let tapped = state.key(event.vkCode, down, other_held);
                TAP.set(state);
                if new_press && !other_held { PostThreadMessageW(THREAD_ID.load(Ordering::Relaxed), MASK_START, event.vkCode as usize, 0); }
                if tapped && masked { PostThreadMessageW(THREAD_ID.load(Ordering::Relaxed), RECALL, 0, 0); }
            }
        }
    }
    CallNextHookEx(std::ptr::null_mut(), code, message, data)
}

unsafe extern "system" fn mouse_hook(code: i32, message: WPARAM, data: LPARAM) -> LRESULT {
    if code == HC_ACTION as i32 && matches!(message as u32,
        WM_LBUTTONDOWN | WM_RBUTTONDOWN | WM_MBUTTONDOWN | WM_XBUTTONDOWN | WM_MOUSEWHEEL | WM_MOUSEHWHEEL) {
        let mut state = TAP.get(); if state.held.is_some() { state.chord = true; TAP.set(state); }
    }
    CallNextHookEx(std::ptr::null_mut(), code, message, data)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn bare_left_and_right_win_recall_once_after_release() {
        for win in [VK_LWIN as u32, VK_RWIN as u32] {
            let mut state = WinTap::default();
            assert!(!state.key(win, true, false));
            assert!(!state.key(win, true, false)); // key repeat
            assert!(state.key(win, false, false));
            assert!(!state.key(win, false, false));
        }
    }
    #[test]
    fn win_chords_and_reverse_release_order_never_recall() {
        for key in [VK_E, VK_R, VK_D, VK_L, VK_TAB, VK_LEFT, VK_SHIFT, VK_CONTROL, VK_MENU, VK_RWIN] {
            for win_up_first in [false, true] {
                let mut state = WinTap::default();
                assert!(!state.key(VK_LWIN as u32, true, false));
                assert!(!state.key(key as u32, true, true));
                let releases = if win_up_first { [VK_LWIN, key] } else { [key, VK_LWIN] };
                for vk in releases { assert!(!state.key(vk as u32, false, false)); }
                assert!(state.held.is_none());
            }
        }
    }
    #[test]
    fn preexisting_modifier_or_mouse_action_cancels_tap() {
        let mut state = WinTap::default();
        assert!(!state.key(VK_LWIN as u32, true, true));
        assert!(!state.key(VK_LWIN as u32, false, false));
        state.key(VK_LWIN as u32, true, false); state.chord = true;
        assert!(!state.key(VK_LWIN as u32, false, false));
        state.key(VK_LWIN as u32, true, false);
        assert!(state.key(VK_LWIN as u32, false, false));
    }
}

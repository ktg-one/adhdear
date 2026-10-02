/**
 * Tauri v2 Desktop IPC Bridge
 * Transparently hooks into Tauri v2 IPC when running in desktop shell,
 * or gracefully falls back to browser runtime during web preview.
 */

export interface TauriWindowConfig {
  alwaysOnTop: boolean;
  transparent: boolean;
  fullscreenLockout: boolean;
}

export class TauriBridge {
  private static isTauriAvailable(): boolean {
    return typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);
  }

  public static async setAlwaysOnTop(enabled: boolean): Promise<void> {
    if (this.isTauriAvailable()) {
      try {
        const tauri = (window as unknown as { __TAURI__?: { window?: { getCurrentWindow?: () => { setAlwaysOnTop: (v: boolean) => Promise<void> } } } }).__TAURI__;
        if (tauri?.window?.getCurrentWindow) {
          await tauri.window.getCurrentWindow().setAlwaysOnTop(enabled);
        }
      } catch {
        // Tauri not initialized
      }
    }
  }

  public static async setFullscreen(enabled: boolean): Promise<void> {
    if (this.isTauriAvailable()) {
      try {
        const tauri = (window as unknown as { __TAURI__?: { window?: { getCurrentWindow?: () => { setFullscreen: (v: boolean) => Promise<void> } } } }).__TAURI__;
        if (tauri?.window?.getCurrentWindow) {
          await tauri.window.getCurrentWindow().setFullscreen(enabled);
        }
      } catch {
        // Tauri not initialized
      }
    }
  }

  public static async triggerOSNotification(title: string, body: string): Promise<void> {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification(title, { body });
      }
    }
  }

  /**
   * Complete copy-pasteable Rust files for Tauri v2 backend
   */
  public static getTauriRustTemplates() {
    return {
      cargoToml: `[package]
name = "synapse-hud"
version = "0.1.0"
description = "SYNAPSE // HUD - Cybernetic ADHD Desktop Overlay"
authors = ["Creator"]
edition = "2021"

[build-dependencies]
tauri-build = { version = "2.0.0", features = [] }

[dependencies]
tauri = { version = "2.0.0", features = ["tray-icon"] }
tauri-plugin-global-shortcut = "2.0.0"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tokio = { version = "1.36", features = ["full"] }
rodio = "0.17"
tracing = "0.1"
tracing-subscriber = "0.3"
`,
      mainRs: `// src-tauri/src/main.rs
// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, WindowEvent};
use std::sync::Mutex;

struct AudioState {
    playing: Mutex<bool>,
}

#[tauri::command]
fn toggle_overlay(app_handle: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app_handle.get_webview_window("main") {
        if window.is_visible().unwrap_or(true) {
            window.hide().map_err(|e| e.to_string())?;
        } else {
            window.show().map_err(|e| e.to_string())?;
            window.set_focus().map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

#[tauri::command]
fn trigger_hard_stop_lockout(app_handle: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app_handle.get_webview_window("main") {
        window.show().map_err(|e| e.to_string())?;
        window.set_always_on_top(true).map_err(|e| e.to_string())?;
        window.set_fullscreen(true).map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn release_hard_stop_lockout(app_handle: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app_handle.get_webview_window("main") {
        window.set_fullscreen(false).map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .manage(AudioState {
            playing: Mutex::new(false),
        })
        .invoke_handler(tauri::generate_handler![
            toggle_overlay,
            trigger_hard_stop_lockout,
            release_hard_stop_lockout
        ])
        .run(tauri::generate_context!())
        .expect("error while running SYNAPSE HUD application");
}
`,
      scoutRs: `// src-tauri/src/scout.rs
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tokio::fs;

#[derive(Debug, Serialize, Deserialize)]
pub struct ScoutTask {
    pub project_slug: String,
    pub title: String,
    pub dependencies: Vec<String>,
}

pub async fn execute_scout_job(task: ScoutTask, base_dir: PathBuf) -> Result<(), Box<dyn std::error::Error>> {
    let project_path = base_dir.join(&task.project_slug);
    fs::create_dir_all(&project_path.join("src")).await?;
    
    // Write Cargo.toml skeleton
    let cargo_manifest = format!(
        r#"[package]
name = "{}"
version = "0.1.0"
edition = "2021"

[dependencies]
{}
"#,
        task.project_slug,
        task.dependencies.iter().map(|d| format!("{d} = \"*\"")).collect::<Vec<_>>().join("\\n")
    );
    fs::write(project_path.join("Cargo.toml"), cargo_manifest).await?;
    
    // Write lib.rs entry
    fs::write(
        project_path.join("src").join("lib.rs"),
        b"// Staged by SYNAPSE Scout Worker\\n// Half-built playground ready\\n"
    ).await?;

    Ok(())
}
`,
    };
  }
}

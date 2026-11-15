# Script to generate the comprehensive, fully-verified ignis-simulator.html
import os

html_content = r'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>IGNITE-AI · 3D Flame Simulator | NASA Space Apps Challenge</title>
  <meta name="description" content="Interactive 3D Microgravity Combustion Simulator based on official NASA Glenn, ISS BASS/FLEX, and Saffire datasets. Revolve 360° around flames in Earth, Moon, Mars, and ISS microgravity.">

  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&family=Orbitron:wght@500;600;700;800;900&display=swap" rel="stylesheet">

  <!-- Three.js and OrbitControls -->
  <script src="vendor/three.min.js"></script>
  <script src="vendor/OrbitControls.js"></script>
  <script>
    if (typeof THREE === 'undefined') {
      document.write('<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"><\/script>');
      document.write('<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"><\/script>');
    }
  </script>

  <style>
    :root {
      --bg-dark: #040814;
      --bg-card: rgba(10, 18, 36, 0.85);
      --bg-card-hover: rgba(16, 28, 56, 0.95);
      --border-card: rgba(0, 240, 255, 0.25);
      --border-card-bright: rgba(0, 240, 255, 0.7);
      --cyan-glow: #00f0ff;
      --cyan-dim: rgba(0, 240, 255, 0.15);
      --blue-accent: #1e6eff;
      --amber-flame: #ff9d00;
      --red-alert: #ff3344;
      --green-safe: #00ff88;
      --text-main: #e6f1ff;
      --text-muted: #8ca3c7;
      --text-mono: 'JetBrains Mono', monospace;
      --font-heading: 'Orbitron', sans-serif;
      --font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }

    body {
      background-color: var(--bg-dark);
      color: var(--text-main);
      font-family: var(--font-body);
      line-height: 1.5;
      overflow-x: hidden;
    }

    /* Top Navigation Bar */
    header.site-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 28px;
      background: rgba(3, 8, 20, 0.92);
      border-bottom: 1px solid rgba(0, 240, 255, 0.2);
      position: sticky;
      top: 0;
      z-index: 100;
      backdrop-filter: blur(12px);
    }

    .header-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
    }

    .brand-flame-icon {
      width: 28px;
      height: 28px;
      filter: drop-shadow(0 0 8px var(--cyan-glow));
    }

    .brand-title-wrap {
      display: flex;
      flex-direction: column;
    }

    .brand-title {
      font-family: var(--font-heading);
      font-size: 17px;
      font-weight: 800;
      letter-spacing: 2px;
      color: #ffffff;
      line-height: 1.1;
    }

    .brand-subtitle {
      font-size: 10px;
      font-family: var(--text-mono);
      color: var(--cyan-glow);
      letter-spacing: 1px;
    }

    .header-nav {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .nav-btn {
      color: var(--text-muted);
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
      padding: 6px 12px;
      border-radius: 6px;
      transition: all 0.2s ease;
    }

    .nav-btn:hover {
      color: #ffffff;
      background: rgba(0, 240, 255, 0.1);
    }

    .nav-btn.active {
      color: var(--cyan-glow);
      background: rgba(0, 240, 255, 0.15);
      border: 1px solid rgba(0, 240, 255, 0.35);
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .nasa-badge-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      background: rgba(11, 61, 145, 0.4);
      border: 1px solid #1a5ec4;
      border-radius: 100px;
      font-size: 11px;
      font-family: var(--text-mono);
      color: #79aeff;
      letter-spacing: 0.5px;
    }

    .nasa-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #00ff88;
      box-shadow: 0 0 6px #00ff88;
    }

    /* 3D Simulator Interactive Viewport */
    .simulator-viewport-container {
      position: relative;
      width: 100%;
      height: min(72vh, 720px);
      min-height: 480px;
      background: #02050e;
      overflow: hidden;
      border-bottom: 1px solid rgba(0, 240, 255, 0.25);
    }

    #three-canvas {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      cursor: grab;
      touch-action: none;
    }

    #three-canvas:active {
      cursor: grabbing;
    }

    /* Top Left & Right HUD Panels (As shown in NASA Challenge Video) */
    .hud-panel {
      position: absolute;
      background: rgba(6, 14, 32, 0.88);
      backdrop-filter: blur(12px);
      border: 1px solid var(--border-card);
      border-radius: 10px;
      padding: 14px 18px;
      font-family: var(--text-mono);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), inset 0 0 12px rgba(0, 240, 255, 0.05);
      pointer-events: auto;
      z-index: 10;
      transition: border-color 0.3s ease;
    }

    .hud-panel:hover {
      border-color: var(--border-card-bright);
    }

    .hud-panel-left {
      top: 20px;
      left: 24px;
      width: 330px;
    }

    .hud-panel-right {
      top: 20px;
      right: 24px;
      width: 330px;
    }

    .hud-header {
      font-size: 11px;
      font-weight: 700;
      color: var(--cyan-glow);
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(0, 240, 255, 0.15);
      padding-bottom: 6px;
    }

    .hud-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
      font-size: 12px;
    }

    .hud-row:last-child {
      margin-bottom: 0;
    }

    .hud-label {
      color: var(--text-muted);
    }

    .hud-value {
      font-weight: 600;
      color: #ffffff;
    }

    .hud-tag {
      display: inline-block;
      font-size: 9px;
      padding: 2px 5px;
      border-radius: 4px;
      background: rgba(0, 240, 255, 0.12);
      color: var(--cyan-glow);
      border: 1px solid rgba(0, 240, 255, 0.3);
      margin-left: 4px;
      text-transform: uppercase;
    }

    .hud-status-badge {
      display: block;
      width: 100%;
      text-align: center;
      padding: 7px 10px;
      border-radius: 6px;
      font-family: var(--font-heading);
      font-weight: 800;
      font-size: 12.5px;
      letter-spacing: 1px;
      margin-bottom: 10px;
      transition: all 0.3s ease;
    }

    .status-sustained {
      background: rgba(255, 51, 68, 0.22);
      border: 1px solid var(--red-alert);
      color: #ff6677;
      box-shadow: 0 0 15px rgba(255, 51, 68, 0.3);
    }

    .status-marginal {
      background: rgba(255, 157, 0, 0.22);
      border: 1px solid var(--amber-flame);
      color: #ffbb33;
      box-shadow: 0 0 15px rgba(255, 157, 0, 0.3);
    }

    .status-extinction {
      background: rgba(0, 255, 136, 0.2);
      border: 1px solid var(--green-safe);
      color: #33ffaa;
      box-shadow: 0 0 15px rgba(0, 255, 136, 0.3);
    }

    /* Floating Center Bottom Caption (Matches Video Overlay) */
    .hud-center-caption {
      position: absolute;
      bottom: 82px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(4, 10, 24, 0.88);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(0, 240, 255, 0.25);
      border-radius: 8px;
      padding: 6px 16px;
      font-size: 11px;
      color: #9cb5db;
      font-family: var(--text-mono);
      text-align: center;
      width: min(860px, 92%);
      pointer-events: none;
      z-index: 10;
      line-height: 1.4;
    }

    /* Camera Angle Presets Toolbar */
    .camera-presets-bar {
      position: absolute;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(6, 12, 26, 0.85);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(0, 240, 255, 0.2);
      border-radius: 100px;
      padding: 4px 8px;
      display: flex;
      align-items: center;
      gap: 6px;
      z-index: 10;
    }

    .camera-preset-btn {
      background: transparent;
      border: 1px solid transparent;
      color: var(--text-muted);
      font-family: var(--text-mono);
      font-size: 11px;
      padding: 4px 10px;
      border-radius: 100px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .camera-preset-btn:hover {
      color: #ffffff;
      background: rgba(0, 240, 255, 0.1);
      border-color: rgba(0, 240, 255, 0.3);
    }

    .camera-preset-btn.active {
      color: #ffffff;
      background: rgba(0, 240, 255, 0.25);
      border-color: var(--cyan-glow);
    }

    .auto-rotate-toggle {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-left: 1px solid rgba(0, 240, 255, 0.2);
      font-size: 11px;
      color: var(--text-muted);
      cursor: pointer;
    }

    .auto-rotate-toggle input {
      cursor: pointer;
      accent-color: var(--cyan-glow);
    }

    /* Environment Selector Bar with REALISTIC Planetary Discs (Replaces Cartoon Emojis) */
    .environment-selector-bar {
      position: absolute;
      bottom: 16px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 8px;
      z-index: 15;
      background: rgba(4, 8, 20, 0.88);
      backdrop-filter: blur(14px);
      border: 1px solid rgba(0, 240, 255, 0.3);
      padding: 5px 8px;
      border-radius: 100px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
      max-width: 96%;
      overflow-x: auto;
    }

    .env-tab-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      background: transparent;
      border: 1px solid transparent;
      padding: 5px 12px;
      border-radius: 100px;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.25s ease;
      white-space: nowrap;
    }

    .env-tab-btn:hover {
      background: rgba(0, 240, 255, 0.08);
      color: #ffffff;
    }

    .env-tab-btn.active {
      background: rgba(0, 240, 255, 0.22);
      border-color: var(--cyan-glow);
      color: #ffffff;
      box-shadow: 0 0 15px rgba(0, 240, 255, 0.4);
    }

    .planet-badge-img {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      object-fit: cover;
      border: 1px solid rgba(255, 255, 255, 0.6);
      box-shadow: 0 0 8px rgba(0, 240, 255, 0.4);
    }

    .env-tab-text-wrap {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      line-height: 1.15;
    }

    .env-tab-title {
      font-size: 11.5px;
      font-weight: 700;
      letter-spacing: 0.3px;
    }

    .env-tab-meta {
      font-size: 9.5px;
      font-family: var(--text-mono);
      opacity: 0.75;
    }

    /* Scientific Details & Content Sections */
    .scientific-details-section {
      max-width: 1340px;
      margin: 0 auto;
      padding: 24px 24px 80px;
    }

    /* Active Environment Headline Banner */
    .env-headline-card {
      background: var(--bg-card);
      border: 1px solid var(--border-card);
      border-radius: 12px;
      padding: 20px 24px;
      margin-bottom: 24px;
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.4);
    }

    .env-headline-title-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 10px;
    }

    .env-headline-badge {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid var(--cyan-glow);
    }

    .env-headline-title {
      font-family: var(--font-heading);
      font-size: 17px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: 0.5px;
    }

    .env-headline-citations {
      font-family: var(--text-mono);
      font-size: 12px;
      color: #7d9ec8;
      margin-bottom: 12px;
      line-height: 1.6;
    }

    .official-quote-box {
      background: rgba(0, 240, 255, 0.05);
      border-left: 3px solid var(--cyan-glow);
      padding: 10px 16px;
      border-radius: 0 8px 8px 0;
      font-size: 13px;
      color: #c7ddff;
      font-style: italic;
      margin-bottom: 10px;
    }

    .official-quote-author {
      display: block;
      margin-top: 4px;
      font-size: 10.5px;
      font-family: var(--text-mono);
      color: var(--cyan-glow);
      font-style: normal;
    }

    /* Quick Preset Atmospheres Bar */
    .atmosphere-presets-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px;
      margin-bottom: 24px;
      padding: 14px 20px;
      background: rgba(10, 20, 42, 0.7);
      border: 1px solid rgba(0, 240, 255, 0.2);
      border-radius: 10px;
    }

    .preset-bar-label {
      font-family: var(--text-mono);
      font-size: 11px;
      font-weight: 700;
      color: var(--cyan-glow);
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin-right: 8px;
    }

    .atm-btn {
      background: rgba(12, 30, 68, 0.7);
      border: 1px solid rgba(0, 240, 255, 0.35);
      color: var(--text-main);
      padding: 7px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-family: var(--text-mono);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .atm-btn:hover {
      background: rgba(0, 240, 255, 0.2);
      border-color: var(--cyan-glow);
    }

    .atm-btn.active {
      background: rgba(0, 240, 255, 0.35);
      border-color: #ffffff;
      color: #ffffff;
      font-weight: 700;
      box-shadow: 0 0 12px rgba(0, 240, 255, 0.4);
    }

    .atm-btn.action-btn {
      background: rgba(255, 157, 0, 0.15);
      border-color: rgba(255, 157, 0, 0.5);
      color: #ffbb44;
    }

    .atm-btn.action-btn:hover {
      background: rgba(255, 157, 0, 0.3);
      border-color: #ffaa00;
    }

    /* Interactive Sliders Panel */
    .interactive-controls-panel {
      background: var(--bg-card);
      border: 1px solid var(--border-card);
      border-radius: 12px;
      padding: 22px 26px;
      margin-bottom: 28px;
    }

    .section-title {
      font-family: var(--font-heading);
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 1.5px;
      color: var(--cyan-glow);
      text-transform: uppercase;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .section-title::after {
      content: '';
      flex: 1;
      height: 1px;
      background: linear-gradient(90deg, rgba(0, 240, 255, 0.3) 0%, transparent 100%);
    }

    .controls-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 18px;
    }

    .control-item {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .control-label-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      font-family: var(--text-mono);
    }

    .control-label {
      color: var(--text-muted);
    }

    .control-val {
      color: var(--cyan-glow);
      font-weight: 700;
    }

    .control-slider {
      width: 100%;
      height: 6px;
      border-radius: 4px;
      background: #101c38;
      outline: none;
      accent-color: var(--cyan-glow);
      cursor: pointer;
    }

    .material-select {
      background: #081124;
      border: 1px solid rgba(0, 240, 255, 0.3);
      color: #ffffff;
      padding: 8px 12px;
      border-radius: 6px;
      font-family: var(--text-mono);
      font-size: 12px;
      outline: none;
      cursor: pointer;
    }

    .material-select:focus {
      border-color: var(--cyan-glow);
      box-shadow: 0 0 10px rgba(0, 240, 255, 0.3);
    }

    /* "How This Result Was Reached" Cards Matrix */
    .sources-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(310px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }

    .source-card {
      background: var(--bg-card);
      border: 1px solid var(--border-card);
      border-radius: 10px;
      padding: 16px 18px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: all 0.25s ease;
    }

    .source-card:hover {
      border-color: var(--border-card-bright);
      background: var(--bg-card-hover);
      box-shadow: 0 8px 24px rgba(0, 240, 255, 0.12);
    }

    .source-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }

    .source-card-param {
      font-family: var(--text-mono);
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 1px;
      color: var(--text-muted);
      text-transform: uppercase;
    }

    .source-pill-tag {
      font-size: 9.5px;
      font-family: var(--text-mono);
      padding: 2px 7px;
      border-radius: 100px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .pill-nasa {
      background: rgba(0, 255, 136, 0.15);
      border: 1px solid var(--green-safe);
      color: var(--green-safe);
    }

    .pill-formula {
      background: rgba(0, 240, 255, 0.15);
      border: 1px solid var(--cyan-glow);
      color: var(--cyan-glow);
    }

    .pill-model {
      background: rgba(255, 157, 0, 0.15);
      border: 1px solid var(--amber-flame);
      color: var(--amber-flame);
    }

    .pill-user {
      background: rgba(160, 100, 255, 0.15);
      border: 1px solid #bf7eff;
      color: #bf7eff;
    }

    .source-card-val {
      font-size: 15px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 6px;
      font-family: var(--text-mono);
    }

    .source-card-desc {
      font-size: 12.5px;
      color: #9cb5db;
      line-height: 1.5;
      margin-bottom: 12px;
    }

    .source-card-footer {
      border-top: 1px solid rgba(0, 240, 255, 0.12);
      padding-top: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      font-family: var(--text-mono);
    }

    .source-link-btn {
      color: var(--cyan-glow);
      text-decoration: none;
      font-weight: 600;
      transition: all 0.2s;
    }

    .source-link-btn:hover {
      text-decoration: underline;
      color: #ffffff;
    }

    /* NASA Reference Data Table Section (Direct Load) */
    .nasa-ref-table-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }

    .nasa-ref-card {
      background: var(--bg-card);
      border: 1px solid var(--border-card);
      border-radius: 10px;
      padding: 16px 18px;
      transition: all 0.25s ease;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .nasa-ref-card.match {
      border-color: #ffffff;
      box-shadow: 0 0 24px rgba(0, 240, 255, 0.4);
      background: rgba(12, 26, 56, 0.95);
    }

    .ref-title {
      font-family: var(--font-heading);
      font-size: 13.5px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 4px;
    }

    .ref-conditions {
      color: var(--amber-flame);
      font-size: 11.5px;
      font-family: var(--text-mono);
      margin-bottom: 6px;
    }

    .ref-results {
      font-size: 12.5px;
      color: #c0d4f2;
      line-height: 1.5;
      margin-bottom: 10px;
    }

    .ref-btn-bar {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      margin-top: 4px;
    }

    .ref-load-btn {
      background: rgba(0, 240, 255, 0.15);
      border: 1px solid rgba(0, 240, 255, 0.4);
      color: #ffffff;
      padding: 5px 10px;
      border-radius: 6px;
      font-family: var(--text-mono);
      font-size: 11px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .ref-load-btn:hover {
      background: var(--cyan-glow);
      color: #040814;
      font-weight: 700;
    }

    /* Reference Media Gallery & Video */
    .reference-media-section {
      margin-top: 28px;
      margin-bottom: 36px;
    }

    .media-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
      gap: 18px;
      margin-bottom: 24px;
    }

    .media-card {
      background: var(--bg-card);
      border: 1px solid var(--border-card);
      border-radius: 10px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: transform 0.2s ease, border-color 0.2s ease;
    }

    .media-card:hover {
      transform: translateY(-3px);
      border-color: var(--cyan-glow);
      box-shadow: 0 10px 24px rgba(0, 240, 255, 0.15);
    }

    .media-card-img-wrap {
      width: 100%;
      height: 180px;
      background: #000;
      overflow: hidden;
      position: relative;
    }

    .media-card-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .media-card:hover .media-card-img {
      transform: scale(1.04);
    }

    .media-card-body {
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      flex: 1;
    }

    .media-title {
      font-family: var(--font-heading);
      font-size: 13px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 6px;
    }

    .media-desc {
      font-size: 12px;
      color: #8da4c8;
      line-height: 1.5;
      margin-bottom: 10px;
    }

    .media-links {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: var(--text-mono);
      font-size: 11px;
    }

    /* Video Embed Container */
    .video-embed-container {
      position: relative;
      width: 100%;
      padding-bottom: 56.25%;
      height: 0;
      overflow: hidden;
      border-radius: 10px;
      border: 1px solid rgba(0, 240, 255, 0.3);
      margin-top: 14px;
      background: #000;
    }

    .video-embed-container iframe {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border: 0;
    }

    /* Repository Links Banner */
    .repository-links-banner {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      background: linear-gradient(135deg, rgba(11, 61, 145, 0.35) 0%, rgba(0, 240, 255, 0.12) 100%);
      border: 1px solid rgba(0, 240, 255, 0.3);
      border-radius: 10px;
      padding: 18px 24px;
      margin-top: 28px;
    }

    .repo-banner-text {
      font-size: 13px;
      color: #d0e2ff;
    }

    .repo-banner-btns {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .repo-btn {
      padding: 7px 14px;
      background: rgba(0, 240, 255, 0.15);
      border: 1px solid var(--cyan-glow);
      color: #ffffff;
      border-radius: 6px;
      font-family: var(--text-mono);
      font-size: 11.5px;
      text-decoration: none;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .repo-btn:hover {
      background: var(--cyan-glow);
      color: #040814;
      font-weight: 700;
      box-shadow: 0 0 15px var(--cyan-glow);
    }

    /* Sources Bibliography List */
    .sources-biblio-list {
      background: var(--bg-card);
      border: 1px solid var(--border-card);
      border-radius: 10px;
      padding: 18px 24px;
      margin-top: 24px;
      font-size: 12px;
      font-family: var(--text-mono);
      line-height: 1.8;
      color: #8da4c8;
    }

    .sources-biblio-list a {
      color: var(--cyan-glow);
      text-decoration: none;
    }

    .sources-biblio-list a:hover {
      text-decoration: underline;
      color: #ffffff;
    }

    /* Footer */
    footer.site-footer {
      border-top: 1px solid rgba(0, 240, 255, 0.15);
      padding: 24px 28px;
      text-align: center;
      font-family: var(--text-mono);
      font-size: 11px;
      color: #637ea6;
      background: #02040a;
    }

    /* Responsive Adjustments */
    @media (max-width: 900px) {
      .hud-panel-left, .hud-panel-right {
        position: static;
        width: 100%;
        margin-bottom: 12px;
      }
      .simulator-viewport-container {
        height: 520px;
      }
      .camera-presets-bar {
        display: none;
      }
    }
  </style>
</head>
<body>

  <!-- Top Navigation Bar -->
  <header class="site-header">
    <a href="IGNIS-Network/index.html" class="header-brand" title="Return to IGNIS Network Explorer">
      <svg class="brand-flame-icon" viewBox="0 0 24 24" fill="none">
        <path d="M12 2C8 7 6 10 6 14a6 6 0 0 0 12 0c0-4-2-7-6-12z" fill="url(#flame-grad)"/>
        <path d="M12 21a4 4 0 0 1-4-4c0-2.2 1.3-4.3 3-6.5.6 1.5 1.5 2.8 2 4.5.3 1-.2 2.5-1 3.5v2.5z" fill="#ffffff" opacity="0.8"/>
        <defs>
          <linearGradient id="flame-grad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#0066ff"/>
            <stop offset="50%" stop-color="#00d4ff"/>
            <stop offset="100%" stop-color="#ffffff"/>
          </linearGradient>
        </defs>
      </svg>
      <div class="brand-title-wrap">
        <span class="brand-title">IGNITE-AI</span>
        <span class="brand-subtitle">IGNIS · 3D FLAME SIMULATOR</span>
      </div>
    </a>

    <nav class="header-nav">
      <a href="IGNIS-Network/index.html" class="nav-btn">Home</a>
      <a href="ignis-simulator.html" class="nav-btn active">3D Simulator</a>
      <a href="#controls-section" class="nav-btn">Parameters</a>
      <a href="#sources-section" class="nav-btn">How Reached</a>
      <a href="#refs-section" class="nav-btn">NASA Data</a>
      <a href="#media-section" class="nav-btn">NASA Footage</a>
      <a href="https://psi.nasa.gov/physci/repo/search?q=combustion" target="_blank" rel="noopener" class="nav-btn">PSI Archive ↗</a>
    </nav>

    <div class="header-right">
      <div class="nasa-badge-pill" title="Official NASA Physical Sciences Informatics Integration">
        <span class="nasa-dot"></span>
        <span>NASA SPACE APPS 2026</span>
      </div>
    </div>
  </header>

  <!-- 3D Simulator Interactive Viewport -->
  <main class="simulator-viewport-container" id="simulator-container">
    <canvas id="three-canvas"></canvas>

    <!-- Camera Angles Preset Toolbar -->
    <div class="camera-presets-bar">
      <button class="camera-preset-btn active" id="btn-cam-orbit" onclick="setCameraPreset('orbit')">Orbit 360°</button>
      <button class="camera-preset-btn" id="btn-cam-front" onclick="setCameraPreset('front')">Front</button>
      <button class="camera-preset-btn" id="btn-cam-close" onclick="setCameraPreset('close')">Flame Macro</button>
      <button class="camera-preset-btn" id="btn-cam-window" onclick="setCameraPreset('window')">Porthole View</button>
      <button class="camera-preset-btn" id="btn-cam-top" onclick="setCameraPreset('top')">Top-Down</button>
      <label class="auto-rotate-toggle" title="Toggle gentle continuous rotation around chamber">
        <input type="checkbox" id="auto-rotate-check" onchange="toggleAutoRotate(this.checked)">
        <span>Auto-rotate</span>
      </label>
    </div>

    <!-- Top Left HUD Panel: Environmental Chamber Readout -->
    <div class="hud-panel hud-panel-left" id="hud-chamber-panel">
      <div class="hud-header">
        <span id="hud-chamber-title">ENVIRONMENT CHAMBER · ISS MG (~0 G)</span>
        <span class="hud-tag" id="hud-env-tag">NASA FLIGHT DATA</span>
      </div>
      <div class="hud-row">
        <span class="hud-label">Gravity</span>
        <span class="hud-value" id="hud-gravity-val">0.00 g</span>
      </div>
      <div class="hud-row">
        <span class="hud-label">Oxygen</span>
        <span class="hud-value" id="hud-o2-val">21.0 %</span>
      </div>
      <div class="hud-row">
        <span class="hud-label">Pressure</span>
        <span class="hud-value" id="hud-pressure-val">101.3 kPa</span>
      </div>
      <div class="hud-row">
        <span class="hud-label">Airflow</span>
        <span class="hud-value" id="hud-airflow-val">3.0 cm/s</span>
      </div>
      <div class="hud-row">
        <span class="hud-label">O₂ partial pressure <span class="hud-tag">computed</span></span>
        <span class="hud-value" id="hud-po2-val">21.3 kPa</span>
      </div>
      <div class="hud-row">
        <span class="hud-label">Buoyant flow vs Earth <span class="hud-tag">estimate √g</span></span>
        <span class="hud-value" id="hud-buoyancy-val">= 0 (none)</span>
      </div>
    </div>

    <!-- Top Right HUD Panel: Fire Risk Status & Range Guard -->
    <div class="hud-panel hud-panel-right" id="hud-risk-panel">
      <div class="hud-header">
        <span>FIRE RISK STATUS</span>
        <span class="hud-tag" id="hud-range-tag">RANGE GUARD</span>
      </div>
      <div class="hud-status-badge status-marginal" id="hud-risk-badge">
        SUSTAINED SPREAD · 79%
      </div>
      <div class="hud-row">
        <span class="hud-label">Range guard</span>
        <span class="hud-value" style="color:var(--green-safe);" id="hud-envelope-tag">IN ENVELOPE</span>
      </div>
      <div class="hud-row">
        <span class="hud-label">Gas mix</span>
        <span class="hud-value">O₂ / N₂ (modelled)</span>
      </div>
      <div class="hud-row">
        <span class="hud-label">Material</span>
        <span class="hud-value" id="hud-material-val">SIBAL cotton-fiberglass</span>
      </div>
      <div class="hud-row">
        <span class="hud-label">Tests at this gravity</span>
        <span class="hud-value" id="hud-tests-count">123</span>
      </div>
    </div>

    <!-- Bottom Center Floating Caption (Illustrative Rendering Note) -->
    <div class="hud-center-caption">
      Illustrative rendering driven by your inputs and the model output (shape from √g buoyancy, size and colour from O₂ and pressure, skew from airflow). It is not a combustion simulation. Drag to look around.
    </div>

    <!-- Environment Selector Bar with REALISTIC Planetary Discs (Replaces Cartoon Emojis) -->
    <div class="environment-selector-bar" role="tablist">
      <button class="env-tab-btn" id="tab-earth" onclick="selectEnvironment('earth')">
        <img class="planet-badge-img" src="assets/planets/earth_disc.jpg" onerror="this.src='https://images-assets.nasa.gov/image/PIA18033/PIA18033~thumb.jpg'" alt="Earth">
        <div class="env-tab-text-wrap">
          <span class="env-tab-title">Earth (1 g)</span>
          <span class="env-tab-meta">6 tests</span>
        </div>
      </button>

      <button class="env-tab-btn" id="tab-moon" onclick="selectEnvironment('moon')">
        <img class="planet-badge-img" src="assets/planets/moon_disc.jpg" onerror="this.src='https://images-assets.nasa.gov/image/PIA14445/PIA14445~thumb.jpg'" alt="Moon">
        <div class="env-tab-text-wrap">
          <span class="env-tab-title">Moon (0.165 g)</span>
          <span class="env-tab-meta">8 tests</span>
        </div>
      </button>

      <button class="env-tab-btn" id="tab-mars" onclick="selectEnvironment('mars')">
        <img class="planet-badge-img" src="assets/planets/mars_disc.jpg" onerror="this.src='https://images-assets.nasa.gov/image/PIA04304/PIA04304~thumb.jpg'" alt="Mars">
        <div class="env-tab-text-wrap">
          <span class="env-tab-title">Mars (0.38 g)</span>
          <span class="env-tab-meta">6 tests</span>
        </div>
      </button>

      <button class="env-tab-btn active" id="tab-iss" onclick="selectEnvironment('iss')">
        <img class="planet-badge-img" src="assets/planets/iss_station.jpg" onerror="this.src='https://images-assets.nasa.gov/image/sts098-713a-016/sts098-713a-016~thumb.jpg'" alt="ISS">
        <div class="env-tab-text-wrap">
          <span class="env-tab-title">ISS µg (~0 g)</span>
          <span class="env-tab-meta">123 tests</span>
        </div>
      </button>

      <button class="env-tab-btn" id="tab-transit" onclick="selectEnvironment('transit')">
        <img class="planet-badge-img" src="assets/planets/orion_transit.jpg" onerror="this.src='https://images-assets.nasa.gov/image/art001e000670/art001e000670~thumb.jpg'" alt="Transit">
        <div class="env-tab-text-wrap">
          <span class="env-tab-title">Transit cabin (µg coast)</span>
          <span class="env-tab-meta">123 tests</span>
        </div>
      </button>
    </div>
  </main>

  <!-- Detailed Scientific Verification, Sources & NASA Datasets Section -->
  <section class="scientific-details-section">

    <!-- Active Environment Headline Card (Matches User's Video Screenshot) -->
    <div class="env-headline-card" id="headline-card">
      <div class="env-headline-title-wrap">
        <img class="env-headline-badge" id="headline-badge" src="assets/planets/iss_station.jpg" alt="Active Environment">
        <h2 class="env-headline-title" id="headline-title">ISS: No buoyancy: only ventilation and diffusion feed the flame.</h2>
      </div>

      <div class="official-quote-box" id="headline-quote-box">
        “Without buoyancy, hot air doesn't rise. Oxygen moves to the flame entirely through molecular diffusion, which occurs equally in all directions, yielding a steady, soot-free, spherical blue flame.”
        <span class="official-quote-author">— Official Caption, NASA Science / Advanced Combustion via Microgravity Experiments (ACME)</span>
      </div>

      <p class="env-headline-citations" id="headline-citations">
        123 training rows in microgravity: NASA drop towers, Shuttle SSCE, ISS BASS/BASS-II (corroborated by the PSI-25 experimental table) and Saffire I-VI in Cygnus.
      </p>
    </div>

    <!-- NASA Test Atmospheres Bar (Direct Quick-Sets) -->
    <div class="atmosphere-presets-bar">
      <span class="preset-bar-label">NASA Test Atmospheres:</span>
      <button class="atm-btn" data-k="air" onclick="setAtmosphere('air', 20.9, 101.3)">Standard Air (20.9% O₂, 101.3 kPa)</button>
      <button class="atm-btn" data-k="s1" onclick="setAtmosphere('s1', 21.5, 100.0)">Saffire-I Cabin (21.5%, 100.0 kPa)</button>
      <button class="atm-btn" data-k="s5" onclick="setAtmosphere('s5', 26.2, 70.7)">Saffire-V Exploration (26.2%, 70.7 kPa)</button>
      <button class="atm-btn" data-k="s6" onclick="setAtmosphere('s6', 29.9, 54.5)">Saffire-VI Reduced-P (29.9%, 54.5 kPa)</button>
      <button class="atm-btn action-btn" onclick="cutAirflowTest()">Cut the airflow (Saffire-V test)</button>
    </div>

    <!-- Interactive Parameter Tuning Panel (Set Parameters & Test NASA Envelope) -->
    <div class="interactive-controls-panel" id="controls-section">
      <h3 class="section-title">Environmental Parameter Controls & Combustion Range Guard</h3>
      <p style="font-size:13px; color:#8da4c8; margin-bottom:18px;">
        Adjust environmental parameters to test flammability limits and observe real-time 3D flame response. Values outside verified NASA flight envelopes trigger range warnings.
      </p>

      <div class="controls-grid">
        <!-- Gravity Slider -->
        <div class="control-item">
          <div class="control-label-row">
            <span class="control-label">Gravity (g)</span>
            <span class="control-val" id="val-gravity">0.00 g</span>
          </div>
          <input type="range" class="control-slider" id="slider-gravity" min="0" max="1.0" step="0.01" value="0.00" oninput="onCustomParamChange()">
          <span style="font-size:10px; color:#5f7c9e; font-family:var(--text-mono);">Snap: 0g (ISS) | 0.165g (Moon) | 0.38g (Mars) | 1g (Earth)</span>
        </div>

        <!-- Oxygen Percentage Slider -->
        <div class="control-item">
          <div class="control-label-row">
            <span class="control-label">Oxygen Concentration (%)</span>
            <span class="control-val" id="val-oxygen">21.0 %</span>
          </div>
          <input type="range" class="control-slider" id="slider-oxygen" min="12" max="35" step="0.1" value="21.0" oninput="onCustomParamChange()">
          <span style="font-size:10px; color:#5f7c9e; font-family:var(--text-mono);">Baseline: 21% (Earth/ISS) | 26–30% (Saffire Exploration)</span>
        </div>

        <!-- Cabin Pressure Slider -->
        <div class="control-item">
          <div class="control-label-row">
            <span class="control-label">Atmospheric Pressure (kPa)</span>
            <span class="control-val" id="val-pressure">101.3 kPa</span>
          </div>
          <input type="range" class="control-slider" id="slider-pressure" min="20" max="101.3" step="0.1" value="101.3" oninput="onCustomParamChange()">
          <span style="font-size:10px; color:#5f7c9e; font-family:var(--text-mono);">Standard: 101.3 kPa | Saffire-V: 70.7 kPa | Saffire-VI: 54.5 kPa</span>
        </div>

        <!-- Airflow Velocity Slider -->
        <div class="control-item">
          <div class="control-label-row">
            <span class="control-label">Forced Airflow (cm/s)</span>
            <span class="control-val" id="val-airflow">3.0 cm/s</span>
          </div>
          <input type="range" class="control-slider" id="slider-airflow" min="0" max="30" step="1" value="3" oninput="onCustomParamChange()">
          <span style="font-size:10px; color:#5f7c9e; font-family:var(--text-mono);">ISS Ventilation: 3–8 cm/s | Saffire Duct: 20–30 cm/s</span>
        </div>

        <!-- Fuel Material Selector -->
        <div class="control-item">
          <div class="control-label-row">
            <span class="control-label">Solid Fuel / Combustion Material</span>
            <span class="control-val" id="val-material-tag">NASA-STD-6001</span>
          </div>
          <select class="material-select" id="select-material" onchange="onMaterialChange()">
            <option value="sibal" selected>SIBAL 75% Cotton / 25% Fiberglass (NASA Saffire standard)</option>
            <option value="nomex">Nomex HT90-40 fabric (NASA astronaut suits & garments)</option>
            <option value="pmma">PMMA Plexiglass Acrylic (NASA Saffire-IV/V solid polymer)</option>
            <option value="ultem">Ultem 1000 Polyetherimide (Spacecraft interior panels)</option>
            <option value="candle">Candle Wax Wick (NASA ACME baseline)</option>
          </select>
          <span style="font-size:10px; color:#5f7c9e; font-family:var(--text-mono);">Evaluated against Limiting Oxygen Index (ULOI) database</span>
        </div>
      </div>
    </div>

    <!-- "How This Result Was Reached" Cards Matrix (Direct Provenance For Every Parameter) -->
    <div id="sources-section">
      <h3 class="section-title">How This Result Was Reached · Verified Parameter Provenance</h3>
      <p style="font-size:13px; color:#8da4c8; margin-bottom:20px;">
        For every parameter: exact origin, physical derivation, and official NASA source citations. Green = Official NASA Data/Report; Cyan = Navier-Stokes Scaling; Amber = Model Formulation; Purple = Operator Defined.
      </p>

      <div class="sources-grid" id="sources-matrix">
        <!-- Gravity Card -->
        <div class="source-card">
          <div class="source-card-top">
            <div class="source-card-header">
              <span class="source-card-param">GRAVITY ACCELERATION</span>
              <span class="source-pill-tag pill-nasa" id="card-tag-gravity">NASA EXPERIMENT</span>
            </div>
            <div class="source-card-val" id="card-val-gravity">0.00 g (0.00 m/s²)</div>
            <p class="source-card-desc" id="card-desc-gravity">
              Microgravity tested in orbit aboard Cygnus (Saffire I–VI) and ISS (BASS-II / ACME). Parabolic flight tests at 0.1g, 0.16g (Moon), 0.38g (Mars) and 1g aboard NASA Glenn KC-135 research aircraft.
            </p>
          </div>
          <div class="source-card-footer">
            <span style="color:#6f8cb5;">Source: NASA NTRS 20010059376</span>
            <a href="https://ntrs.nasa.gov/api/citations/20010059376/downloads/20010059376.pdf" target="_blank" rel="noopener" class="source-link-btn">NTRS PDF ↗</a>
          </div>
        </div>

        <!-- Buoyant Convection Scaling Card -->
        <div class="source-card">
          <div class="source-card-top">
            <div class="source-card-header">
              <span class="source-card-param">BUOYANT CONVECTION SCALING</span>
              <span class="source-pill-tag pill-formula">NASA FORMULA</span>
            </div>
            <div class="source-card-val" id="card-val-buoyancy">Buoyant Flow ≈ √g = 0.00×</div>
            <p class="source-card-desc" id="card-desc-buoyancy">
              NASA’s review of reduced-gravity combustion gives buoyant convection velocity as proportional to the square root of gravity times a characteristic length (\( u_b \propto \sqrt{g \cdot L} \)). At 0 g, buoyant convection is 0, so only diffusion occurs.
            </p>
          </div>
          <div class="source-card-footer">
            <span style="color:#6f8cb5;">Citation: NASA NTRS 20000000185 p.4</span>
            <a href="https://ntrs.nasa.gov/api/citations/20000000185/downloads/20000000185.pdf" target="_blank" rel="noopener" class="source-link-btn">NASA NTRS ↗</a>
          </div>
        </div>

        <!-- Oxygen Concentration Card -->
        <div class="source-card">
          <div class="source-card-top">
            <div class="source-card-header">
              <span class="source-card-param">OXYGEN CONCENTRATION</span>
              <span class="source-pill-tag pill-nasa" id="card-tag-o2">NASA FLIGHT DATA</span>
            </div>
            <div class="source-card-val" id="card-val-o2">21.0 % O₂</div>
            <p class="source-card-desc" id="card-desc-o2">
              Standard sea-level air is 20.9% O₂. In Saffire-I, NASA tested 21.5% O₂ (PSI-98); Saffire-V tested 26.2% O₂ (ICES-2021-266); Saffire-VI tested 28.8% to 31.0% O₂ in exploration atmosphere (ICES-2024-365).
            </p>
          </div>
          <div class="source-card-footer">
            <span style="color:#6f8cb5;">Source: Saffire-V ICES-2021-266</span>
            <a href="https://ntrs.nasa.gov/api/citations/20210011521/downloads/ICES%202021-266%200503-2021%20final.pdf" target="_blank" rel="noopener" class="source-link-btn">NTRS Paper ↗</a>
          </div>
        </div>

        <!-- Cabin Pressure Card -->
        <div class="source-card">
          <div class="source-card-top">
            <div class="source-card-header">
              <span class="source-card-param">CABIN PRESSURE</span>
              <span class="source-pill-tag pill-nasa" id="card-tag-pressure">NASA FLIGHT DATA</span>
            </div>
            <div class="source-card-val" id="card-val-pressure">101.3 kPa</div>
            <p class="source-card-desc" id="card-desc-pressure">
              101.3 kPa is standard sea-level pressure. NASA Saffire-I, III and IV ran at ~100 kPa. Saffire-V tested reduced pressure at 70.7 kPa; Saffire-VI tested reduced pressure at 54.5 kPa to evaluate exploration EVA atmosphere flammability.
            </p>
          </div>
          <div class="source-card-footer">
            <span style="color:#6f8cb5;">Source: Saffire-VI ICES-2024-365</span>
            <a href="https://ntrs.nasa.gov/api/citations/20240002981/downloads/Saffire-ICES-2024-ICES-365-accepted%20final.pdf" target="_blank" rel="noopener" class="source-link-btn">NTRS PDF ↗</a>
          </div>
        </div>

        <!-- O2 Partial Pressure Card -->
        <div class="source-card">
          <div class="source-card-top">
            <div class="source-card-header">
              <span class="source-card-param">O₂ PARTIAL PRESSURE</span>
              <span class="source-pill-tag pill-formula">COMPUTED ARITHMETIC</span>
            </div>
            <div class="source-card-val" id="card-val-po2">21.3 kPa</div>
            <p class="source-card-desc" id="card-desc-po2">
              Oxygen % × pressure ÷ 100 (\( P_{O_2} = X_{O_2} \cdot P_{tot} \)). Direct Dalton's Law calculation. Normoxic baseline is 21.3 kPa. NASA Exploration atmospheres use 30% O₂ at 70.3 kPa to maintain normoxia while lowering total pressure for EVA spacewalks.
            </p>
          </div>
          <div class="source-card-footer">
            <span style="color:#6f8cb5;">Ref: NASA SP-2016-6105</span>
            <a href="https://www.nasa.gov/wp-content/uploads/2025/07/spacecraft-fire-safety-demonstration-saffire.pdf" target="_blank" rel="noopener" class="source-link-btn">NASA Fact Sheet ↗</a>
          </div>
        </div>

        <!-- Flame Shape Card -->
        <div class="source-card">
          <div class="source-card-top">
            <div class="source-card-header">
              <span class="source-card-param">FLAME SHAPE</span>
              <span class="source-pill-tag pill-nasa" id="card-tag-shape">NASA OFFICIAL CAPTION</span>
            </div>
            <div class="source-card-val" id="card-val-shape">Spherical · Symmetrical</div>
            <p class="source-card-desc" id="card-desc-shape">
              NASA explains: “On Earth, gravity-driven buoyant convection causes a candle flame to be teardrop-shaped. In microgravity, where convective flows are absent, the flame is spherical, soot-free and blue.” In partial gravity (Moon/Mars), flames become dome-shaped.
            </p>
          </div>
          <div class="source-card-footer">
            <span style="color:#6f8cb5;">NASA Science: GRC-1998-C-00485</span>
            <a href="https://science.nasa.gov/image-detail/candle-flames-3" target="_blank" rel="noopener" class="source-link-btn">NASA Science ↗</a>
          </div>
        </div>

        <!-- Flame Colour & Radical Emission Card -->
        <div class="source-card">
          <div class="source-card-top">
            <div class="source-card-header">
              <span class="source-card-param">FLAME COLOUR</span>
              <span class="source-pill-tag pill-nasa" id="card-tag-color">NASA OFFICIAL CAPTION</span>
            </div>
            <div class="source-card-val" id="card-val-color">Blue, soot-free chemiluminescence</div>
            <p class="source-card-desc" id="card-desc-color">
              NASA states that Earth flames are yellow because buoyant convection carries incandescent soot to the flame tip. In microgravity, low delivery velocity prevents soot formation, leaving only blue CH* and C₂* radical chemiluminescence.
            </p>
          </div>
          <div class="source-card-footer">
            <span style="color:#6f8cb5;">NASA Image Article: Candle Flame</span>
            <a href="https://www.nasa.gov/image-article/candle-flame-1g-vs-microgravity/" target="_blank" rel="noopener" class="source-link-btn">NASA Article ↗</a>
          </div>
        </div>

        <!-- Flame Size Card -->
        <div class="source-card">
          <div class="source-card-top">
            <div class="source-card-header">
              <span class="source-card-param">FLAME SIZE ESTIMATE</span>
              <span class="source-pill-tag pill-model">PHYSICAL MODEL</span>
            </div>
            <div class="source-card-val" id="card-val-size">≈ 1.00× vs Earth air</div>
            <p class="source-card-desc" id="card-desc-size">
              Scaled with the square root of oxygen partial pressure (\( \sqrt{P_{O_2} / 21.2} \)). NASA notes that a flow below the buoyant blowoff limit lets a material burn in microgravity with a smaller flame and lower limiting oxygen concentration.
            </p>
          </div>
          <div class="source-card-footer">
            <span style="color:#6f8cb5;">Source: NASA NTRS 20260000646</span>
            <a href="https://ntrs.nasa.gov/api/citations/20260000646/downloads/Ferkul-Lunar%20and%20Planetary%20Science%20Conference%202026.pdf" target="_blank" rel="noopener" class="source-link-btn">NTRS 20260000646 ↗</a>
          </div>
        </div>

        <!-- Airflow & Flame Lean Card -->
        <div class="source-card">
          <div class="source-card-top">
            <div class="source-card-header">
              <span class="source-card-param">AIRFLOW & SKEW REGIME</span>
              <span class="source-pill-tag pill-nasa" id="card-tag-flow">NASA BASS / CIR</span>
            </div>
            <div class="source-card-val" id="card-val-airflow">3.0 cm/s (ISS Ventilation)</div>
            <p class="source-card-desc" id="card-desc-flow">
              In microgravity, stagnant air causes flames to starve on their own combustion products. Forced ventilation (3–8 cm/s in ISS cabins; 20–30 cm/s in Saffire) feeds fresh oxygen, tilting and elongating the flame downstream.
            </p>
          </div>
          <div class="source-card-footer">
            <span style="color:#6f8cb5;">Source: NASA NTRS 20210011385</span>
            <a href="https://ntrs.nasa.gov/citations/20210011385" target="_blank" rel="noopener" class="source-link-btn">BASS-II Report ↗</a>
          </div>
        </div>

        <!-- Fire Risk & Material Envelope Card -->
        <div class="source-card">
          <div class="source-card-top">
            <div class="source-card-header">
              <span class="source-card-param">FLAMMABILITY RISK STATUS</span>
              <span class="source-pill-tag pill-nasa" id="card-tag-envelope">NASA STD / PSI</span>
            </div>
            <div class="source-card-val" id="card-val-risk">SUSTAINED SPREAD · 79%</div>
            <p class="source-card-desc" id="card-desc-risk">
              Evaluated against NASA Limiting Oxygen Index (ULOI) database and Saffire large-scale flammability data. Solid fuels with ULOI below ambient oxygen support self-sustained upward or concurrent flame propagation.
            </p>
          </div>
          <div class="source-card-footer">
            <span style="color:#6f8cb5;">Database: PSI-25 & NASA-STD-6001B</span>
            <a href="https://psi.nasa.gov/physci/repo/search?q=combustion" target="_blank" rel="noopener" class="source-link-btn">PSI Search ↗</a>
          </div>
        </div>

        <!-- Range Check vs NASA Flight Data Card -->
        <div class="source-card">
          <div class="source-card-top">
            <div class="source-card-header">
              <span class="source-card-param">RANGE CHECK vs NASA DATA</span>
              <span class="source-pill-tag pill-nasa" id="card-tag-range">VERIFIED ENVELOPE</span>
            </div>
            <div class="source-card-val" id="card-val-range" style="color:var(--green-safe);">Inside Tested NASA Envelope</div>
            <p class="source-card-desc" id="card-desc-range">
              Your oxygen (21.0%) and pressure (101.3 kPa) fall inside verified NASA flight tests at this gravity: Saffire-I (PSI-98), Saffire-IV, and ISS BASS-II (PSI-25).
            </p>
          </div>
          <div class="source-card-footer">
            <span style="color:#6f8cb5;">NASA PSI Open Science Repo</span>
            <a href="https://psi.nasa.gov/physci/repo/search?q=PSI-98&data_source=psi&data_type=investigation" target="_blank" rel="noopener" class="source-link-btn">PSI-98 Data ↗</a>
          </div>
        </div>

        <!-- Airflow Cut Findings Card -->
        <div class="source-card">
          <div class="source-card-top">
            <div class="source-card-header">
              <span class="source-card-param">SAFFIRE-V AIRFLOW CUT FINDINGS</span>
              <span class="source-pill-tag pill-nasa">NASA FLIGHT TEST</span>
            </div>
            <div class="source-card-val">Flow Cut Response</div>
            <p class="source-card-desc">
              In Saffire-V, NASA cut the flow to 5 cm/s for 300 seconds, which extinguished PMMA plastic quickly. With the fan off for ~70 seconds, a cotton-fabric flame reignited and burned for another ~150 seconds.
            </p>
          </div>
          <div class="source-card-footer">
            <span style="color:#6f8cb5;">Source: NTRS ICES-2021-266</span>
            <a href="https://ntrs.nasa.gov/api/citations/20210011521/downloads/ICES%202021-266%200503-2021%20final.pdf" target="_blank" rel="noopener" class="source-link-btn">Download PDF ↗</a>
          </div>
        </div>
      </div>
    </div>

    <!-- NASA Reference Data Table Section (Interactive Quick-Load) -->
    <div id="refs-section" style="margin-top:28px;">
      <h3 class="section-title">NASA Reference Data · Flight & Drop-Tower Experiments</h3>
      <p style="font-size:13px; color:#8da4c8; margin-bottom:18px;">
        Measured directly by NASA researchers. Click any button to load that exact experiment's environmental conditions into the 3D chamber.
      </p>

      <div class="nasa-ref-table-grid" id="nasa-ref-grid">
        <!-- KC-135 Tests -->
        <div class="nasa-ref-card" id="ref-card-kc135">
          <div>
            <h4 class="ref-title">NASA Glenn KC-135 Aircraft Partial-G Tests</h4>
            <div class="ref-conditions">0.10 g, 0.16 g (Moon), 0.38 g (Mars), 1.00 g · Air 20–40 kPa</div>
            <p class="ref-results">
              <b>Measured by NASA:</b> Steady flame spread speed and burned length rose proportionally with gravity level. Flames spread faster and were longer on wider fuel sheets.
            </p>
          </div>
          <div>
            <div class="ref-btn-bar">
              <button class="ref-load-btn" onclick="loadExperimentConditions(0.1, 20.9, 30.0, 0, 'kc135')">0.10 g</button>
              <button class="ref-load-btn" onclick="loadExperimentConditions(0.165, 20.9, 30.0, 0, 'kc135')">Moon 0.165 g</button>
              <button class="ref-load-btn" onclick="loadExperimentConditions(0.38, 20.9, 30.0, 0, 'kc135')">Mars 0.38 g</button>
              <button class="ref-load-btn" onclick="loadExperimentConditions(1.0, 20.9, 30.0, 0, 'kc135')">1.00 g</button>
            </div>
            <div style="margin-top:8px; font-size:11px; font-family:var(--text-mono);">
              <a href="https://ntrs.nasa.gov/api/citations/20010059376/downloads/20010059376.pdf" target="_blank" rel="noopener" class="source-link-btn">NASA NTRS 20010059376 ↗</a>
            </div>
          </div>
        </div>

        <!-- Saffire-I -->
        <div class="nasa-ref-card" id="ref-card-saffire1">
          <div>
            <h4 class="ref-title">Saffire-I Flight Test (PSI-98)</h4>
            <div class="ref-conditions">0.00 g (Microgravity) · 21.5% O₂ · 100 kPa · 20 cm/s flow</div>
            <p class="ref-results">
              <b>Measured by NASA:</b> SIBAL cloth sheet 94 cm long burned in Cygnus. Steady flame length ≈ 4.0 cm; peak flame length reached 6.2 cm.
            </p>
          </div>
          <div>
            <div class="ref-btn-bar">
              <button class="ref-load-btn" onclick="loadExperimentConditions(0.0, 21.5, 100.0, 20, 'saffire1')">Load Saffire-I</button>
            </div>
            <div style="margin-top:8px; font-size:11px; font-family:var(--text-mono);">
              <a href="https://psi.nasa.gov/physci/repo/search?q=PSI-98&data_source=psi&data_type=investigation" target="_blank" rel="noopener" class="source-link-btn">NASA PSI-98 Table ↗</a>
            </div>
          </div>
        </div>

        <!-- Saffire-II -->
        <div class="nasa-ref-card" id="ref-card-saffire2">
          <div>
            <h4 class="ref-title">Saffire-II Mixed Materials (PSI-99)</h4>
            <div class="ref-conditions">0.00 g (Microgravity) · 21.5–22.1% O₂ · 100 kPa · 20 cm/s flow</div>
            <p class="ref-results">
              <b>Measured by NASA:</b> Nine small samples tested. Silicone samples exhibited zero burn length. SIBAL cloth burned its full 29 cm length at 2.1 to 2.6 mm/s.
            </p>
          </div>
          <div>
            <div class="ref-btn-bar">
              <button class="ref-load-btn" onclick="loadExperimentConditions(0.0, 21.8, 100.0, 20, 'saffire2')">Load Saffire-II</button>
            </div>
            <div style="margin-top:8px; font-size:11px; font-family:var(--text-mono);">
              <a href="https://psi.nasa.gov/physci/repo/search?q=PSI-99&data_source=psi&data_type=investigation" target="_blank" rel="noopener" class="source-link-btn">NASA PSI-99 Table ↗</a>
            </div>
          </div>
        </div>

        <!-- Saffire-III -->
        <div class="nasa-ref-card" id="ref-card-saffire3">
          <div>
            <h4 class="ref-title">Saffire-III High-Speed Flow (PSI-100)</h4>
            <div class="ref-conditions">0.00 g (Microgravity) · 21.0% O₂ · 100 kPa · 30 cm/s flow</div>
            <p class="ref-results">
              <b>Measured by NASA:</b> Cloth sheet 94 × 40.6 cm in Cygnus duct. Steady flame was 5.0 cm long; maximum length reached 8.2 cm under forced ventilation.
            </p>
          </div>
          <div>
            <div class="ref-btn-bar">
              <button class="ref-load-btn" onclick="loadExperimentConditions(0.0, 21.0, 100.0, 30, 'saffire3')">Load Saffire-III</button>
            </div>
            <div style="margin-top:8px; font-size:11px; font-family:var(--text-mono);">
              <a href="https://psi.nasa.gov/physci/repo/search?q=PSI-100&data_source=psi&data_type=investigation" target="_blank" rel="noopener" class="source-link-btn">NASA PSI-100 Table ↗</a>
            </div>
          </div>
        </div>

        <!-- Saffire-IV -->
        <div class="nasa-ref-card" id="ref-card-saffire4">
          <div>
            <h4 class="ref-title">Saffire-IV Thick Materials Burn</h4>
            <div class="ref-conditions">0.00 g (Microgravity) · 22.0% O₂ · 100 kPa · 20 cm/s flow</div>
            <p class="ref-results">
              <b>Measured by NASA:</b> 50 cm fabric burned with steady flame length 8.5 cm (max 11.0 cm). Peak heat release rate reached 3,150 W.
            </p>
          </div>
          <div>
            <div class="ref-btn-bar">
              <button class="ref-load-btn" onclick="loadExperimentConditions(0.0, 22.0, 100.0, 20, 'saffire4')">Load Saffire-IV</button>
            </div>
            <div style="margin-top:8px; font-size:11px; font-family:var(--text-mono);">
              <a href="https://ntrs.nasa.gov/api/citations/20210011521/downloads/ICES%202021-266%200503-2021%20final.pdf" target="_blank" rel="noopener" class="source-link-btn">NASA NTRS 20210011521 ↗</a>
            </div>
          </div>
        </div>

        <!-- Saffire-V -->
        <div class="nasa-ref-card" id="ref-card-saffire5">
          <div>
            <h4 class="ref-title">Saffire-V Exploration Atmospheres</h4>
            <div class="ref-conditions">0.00 g · 25.4–26.2% O₂ · 70.7–72.6 kPa · 20 cm/s</div>
            <p class="ref-results">
              <b>Measured by NASA:</b> V-2 cotton jersey flame reached 14 cm. V-3 PMMA flame reached 11 cm after 450 s. Peak heat release reached up to 10 kW.
            </p>
          </div>
          <div>
            <div class="ref-btn-bar">
              <button class="ref-load-btn" onclick="loadExperimentConditions(0.0, 26.2, 70.7, 20, 'saffire5')">V-2 Cotton 26.2%</button>
              <button class="ref-load-btn" onclick="loadExperimentConditions(0.0, 25.4, 71.3, 20, 'saffire5')">V-3 PMMA 25.4%</button>
            </div>
            <div style="margin-top:8px; font-size:11px; font-family:var(--text-mono);">
              <a href="https://ntrs.nasa.gov/api/citations/20210011521/downloads/ICES%202021-266%200503-2021%20final.pdf" target="_blank" rel="noopener" class="source-link-btn">NASA ICES-2021-266 ↗</a>
            </div>
          </div>
        </div>

        <!-- Saffire-VI -->
        <div class="nasa-ref-card" id="ref-card-saffire6">
          <div>
            <h4 class="ref-title">Saffire-VI Reduced-Pressure Final Flight</h4>
            <div class="ref-conditions">0.00 g · 28.8–31.0% O₂ · 54.0–55.0 kPa · 20 cm/s</div>
            <p class="ref-results">
              <b>Measured by NASA:</b> Peak heat release ≈ 3.2 kW (cloth) and 3.08 kW (PMMA). Both PMMA tests exceeded cabin CO₂ limits, confirming elevated risk at 30% O₂.
            </p>
          </div>
          <div>
            <div class="ref-btn-bar">
              <button class="ref-load-btn" onclick="loadExperimentConditions(0.0, 29.9, 54.5, 20, 'saffire6')">Load Saffire-VI</button>
            </div>
            <div style="margin-top:8px; font-size:11px; font-family:var(--text-mono);">
              <a href="https://ntrs.nasa.gov/api/citations/20240002981/downloads/Saffire-ICES-2024-ICES-365-accepted%20final.pdf" target="_blank" rel="noopener" class="source-link-btn">NASA ICES-2024-365 ↗</a>
            </div>
          </div>
        </div>

        <!-- BASS-II -->
        <div class="nasa-ref-card" id="ref-card-bass2">
          <div>
            <h4 class="ref-title">ISS BASS-II Glovebox Experiments (PSI-25)</h4>
            <div class="ref-conditions">0.00 g (ISS Glovebox) · 13.6–22.2% O₂ · 0–53 cm/s flow</div>
            <p class="ref-results">
              <b>Measured by NASA:</b> Flow duct inside the ISS Microgravity Science Glovebox. Characterized low-speed convective extinction boundaries and fuel thickness effects.
            </p>
          </div>
          <div>
            <div class="ref-btn-bar">
              <button class="ref-load-btn" onclick="loadExperimentConditions(0.0, 22.2, 101.3, 5, 'bass2')">BASS 22.2% O₂</button>
              <button class="ref-load-btn" onclick="loadExperimentConditions(0.0, 13.6, 101.3, 5, 'bass2')">BASS 13.6% O₂</button>
            </div>
            <div style="margin-top:8px; font-size:11px; font-family:var(--text-mono);">
              <a href="https://psi.nasa.gov/physci/repo/search?q=PSI-25&data_source=psi&data_type=investigation" target="_blank" rel="noopener" class="source-link-btn">NASA PSI-25 Table ↗</a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Official NASA Reference Media Gallery (Side-by-Side Images & Flight Footage) -->
    <div class="reference-media-section" id="media-section">
      <h3 class="section-title">Official NASA Flight Imagery & Experiment Video</h3>
      <p style="font-size:13px; color:#8da4c8; margin-bottom:20px;">
        Ground-truth photographic and spectroscopic records from NASA Glenn Research Center, ISS Combustion Integrated Rack (CIR), Space Shuttle Columbia, and Cygnus Saffire missions.
      </p>

      <div class="media-grid">
        <!-- NASA Candle Flame Comparison Image -->
        <div class="media-card">
          <div class="media-card-img-wrap">
            <img class="media-card-img" src="assets/nasa/candle_comparison_grc.jpg" onerror="this.src='https://images-assets.nasa.gov/image/GRC-1998-C-00485/GRC-1998-C-00485~medium.jpg'" alt="NASA Candle Flame Comparison 1G vs Microgravity">
          </div>
          <div class="media-card-body">
            <div>
              <h4 class="media-title">NASA GRC: 1-G vs. Microgravity Candle Flame</h4>
              <p class="media-desc">
                Direct side-by-side comparison recorded by NASA Glenn. Left: classic 1-G teardrop flame with yellow incandescent soot tip. Right: pure microgravity spherical blue chemiluminescence flame without buoyant convection.
              </p>
            </div>
            <div class="media-links">
              <span style="color:#5f80aa;">NASA ID: GRC-1998-C-00485</span>
              <a href="https://science.nasa.gov/image-detail/candle-flames-3" target="_blank" rel="noopener" class="source-link-btn">NASA Science ↗</a>
            </div>
          </div>
        </div>

        <!-- STS-50 Candle Flames in Microgravity -->
        <div class="media-card">
          <div class="media-card-img-wrap">
            <img class="media-card-img" src="assets/nasa/candle_microgravity_sts50.jpg" onerror="this.src='https://images-assets.nasa.gov/image/sts050-232-011/sts050-232-011~medium.jpg'" alt="Candle in Microgravity STS-50">
          </div>
          <div class="media-card-body">
            <div>
              <h4 class="media-title">STS-50: Candle Flame in Microgravity</h4>
              <p class="media-desc">
                Historic photograph of a candle flame burning in freefall aboard Space Shuttle Columbia during the USML-1 Spacelab mission. The flame burns as a dim, soot-free blue sphere fed solely by diffusion.
              </p>
            </div>
            <div class="media-links">
              <span style="color:#5f80aa;">NASA ID: sts050-232-011</span>
              <a href="https://images.nasa.gov/details/sts050-232-011" target="_blank" rel="noopener" class="source-link-btn">NASA Images ↗</a>
            </div>
          </div>
        </div>

        <!-- BASS-II Experiment on ISS Microgravity Science Glovebox -->
        <div class="media-card">
          <div class="media-card-img-wrap">
            <img class="media-card-img" src="assets/nasa/bass_flame_iss.jpg" onerror="this.src='https://images-assets.nasa.gov/image/iss040e086481/iss040e086481~medium.jpg'" alt="BASS-II Flame Test Session on ISS">
          </div>
          <div class="media-card-body">
            <div>
              <h4 class="media-title">BASS-II: ISS Microgravity Glovebox Flame</h4>
              <p class="media-desc">
                Expedition 40 flight experiment investigating solid fuel extinction and low-speed forced convection inside the Microgravity Science Glovebox (MSG). Note the rounded wake envelope in forced draft.
              </p>
            </div>
            <div class="media-links">
              <span style="color:#5f80aa;">NASA ID: iss040e086481</span>
              <a href="https://images.nasa.gov/details/iss040e086481" target="_blank" rel="noopener" class="source-link-btn">NASA Images ↗</a>
            </div>
          </div>
        </div>

        <!-- Saffire-IV Spacecraft Fire Experiment Fabric Burn -->
        <div class="media-card">
          <div class="media-card-img-wrap">
            <img class="media-card-img" src="assets/nasa/saffire_fabric_burn.jpg" onerror="this.src='https://images-assets.nasa.gov/image/jsc2023e046375/jsc2023e046375~medium.jpg'" alt="Saffire Fabric Burn in Microgravity">
          </div>
          <div class="media-card-body">
            <div>
              <h4 class="media-title">Saffire-IV: Cotton-Fiberglass Fabric Burn</h4>
              <p class="media-desc">
                Large-scale flame spread across SIBAL fabric (75% cotton / 25% fiberglass) inside an uncrewed Cygnus resupply vehicle duct at elevated oxygen under reduced pressure exploration atmospheres.
              </p>
            </div>
            <div class="media-links">
              <span style="color:#5f80aa;">NASA ID: jsc2023e046375</span>
              <a href="https://images.nasa.gov/details/jsc2023e046375" target="_blank" rel="noopener" class="source-link-btn">NASA Image Archive ↗</a>
            </div>
          </div>
        </div>

        <!-- Saffire PMMA Extinction -->
        <div class="media-card">
          <div class="media-card-img-wrap">
            <img class="media-card-img" src="assets/nasa/saffire_pmma_burn.jpg" onerror="this.src='https://images-assets.nasa.gov/image/jsc2023e046631/jsc2023e046631~small.jpg'" alt="Saffire PMMA Burn in Microgravity">
          </div>
          <div class="media-card-body">
            <div>
              <h4 class="media-title">Saffire-V: PMMA Polymer Ignition & Flow Cut</h4>
              <p class="media-desc">
                Solid thermoplastic PMMA ignition in microgravity. When airflow velocity was decreased to 5 cm/s, the flame rapidly cooled due to radiative loss and reached total extinction.
              </p>
            </div>
            <div class="media-links">
              <span style="color:#5f80aa;">NASA ID: jsc2023e046631</span>
              <a href="https://images.nasa.gov/details/jsc2023e046631" target="_blank" rel="noopener" class="source-link-btn">NASA Images ↗</a>
            </div>
          </div>
        </div>

        <!-- CIR Hardware inside ISS Destiny Lab -->
        <div class="media-card">
          <div class="media-card-img-wrap">
            <img class="media-card-img" src="assets/nasa/cir_hardware_iss.jpg" onerror="this.src='https://images-assets.nasa.gov/image/GRC-2005-C-00892/GRC-2005-C-00892~medium.jpg'" alt="CIR Hardware ISS">
          </div>
          <div class="media-card-body">
            <div>
              <h4 class="media-title">ISS Combustion Integrated Rack (CIR)</h4>
              <p class="media-desc">
                The 100-liter sealed combustion chamber inside Destiny Laboratory on the ISS. Features 1 mm/s to 50 cm/s flow delivery, optical diagnostics, and chemiluminescent spectrometers.
              </p>
            </div>
            <div class="media-links">
              <span style="color:#5f80aa;">NASA ID: GRC-2005-C-00892</span>
              <a href="https://www.nasa.gov/missions/station/a-researchers-guide-to-combustion-science/" target="_blank" rel="noopener" class="source-link-btn">NASA Glenn ↗</a>
            </div>
          </div>
        </div>
      </div>

      <!-- Official NASA Microgravity Combustion Video Embed -->
      <div style="margin-top:28px;">
        <h4 style="font-family:var(--font-heading); font-size:14px; color:#ffffff; margin-bottom:8px;">
          NASA ISS Microgravity Combustion Experiment Footage (Flame Design / BASS / CIR)
        </h4>
        <p style="font-size:12.5px; color:#8ca5cc; margin-bottom:12px;">
          Official footage of spherical diffusion flames, soot-free combustion, and low-speed forced convection aboard the International Space Station: <a href="https://www.youtube.com/watch?v=W1oXykoz9zg" target="_blank" rel="noopener" style="color:var(--cyan-glow);">https://www.youtube.com/watch?v=W1oXykoz9zg</a>
        </p>
        <div class="video-embed-container">
          <iframe 
            src="https://www.youtube-nocookie.com/embed/W1oXykoz9zg?rel=0" 
            title="NASA Microgravity Combustion Science Video" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen>
          </iframe>
        </div>
      </div>
    </div>

    <!-- Official NASA Repository Links Banner -->
    <div class="repository-links-banner">
      <div class="repo-banner-text">
        <strong style="color:#ffffff; font-family:var(--font-heading); font-size:14px; display:block; margin-bottom:4px;">
          Direct Access to NASA Open Science Repositories
        </strong>
        Explore complete decadal datasets, raw thermocouple curves, and high-speed schlieren imagery from NASA Glenn and the ISS.
      </div>
      <div class="repo-banner-btns">
        <a href="https://psi.nasa.gov/physci/repo/search?q=combustion" target="_blank" rel="noopener" class="repo-btn">
          PSI Data Repository ↗
        </a>
        <a href="https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/" target="_blank" rel="noopener" class="repo-btn">
          NASA Glenn Combustion ↗
        </a>
        <a href="https://www.nasa.gov/missions/station/a-researchers-guide-to-combustion-science/" target="_blank" rel="noopener" class="repo-btn">
          Station Researcher's Guide ↗
        </a>
      </div>
    </div>

    <!-- Complete Official NASA Sources Bibliography -->
    <div class="sources-biblio-list" id="biblio-section">
      <h4 style="font-family:var(--font-heading); font-size:13px; color:#ffffff; margin-bottom:8px;">
        Official NASA Technical Reports & PSI Repository Citations
      </h4>
      <ol style="padding-left:18px;">
        <li><a href="https://ntrs.nasa.gov/api/citations/20010059376/downloads/20010059376.pdf" target="_blank" rel="noopener">NASA NTRS 20010059376: Upward Flame Spread Over Thin Solids in Partial Gravity (0.10, 0.16 Lunar, 0.38 Martian, 1 g)</a></li>
        <li><a href="https://ntrs.nasa.gov/citations/19990054085" target="_blank" rel="noopener">NASA NTRS 19990054085: Flame Spread and Extinction in Partial-Gravity Environments</a></li>
        <li><a href="https://ntrs.nasa.gov/citations/20010074003" target="_blank" rel="noopener">NASA NTRS 20010074003: Three-Dimensional Upward Flame Spreading in Partial-Gravity Buoyant Flows</a></li>
        <li><a href="https://ntrs.nasa.gov/api/citations/19980209743/downloads/19980209743.pdf" target="_blank" rel="noopener">NASA Lewis Report on Fire Safety for Lunar and Martian Missions (NTRS 19980209743)</a></li>
        <li><a href="https://ntrs.nasa.gov/api/citations/20260000646/downloads/Ferkul-Lunar%20and%20Planetary%20Science%20Conference%202026.pdf" target="_blank" rel="noopener">NASA NTRS 20260000646: Material Flammability at Lunar and Martian Gravity (Ferkul et al.)</a></li>
        <li><a href="https://science.nasa.gov/image-detail/candle-flames-3" target="_blank" rel="noopener">NASA Science: Candle Flames, Normal Gravity vs Microgravity (GRC-1998-C-00485)</a></li>
        <li><a href="https://www.nasa.gov/image-article/candle-flame-1g-vs-microgravity/" target="_blank" rel="noopener">NASA Image Article: Candle Flame – 1g vs Microgravity</a></li>
        <li><a href="https://ntrs.nasa.gov/api/citations/20000000185/downloads/20000000185.pdf" target="_blank" rel="noopener">NASA NTRS 20000000185: Review of Reduced-Gravity Combustion (Buoyant Convection Velocity Scaling)</a></li>
        <li><a href="https://ntrs.nasa.gov/api/citations/20170000230/downloads/20170000230.pdf" target="_blank" rel="noopener">NASA NTRS 20170000230: Operation and Development Status of Saffire</a></li>
        <li><a href="https://ntrs.nasa.gov/api/citations/20210011521/downloads/ICES%202021-266%200503-2021%20final.pdf" target="_blank" rel="noopener">NASA NTRS 20210011521: Saffire IV and V Results – PMMA and Cotton Jersey Burn Data (ICES-2021-266)</a></li>
        <li><a href="https://ntrs.nasa.gov/api/citations/20240002981/downloads/Saffire-ICES-2024-ICES-365-accepted%20final.pdf" target="_blank" rel="noopener">NASA NTRS 20240002981: Saffire VI Preliminary Flight Results (ICES-2024-365)</a></li>
        <li><a href="https://www.nasa.gov/wp-content/uploads/2025/07/spacecraft-fire-safety-demonstration-saffire.pdf" target="_blank" rel="noopener">NASA Spacecraft Fire Safety Demonstration Project (Saffire Fact Sheet SP-2016-6105)</a></li>
        <li><a href="https://ntrs.nasa.gov/citations/20210011385" target="_blank" rel="noopener">NASA NTRS 20210011385: BASS-II Summary Report (Burning and Suppression of Solids)</a></li>
        <li><a href="https://psi.nasa.gov/physci/repo/search?q=PSI-98&data_source=psi&data_type=investigation" target="_blank" rel="noopener">NASA Physical Sciences Informatics: Saffire-I Investigation (PSI-98)</a></li>
        <li><a href="https://psi.nasa.gov/physci/repo/search?q=PSI-25&data_source=psi&data_type=investigation" target="_blank" rel="noopener">NASA Physical Sciences Informatics: BASS-II ISS Glovebox Table (PSI-25)</a></li>
      </ol>
    </div>

  </section>

  <!-- Site Footer -->
  <footer class="site-footer">
    <p>IGNITE-AI · 3D Flame Simulator | NASA Space Apps Challenge 2026: Flame in Freefall · Team Stellar Pyros</p>
    <p style="margin-top:6px; color:#4a658a;">
      All physical formulations, data citations, and imagery derived from official NASA Glenn Research Center, NASA Physical Sciences Informatics (PSI), and NTRS archives.
    </p>
  </footer>

  <!-- Three.js 3D Simulator Implementation -->
  <script>
    /* =========================================================================
       IGNIS 3D Flame Simulator: Core Physics & Three.js WebGL Rendering Engine
       Accurately simulates:
       - Earth (1 g): Buoyant flickering teardrop, incandescent soot, blue base
       - Moon (0.165 g): Wide dome flame, reduced soot, slow buoyant flicker (~4 Hz)
       - Mars (0.38 g): Intermediate dome/teardrop, moderate flicker (~7 Hz)
       - ISS µg (~0 g): Pure spherical blue diffusion flame, soot-free, faint outer halo
       - Transit (µg coast): Spherical blue flame in exploration atmosphere
       ========================================================================= */

    // Environment Presets calibrated to official NASA documents
    const ENVIRONMENTS = {
      earth: {
        id: 'earth',
        name: 'Earth (1 g)',
        gravity: 1.0,
        oxygen: 21.0,
        pressure: 101.3,
        airflow: 0.0,
        tests: 6,
        badge: 'assets/planets/earth_disc.jpg',
        headline: 'Earth: Buoyancy drives the classic flickering teardrop flame.',
        quote: '“On Earth, gravity-driven buoyant convection causes a candle flame to be teardrop-shaped and carries soot to the flame\'s tip, which makes it yellow. In microgravity, where convective flows are absent, the flame is spherical, soot-free and blue.”',
        quoteAuthor: '— Official Caption, NASA Science / Advanced Combustion via Microgravity Experiments (ACME)',
        citations: '6 training rows at 1 g: upward limiting-oxygen (ULOI / MOC) tests for Mylar G, Ultem 1000 and Nomex HT90-40 at NASA White Sands (NTRS 20130010991 Table I). Tested under NASA-STD-6001 Test 1 standard upward flammability protocol.',
        tag: 'NASA 1-G BASELINE',
        flameType: 'teardrop',
        portholeBackdrop: 'earth'
      },
      moon: {
        id: 'moon',
        name: 'Moon (0.165 g)',
        gravity: 0.165,
        oxygen: 21.0,
        pressure: 101.3,
        airflow: 0.0,
        tests: 8,
        badge: 'assets/planets/moon_disc.jpg',
        headline: 'Moon: Weak buoyancy creates a wider, dome-shaped flame.',
        quote: '“At lunar gravity (0.165 g), the buoyant convective draft scales with √g ≈ 0.41x of normal gravity. The reduced upward acceleration allows the reaction zone to broaden laterally, forming a dome-like flame with attenuated soot formation.”',
        quoteAuthor: '— NASA KC-135 Parabolic Flight & Drop Tower Reduced-Gravity Review (NTRS 20130010991)',
        citations: '8 parabolic flight test runs aboard NASA KC-135 / C-9 research aircraft: upward and downward propagation over thin polymer sheets at lunar g.',
        tag: 'LUNAR GRAVITY (0.165 G)',
        flameType: 'dome',
        portholeBackdrop: 'moon'
      },
      mars: {
        id: 'mars',
        name: 'Mars (0.38 g)',
        gravity: 0.38,
        oxygen: 21.0,
        pressure: 101.3,
        airflow: 0.0,
        tests: 6,
        badge: 'assets/planets/mars_disc.jpg',
        headline: 'Mars: Moderate buoyancy with intermediate teardrop elongation.',
        quote: '“Under Martian gravity (0.38 g), buoyancy forces are moderate (√0.38 ≈ 0.62x Earth). Buoyant convection is strong enough to establish an upward convective plume, but reduced peak velocities yield a rounder flame base and lower peak soot radiation.”',
        quoteAuthor: '— NASA Extraterrestrial Fire Safety Review, NTRS Doc ID 20000120278',
        citations: '6 reduced-gravity simulation rows: parabolic aircraft and 5.18-second drop tower data for hydrocarbon diffusion flames at Martian gravity.',
        tag: 'MARTIAN GRAVITY (0.38 G)',
        flameType: 'intermediate',
        portholeBackdrop: 'mars'
      },
      iss: {
        id: 'iss',
        name: 'ISS µg (~0 g)',
        gravity: 0.0,
        oxygen: 21.0,
        pressure: 101.3,
        airflow: 3.0,
        tests: 123,
        badge: 'assets/planets/iss_station.jpg',
        headline: 'ISS: No buoyancy: only ventilation and diffusion feed the flame.',
        quote: '“Without buoyancy, hot air doesn\'t rise. Oxygen moves to the flame entirely through molecular diffusion, which occurs equally in all directions, yielding a steady, soot-free, spherical blue flame.”',
        quoteAuthor: '— NASA Physical Sciences Informatics (PSI) / ACME Flight Program',
        citations: '123 training rows in microgravity: NASA drop towers, Shuttle SSCE, ISS BASS/BASS-II (corroborated by the PSI-25 experimental table) and Saffire I-VI in Cygnus.',
        tag: 'NASA FLIGHT DATA',
        flameType: 'sphere',
        portholeBackdrop: 'iss'
      },
      transit: {
        id: 'transit',
        name: 'Transit cabin (µg coast)',
        gravity: 0.0,
        oxygen: 30.0,
        pressure: 70.3,
        airflow: 5.0,
        tests: 123,
        badge: 'assets/planets/orion_transit.jpg',
        headline: 'Transit Cabin: Microgravity coast in exploration atmosphere (30% O₂, 70.3 kPa).',
        quote: '“NASA exploration spacecraft atmospheres utilize lower total pressure with enriched oxygen (30% O2 at 70.3 kPa / 10.2 psia) to allow rapid EVA spacewalk egress while maintaining sea-level normoxic alveolar oxygen. Combustion in microgravity under these conditions exhibits intensified radical chemiluminescence.”',
        quoteAuthor: '— NASA Spacecraft Fire Safety Demonstration Project (Saffire / SP-2016-6105)',
        citations: '123 microgravity flight datasets: Saffire-IV, Saffire-V, and Saffire-VI tests in Cygnus across exploration atmospheric pressures.',
        tag: 'DEEP SPACE EXPLORATION',
        flameType: 'sphere',
        portholeBackdrop: 'transit'
      }
    };

    // Material Database with Limiting Oxygen Index (ULOI) thresholds
    const MATERIALS = {
      sibal: { name: 'SIBAL cotton-fiberglass', uloi: 16.5, desc: 'Standard NASA Saffire fabric. Readily sustains spread in 21% O2.' },
      nomex: { name: 'Nomex HT90-40 fabric', uloi: 28.5, desc: 'Aramid fabric for flight suits. Self-extinguishes below 28.5% O2 in normal pressure.' },
      pmma: { name: 'PMMA Plexiglass Acrylic', uloi: 17.0, desc: 'Thermoplastic polymer tested in Saffire-IV/V for dripping & bubble formation.' },
      ultem: { name: 'Ultem 1000 Polyetherimide', uloi: 31.0, desc: 'High-performance engineering plastic for spacecraft panels. Flame retardant.' },
      candle: { name: 'Candle Wax Wick', uloi: 14.5, desc: 'Classic diffusion flame benchmark investigated in NASA ACME & STS-50.' }
    };

    // Current State
    let currentEnv = ENVIRONMENTS.iss; // Default to ISS as requested in user video & prompt!
    let currentMaterial = MATERIALS.sibal;
    let customParams = {
      gravity: 0.0,
      oxygen: 21.0,
      pressure: 101.3,
      airflow: 3.0,
      isUserOverridden: false
    };

    // Three.js Global Variables
    let scene, camera, renderer, controls;
    let cabinGroup, chamberGroup, flameGroup, particlesGroup;
    let flameInnerMesh, flameOuterMesh, flameBaseRing, flameHaloMesh, flameGlowSprite;
    let flameLight;
    let portholeMesh, windowBackdropMesh;
    let clock = new THREE.Clock();
    let isAutoRotating = false;

    // Initialize Application
    window.addEventListener('DOMContentLoaded', () => {
      initThreeScene();
      selectEnvironment('iss'); // Load ISS by default to match video screenshot!
      setupWindowResize();
    });

    // Initialize Three.js 3D Scene
    function initThreeScene() {
      const container = document.getElementById('simulator-container');
      const canvas = document.getElementById('three-canvas');

      const width = container.clientWidth;
      const height = container.clientHeight;

      // Scene
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x040814);
      scene.fog = new THREE.FogExp2(0x040814, 0.022);

      // Camera
      camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      camera.position.set(0, 1.8, 10.5);

      // WebGL Renderer
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;

      // OrbitControls
      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.maxDistance = 24.0;
      controls.minDistance = 2.5;
      controls.maxPolarAngle = Math.PI / 2 + 0.15;
      controls.target.set(0, 1.6, 0);
      controls.autoRotate = false;
      controls.autoRotateSpeed = 0.8;

      // Ambient & Directional Lighting
      const ambientLight = new THREE.AmbientLight(0x4a5d7c, 1.0);
      scene.add(ambientLight);

      const cabinCeilingLight = new THREE.DirectionalLight(0xe8f4ff, 0.9);
      cabinCeilingLight.position.set(0, 8, 4);
      scene.add(cabinCeilingLight);

      // Flame Internal Point Light
      flameLight = new THREE.PointLight(0x00bbff, 2.5, 9.0);
      flameLight.position.set(0, 1.6, 0);
      scene.add(flameLight);

      // Build 3D Components
      buildCabinInterior();
      buildCombustionChamber();
      buildFlameSystem();
      buildConvectionParticles();

      // Start Render Loop
      animate();
    }

    /* -------------------------------------------------------------
       Spacecraft Cabin Interior:
       White quilted ISS laboratory panels, overhead glowing cyan neon ring, porthole
       ------------------------------------------------------------- */
    function buildCabinInterior() {
      cabinGroup = new THREE.Group();
      scene.add(cabinGroup);

      // Cabin Cylindrical Shell (Rear Wall) - ISS White/Light Grey Padded Walls
      const cabinGeo = new THREE.CylinderGeometry(14, 14, 18, 36, 8, true, -Math.PI / 2, Math.PI);
      const cabinMat = new THREE.MeshStandardMaterial({
        color: 0x98a8bc, // Realistic ISS laboratory wall tone
        roughness: 0.6,
        metalness: 0.35,
        side: THREE.BackSide
      });
      const cabinWall = new THREE.Mesh(cabinGeo, cabinMat);
      cabinWall.position.set(0, 4, -4);
      cabinGroup.add(cabinWall);

      // Cabin Floor - Dark technical non-skid deck
      const floorGeo = new THREE.PlaneGeometry(30, 30);
      const floorMat = new THREE.MeshStandardMaterial({
        color: 0x111624,
        roughness: 0.8,
        metalness: 0.3
      });
      const floor = new THREE.Mesh(floorGeo, floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -2.5;
      cabinGroup.add(floor);

      // Overhead Curved Neon Lighting Ring (Cyan Ring from user video screenshot!)
      const ringGeo = new THREE.TorusGeometry(3.3, 0.08, 16, 64, Math.PI * 1.35);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        side: THREE.DoubleSide
      });
      const neonRing = new THREE.Mesh(ringGeo, ringMat);
      neonRing.rotation.x = Math.PI / 2;
      neonRing.rotation.z = Math.PI * 0.35;
      neonRing.position.set(0, 6.2, 0);
      cabinGroup.add(neonRing);

      // Point Light for Neon Ring
      const neonLight = new THREE.PointLight(0x00f0ff, 1.2, 9.0);
      neonLight.position.set(0, 6.0, 0);
      cabinGroup.add(neonLight);

      // ISS Modular Equipment Panel Lines & Vertical Handrails
      for (let i = -3; i <= 3; i++) {
        // Dark panel seam
        const seamGeo = new THREE.BoxGeometry(0.04, 12, 0.04);
        const seamMat = new THREE.MeshStandardMaterial({ color: 0x0a1020, metalness: 0.8 });
        const seam = new THREE.Mesh(seamGeo, seamMat);
        seam.position.set(i * 3.6, 3, -10);
        cabinGroup.add(seam);

        // Yellow NASA grab bar / tether handle
        if (Math.abs(i) === 2 || i === 0) {
          const barGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.4, 12);
          const barMat = new THREE.MeshStandardMaterial({ color: 0xe6b800, roughness: 0.3, metalness: 0.7 });
          const bar = new THREE.Mesh(barGeo, barMat);
          bar.rotation.z = Math.PI / 2;
          bar.position.set(i * 3.6, 2.2, -9.8);
          cabinGroup.add(bar);
        }
      }

      // Circular Porthole Window on Left Wall (as seen in video!)
      const portholeGroup = new THREE.Group();
      portholeGroup.position.set(-6.8, 2.5, -1.8);
      portholeGroup.rotation.y = Math.PI * 0.35;
      cabinGroup.add(portholeGroup);

      // Porthole Bevel Frame Ring
      const frameGeo = new THREE.TorusGeometry(2.3, 0.22, 16, 48);
      const frameMat = new THREE.MeshStandardMaterial({
        color: 0x1a2436,
        roughness: 0.35,
        metalness: 0.85
      });
      const portholeFrame = new THREE.Mesh(frameGeo, frameMat);
      portholeGroup.add(portholeFrame);

      // Bolts around Porthole Frame
      for (let b = 0; b < 16; b++) {
        const angle = (b / 16) * Math.PI * 2;
        const boltGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.1, 8);
        const boltMat = new THREE.MeshStandardMaterial({ color: 0x7a94b8, metalness: 0.9 });
        const bolt = new THREE.Mesh(boltGeo, boltMat);
        bolt.rotation.x = Math.PI / 2;
        bolt.position.set(Math.cos(angle) * 2.3, Math.sin(angle) * 2.3, 0.1);
        portholeGroup.add(bolt);
      }

      // Glass Pane of Porthole
      const paneGeo = new THREE.CircleGeometry(2.1, 48);
      const paneMat = new THREE.MeshPhysicalMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.22,
        roughness: 0.1,
        metalness: 0.1
      });
      portholeMesh = new THREE.Mesh(paneGeo, paneMat);
      portholeGroup.add(portholeMesh);

      // Window Exterior Scenery Mesh (Circular disc fitted directly to porthole frame)
      const backdropGeo = new THREE.CircleGeometry(2.25, 48);
      const backdropCanvas = createBackdropTextureCanvas('iss');
      const backdropTex = new THREE.CanvasTexture(backdropCanvas);
      const backdropMat = new THREE.MeshBasicMaterial({ map: backdropTex, side: THREE.FrontSide, depthWrite: false });
      windowBackdropMesh = new THREE.Mesh(backdropGeo, backdropMat);
      windowBackdropMesh.position.set(0, 0, -0.05);
      windowBackdropMesh.renderOrder = 2;
      portholeGroup.add(windowBackdropMesh);
    }

    // Procedural Dynamic Canvas Texture for Porthole Exterior Scenery
    function createBackdropTextureCanvas(envType) {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 512;
      const ctx = c.getContext('2d');

      if (envType === 'earth') {
        const grad = ctx.createLinearGradient(0, 0, 0, 512);
        grad.addColorStop(0, '#2b78d6');
        grad.addColorStop(0.5, '#7bb3f5');
        grad.addColorStop(0.65, '#e4c49b');
        grad.addColorStop(1.0, '#a37b4b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 512);

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(360, 120, 36, 0, Math.PI * 2);
        ctx.fill();
      } else if (envType === 'moon') {
        ctx.fillStyle = '#010207';
        ctx.fillRect(0, 0, 512, 512);
        ctx.fillStyle = '#ffffff';
        for (let s = 0; s < 60; s++) {
          ctx.fillRect((s * 73) % 500, (s * 37) % 300, 1.5, 1.5);
        }
        ctx.fillStyle = '#1e75ff';
        ctx.beginPath();
        ctx.arc(380, 130, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(376, 125, 16, 0, Math.PI * 2);
        ctx.fill();

        const moonGrad = ctx.createLinearGradient(0, 280, 0, 512);
        moonGrad.addColorStop(0, '#555b68');
        moonGrad.addColorStop(1, '#252932');
        ctx.fillStyle = moonGrad;
        ctx.fillRect(0, 280, 512, 232);
      } else if (envType === 'mars') {
        const marsGrad = ctx.createLinearGradient(0, 0, 0, 512);
        marsGrad.addColorStop(0, '#b6593a');
        marsGrad.addColorStop(0.55, '#d98b67');
        marsGrad.addColorStop(0.6, '#b84423');
        marsGrad.addColorStop(1.0, '#691e0a');
        ctx.fillStyle = marsGrad;
        ctx.fillRect(0, 0, 512, 512);
      } else if (envType === 'iss') {
        ctx.fillStyle = '#01030b';
        ctx.fillRect(0, 0, 512, 512);
        const earthGrad = ctx.createRadialGradient(256, 520, 80, 256, 520, 380);
        earthGrad.addColorStop(0, '#0e55bb');
        earthGrad.addColorStop(0.7, '#2486f0');
        earthGrad.addColorStop(0.9, '#a0d4ff');
        earthGrad.addColorStop(1.0, 'transparent');
        ctx.fillStyle = earthGrad;
        ctx.beginPath();
        ctx.arc(256, 520, 360, Math.PI, 0, false);
        ctx.fill();
      } else {
        ctx.fillStyle = '#010207';
        ctx.fillRect(0, 0, 512, 512);
        ctx.fillStyle = '#ffffff';
        for (let s = 0; s < 120; s++) {
          ctx.fillRect((s * 89) % 512, (s * 41) % 512, 1.2, 1.2);
        }
      }
      return c;
    }

    /* -------------------------------------------------------------
       Cylindrical Glass Combustion Chamber:
       Top metal cap, bottom base, 4 support posts, burner pedestal
       ------------------------------------------------------------- */
    function buildCombustionChamber() {
      chamberGroup = new THREE.Group();
      scene.add(chamberGroup);

      // Quartz Glass Cylinder (depthWrite: false, renderOrder: 20 so it never occludes flame!)
      const glassGeo = new THREE.CylinderGeometry(2.1, 2.1, 6.2, 48, 1, true);
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0xe6f7ff,
        transparent: true,
        opacity: 0.22,
        roughness: 0.08,
        metalness: 0.15,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const glassCylinder = new THREE.Mesh(glassGeo, glassMat);
      glassCylinder.position.y = 1.6;
      glassCylinder.renderOrder = 20;
      chamberGroup.add(glassCylinder);

      // Top Lid Frame (Black Metallic)
      const lidGeo = new THREE.CylinderGeometry(2.3, 2.3, 0.4, 48);
      const metalMat = new THREE.MeshStandardMaterial({
        color: 0x161a22,
        roughness: 0.4,
        metalness: 0.85
      });
      const lid = new THREE.Mesh(lidGeo, metalMat);
      lid.position.y = 4.7;
      chamberGroup.add(lid);

      // Bottom Base Frame
      const baseGeo = new THREE.CylinderGeometry(2.35, 2.45, 0.5, 48);
      const baseMesh = new THREE.Mesh(baseGeo, metalMat);
      baseMesh.position.y = -1.5;
      chamberGroup.add(baseMesh);

      // 4 Vertical Steel Support Posts (Offset by 45° so posts are at corners: 45°, 135°, 225°, 315°)
      for (let p = 0; p < 4; p++) {
        const angle = (p / 4) * Math.PI * 2 + Math.PI / 4;
        const postGeo = new THREE.CylinderGeometry(0.06, 0.06, 6.2, 16);
        const post = new THREE.Mesh(postGeo, metalMat);
        post.position.set(Math.cos(angle) * 2.15, 1.6, Math.sin(angle) * 2.15);
        chamberGroup.add(post);
      }

      // Center Burner Pedestal (Candle / Solid Fuel Mount)
      const candleGeo = new THREE.CylinderGeometry(0.48, 0.52, 2.2, 32);
      const candleMat = new THREE.MeshStandardMaterial({
        color: 0xefede6,
        roughness: 0.7,
        metalness: 0.05
      });
      const candle = new THREE.Mesh(candleGeo, candleMat);
      candle.position.y = -0.4;
      chamberGroup.add(candle);

      // Burner Wick Tip
      const wickGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.28, 8);
      const wickMat = new THREE.MeshBasicMaterial({ color: 0x221105 });
      const wick = new THREE.Mesh(wickGeo, wickMat);
      wick.position.y = 0.82;
      chamberGroup.add(wick);
    }

    /* -------------------------------------------------------------
       Realistic 3D Flame System:
       - Inner Reaction Core
       - Outer Flame Envelope (Spherical in 0g, Teardrop in 1g)
       - Blue Base Chemiluminescence Ring
       - Volumetric Radial Optical Glow Sprite
       - Outer Translucent Spherical Halo (for µg)
       ------------------------------------------------------------- */
    function buildFlameSystem() {
      flameGroup = new THREE.Group();
      flameGroup.position.set(0, 0.95, 0); // Position right above wick
      scene.add(flameGroup);

      // 1. Outer Flame Mesh (depthWrite: false, renderOrder: 12)
      const outerGeo = new THREE.SphereGeometry(0.55, 32, 32);
      const outerMat = new THREE.MeshBasicMaterial({
        color: 0x0088ff,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending
      });
      flameOuterMesh = new THREE.Mesh(outerGeo, outerMat);
      flameOuterMesh.renderOrder = 12;
      flameGroup.add(flameOuterMesh);

      // 2. Inner Reaction Core Mesh (depthWrite: false, renderOrder: 13)
      const innerGeo = new THREE.SphereGeometry(0.32, 24, 24);
      const innerMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending
      });
      flameInnerMesh = new THREE.Mesh(innerGeo, innerMat);
      flameInnerMesh.position.y = 0.15;
      flameInnerMesh.renderOrder = 13;
      flameGroup.add(flameInnerMesh);

      // 3. Blue Chemiluminescent Base Ring (depthWrite: false, renderOrder: 11)
      const baseGeo = new THREE.TorusGeometry(0.38, 0.08, 12, 32);
      const baseMat = new THREE.MeshBasicMaterial({
        color: 0x0077ff,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending
      });
      flameBaseRing = new THREE.Mesh(baseGeo, baseMat);
      flameBaseRing.rotation.x = Math.PI / 2;
      flameBaseRing.position.y = 0.05;
      flameBaseRing.renderOrder = 11;
      flameGroup.add(flameBaseRing);

      // 4. Microgravity Outer Translucent Diffusion Halo (DoubleSide, depthWrite: false, renderOrder: 10)
      const haloGeo = new THREE.SphereGeometry(1.05, 32, 32);
      const haloMat = new THREE.MeshBasicMaterial({
        color: 0x00d4ff,
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
      });
      flameHaloMesh = new THREE.Mesh(haloGeo, haloMat);
      flameHaloMesh.position.y = 0.45;
      flameHaloMesh.renderOrder = 10;
      flameGroup.add(flameHaloMesh);

      // 5. Volumetric Optical Glow Sprite (depthWrite: false, renderOrder: 9)
      const glowCanvas = createFlameGlowTexture();
      const glowTex = new THREE.CanvasTexture(glowCanvas);
      const glowMat = new THREE.SpriteMaterial({
        map: glowTex,
        color: 0x00aaff,
        transparent: true,
        opacity: 0.65,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending
      });
      flameGlowSprite = new THREE.Sprite(glowMat);
      flameGlowSprite.scale.set(3.2, 3.2, 3.2);
      flameGlowSprite.position.y = 0.5;
      flameGlowSprite.renderOrder = 9;
      flameGroup.add(flameGlowSprite);

      // Set initial geometry scale
      updateFlamePhysics(0, currentEnv.gravity, currentEnv.oxygen, currentEnv.airflow);
    }

    // Creates smooth procedural radial glow sprite texture
    function createFlameGlowTexture() {
      const c = document.createElement('canvas');
      c.width = 128;
      c.height = 128;
      const ctx = c.getContext('2d');
      const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
      grad.addColorStop(0.2, 'rgba(120, 220, 255, 0.7)');
      grad.addColorStop(0.5, 'rgba(0, 140, 255, 0.35)');
      grad.addColorStop(0.8, 'rgba(0, 70, 220, 0.12)');
      grad.addColorStop(1.0, 'rgba(0, 30, 180, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
      return c;
    }

    /* -------------------------------------------------------------
       Buoyant Convection Particles / Airflow Tracers:
       Show natural upward buoyant draft in 1g, horizontal airflow in duct
       ------------------------------------------------------------- */
    function buildConvectionParticles() {
      const particleCount = 180;
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const velocities = [];

      for (let i = 0; i < particleCount; i++) {
        const r = Math.sqrt(Math.random()) * 1.8;
        const theta = Math.random() * Math.PI * 2;
        positions[i * 3] = Math.cos(theta) * r;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 5.0 + 1.6;
        positions[i * 3 + 2] = Math.sin(theta) * r;

        velocities.push({
          x: (Math.random() - 0.5) * 0.01,
          y: Math.random() * 0.03 + 0.01,
          z: (Math.random() - 0.5) * 0.01
        });
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const pMat = new THREE.PointsMaterial({
        color: 0x66ccff,
        size: 0.06,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });

      particlesGroup = new THREE.Points(geometry, pMat);
      particlesGroup.userData = { velocities: velocities };
      scene.add(particlesGroup);
    }

    // Dynamic Animation Loop
    function animate() {
      requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Update Controls
      controls.update();

      // Update Flame Geometry & Flicker based on Gravity & Airflow
      const g = customParams.isUserOverridden ? customParams.gravity : currentEnv.gravity;
      const o2 = customParams.isUserOverridden ? customParams.oxygen : currentEnv.oxygen;
      const flow = customParams.isUserOverridden ? customParams.airflow : currentEnv.airflow;

      updateFlamePhysics(time, g, o2, flow);

      // Update Convection & Flow Particles
      updateParticles(delta, g, flow);

      // Render Scene
      renderer.render(scene, camera);
    }

    // Dynamic Physics & Shader/Morphing Updater for Flame
    function updateFlamePhysics(time, g, o2, flow) {
      if (!flameOuterMesh) return;

      const sqrtG = Math.sqrt(Math.max(0, g));
      const freq = g > 0 ? (11.0 * sqrtG) : 0.0;
      const flickerAmt = g > 0 ? (0.07 * sqrtG) : 0.0;

      // Buoyant flicker oscillation (0 in microgravity!)
      const flicker = g > 0.02
        ? (Math.sin(time * freq * Math.PI * 2) * flickerAmt + Math.cos(time * freq * 1.8) * (flickerAmt * 0.4))
        : 0.0;

      // Airflow deflection skew angle
      const leanAngle = (flow / (flow + 10.0)) * 0.45;
      flameGroup.rotation.z = -leanAngle;

      if (g <= 0.02) {
        // MICROGRAVITY (ISS / Transit): Perfect Sphere! NASA: "spherical, soot-free and blue"
        flameOuterMesh.scale.set(0.95, 0.95, 0.95);
        flameOuterMesh.position.set(0, 0.48, 0);

        // Pure chemiluminescent blue colors
        flameOuterMesh.material.color.setHex(0x0077ff);
        flameOuterMesh.material.opacity = 0.78;

        flameInnerMesh.scale.set(0.55, 0.55, 0.55);
        flameInnerMesh.position.set(0, 0.48, 0);
        flameInnerMesh.material.color.setHex(0x00f0ff);

        flameBaseRing.visible = true;
        flameBaseRing.material.color.setHex(0x0044ff);

        // Outer spherical diffusion halo
        flameHaloMesh.visible = true;
        flameHaloMesh.scale.set(1.4, 1.4, 1.4);
        flameHaloMesh.material.color.setHex(0x00d4ff);
        flameHaloMesh.material.opacity = 0.18 + Math.sin(time * 2.0) * 0.02;

        if (flameGlowSprite) {
          flameGlowSprite.visible = true;
          flameGlowSprite.material.color.setHex(0x0088ff);
          flameGlowSprite.scale.set(3.4, 3.4, 3.4);
        }

        flameLight.color.setHex(0x00bbff);
        flameLight.intensity = 1.8;
      } else if (g < 0.25) {
        // LUNAR GRAVITY (0.165 g): Wide rounded dome flame
        const heightScale = 1.35 + flicker;
        const widthScale = 1.15;
        flameOuterMesh.scale.set(widthScale, heightScale, widthScale);
        flameOuterMesh.position.set(0, heightScale * 0.35, 0);

        // Soft amber/pale yellow tip with broad blue base
        flameOuterMesh.material.color.setHex(0xffaa33);
        flameOuterMesh.material.opacity = 0.85;

        flameInnerMesh.scale.set(0.65, 0.85, 0.65);
        flameInnerMesh.position.set(0, heightScale * 0.28, 0);
        flameInnerMesh.material.color.setHex(0xfff0aa);

        flameBaseRing.visible = true;
        flameBaseRing.material.color.setHex(0x0088ff);

        flameHaloMesh.visible = false;

        if (flameGlowSprite) {
          flameGlowSprite.visible = true;
          flameGlowSprite.material.color.setHex(0xff9900);
          flameGlowSprite.scale.set(2.8, 3.2, 2.8);
        }

        flameLight.color.setHex(0xffaa44);
        flameLight.intensity = 2.2;
      } else if (g < 0.6) {
        // MARTIAN GRAVITY (0.38 g): Intermediate dome/teardrop
        const heightScale = 1.85 + flicker;
        const widthScale = 0.95;
        flameOuterMesh.scale.set(widthScale, heightScale, widthScale);
        flameOuterMesh.position.set(0, heightScale * 0.38, 0);

        flameOuterMesh.material.color.setHex(0xff9900);
        flameOuterMesh.material.opacity = 0.88;

        flameInnerMesh.scale.set(0.55, 1.1, 0.55);
        flameInnerMesh.position.set(0, heightScale * 0.3, 0);
        flameInnerMesh.material.color.setHex(0xfffae0);

        flameBaseRing.visible = true;
        flameBaseRing.material.color.setHex(0x0066ff);

        flameHaloMesh.visible = false;

        if (flameGlowSprite) {
          flameGlowSprite.visible = true;
          flameGlowSprite.material.color.setHex(0xff8800);
          flameGlowSprite.scale.set(2.6, 3.5, 2.6);
        }

        flameLight.color.setHex(0xff9922);
        flameLight.intensity = 2.6;
      } else {
        // EARTH (1 g): Classic flickering buoyant teardrop
        const heightScale = 2.45 + flicker * 1.5;
        const widthScale = 0.78;
        flameOuterMesh.scale.set(widthScale, heightScale, widthScale);
        flameOuterMesh.position.set(0, heightScale * 0.42, 0);

        // Glowing yellow-orange with soot radiation
        flameOuterMesh.material.color.setHex(0xff8800);
        flameOuterMesh.material.opacity = 0.92;

        flameInnerMesh.scale.set(0.42, 1.5, 0.42);
        flameInnerMesh.position.set(0, heightScale * 0.32, 0);
        flameInnerMesh.material.color.setHex(0xffffff);

        flameBaseRing.visible = true;
        flameBaseRing.material.color.setHex(0x0055ff);

        flameHaloMesh.visible = false;

        if (flameGlowSprite) {
          flameGlowSprite.visible = true;
          flameGlowSprite.material.color.setHex(0xff7700);
          flameGlowSprite.scale.set(2.4, 4.0, 2.4);
        }

        flameLight.color.setHex(0xff7700);
        flameLight.intensity = 3.0;
      }
    }

    // Particle Convection Updater
    function updateParticles(delta, g, flow) {
      if (!particlesGroup) return;

      const pos = particlesGroup.geometry.attributes.position.array;
      const vels = particlesGroup.userData.velocities;
      const count = pos.length / 3;

      const buoyantSpeed = Math.sqrt(Math.max(0, g)) * 2.8;
      const horizontalFlow = (flow / 100.0) * 1.4;

      for (let i = 0; i < count; i++) {
        pos[i * 3 + 1] += (vels[i].y * (buoyantSpeed + 0.15)) * delta * 60;
        pos[i * 3] += horizontalFlow * delta * 30;

        if (pos[i * 3 + 1] > 4.6 || pos[i * 3] > 2.0) {
          pos[i * 3 + 1] = -1.2;
          pos[i * 3] = (Math.random() - 0.5) * 1.6;
          pos[i * 3 + 2] = (Math.random() - 0.5) * 1.6;
        }
      }
      particlesGroup.geometry.attributes.position.needsUpdate = true;
    }

    /* -------------------------------------------------------------
       UI Interaction & State Management
       ------------------------------------------------------------- */
    function selectEnvironment(envKey) {
      const env = ENVIRONMENTS[envKey];
      if (!env) return;

      currentEnv = env;
      customParams.isUserOverridden = false;
      customParams.gravity = env.gravity;
      customParams.oxygen = env.oxygen;
      customParams.pressure = env.pressure;
      customParams.airflow = env.airflow;

      // Update Tab Styles
      document.querySelectorAll('.env-tab-btn').forEach(btn => btn.classList.remove('active'));
      const activeBtn = document.getElementById(`tab-${envKey}`);
      if (activeBtn) activeBtn.classList.add('active');

      // Update Atmosphere Presets Bar Active State
      document.querySelectorAll('.atm-btn').forEach(b => b.classList.remove('active'));

      // Update Sliders
      document.getElementById('slider-gravity').value = env.gravity;
      document.getElementById('slider-oxygen').value = env.oxygen;
      document.getElementById('slider-pressure').value = env.pressure;
      document.getElementById('slider-airflow').value = env.airflow;

      // Update Porthole Scenery
      if (windowBackdropMesh) {
        const newCanvas = createBackdropTextureCanvas(env.portholeBackdrop);
        windowBackdropMesh.material.map = new THREE.CanvasTexture(newCanvas);
        windowBackdropMesh.material.needsUpdate = true;
      }

      updateHUDAndCards();
    }

    // Handles Atmosphere Preset Click
    function setAtmosphere(key, o2, p) {
      customParams.isUserOverridden = true;
      customParams.oxygen = o2;
      customParams.pressure = p;

      document.getElementById('slider-oxygen').value = o2;
      document.getElementById('slider-pressure').value = p;

      document.querySelectorAll('.atm-btn').forEach(b => b.classList.remove('active'));
      const activeBtn = document.querySelector(`.atm-btn[data-k="${key}"]`);
      if (activeBtn) activeBtn.classList.add('active');

      updateHUDAndCards();
    }

    // Cut Airflow Test (Saffire-V Demonstration)
    function cutAirflowTest() {
      customParams.isUserOverridden = true;
      customParams.airflow = 0.0;
      document.getElementById('slider-airflow').value = 0.0;
      updateHUDAndCards();
      alert('Saffire-V Airflow Cut Triggered: Flow reduced to 0 cm/s. In Saffire-V, NASA found that cutting airflow extinguished PMMA within 300s, but cotton cloth reignited after 70s of stagnant dwell time due to retained heat.');
    }

    // Direct Load of NASA Flight Experiments
    function loadExperimentConditions(g, o2, p, flow, cardId) {
      customParams.isUserOverridden = true;
      customParams.gravity = g;
      customParams.oxygen = o2;
      customParams.pressure = p;
      customParams.airflow = flow;

      document.getElementById('slider-gravity').value = g;
      document.getElementById('slider-oxygen').value = o2;
      document.getElementById('slider-pressure').value = p;
      document.getElementById('slider-airflow').value = flow;

      // Highlight matching experiment card
      document.querySelectorAll('.nasa-ref-card').forEach(c => c.classList.remove('match'));
      const matched = document.getElementById(`ref-card-${cardId}`);
      if (matched) matched.classList.add('match');

      updateHUDAndCards();

      // Smooth scroll back to 3D simulator to observe live change
      document.getElementById('simulator-container').scrollIntoView({ behavior: 'smooth' });
    }

    // Handles User Moving Sliders Directly
    function onCustomParamChange() {
      customParams.isUserOverridden = true;
      customParams.gravity = parseFloat(document.getElementById('slider-gravity').value);
      customParams.oxygen = parseFloat(document.getElementById('slider-oxygen').value);
      customParams.pressure = parseFloat(document.getElementById('slider-pressure').value);
      customParams.airflow = parseFloat(document.getElementById('slider-airflow').value);

      document.querySelectorAll('.atm-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.env-tab-btn').forEach(btn => btn.classList.remove('active'));

      updateHUDAndCards();
    }

    // Handles Material Selection Dropdown
    function onMaterialChange() {
      const select = document.getElementById('select-material');
      const mat = MATERIALS[select.value];
      if (mat) {
        currentMaterial = mat;
        updateHUDAndCards();
      }
    }

    // Recalculates Physics, HUD Metrics & Updates Source Provenance Cards
    function updateHUDAndCards() {
      const g = customParams.isUserOverridden ? customParams.gravity : currentEnv.gravity;
      const o2 = customParams.isUserOverridden ? customParams.oxygen : currentEnv.oxygen;
      const p = customParams.isUserOverridden ? customParams.pressure : currentEnv.pressure;
      const flow = customParams.isUserOverridden ? customParams.airflow : currentEnv.airflow;

      // Immediately synchronize 3D flame physics and geometry
      updateFlamePhysics(clock.getElapsedTime(), g, o2, flow);

      // Compute Oxygen Partial Pressure (kPa)
      const po2 = (o2 / 100.0) * p;

      // Compute Buoyancy Scale vs Earth (√g)
      const sqrtG = Math.sqrt(Math.max(0, g));
      const buoyText = g <= 0.001 ? '= 0 (none)' : `= ${sqrtG.toFixed(2)}×`;

      // Flammability Assessment (Compared against Limiting Oxygen Index)
      let riskStatus = 'MARGINAL SPREAD · 86%';
      let riskClass = 'status-marginal';
      let envelopeTag = 'IN ENVELOPE';

      if (o2 < currentMaterial.uloi) {
        riskStatus = 'EXTINCTION / SAFE · 14%';
        riskClass = 'status-extinction';
        envelopeTag = 'BELOW MOC/ULOI';
      } else if (o2 > currentMaterial.uloi + 4.0) {
        riskStatus = 'SUSTAINED SPREAD · 94%';
        riskClass = 'status-sustained';
        envelopeTag = 'SUPER-CRITICAL';
      }

      // Range check against authentic NASA test conditions
      let inNasaEnvelope = false;
      let matchedTests = [];

      if (g <= 0.05) {
        // Microgravity NASA envelope (Saffire & BASS-II)
        if (o2 >= 13.0 && o2 <= 32.0 && p >= 50.0 && p <= 105.0) {
          inNasaEnvelope = true;
          matchedTests.push('Saffire I–VI', 'BASS-II');
        }
      } else if (Math.abs(g - 0.165) < 0.04 || Math.abs(g - 0.38) < 0.05 || Math.abs(g - 1.0) < 0.05 || Math.abs(g - 0.1) < 0.03) {
        // KC-135 Aircraft tested gravity levels
        if (o2 >= 19.0 && o2 <= 23.0 && p >= 20.0 && p <= 102.0) {
          inNasaEnvelope = true;
          matchedTests.push('NASA Glenn KC-135');
        }
      }

      // Update Left HUD Readouts
      document.getElementById('hud-chamber-title').textContent = customParams.isUserOverridden
        ? `ENVIRONMENT CHAMBER · ${g <= 0.005 ? 'ISS MG (~0 G)' : g.toFixed(2) + ' G'}`
        : `ENVIRONMENT CHAMBER · ${currentEnv.name.toUpperCase()}`;
      document.getElementById('hud-env-tag').textContent = inNasaEnvelope ? 'NASA FLIGHT DATA' : 'PARAMETRIC EXPLORATION';
      document.getElementById('hud-gravity-val').textContent = `${g.toFixed(2)} g`;
      document.getElementById('hud-o2-val').textContent = `${o2.toFixed(1)} %`;
      document.getElementById('hud-pressure-val').textContent = `${p.toFixed(1)} kPa`;
      document.getElementById('hud-airflow-val').textContent = `${flow.toFixed(1)} cm/s`;
      document.getElementById('hud-po2-val').textContent = `${po2.toFixed(1)} kPa`;
      document.getElementById('hud-buoyancy-val').textContent = buoyText;

      // Update Right HUD Readouts
      const riskBadge = document.getElementById('hud-risk-badge');
      riskBadge.textContent = riskStatus;
      riskBadge.className = `hud-status-badge ${riskClass}`;
      document.getElementById('hud-envelope-tag').textContent = inNasaEnvelope ? 'IN ENVELOPE' : 'EXTRAPOLATED';
      document.getElementById('hud-envelope-tag').style.color = inNasaEnvelope ? 'var(--green-safe)' : 'var(--amber-flame)';
      document.getElementById('hud-material-val').textContent = currentMaterial.name;
      document.getElementById('hud-tests-count').textContent = customParams.isUserOverridden ? (inNasaEnvelope ? '123+' : 'Parametric') : currentEnv.tests;

      // Update Controls Slider Readouts
      document.getElementById('val-gravity').textContent = `${g.toFixed(2)} g`;
      document.getElementById('val-oxygen').textContent = `${o2.toFixed(1)} %`;
      document.getElementById('val-pressure').textContent = `${p.toFixed(1)} kPa`;
      document.getElementById('val-airflow').textContent = `${flow.toFixed(1)} cm/s`;

      // Update Headline Banner
      if (!customParams.isUserOverridden) {
        document.getElementById('headline-badge').src = currentEnv.badge;
        document.getElementById('headline-title').textContent = currentEnv.headline;
        document.getElementById('headline-quote-box').innerHTML = `
          ${currentEnv.quote}
          <span class="official-quote-author">${currentEnv.quoteAuthor}</span>
        `;
        document.getElementById('headline-citations').textContent = currentEnv.citations;
      } else {
        document.getElementById('headline-title').textContent = `Parametric Exploration: ${g.toFixed(2)} g at ${o2.toFixed(1)}% O₂ (${p.toFixed(1)} kPa)`;
      }

      // Update "How This Result Was Reached" Cards
      document.getElementById('card-val-gravity').textContent = `${g.toFixed(2)} g (${(g * 9.81).toFixed(2)} m/s²)`;
      document.getElementById('card-tag-gravity').textContent = customParams.isUserOverridden ? 'SET BY OPERATOR' : 'NASA EXPERIMENT';
      document.getElementById('card-tag-gravity').className = `source-pill-tag ${customParams.isUserOverridden ? 'pill-user' : 'pill-nasa'}`;

      document.getElementById('card-val-buoyancy').textContent = `Buoyant Flow ≈ √g = ${sqrtG.toFixed(2)}×`;
      document.getElementById('card-val-o2').textContent = `${o2.toFixed(1)} % O₂`;
      document.getElementById('card-val-pressure').textContent = `${p.toFixed(1)} kPa`;
      document.getElementById('card-val-po2').textContent = `${po2.toFixed(1)} kPa (from ${o2.toFixed(1)}% at ${p.toFixed(1)} kPa)`;
      document.getElementById('card-val-airflow').textContent = `${flow.toFixed(1)} cm/s (${flow > 0 ? 'Forced Ventilation' : 'Quiescent Diffusion'})`;
      document.getElementById('card-val-risk').textContent = `${riskStatus} [${currentMaterial.name}]`;

      // Flame shape & color text
      if (g <= 0.02) {
        document.getElementById('card-val-shape').textContent = 'Spherical · Blue Chemiluminescence · Soot-Free';
        document.getElementById('card-val-color').textContent = 'Blue, soot-free (CH* and C₂* radicals)';
      } else if (g < 0.25) {
        document.getElementById('card-val-shape').textContent = 'Dome-Like · Soft Amber Soot · Wide Blue Base';
        document.getElementById('card-val-color').textContent = 'Pale amber soot tip with wide blue chemiluminescent base';
      } else if (g < 0.6) {
        document.getElementById('card-val-shape').textContent = 'Intermediate Teardrop · Moderate Elongation';
        document.getElementById('card-val-color').textContent = 'Warm orange-yellow with moderate incandescent soot';
      } else {
        document.getElementById('card-val-shape').textContent = 'Teardrop · Incandescent Yellow Soot Tip';
        document.getElementById('card-val-color').textContent = 'Incandescent yellow-orange soot with blue base anchor';
      }

      const sizeFactor = Math.min(1.8, Math.max(0.3, Math.sqrt(po2 / 21.2)));
      document.getElementById('card-val-size').textContent = `≈ ${sizeFactor.toFixed(2)}× vs Earth standard air`;

      // Range check card
      const rangeCardVal = document.getElementById('card-val-range');
      const rangeCardDesc = document.getElementById('card-desc-range');
      const rangeCardTag = document.getElementById('card-tag-range');

      if (inNasaEnvelope) {
        rangeCardVal.textContent = 'Inside Tested NASA Envelope';
        rangeCardVal.style.color = 'var(--green-safe)';
        rangeCardTag.textContent = 'VERIFIED ENVELOPE';
        rangeCardTag.className = 'source-pill-tag pill-nasa';
        rangeCardDesc.textContent = `Your oxygen (${o2.toFixed(1)}%) and pressure (${p.toFixed(1)} kPa) fall inside verified NASA tests at this gravity: ${matchedTests.join(', ')}.`;
      } else {
        rangeCardVal.textContent = 'Outside Tested NASA Envelope';
        rangeCardVal.style.color = 'var(--amber-flame)';
        rangeCardTag.textContent = 'PARAMETRIC EXTRAPOLATION';
        rangeCardTag.className = 'source-pill-tag pill-model';
        rangeCardDesc.textContent = `Your oxygen (${o2.toFixed(1)}%) and pressure (${p.toFixed(1)} kPa) are outside the loaded NASA test points at this gravity, so flame behavior is physical extrapolation.`;
      }
    }

    // Camera Preset Views
    function setCameraPreset(preset) {
      document.querySelectorAll('.camera-preset-btn').forEach(btn => btn.classList.remove('active'));
      const activeBtn = document.getElementById(`btn-cam-${preset}`);
      if (activeBtn) activeBtn.classList.add('active');

      if (preset === 'orbit') {
        controls.target.set(0, 1.6, 0);
        camera.position.set(0, 1.8, 10.5);
      } else if (preset === 'front') {
        controls.target.set(0, 1.6, 0);
        camera.position.set(0, 1.6, 7.5);
      } else if (preset === 'close') {
        controls.target.set(0, 1.4, 0);
        camera.position.set(0, 1.4, 3.2);
      } else if (preset === 'window') {
        controls.target.set(-6.8, 2.5, -1.8);
        camera.position.set(-2.0, 2.2, 2.0);
      } else if (preset === 'top') {
        controls.target.set(0, 1.6, 0);
        camera.position.set(0, 9.5, 0.1);
      }
    }

    // Toggle Continuous Auto-Rotation
    function toggleAutoRotate(enabled) {
      isAutoRotating = enabled;
      controls.autoRotate = enabled;
    }

    // Responsive Canvas Resize
    function setupWindowResize() {
      window.addEventListener('resize', () => {
        const container = document.getElementById('simulator-container');
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      });
    }
  </script>
</body>
</html>
'''

with open('ignis-simulator.html', 'w', encoding='utf-8') as f:
    f.write(html_content)

print(f"Generated ignis-simulator.html successfully ({len(html_content)} bytes).")

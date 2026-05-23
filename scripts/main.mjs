const MODULE_ID = "pat-pat-party";
const MODULE_TITLE = "Pat Pat Party";
const SOCKET_NAME = `module.${MODULE_ID}`;
const LOG_PREFIX = "[Pat Pat Party]";
const HUD_PAT_BUTTON_CLASS = "pat-pat-party-hud-button";
const HUD_CALIBRATE_BUTTON_CLASS = "pat-pat-party-calibrate-hud-button";
const OVERLAY_ID = "pat-pat-party-overlay";
const PAT_OFFSET_FLAG = "patOffset";
const MAX_MESSAGE_LENGTH = 40;

const INTENSITIES = ["gentle", "normal", "rough"];
const LEGACY_INTENSITY_MAP = {
  low: "gentle",
  high: "rough"
};

const DEFAULT_SETTINGS = {
  allowPlayersPatOthers: true,
  allowPatHostile: false,
  showChatMessage: true,
  cooldownSeconds: 10,
  animationIntensity: "normal"
};

const EFFECT_DURATION_BY_INTENSITY = {
  gentle: 1400,
  normal: 1200,
  rough: 1300
};

const PARTICLE_CONFIG_BY_INTENSITY = {
  gentle: {
    count: [3, 5],
    symbols: ["&#x1F497;", "&#x1F33C;", "&#x2728;"],
    drift: 32,
    rise: [42, 74],
    delay: [130, 620],
    size: [14, 20]
  },
  normal: {
    count: [5, 8],
    symbols: ["&#x1F495;", "&#x1F497;", "&#x1F33C;", "&#x2728;"],
    drift: 46,
    rise: [48, 88],
    delay: [70, 560],
    size: [15, 23]
  },
  rough: {
    count: [8, 12],
    symbols: ["&#x1F495;", "&#x1F497;", "&#x1F33C;", "&#x2728;", "&#x1F4AB;"],
    drift: 64,
    rise: [54, 104],
    delay: [20, 620],
    size: [16, 26]
  }
};

const RUB_ARCS_BY_INTENSITY = {
  gentle: 0,
  normal: 1,
  rough: 3
};

const TOKEN_FEEDBACK_BY_INTENSITY = {
  gentle: { cycles: 2, scaleX: 0.018, scaleY: 0.032, shiftX: 0.4, shiftY: 2.2, rotation: 0 },
  normal: { cycles: 3, scaleX: 0.028, scaleY: 0.045, shiftX: 1.8, shiftY: 3.4, rotation: 0.01 },
  rough: { cycles: 5, scaleX: 0.04, scaleY: 0.058, shiftX: 3.2, shiftY: 4.6, rotation: 0.018 }
};

const cooldowns = new Map();
const tokenFeedbackCleanups = new WeakMap();

Hooks.once("init", () => {
  registerSettings();
  debug("Initialized.");
});

Hooks.once("ready", () => {
  registerSocket();
  ensureOverlay();

  game.patPatParty = {
    handlePatToken,
    openPatIntensityDialog,
    openCalibrationDialog,
    playPatAnimation,
    canPatToken,
    getPatOffset,
    savePatOffset,
    clearCooldowns: () => cooldowns.clear()
  };

  debug("Ready.");
});

Hooks.on("renderTokenHUD", injectTokenHudButton);

function registerSettings() {
  game.settings.register(MODULE_ID, "allowPlayersPatOthers", {
    name: "PATPAT.Settings.AllowPlayersPatOthers.Name",
    hint: "PATPAT.Settings.AllowPlayersPatOthers.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: DEFAULT_SETTINGS.allowPlayersPatOthers
  });

  game.settings.register(MODULE_ID, "allowPatHostile", {
    name: "PATPAT.Settings.AllowPatHostile.Name",
    hint: "PATPAT.Settings.AllowPatHostile.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: DEFAULT_SETTINGS.allowPatHostile
  });

  game.settings.register(MODULE_ID, "showChatMessage", {
    name: "PATPAT.Settings.ShowChatMessage.Name",
    hint: "PATPAT.Settings.ShowChatMessage.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: DEFAULT_SETTINGS.showChatMessage
  });

  game.settings.register(MODULE_ID, "cooldownSeconds", {
    name: "PATPAT.Settings.CooldownSeconds.Name",
    hint: "PATPAT.Settings.CooldownSeconds.Hint",
    scope: "world",
    config: true,
    type: Number,
    range: {
      min: 0,
      max: 300,
      step: 1
    },
    default: DEFAULT_SETTINGS.cooldownSeconds
  });

  game.settings.register(MODULE_ID, "animationIntensity", {
    name: "PATPAT.Settings.AnimationIntensity.Name",
    hint: "PATPAT.Settings.AnimationIntensity.Hint",
    scope: "world",
    config: true,
    type: String,
    choices: {
      gentle: "PATPAT.Settings.AnimationIntensity.Choices.Gentle",
      normal: "PATPAT.Settings.AnimationIntensity.Choices.Normal",
      rough: "PATPAT.Settings.AnimationIntensity.Choices.Rough"
    },
    default: DEFAULT_SETTINGS.animationIntensity
  });
}

function injectTokenHudButton(app, html, data) {
  const root = getHtmlElement(html);
  if (!root) return;

  const token = getTokenFromHud(app, data);
  if (!token) {
    warn("Token HUD rendered without a resolvable token.", { app, data });
    return;
  }

  const targetColumn =
    root.querySelector(".col.left") ??
    root.querySelector(".col.right") ??
    root.querySelector(".control-icons") ??
    root;

  if (!root.querySelector(`.${HUD_PAT_BUTTON_CLASS}`)) {
    const patButton = createHudButton({
      className: HUD_PAT_BUTTON_CLASS,
      iconClass: "fa-solid fa-hand-sparkles",
      labelKey: "PATPAT.Controls.Pat",
      action: () => openPatIntensityDialog(resolveLiveToken(token) ?? token)
    });

    targetColumn.appendChild(patButton);
  }

  if (!root.querySelector(`.${HUD_CALIBRATE_BUTTON_CLASS}`)) {
    const calibrateButton = createHudButton({
      className: HUD_CALIBRATE_BUTTON_CLASS,
      iconClass: "fa-solid fa-crosshairs",
      labelKey: "PATPAT.Controls.Calibrate",
      action: () => openCalibrationDialog(resolveLiveToken(token) ?? token)
    });

    targetColumn.appendChild(calibrateButton);
  }
}

function createHudButton({ className, iconClass, labelKey, action }) {
  const label = localize(labelKey);
  const button = document.createElement("div");
  button.classList.add("control-icon", className);
  button.dataset.action = className;
  button.setAttribute("role", "button");
  button.setAttribute("aria-label", label);
  button.title = label;
  button.innerHTML = `<i class="${iconClass}" aria-hidden="true"></i>`;

  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      action();
    } catch (error) {
      warn(`Failed to run HUD action ${className}.`, error);
      ui.notifications?.warn(localize("PATPAT.Warnings.Generic"));
    }
  });

  return button;
}

function openPatIntensityDialog(token) {
  const liveToken = resolveLiveToken(token) ?? token;
  if (!liveToken) {
    ui.notifications?.warn(localize("PATPAT.Warnings.NoToken"));
    return;
  }

  const defaultIntensity = normalizeIntensity(getSetting("animationIntensity"));
  const defaultMessage = getDefaultPatMessage();
  const content = `
    <form class="pat-pat-party-dialog pat-pat-party-pat-form">
      <p class="pat-pat-party-dialog-target">
        <strong>${escapeHtml(localize("PATPAT.Dialogs.Pat.Target"))}</strong>
        <span>${escapeHtml(getTokenName(liveToken))}</span>
      </p>
      <div class="form-group">
        <label for="pat-pat-party-message">${escapeHtml(localize("PATPAT.Dialogs.Pat.MessageLabel"))}</label>
        <input
          id="pat-pat-party-message"
          type="text"
          name="message"
          maxlength="${MAX_MESSAGE_LENGTH}"
          value="${escapeHtml(defaultMessage)}"
          placeholder="${escapeHtml(localize("PATPAT.Dialogs.Pat.MessagePlaceholder"))}">
      </div>
      <p class="notes">${escapeHtml(format("PATPAT.Dialogs.Pat.MessageHint", { max: MAX_MESSAGE_LENGTH }))}</p>
    </form>
  `;

  new Dialog({
    title: localize("PATPAT.Dialogs.Pat.Title"),
    content,
    buttons: {
      gentle: {
        icon: '<i class="fa-solid fa-feather-pointed"></i>',
        label: localize("PATPAT.Intensity.Gentle"),
        callback: (html) => runPatFromDialog(liveToken, "gentle", readPatMessageFromDialog(html))
      },
      normal: {
        icon: '<i class="fa-solid fa-hand-sparkles"></i>',
        label: localize("PATPAT.Intensity.Normal"),
        callback: (html) => runPatFromDialog(liveToken, "normal", readPatMessageFromDialog(html))
      },
      rough: {
        icon: '<i class="fa-solid fa-wand-sparkles"></i>',
        label: localize("PATPAT.Intensity.Rough"),
        callback: (html) => runPatFromDialog(liveToken, "rough", readPatMessageFromDialog(html))
      },
      cancel: {
        icon: '<i class="fa-solid fa-xmark"></i>',
        label: localize("PATPAT.Dialogs.Common.Cancel")
      }
    },
    default: defaultIntensity
  }).render(true);
}

function runPatFromDialog(token, intensity, message) {
  const liveToken = resolveLiveToken(token) ?? token;
  return handlePatToken(liveToken, intensity, message).catch((error) => {
    warn("Failed to handle token pat.", error);
    ui.notifications?.warn(localize("PATPAT.Warnings.Generic"));
  });
}

function openCalibrationDialog(token) {
  const liveToken = resolveLiveToken(token) ?? token;
  if (!liveToken) {
    ui.notifications?.warn(localize("PATPAT.Warnings.NoToken"));
    return;
  }

  const offset = getPatOffset(liveToken);
  const content = `
    <form class="pat-pat-party-dialog pat-pat-party-calibration-form">
      <p class="pat-pat-party-dialog-target">
        <strong>${escapeHtml(localize("PATPAT.Dialogs.Calibration.Token"))}</strong>
        <span>${escapeHtml(getTokenName(liveToken))}</span>
      </p>
      <div class="form-group">
        <label>${escapeHtml(localize("PATPAT.Dialogs.Calibration.XOffset"))}</label>
        <input type="number" name="x" min="-300" max="300" step="1" value="${offset.x}">
      </div>
      <div class="form-group">
        <label>${escapeHtml(localize("PATPAT.Dialogs.Calibration.YOffset"))}</label>
        <input type="number" name="y" min="-300" max="300" step="1" value="${offset.y}">
      </div>
      <p class="notes">${escapeHtml(localize("PATPAT.Dialogs.Calibration.Hint"))}</p>
    </form>
  `;

  new Dialog({
    title: localize("PATPAT.Dialogs.Calibration.Title"),
    content,
    buttons: {
      reset: {
        icon: '<i class="fa-solid fa-rotate-left"></i>',
        label: localize("PATPAT.Dialogs.Common.Reset"),
        callback: (html) => {
          const form = getDialogForm(html);
          if (form?.elements?.x) form.elements.x.value = 0;
          if (form?.elements?.y) form.elements.y.value = 0;
          return false;
        }
      },
      save: {
        icon: '<i class="fa-solid fa-floppy-disk"></i>',
        label: localize("PATPAT.Dialogs.Common.Save"),
        callback: (html) => {
          const nextOffset = readOffsetFromDialog(html);
          return savePatOffset(resolveLiveToken(liveToken) ?? liveToken, nextOffset);
        }
      },
      cancel: {
        icon: '<i class="fa-solid fa-xmark"></i>',
        label: localize("PATPAT.Dialogs.Common.Cancel")
      }
    },
    default: "save"
  }).render(true);
}

async function handlePatToken(token, intensity = getSetting("animationIntensity"), message = getDefaultPatMessage()) {
  const liveToken = resolveLiveToken(token) ?? token;
  if (!liveToken) {
    ui.notifications?.warn(localize("PATPAT.Warnings.NoToken"));
    return;
  }

  const permission = canPatToken(liveToken);
  if (!permission.allowed) {
    ui.notifications?.warn(localize(permission.messageKey));
    return;
  }

  const cooldown = checkCooldown(liveToken);
  if (!cooldown.allowed) {
    ui.notifications?.warn(format("PATPAT.Warnings.Cooldown", { seconds: cooldown.remaining }));
    return;
  }

  const selectedIntensity = normalizeIntensity(intensity);
  const safeMessage = normalizePatMessage(message);
  const payload = createPatPayload(liveToken, selectedIntensity, safeMessage);

  playPatAnimation(liveToken, selectedIntensity, safeMessage, payload.offset);

  if (getSetting("showChatMessage")) {
    await sendPatChatMessage(liveToken, payload);
  }

  broadcastPat(payload);
}

function canPatToken(token) {
  if (game.user?.isGM) {
    return { allowed: true };
  }

  if (!token?.document) {
    return { allowed: false, messageKey: "PATPAT.Warnings.NoToken" };
  }

  if (isHostileToken(token) && !getSetting("allowPatHostile")) {
    return { allowed: false, messageKey: "PATPAT.Warnings.HostileNotAllowed" };
  }

  if (userOwnsToken(token)) {
    return { allowed: true };
  }

  if (!getSetting("allowPlayersPatOthers")) {
    return { allowed: false, messageKey: "PATPAT.Warnings.NoPermission" };
  }

  return { allowed: true };
}

function checkCooldown(token) {
  if (game.user?.isGM) {
    return { allowed: true, remaining: 0 };
  }

  const seconds = Math.max(0, Number(getSetting("cooldownSeconds")) || 0);
  if (seconds <= 0) {
    return { allowed: true, remaining: 0 };
  }

  const tokenId = token?.id ?? token?.document?.id;
  if (!tokenId || !game.user?.id) {
    return { allowed: true, remaining: 0 };
  }

  const key = `${game.user.id}:${tokenId}`;
  const now = Date.now();
  const expiresAt = cooldowns.get(key) ?? 0;

  if (expiresAt > now) {
    return {
      allowed: false,
      remaining: Math.max(1, Math.ceil((expiresAt - now) / 1000))
    };
  }

  cooldowns.set(key, now + seconds * 1000);
  return { allowed: true, remaining: 0 };
}

function playPatAnimation(token, intensity = getSetting("animationIntensity"), message = getDefaultPatMessage(), offsetOverride = null) {
  if (!token || !canvas?.ready) return;

  const position = getTokenScreenPosition(token, offsetOverride);
  if (!position) {
    warn("Unable to determine token screen position for animation.", token);
    return;
  }

  const overlay = ensureOverlay();
  if (!overlay) return;

  const selectedIntensity = normalizeIntensity(intensity);
  const duration = EFFECT_DURATION_BY_INTENSITY[selectedIntensity];
  const safeMessage = normalizePatMessage(message);
  const effect = document.createElement("div");
  effect.className = `pat-pat-party-effect pat-pat-party-intensity-${selectedIntensity}`;
  effect.style.left = `${Math.round(position.x)}px`;
  effect.style.top = `${Math.round(position.y)}px`;
  effect.style.setProperty("--ppp-duration", `${duration}ms`);
  effect.innerHTML = `
    <div class="pat-pat-party-token-feedback" aria-hidden="true"></div>
    <div class="pat-pat-party-rub-arcs" aria-hidden="true">${createRubArcMarkup(selectedIntensity)}</div>
    <div class="pat-pat-party-hand" aria-hidden="true">&#x1F590;&#xFE0F;</div>
    <div class="pat-pat-party-particles" aria-hidden="true">${createParticleMarkup(selectedIntensity)}</div>
    <div class="pat-pat-party-floating-text">${escapeHtml(safeMessage)}</div>
  `;

  overlay.appendChild(effect);
  playTokenSpriteFeedback(token, selectedIntensity, duration);
  window.setTimeout(() => effect.remove(), duration + 650);
}

async function sendPatChatMessage(token, payload) {
  if (!token) return;

  const speakerToken = getSpeakerToken(token);
  const message = normalizePatMessage(payload.message ?? localize(payload.messageKey ?? "PATPAT.Chat.Message"));
  const speaker = getChatSpeaker(speakerToken);
  const content = `
    <div class="pat-pat-party-chat-card">
      <header class="pat-pat-party-chat-header">
        <i class="fa-solid fa-hand-sparkles" aria-hidden="true"></i>
        <span>${escapeHtml(localize("PATPAT.Chat.Title"))}</span>
      </header>
      <p>${escapeHtml(message)}</p>
    </div>
  `;

  await ChatMessage.create({
    user: game.user?.id,
    speaker,
    content,
    flavor: localize("PATPAT.Chat.Flavor")
  });
}

function broadcastPat(payload) {
  if (!game.socket) {
    warn("Socket is unavailable; animation will remain local.");
    return;
  }

  try {
    game.socket.emit(SOCKET_NAME, payload);
  } catch (error) {
    warn("Failed to broadcast pat animation.", error);
  }
}

function handleSocketMessage(payload) {
  if (payload?.action === "pat") {
    handleSocketPat(payload);
    return;
  }

  if (payload?.action === "setPatOffset") {
    handleSocketSetPatOffset(payload).catch((error) => {
      warn("Failed to handle pat offset socket request.", error);
    });
  }
}

function handleSocketPat(payload) {
  if (!canvas?.ready || !canvas.scene) return;
  if (payload.sceneId !== canvas.scene.id) return;
  if (payload.userId === game.user?.id) return;

  const token = getCanvasToken(payload.tokenId);
  if (!token) {
    debug("Received pat socket payload for a token that is not on this canvas.", payload);
    return;
  }

  playPatAnimation(token, payload.intensity, payload.message, payload.offset);
}

async function handleSocketSetPatOffset(payload) {
  if (!game.user?.isGM) return;
  if (!isPrimaryActiveGM()) return;

  const requester = game.users?.get?.(payload.userId);
  const tokenDocument = getSceneTokenDocument(payload.sceneId, payload.tokenId);
  if (!requester || !tokenDocument) {
    debug("Offset socket request could not resolve requester or token.", payload);
    return;
  }

  if (!canRequesterCalibrateToken(requester, tokenDocument)) {
    warn("Rejected pat offset socket request because requester lacks permission.", payload);
    return;
  }

  await tokenDocument.setFlag(MODULE_ID, PAT_OFFSET_FLAG, normalizeOffset(payload.offset));
}

function registerSocket() {
  if (!game.socket) {
    warn("Game socket is unavailable during ready hook.");
    return;
  }

  game.socket.on(SOCKET_NAME, handleSocketMessage);
}

async function savePatOffset(token, offset) {
  const liveToken = resolveLiveToken(token) ?? token;
  const tokenDocument = liveToken?.document ?? token?.document;
  if (!tokenDocument) {
    ui.notifications?.warn(localize("PATPAT.Warnings.NoToken"));
    return false;
  }

  const normalizedOffset = normalizeOffset(offset);

  try {
    await tokenDocument.setFlag(MODULE_ID, PAT_OFFSET_FLAG, normalizedOffset);
    ui.notifications?.info(localize("PATPAT.Notifications.CalibrationSaved"));
    return true;
  } catch (error) {
    debug("Direct pat offset save failed; trying GM socket delegation.", error);
  }

  if (!game.socket || !hasActiveGM()) {
    ui.notifications?.warn(localize("PATPAT.Warnings.NoCalibrationPermission"));
    return false;
  }

  try {
    game.socket.emit(SOCKET_NAME, {
      action: "setPatOffset",
      sceneId: canvas?.scene?.id ?? tokenDocument.parent?.id,
      tokenId: tokenDocument.id,
      userId: game.user?.id,
      offset: normalizedOffset
    });
    ui.notifications?.info(localize("PATPAT.Notifications.CalibrationRequested"));
    return true;
  } catch (error) {
    warn("Failed to request GM pat offset save.", error);
    ui.notifications?.warn(localize("PATPAT.Warnings.NoCalibrationPermission"));
    return false;
  }
}

function createPatPayload(token, intensity, message = getDefaultPatMessage()) {
  return {
    action: "pat",
    sceneId: canvas?.scene?.id,
    tokenId: token?.id ?? token?.document?.id,
    userId: game.user?.id,
    userName: game.user?.name,
    targetName: getTokenName(token),
    messageKey: "PATPAT.Chat.Message",
    message: normalizePatMessage(message),
    intensity: normalizeIntensity(intensity),
    offset: getPatOffset(token)
  };
}

function getHtmlElement(html) {
  if (html instanceof HTMLElement) return html;
  if (html?.[0] instanceof HTMLElement) return html[0];
  if (html?.element instanceof HTMLElement) return html.element;
  if (html?.jquery && html?.[0] instanceof HTMLElement) return html[0];
  return null;
}

function getDialogForm(html) {
  const root = getHtmlElement(html);
  return root?.querySelector?.("form") ?? null;
}

function readOffsetFromDialog(html) {
  const form = getDialogForm(html);
  if (!form) return { x: 0, y: 0 };

  const formData = new FormData(form);
  return normalizeOffset({
    x: formData.get("x"),
    y: formData.get("y")
  });
}

function readPatMessageFromDialog(html) {
  const form = getDialogForm(html);
  if (!form) return getDefaultPatMessage();

  const formData = new FormData(form);
  return normalizePatMessage(formData.get("message"));
}

function getTokenFromHud(app, data) {
  const hudObject = app?.object;
  if (isCanvasToken(hudObject)) return hudObject;

  const tokenId =
    hudObject?.id ??
    hudObject?.document?.id ??
    data?._id ??
    data?.id ??
    data?.tokenId;

  return getCanvasToken(tokenId);
}

function resolveLiveToken(token) {
  return getCanvasToken(token?.id ?? token?.document?.id) ?? token ?? null;
}

function getCanvasToken(tokenId) {
  if (!tokenId || !canvas?.tokens) return null;
  return (
    canvas.tokens.get?.(tokenId) ??
    canvas.tokens.placeables?.find((token) => token.id === tokenId || token.document?.id === tokenId) ??
    null
  );
}

function getSceneTokenDocument(sceneId, tokenId) {
  if (!sceneId || !tokenId) return null;

  const currentSceneToken =
    canvas?.scene?.id === sceneId ? getCanvasToken(tokenId)?.document ?? null : null;
  if (currentSceneToken) return currentSceneToken;

  const scene = game.scenes?.get?.(sceneId);
  return scene?.tokens?.get?.(tokenId) ?? null;
}

function isCanvasToken(value) {
  return Boolean(value?.document && (value?.center || Number.isFinite(value?.x)));
}

function isHostileToken(token) {
  const hostileDisposition = CONST?.TOKEN_DISPOSITIONS?.HOSTILE ?? -1;
  return token?.document?.disposition === hostileDisposition;
}

function userOwnsToken(token) {
  const user = game.user;
  if (!user || !token) return false;

  const actor = token.actor ?? token.document?.actor;

  try {
    if (token.document?.testUserPermission?.(user, "OWNER")) return true;
  } catch (error) {
    debug("Token permission test failed; falling back to actor ownership.", error);
  }

  try {
    if (actor?.testUserPermission?.(user, "OWNER")) return true;
  } catch (error) {
    debug("Actor permission test failed; falling back to isOwner flags.", error);
  }

  return Boolean(token.isOwner || token.document?.isOwner || actor?.isOwner);
}

function canRequesterCalibrateToken(user, tokenDocument) {
  if (user?.isGM) return true;
  if (!user || !tokenDocument) return false;

  const hostileDisposition = CONST?.TOKEN_DISPOSITIONS?.HOSTILE ?? -1;
  if (tokenDocument.disposition === hostileDisposition && !getSetting("allowPatHostile")) {
    return false;
  }

  if (getSetting("allowPlayersPatOthers")) {
    return true;
  }

  try {
    if (tokenDocument.testUserPermission?.(user, "OWNER")) return true;
  } catch (error) {
    debug("Requester token permission test failed.", error);
  }

  try {
    if (tokenDocument.actor?.testUserPermission?.(user, "OWNER")) return true;
  } catch (error) {
    debug("Requester actor permission test failed.", error);
  }

  return false;
}

function getTokenScreenPosition(token, offsetOverride = null) {
  const basePosition = getTokenTopCenterScreenPosition(token);
  if (!basePosition) return null;

  const offset = offsetOverride ? normalizeOffset(offsetOverride) : getPatOffset(token);
  return {
    x: basePosition.x + offset.x,
    y: basePosition.y + offset.y
  };
}

function getTokenTopCenterScreenPosition(token) {
  const center = getTokenCenter(token);
  if (!center) return null;

  const tokenHeight = Number(token?.h ?? token?.height ?? token?.bounds?.height ?? 0);
  const topY = Number.isFinite(token?.y) ? token.y : center.y - tokenHeight / 2;
  const worldPoint = { x: center.x, y: topY };

  try {
    const transformed = canvas?.stage?.worldTransform?.apply?.(worldPoint);
    const view = canvas?.app?.view ?? canvas?.app?.renderer?.view ?? document.querySelector("#board canvas");
    const rect = view?.getBoundingClientRect?.();

    if (transformed && rect) {
      return {
        x: rect.left + transformed.x,
        y: rect.top + transformed.y
      };
    }
  } catch (error) {
    debug("Stage coordinate conversion failed; trying token bounds fallback.", error);
  }

  const bounds = token?.bounds ?? token?.getBounds?.();
  if (bounds) {
    return {
      x: bounds.x + bounds.width / 2,
      y: bounds.y
    };
  }

  return null;
}

function getTokenCenter(token) {
  if (token?.center && Number.isFinite(token.center.x) && Number.isFinite(token.center.y)) {
    return token.center;
  }

  if (Number.isFinite(token?.x) && Number.isFinite(token?.y)) {
    const width = Number(token?.w ?? token?.width ?? token?.bounds?.width ?? 0);
    const height = Number(token?.h ?? token?.height ?? token?.bounds?.height ?? 0);
    return {
      x: token.x + width / 2,
      y: token.y + height / 2
    };
  }

  return null;
}

function getPatOffset(tokenOrDocument) {
  const flag =
    tokenOrDocument?.document?.getFlag?.(MODULE_ID, PAT_OFFSET_FLAG) ??
    tokenOrDocument?.getFlag?.(MODULE_ID, PAT_OFFSET_FLAG);

  return normalizeOffset(flag);
}

function normalizeOffset(offset) {
  return {
    x: clampOffset(offset?.x),
    y: clampOffset(offset?.y)
  };
}

function clampOffset(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.min(300, Math.max(-300, Math.round(number)));
}

function createParticleMarkup(intensity) {
  const selectedIntensity = normalizeIntensity(intensity);
  const config = PARTICLE_CONFIG_BY_INTENSITY[selectedIntensity] ?? PARTICLE_CONFIG_BY_INTENSITY.normal;
  const particleCount = randomInt(config.count[0], config.count[1]);

  return Array.from({ length: particleCount }, (_, index) => {
    const side = index % 2 === 0 ? -1 : 1;
    const driftX = side * randomBetween(config.drift * 0.25, config.drift);
    const startX = randomBetween(-20, 20);
    const rise = randomBetween(config.rise[0], config.rise[1]);
    const delay = randomInt(config.delay[0], config.delay[1]);
    const size = randomInt(config.size[0], config.size[1]);
    const scale = randomBetween(0.8, 1.22);
    const rotate = randomBetween(-22, 22);
    const symbol = pick(config.symbols);
    const style = [
      `--ppp-start-x: ${startX.toFixed(1)}px`,
      `--ppp-drift-x: ${driftX.toFixed(1)}px`,
      `--ppp-rise-y: -${rise.toFixed(1)}px`,
      `--ppp-delay: ${delay}ms`,
      `--ppp-particle-size: ${size}px`,
      `--ppp-particle-scale: ${scale.toFixed(2)}`,
      `--ppp-rotate: ${rotate.toFixed(1)}deg`
    ].join("; ");

    return `<span class="pat-pat-party-particle" style="${style};">${symbol}</span>`;
  }).join("");
}

function createRubArcMarkup(intensity) {
  const selectedIntensity = normalizeIntensity(intensity);
  const arcCount = RUB_ARCS_BY_INTENSITY[selectedIntensity] ?? 0;
  return Array.from({ length: arcCount }, (_, index) => {
    const delay = selectedIntensity === "rough" ? 150 + index * 130 : 240;
    const offset = (index - (arcCount - 1) / 2) * 18;
    const style = [
      `--ppp-arc-delay: ${delay}ms`,
      `--ppp-arc-x: ${offset}px`,
      `--ppp-arc-rotate: ${index % 2 === 0 ? -14 : 14}deg`
    ].join("; ");

    return `<span class="pat-pat-party-rub-arc" style="${style};"></span>`;
  }).join("");
}

function playTokenSpriteFeedback(token, intensity, duration) {
  const mesh = getTokenVisualMesh(token);
  if (!mesh?.scale || !mesh?.position || mesh.destroyed) return;

  const previousCleanup = tokenFeedbackCleanups.get(token);
  if (previousCleanup) previousCleanup();

  const selectedIntensity = normalizeIntensity(intensity);
  const config = TOKEN_FEEDBACK_BY_INTENSITY[selectedIntensity] ?? TOKEN_FEEDBACK_BY_INTENSITY.normal;
  const original = {
    scaleX: mesh.scale.x,
    scaleY: mesh.scale.y,
    x: mesh.position.x,
    y: mesh.position.y,
    rotation: Number(mesh.rotation) || 0
  };

  let frameId = null;
  let active = true;
  const startedAt = performance.now();

  const restore = () => {
    if (mesh.destroyed) return;
    mesh.scale.x = original.scaleX;
    mesh.scale.y = original.scaleY;
    mesh.position.x = original.x;
    mesh.position.y = original.y;
    mesh.rotation = original.rotation;
  };

  const cleanup = () => {
    if (!active) return;
    active = false;
    if (frameId) window.cancelAnimationFrame(frameId);
    restore();
    tokenFeedbackCleanups.delete(token);
  };

  tokenFeedbackCleanups.set(token, cleanup);

  const animate = (now) => {
    if (!active || mesh.destroyed) {
      cleanup();
      return;
    }

    const progress = Math.min(1, (now - startedAt) / duration);
    const envelope = Math.sin(progress * Math.PI);
    const wave = Math.sin(progress * Math.PI * config.cycles);
    const press = Math.abs(wave) * envelope;

    mesh.scale.x = original.scaleX * (1 + config.scaleX * press);
    mesh.scale.y = original.scaleY * (1 - config.scaleY * press);
    mesh.position.x = original.x + config.shiftX * wave * envelope;
    mesh.position.y = original.y + config.shiftY * press;
    mesh.rotation = original.rotation + config.rotation * wave * envelope;

    if (progress < 1) {
      frameId = window.requestAnimationFrame(animate);
    } else {
      cleanup();
    }
  };

  frameId = window.requestAnimationFrame(animate);
  window.setTimeout(cleanup, duration + 250);
}

function getTokenVisualMesh(token) {
  return token?.mesh ?? token?.sprite ?? token?.icon ?? null;
}

function getDefaultPatMessage() {
  return truncateText(localize("PATPAT.Chat.Message"), MAX_MESSAGE_LENGTH);
}

function normalizePatMessage(value) {
  const normalized = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return getDefaultPatMessage();
  return truncateText(normalized, MAX_MESSAGE_LENGTH);
}

function truncateText(value, maxLength) {
  return Array.from(String(value ?? "")).slice(0, maxLength).join("");
}

function randomInt(min, max) {
  return Math.floor(randomBetween(min, max + 1));
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function pick(values) {
  if (!Array.isArray(values) || values.length === 0) return "";
  return values[Math.floor(Math.random() * values.length)];
}

function ensureOverlay() {
  if (!document?.body) return null;

  let overlay = document.getElementById(OVERLAY_ID);
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;
    overlay.setAttribute("aria-hidden", "true");
    document.body.appendChild(overlay);
  }

  return overlay;
}

function getSpeakerToken(targetToken) {
  const controlled = canvas?.tokens?.controlled ?? [];
  const ownedControlled = controlled.find((token) => userOwnsToken(token));
  if (ownedControlled) return ownedControlled;
  return userOwnsToken(targetToken) ? targetToken : null;
}

function getTokenName(token) {
  return (
    token?.name ??
    token?.document?.name ??
    token?.actor?.name ??
    token?.document?.actor?.name ??
    localize("PATPAT.Chat.UnknownTarget")
  );
}

function getChatSpeaker(speakerToken) {
  try {
    if (speakerToken) return ChatMessage.getSpeaker({ token: speakerToken });
    return ChatMessage.getSpeaker({ alias: game.user?.name });
  } catch (error) {
    debug("Chat speaker fallback used.", error);
    return { alias: game.user?.name ?? MODULE_TITLE };
  }
}

function hasActiveGM() {
  return getActiveGMs().length > 0;
}

function isPrimaryActiveGM() {
  const activeGMs = getActiveGMs();
  activeGMs.sort((a, b) => String(a.id).localeCompare(String(b.id)));
  return activeGMs[0]?.id === game.user?.id;
}

function getActiveGMs() {
  const users = game.users?.contents ?? Array.from(game.users ?? []);
  return users.filter((user) => user.active && user.isGM);
}

function normalizeIntensity(value) {
  const mappedValue = LEGACY_INTENSITY_MAP[value] ?? value;
  if (INTENSITIES.includes(mappedValue)) return mappedValue;
  return DEFAULT_SETTINGS.animationIntensity;
}

function getSetting(key) {
  try {
    return game.settings.get(MODULE_ID, key);
  } catch (error) {
    debug(`Using default setting for ${key}.`, error);
    return DEFAULT_SETTINGS[key];
  }
}

function localize(key) {
  return game.i18n?.localize(key) ?? key;
}

function format(key, data = {}) {
  return game.i18n?.format(key, data) ?? key;
}

function escapeHtml(value) {
  const text = String(value ?? "");
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function debug(...args) {
  console.debug(LOG_PREFIX, ...args);
}

function warn(...args) {
  console.warn(LOG_PREFIX, ...args);
}

const MODULE_ID = "pat-pat-party";
const MODULE_TITLE = "Pat Pat Party";
const SOCKET_NAME = `module.${MODULE_ID}`;
const LOG_PREFIX = "[Pat Pat Party]";
const HUD_PAT_BUTTON_CLASS = "pat-pat-party-hud-button";
const HUD_CALIBRATE_BUTTON_CLASS = "pat-pat-party-calibrate-hud-button";
const OVERLAY_ID = "pat-pat-party-overlay";
const PAT_OFFSET_FLAG = "patOffset";
const MAX_MESSAGE_LENGTH = 40;
const HAND_SYMBOL = "\u{1F590}\uFE0F";

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
    symbols: ["\u{1F497}", "\u{1F33C}", "\u2728"],
    drift: 32,
    rise: [42, 74],
    delay: [130, 620],
    size: [14, 20]
  },
  normal: {
    count: [5, 8],
    symbols: ["\u{1F495}", "\u{1F497}", "\u{1F33C}", "\u2728"],
    drift: 46,
    rise: [48, 88],
    delay: [70, 560],
    size: [15, 23]
  },
  rough: {
    count: [8, 12],
    symbols: ["\u{1F495}", "\u{1F497}", "\u{1F33C}", "\u2728", "\u{1F4AB}"],
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

const PIXI_EFFECT_CONFIG_BY_INTENSITY = {
  gentle: {
    handSize: 34,
    handScale: [0.82, 1],
    enterX: 54,
    enterY: -64,
    rubAmplitude: 10,
    rubCount: 2,
    rubRotation: 0.1,
    pressY: 4,
    exitY: -42,
    particleDuration: 1080,
    textRise: 44
  },
  normal: {
    handSize: 39,
    handScale: [0.86, 1.08],
    enterX: 64,
    enterY: -70,
    rubAmplitude: 22,
    rubCount: 3,
    rubRotation: 0.18,
    pressY: 6,
    exitY: -48,
    particleDuration: 980,
    textRise: 52
  },
  rough: {
    handSize: 45,
    handScale: [0.92, 1.2],
    enterX: 76,
    enterY: -76,
    rubAmplitude: 34,
    rubCount: 5,
    rubRotation: 0.32,
    pressY: 9,
    exitY: -56,
    particleDuration: 900,
    textRise: 60
  }
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

  const selectedIntensity = normalizeIntensity(intensity);
  const safeMessage = normalizePatMessage(message);

  if (playPixiPatAnimation(token, selectedIntensity, safeMessage, offsetOverride)) {
    return;
  }

  playDomPatAnimation(token, selectedIntensity, safeMessage, offsetOverride);
}

function playPixiPatAnimation(token, intensity, message, offsetOverride = null) {
  const PIXIConstructor = globalThis.PIXI;
  const parent = getPixiEffectParent();
  const ticker = canvas?.app?.ticker;

  if (!PIXIConstructor || !parent?.addChild || !ticker) return false;

  const position = getTokenTopCenterWorldPosition(token, offsetOverride);
  if (!position) {
    warn("Unable to determine token world position for PIXI animation.", token);
    return false;
  }

  let cleanupEffect = null;

  try {
    const selectedIntensity = normalizeIntensity(intensity);
    const duration = EFFECT_DURATION_BY_INTENSITY[selectedIntensity];
    const config = PIXI_EFFECT_CONFIG_BY_INTENSITY[selectedIntensity] ?? PIXI_EFFECT_CONFIG_BY_INTENSITY.normal;
    const effect = createPixiPatEffect(PIXIConstructor, selectedIntensity, message);
    const tokenFeedback = createTokenFeedbackAnimator(token, selectedIntensity);
    const startedAt = performance.now();
    let cleaned = false;

    effect.position.set(position.x, position.y);
    effect.scale.set(getInverseCanvasScale());
    parent.addChild(effect);

    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      ticker.remove(tick, effect);
      tokenFeedback?.cleanup();
      if (effect.parent) effect.parent.removeChild(effect);
      if (!effect.destroyed) effect.destroy({ children: true });
    };
    cleanupEffect = cleanup;

    const tick = () => {
      const elapsed = performance.now() - startedAt;
      const progress = Math.min(1, elapsed / duration);
      const nextPosition = getTokenTopCenterWorldPosition(token, offsetOverride);
      if (nextPosition) effect.position.set(nextPosition.x, nextPosition.y);
      effect.scale.set(getInverseCanvasScale());

      updatePixiPatEffect(effect, selectedIntensity, config, elapsed, progress, duration);
      tokenFeedback?.update(progress);

      if (progress >= 1) cleanup();
    };

    ticker.add(tick, effect, PIXIConstructor.UPDATE_PRIORITY?.LOW ?? 0);
    tick();
    window.setTimeout(cleanup, duration + 900);
    return true;
  } catch (error) {
    cleanupEffect?.();
    warn("PIXI pat animation failed; using DOM fallback.", error);
    return false;
  }
}

function playDomPatAnimation(token, intensity, message, offsetOverride = null) {
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

function getTokenTopCenterWorldPosition(token, offsetOverride = null) {
  const center = getTokenCenter(token);
  if (!center) return null;

  const tokenHeight = Number(token?.h ?? token?.height ?? token?.bounds?.height ?? 0);
  const topY = Number.isFinite(token?.y) ? token.y : center.y - tokenHeight / 2;
  const offset = offsetOverride ? normalizeOffset(offsetOverride) : getPatOffset(token);
  const scale = getCanvasStageScale();

  return {
    x: center.x + offset.x / scale,
    y: topY + offset.y / scale
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

function getPixiEffectParent() {
  const parent = canvas?.interface ?? canvas?.stage;
  if (!parent?.addChild) return null;

  try {
    parent.sortableChildren = true;
  } catch (error) {
    debug("Unable to enable sortable PIXI children for effect parent.", error);
  }

  return parent;
}

function getCanvasStageScale() {
  const scale =
    Number(canvas?.stage?.scale?.x) ||
    Number(canvas?.stage?.worldTransform?.a) ||
    Number(canvas?.stage?.worldTransform?.d) ||
    1;

  return Math.max(0.05, Math.abs(scale));
}

function getInverseCanvasScale() {
  return 1 / getCanvasStageScale();
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

function createPixiPatEffect(PIXIConstructor, intensity, message) {
  const selectedIntensity = normalizeIntensity(intensity);
  const config = PIXI_EFFECT_CONFIG_BY_INTENSITY[selectedIntensity] ?? PIXI_EFFECT_CONFIG_BY_INTENSITY.normal;
  const effect = new PIXIConstructor.Container();
  effect.name = `${MODULE_ID}-pixi-effect`;
  effect.eventMode = "none";
  effect.interactiveChildren = false;
  effect.sortableChildren = true;
  effect.zIndex = Number(CONFIG?.Canvas?.groups?.interface?.zIndexScrollingText ?? 700) + 20;

  const tokenGlow = createPixiTokenGlow(PIXIConstructor);
  const arcs = createPixiRubArcs(PIXIConstructor, selectedIntensity);
  const handGroup = createPixiHand(PIXIConstructor, config);
  const particles = createPixiParticles(PIXIConstructor, selectedIntensity);
  const floatingText = createPixiFloatingText(PIXIConstructor, message);

  tokenGlow.zIndex = 1;
  arcs.forEach((arc) => arc.zIndex = 2);
  particles.forEach((particle) => particle.text.zIndex = 3);
  handGroup.zIndex = 4;
  floatingText.group.zIndex = 5;

  effect.addChild(tokenGlow);
  for (const arc of arcs) effect.addChild(arc);
  for (const particle of particles) effect.addChild(particle.text);
  effect.addChild(handGroup);
  effect.addChild(floatingText.group);

  effect.patPatParty = {
    tokenGlow,
    arcs,
    handGroup,
    particles,
    floatingText
  };

  return effect;
}

function createPixiTokenGlow(PIXIConstructor) {
  const glow = new PIXIConstructor.Graphics();
  glow.name = `${MODULE_ID}-token-feedback`;
  glow.beginFill(0xff9cca, 0.34);
  glow.drawEllipse(0, 22, 48, 14);
  glow.endFill();
  glow.beginFill(0x8ff5df, 0.18);
  glow.drawEllipse(0, 22, 64, 18);
  glow.endFill();
  glow.alpha = 0;
  return glow;
}

function createPixiHand(PIXIConstructor, config) {
  const group = new PIXIConstructor.Container();
  group.name = `${MODULE_ID}-hand`;
  group.position.set(config.enterX, config.enterY);
  group.alpha = 0;

  const glow = new PIXIConstructor.Graphics();
  glow.beginFill(0xff87bf, 0.26);
  glow.drawCircle(0, 3, config.handSize * 0.98);
  glow.endFill();
  glow.beginFill(0x9cf3df, 0.16);
  glow.drawCircle(0, 4, config.handSize * 1.18);
  glow.endFill();

  const hand = createPixiText(PIXIConstructor, HAND_SYMBOL, {
    fontFamily: "\"Segoe UI Emoji\", \"Apple Color Emoji\", \"Noto Color Emoji\", sans-serif",
    fontSize: config.handSize,
    lineJoin: "round",
    dropShadow: true,
    dropShadowAlpha: 0.26,
    dropShadowBlur: 4,
    dropShadowDistance: 2
  });
  setPixiAnchor(hand, 0.5);

  group.addChild(glow);
  group.addChild(hand);
  group.patPatParty = { glow, hand };
  return group;
}

function createPixiParticles(PIXIConstructor, intensity) {
  const selectedIntensity = normalizeIntensity(intensity);
  const config = PARTICLE_CONFIG_BY_INTENSITY[selectedIntensity] ?? PARTICLE_CONFIG_BY_INTENSITY.normal;
  const particleCount = randomInt(config.count[0], config.count[1]);

  return Array.from({ length: particleCount }, (_, index) => {
    const side = index % 2 === 0 ? -1 : 1;
    const startX = randomBetween(-22, 22);
    const driftX = side * randomBetween(config.drift * 0.35, config.drift);
    const startY = randomBetween(-8, 16);
    const rise = randomBetween(config.rise[0], config.rise[1]);
    const delay = randomInt(config.delay[0], config.delay[1]);
    const size = randomInt(config.size[0], config.size[1]);
    const targetScale = randomBetween(0.86, 1.24);
    const rotation = randomBetween(-0.38, 0.38);
    const text = createPixiText(PIXIConstructor, pick(config.symbols), {
      fontFamily: "\"Segoe UI Emoji\", \"Apple Color Emoji\", \"Noto Color Emoji\", sans-serif",
      fontSize: size,
      dropShadow: true,
      dropShadowAlpha: 0.24,
      dropShadowBlur: 3,
      dropShadowDistance: 1
    });
    setPixiAnchor(text, 0.5);
    text.alpha = 0;
    text.position.set(startX, startY);

    return {
      text,
      delay,
      duration: PIXI_EFFECT_CONFIG_BY_INTENSITY[selectedIntensity].particleDuration,
      startX,
      startY,
      driftX,
      rise,
      targetScale,
      rotation
    };
  });
}

function createPixiRubArcs(PIXIConstructor, intensity) {
  const selectedIntensity = normalizeIntensity(intensity);
  const arcCount = RUB_ARCS_BY_INTENSITY[selectedIntensity] ?? 0;
  return Array.from({ length: arcCount }, (_, index) => {
    const arc = new PIXIConstructor.Graphics();
    const color = index % 2 === 0 ? 0xffdf75 : 0xff9cca;
    arc.lineStyle({ width: 2.6, color, alpha: 0.9, cap: PIXIConstructor.LINE_CAP?.ROUND });
    arc.moveTo(-18, 0);
    arc.quadraticCurveTo(0, -15, 18, 0);
    arc.alpha = 0;
    arc.pivot.set(0, 0);
    arc.position.set((index - (arcCount - 1) / 2) * 18, -8 - index * 2);
    arc.rotation = index % 2 === 0 ? -0.2 : 0.2;
    arc.patPatParty = {
      delay: selectedIntensity === "rough" ? 150 + index * 120 : 240,
      duration: selectedIntensity === "rough" ? 560 : 620,
      startY: arc.position.y
    };
    return arc;
  });
}

function createPixiFloatingText(PIXIConstructor, message) {
  const group = new PIXIConstructor.Container();
  group.name = `${MODULE_ID}-floating-text`;
  group.position.set(0, -76);
  group.alpha = 0;

  const label = createPixiText(PIXIConstructor, normalizePatMessage(message), {
    fontFamily: "Arial, \"Microsoft YaHei\", sans-serif",
    fontSize: 15,
    fontWeight: "700",
    fill: 0xb72f71,
    align: "center",
    wordWrap: true,
    wordWrapWidth: 210,
    breakWords: true,
    dropShadow: true,
    dropShadowAlpha: 0.16,
    dropShadowBlur: 4,
    dropShadowDistance: 1
  });
  setPixiAnchor(label, 0.5);

  const width = Math.max(78, Math.min(228, label.width + 22));
  const height = Math.max(28, label.height + 10);
  const bubble = new PIXIConstructor.Graphics();
  bubble.lineStyle({ width: 1, color: 0xffacd0, alpha: 0.6 });
  bubble.beginFill(0xfff7fc, 0.92);
  bubble.drawRoundedRect(-width / 2, -height / 2, width, height, 13);
  bubble.endFill();

  group.addChild(bubble);
  group.addChild(label);
  return { group, bubble, label };
}

function updatePixiPatEffect(effect, intensity, config, elapsed, progress, duration) {
  const parts = effect.patPatParty;
  if (!parts) return;

  updatePixiHand(parts.handGroup, config, progress);
  updatePixiTokenGlow(parts.tokenGlow, intensity, progress);
  updatePixiParticles(parts.particles, elapsed);
  updatePixiRubArcs(parts.arcs, elapsed);
  updatePixiFloatingText(parts.floatingText.group, config, elapsed, progress, duration);
}

function updatePixiHand(handGroup, config, progress) {
  const enterEnd = 0.22;
  const rubEnd = 0.82;
  const exitStart = rubEnd;
  const handParts = handGroup.patPatParty;

  if (progress < enterEnd) {
    const t = easeOutBack(progress / enterEnd);
    handGroup.alpha = clamp01(t);
    handGroup.x = lerp(config.enterX, 0, t);
    handGroup.y = lerp(config.enterY, -8, easeOutCubic(progress / enterEnd));
    handGroup.rotation = lerp(0.42, 0.03, t);
    handGroup.scale.set(lerp(config.handScale[0], config.handScale[1], easeOutBack(progress / enterEnd)));
  } else if (progress < rubEnd) {
    const t = (progress - enterEnd) / (rubEnd - enterEnd);
    const wave = Math.sin(t * config.rubCount * Math.PI * 2);
    const press = Math.abs(wave);
    handGroup.alpha = 1;
    handGroup.x = wave * config.rubAmplitude;
    handGroup.y = -8 + press * config.pressY;
    handGroup.rotation = wave * config.rubRotation;
    handGroup.scale.set(config.handScale[1] * (1 + press * 0.04));
  } else {
    const t = easeInOutCubic((progress - exitStart) / (1 - exitStart));
    handGroup.alpha = 1 - t;
    handGroup.x = lerp(0, -6, t);
    handGroup.y = lerp(-8, config.exitY, t);
    handGroup.rotation = lerp(0.02, -0.12, t);
    handGroup.scale.set(lerp(config.handScale[1], config.handScale[0], t));
  }

  if (handParts?.glow) {
    const pulse = Math.sin(progress * Math.PI * config.rubCount * 2);
    handParts.glow.alpha = handGroup.alpha * (0.48 + Math.abs(pulse) * 0.18);
    handParts.glow.scale.set(0.9 + Math.abs(pulse) * 0.1);
  }
}

function updatePixiTokenGlow(glow, intensity, progress) {
  const selectedIntensity = normalizeIntensity(intensity);
  const config = TOKEN_FEEDBACK_BY_INTENSITY[selectedIntensity] ?? TOKEN_FEEDBACK_BY_INTENSITY.normal;
  const envelope = Math.sin(progress * Math.PI);
  const wave = Math.sin(progress * Math.PI * config.cycles);
  const press = Math.abs(wave) * envelope;

  glow.alpha = 0.62 * press;
  glow.x = config.shiftX * wave * 1.2;
  glow.y = 22 + config.shiftY * press * 0.8;
  glow.scale.set(1 + config.scaleX * press * 8, 1 - config.scaleY * press * 4);
}

function updatePixiParticles(particles, elapsed) {
  for (const particle of particles) {
    const t = (elapsed - particle.delay) / particle.duration;
    if (t <= 0) {
      particle.text.alpha = 0;
      continue;
    }

    const progress = Math.min(1, t);
    const drift = easeOutCubic(progress);
    const fadeOut = 1 - easeInCubic(Math.max(0, (progress - 0.62) / 0.38));
    const fadeIn = easeOutCubic(Math.min(1, progress / 0.2));
    particle.text.alpha = Math.max(0, Math.min(fadeIn, fadeOut));
    particle.text.x = particle.startX + particle.driftX * drift;
    particle.text.y = particle.startY - particle.rise * drift;
    particle.text.rotation = particle.rotation * drift;
    particle.text.scale.set(lerp(0.45, particle.targetScale, easeOutBack(Math.min(1, progress * 1.25))));
  }
}

function updatePixiRubArcs(arcs, elapsed) {
  for (const arc of arcs) {
    const data = arc.patPatParty;
    const t = (elapsed - data.delay) / data.duration;
    if (t <= 0) {
      arc.alpha = 0;
      continue;
    }

    const progress = Math.min(1, t);
    const fade = Math.sin(progress * Math.PI);
    arc.alpha = Math.max(0, fade) * 0.82;
    arc.y = data.startY - 18 * easeOutCubic(progress);
    arc.scale.set(lerp(0.72, 1.2, easeOutCubic(progress)));
  }
}

function updatePixiFloatingText(textGroup, config, elapsed, progress, duration) {
  const t = Math.min(1, Math.max(0, (elapsed - 80) / Math.max(1, duration - 120)));
  const fadeIn = easeOutCubic(Math.min(1, t / 0.22));
  const fadeOut = 1 - easeInCubic(Math.max(0, (progress - 0.72) / 0.28));
  textGroup.alpha = Math.max(0, Math.min(fadeIn, fadeOut));
  textGroup.y = -76 - config.textRise * easeOutCubic(t);
  textGroup.scale.set(lerp(0.92, 1, easeOutBack(Math.min(1, t * 1.4))));
}

function playTokenSpriteFeedback(token, intensity, duration) {
  const feedback = createTokenFeedbackAnimator(token, intensity);
  if (!feedback) return;

  let frameId = null;
  let active = true;
  const startedAt = performance.now();

  const cleanup = () => {
    if (!active) return;
    active = false;
    if (frameId) window.cancelAnimationFrame(frameId);
    feedback.cleanup();
  };

  const animate = (now) => {
    if (!active) return;
    const progress = Math.min(1, (now - startedAt) / duration);
    feedback.update(progress);
    if (progress < 1) {
      frameId = window.requestAnimationFrame(animate);
    } else {
      cleanup();
    }
  };

  frameId = window.requestAnimationFrame(animate);
  window.setTimeout(cleanup, duration + 250);
}

function createTokenFeedbackAnimator(token, intensity) {
  const mesh = getTokenVisualMesh(token);
  if (!mesh?.scale || !mesh?.position || mesh.destroyed) return null;

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

  let active = true;

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
    restore();
    tokenFeedbackCleanups.delete(token);
  };

  tokenFeedbackCleanups.set(token, cleanup);

  const update = (progress) => {
    if (!active || mesh.destroyed) {
      cleanup();
      return;
    }

    const envelope = Math.sin(progress * Math.PI);
    const wave = Math.sin(progress * Math.PI * config.cycles);
    const press = Math.abs(wave) * envelope;

    mesh.scale.x = original.scaleX * (1 + config.scaleX * press);
    mesh.scale.y = original.scaleY * (1 - config.scaleY * press);
    mesh.position.x = original.x + config.shiftX * wave * envelope;
    mesh.position.y = original.y + config.shiftY * press;
    mesh.rotation = original.rotation + config.rotation * wave * envelope;
  };

  return { update, cleanup };
}

function getTokenVisualMesh(token) {
  return token?.mesh ?? token?.sprite ?? token?.icon ?? null;
}

function createPixiText(PIXIConstructor, text, style = {}) {
  try {
    return new PIXIConstructor.Text(text, style);
  } catch (error) {
    debug("Using PIXI.Text object-constructor fallback.", error);
    return new PIXIConstructor.Text({ text, style });
  }
}

function setPixiAnchor(displayObject, value) {
  try {
    displayObject.anchor?.set?.(value);
  } catch (error) {
    debug("Unable to set PIXI text anchor.", error);
  }
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

function lerp(from, to, progress) {
  return from + (to - from) * clamp01(progress);
}

function clamp01(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.min(1, Math.max(0, number));
}

function easeOutCubic(value) {
  const t = clamp01(value);
  return 1 - Math.pow(1 - t, 3);
}

function easeInCubic(value) {
  const t = clamp01(value);
  return t * t * t;
}

function easeInOutCubic(value) {
  const t = clamp01(value);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutBack(value) {
  const t = clamp01(value);
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
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

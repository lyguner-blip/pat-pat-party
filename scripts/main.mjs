const MODULE_ID = "pat-pat-party";
const MODULE_TITLE = "Pat Pat Party";
const SOCKET_NAME = `module.${MODULE_ID}`;
const LOG_PREFIX = "[Pat Pat Party]";
const HUD_INTERACT_BUTTON_CLASS = "pat-pat-party-interact-hud-button";
const HUD_PAT_BUTTON_CLASS = "pat-pat-party-hud-button";
const HUD_HUG_BUTTON_CLASS = "pat-pat-party-hug-hud-button";
const HUD_FLOWER_BUTTON_CLASS = "pat-pat-party-flower-hud-button";
const HUD_CALIBRATE_BUTTON_CLASS = "pat-pat-party-calibrate-hud-button";
const OVERLAY_ID = "pat-pat-party-overlay";
const PAT_OFFSET_FLAG = "patOffset";
const MAX_MESSAGE_LENGTH = 40;
const HAND_SYMBOL = "\u{1F590}\uFE0F";
const HUG_SYMBOL = "\u{1F917}";
const HUG_HEART_SYMBOL = "\u{1F49E}";
const FLOWER_SYMBOL = "\u{1F490}";
const TEA_SYMBOL = "\u{1F375}";
const FIST_SYMBOL = "\u{1F44A}";

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

const HUG_EFFECT_DURATION = 1450;
const HUG_PARTICLE_CONFIG = {
  count: [8, 12],
  symbols: ["\u{1F497}", "\u{1F495}", "\u{1F33C}", "\u2728", "\u{1F49E}"],
  drift: 76,
  rise: [48, 104],
  delay: [80, 720],
  size: [15, 26]
};

const FLOWER_EFFECT_DURATION = 1350;
const FLOWER_PARTICLE_CONFIG = {
  count: [8, 13],
  symbols: ["\u{1F33C}", "\u{1F337}", "\u{1F338}", "\u{1F497}", "\u2728"],
  drift: 54,
  rise: [42, 92],
  delay: [70, 680],
  size: [14, 25]
};

const TEA_EFFECT_DURATION = 1300;
const TEA_PARTICLE_CONFIG = {
  count: [6, 10],
  symbols: ["\u2668\uFE0F", "\u2728", "\u{1F33F}", "\u{1F49A}"],
  drift: 42,
  rise: [46, 86],
  delay: [80, 620],
  size: [13, 22]
};

const FIST_BUMP_EFFECT_DURATION = 1150;
const FIST_BUMP_PARTICLE_CONFIG = {
  count: [9, 14],
  symbols: ["\u2728", "\u{1F4AB}", "\u{1F49B}", "\u2B50"],
  drift: 72,
  rise: [38, 86],
  delay: [260, 760],
  size: [15, 26]
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
    handleHugToken,
    handleFlowerToken,
    handleTeaToken,
    handleFistBumpToken,
    openInteractionDialog,
    openPatIntensityDialog,
    openHugDialog,
    openFlowerDialog,
    openTeaDialog,
    openFistBumpDialog,
    openCalibrationDialog,
    playPatAnimation,
    playHugAnimation,
    playFlowerAnimation,
    playTeaAnimation,
    playFistBumpAnimation,
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

  if (!root.querySelector(`.${HUD_INTERACT_BUTTON_CLASS}`)) {
    const interactButton = createHudButton({
      className: HUD_INTERACT_BUTTON_CLASS,
      iconClass: "fa-solid fa-hand-holding-heart",
      labelKey: "PATPAT.Controls.Interact",
      action: () => openInteractionDialog(resolveLiveToken(token) ?? token)
    });

    targetColumn.appendChild(interactButton);
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

function openInteractionDialog(sourceToken) {
  const liveSource = resolveLiveToken(sourceToken) ?? sourceToken;
  if (!liveSource) {
    ui.notifications?.warn(localize("PATPAT.Warnings.NoToken"));
    return;
  }

  const targetToken = getInteractionTargetToken(liveSource);
  if (!targetToken) {
    ui.notifications?.warn(localize("PATPAT.Warnings.NoToken"));
    return;
  }

  const sourceId = liveSource?.id ?? liveSource?.document?.id;
  const targetId = targetToken?.id ?? targetToken?.document?.id;
  const isTargetedOther = Boolean(targetId && sourceId && targetId !== sourceId);
  const content = `
    <form class="pat-pat-party-dialog pat-pat-party-interaction-form">
      <p class="pat-pat-party-dialog-target">
        <strong>${escapeHtml(localize("PATPAT.Dialogs.Interaction.Source"))}</strong>
        <span>${escapeHtml(getTokenName(liveSource))}</span>
      </p>
      <p class="pat-pat-party-dialog-target">
        <strong>${escapeHtml(localize("PATPAT.Dialogs.Interaction.Target"))}</strong>
        <span>${escapeHtml(getTokenName(targetToken))}</span>
      </p>
      <p class="notes">${escapeHtml(localize(isTargetedOther ? "PATPAT.Dialogs.Interaction.TargetedHint" : "PATPAT.Dialogs.Interaction.SelfHint"))}</p>
    </form>
  `;

  new Dialog({
    title: localize("PATPAT.Dialogs.Interaction.Title"),
    content,
    buttons: {
      pat: {
        icon: '<i class="fa-solid fa-hand-sparkles"></i>',
        label: localize("PATPAT.Controls.Pat"),
        callback: () => openPatIntensityDialog(targetToken)
      },
      hug: {
        icon: '<i class="fa-solid fa-heart"></i>',
        label: localize("PATPAT.Controls.Hug"),
        callback: () => openHugDialog(targetToken, liveSource)
      },
      fistBump: {
        icon: '<i class="fa-solid fa-hand-fist"></i>',
        label: localize("PATPAT.Controls.FistBump"),
        callback: () => openFistBumpDialog(targetToken, liveSource)
      },
      flower: {
        icon: '<i class="fa-solid fa-seedling"></i>',
        label: localize("PATPAT.Controls.Flower"),
        callback: () => openFlowerDialog(targetToken)
      },
      tea: {
        icon: '<i class="fa-solid fa-mug-hot"></i>',
        label: localize("PATPAT.Controls.Tea"),
        callback: () => openTeaDialog(targetToken)
      },
      cancel: {
        icon: '<i class="fa-solid fa-xmark"></i>',
        label: localize("PATPAT.Dialogs.Common.Cancel")
      }
    },
    default: "pat"
  }).render(true);
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

function openHugDialog(targetToken, sourceOverride = null) {
  const liveTarget = resolveLiveToken(targetToken) ?? targetToken;
  if (!liveTarget) {
    ui.notifications?.warn(localize("PATPAT.Warnings.NoToken"));
    return;
  }

  const sourceToken = getHugSourceToken(liveTarget, sourceOverride);
  if (!sourceToken) {
    ui.notifications?.warn(localize("PATPAT.Warnings.NoHugSource"));
    return;
  }

  const defaultMessage = getDefaultHugMessage();
  const content = `
    <form class="pat-pat-party-dialog pat-pat-party-hug-form">
      <p class="pat-pat-party-dialog-target">
        <strong>${escapeHtml(localize("PATPAT.Dialogs.Hug.Source"))}</strong>
        <span>${escapeHtml(getTokenName(sourceToken))}</span>
      </p>
      <p class="pat-pat-party-dialog-target">
        <strong>${escapeHtml(localize("PATPAT.Dialogs.Hug.Target"))}</strong>
        <span>${escapeHtml(getTokenName(liveTarget))}</span>
      </p>
      <div class="form-group">
        <label for="pat-pat-party-hug-message">${escapeHtml(localize("PATPAT.Dialogs.Hug.MessageLabel"))}</label>
        <input
          id="pat-pat-party-hug-message"
          type="text"
          name="message"
          maxlength="${MAX_MESSAGE_LENGTH}"
          value="${escapeHtml(defaultMessage)}"
          placeholder="${escapeHtml(localize("PATPAT.Dialogs.Hug.MessagePlaceholder"))}">
      </div>
      <p class="notes">${escapeHtml(format("PATPAT.Dialogs.Hug.MessageHint", { max: MAX_MESSAGE_LENGTH }))}</p>
    </form>
  `;

  new Dialog({
    title: localize("PATPAT.Dialogs.Hug.Title"),
    content,
    buttons: {
      hug: {
        icon: '<i class="fa-solid fa-heart"></i>',
        label: localize("PATPAT.Dialogs.Hug.Action"),
        callback: (html) => runHugFromDialog(sourceToken, liveTarget, readHugMessageFromDialog(html))
      },
      cancel: {
        icon: '<i class="fa-solid fa-xmark"></i>',
        label: localize("PATPAT.Dialogs.Common.Cancel")
      }
    },
    default: "hug"
  }).render(true);
}

function openFlowerDialog(token) {
  const liveToken = resolveLiveToken(token) ?? token;
  if (!liveToken) {
    ui.notifications?.warn(localize("PATPAT.Warnings.NoToken"));
    return;
  }

  const defaultMessage = getDefaultFlowerMessage();
  const content = `
    <form class="pat-pat-party-dialog pat-pat-party-flower-form">
      <p class="pat-pat-party-dialog-target">
        <strong>${escapeHtml(localize("PATPAT.Dialogs.Flower.Target"))}</strong>
        <span>${escapeHtml(getTokenName(liveToken))}</span>
      </p>
      <div class="form-group">
        <label for="pat-pat-party-flower-message">${escapeHtml(localize("PATPAT.Dialogs.Flower.MessageLabel"))}</label>
        <input
          id="pat-pat-party-flower-message"
          type="text"
          name="message"
          maxlength="${MAX_MESSAGE_LENGTH}"
          value="${escapeHtml(defaultMessage)}"
          placeholder="${escapeHtml(localize("PATPAT.Dialogs.Flower.MessagePlaceholder"))}">
      </div>
      <p class="notes">${escapeHtml(format("PATPAT.Dialogs.Flower.MessageHint", { max: MAX_MESSAGE_LENGTH }))}</p>
    </form>
  `;

  new Dialog({
    title: localize("PATPAT.Dialogs.Flower.Title"),
    content,
    buttons: {
      flower: {
        icon: '<i class="fa-solid fa-seedling"></i>',
        label: localize("PATPAT.Dialogs.Flower.Action"),
        callback: (html) => runFlowerFromDialog(liveToken, readFlowerMessageFromDialog(html))
      },
      cancel: {
        icon: '<i class="fa-solid fa-xmark"></i>',
        label: localize("PATPAT.Dialogs.Common.Cancel")
      }
    },
    default: "flower"
  }).render(true);
}

function openTeaDialog(token) {
  const liveToken = resolveLiveToken(token) ?? token;
  if (!liveToken) {
    ui.notifications?.warn(localize("PATPAT.Warnings.NoToken"));
    return;
  }

  const defaultMessage = getDefaultTeaMessage();
  const content = `
    <form class="pat-pat-party-dialog pat-pat-party-tea-form">
      <p class="pat-pat-party-dialog-target">
        <strong>${escapeHtml(localize("PATPAT.Dialogs.Tea.Target"))}</strong>
        <span>${escapeHtml(getTokenName(liveToken))}</span>
      </p>
      <div class="form-group">
        <label for="pat-pat-party-tea-message">${escapeHtml(localize("PATPAT.Dialogs.Tea.MessageLabel"))}</label>
        <input
          id="pat-pat-party-tea-message"
          type="text"
          name="message"
          maxlength="${MAX_MESSAGE_LENGTH}"
          value="${escapeHtml(defaultMessage)}"
          placeholder="${escapeHtml(localize("PATPAT.Dialogs.Tea.MessagePlaceholder"))}">
      </div>
      <p class="notes">${escapeHtml(format("PATPAT.Dialogs.Tea.MessageHint", { max: MAX_MESSAGE_LENGTH }))}</p>
    </form>
  `;

  new Dialog({
    title: localize("PATPAT.Dialogs.Tea.Title"),
    content,
    buttons: {
      tea: {
        icon: '<i class="fa-solid fa-mug-hot"></i>',
        label: localize("PATPAT.Dialogs.Tea.Action"),
        callback: (html) => runTeaFromDialog(liveToken, readTeaMessageFromDialog(html))
      },
      cancel: {
        icon: '<i class="fa-solid fa-xmark"></i>',
        label: localize("PATPAT.Dialogs.Common.Cancel")
      }
    },
    default: "tea"
  }).render(true);
}

function openFistBumpDialog(targetToken, sourceOverride = null) {
  const liveTarget = resolveLiveToken(targetToken) ?? targetToken;
  if (!liveTarget) {
    ui.notifications?.warn(localize("PATPAT.Warnings.NoToken"));
    return;
  }

  const sourceToken = getHugSourceToken(liveTarget, sourceOverride);
  if (!sourceToken) {
    ui.notifications?.warn(localize("PATPAT.Warnings.NoHugSource"));
    return;
  }

  const defaultMessage = getDefaultFistBumpMessage();
  const content = `
    <form class="pat-pat-party-dialog pat-pat-party-fist-bump-form">
      <p class="pat-pat-party-dialog-target">
        <strong>${escapeHtml(localize("PATPAT.Dialogs.FistBump.Source"))}</strong>
        <span>${escapeHtml(getTokenName(sourceToken))}</span>
      </p>
      <p class="pat-pat-party-dialog-target">
        <strong>${escapeHtml(localize("PATPAT.Dialogs.FistBump.Target"))}</strong>
        <span>${escapeHtml(getTokenName(liveTarget))}</span>
      </p>
      <div class="form-group">
        <label for="pat-pat-party-fist-bump-message">${escapeHtml(localize("PATPAT.Dialogs.FistBump.MessageLabel"))}</label>
        <input
          id="pat-pat-party-fist-bump-message"
          type="text"
          name="message"
          maxlength="${MAX_MESSAGE_LENGTH}"
          value="${escapeHtml(defaultMessage)}"
          placeholder="${escapeHtml(localize("PATPAT.Dialogs.FistBump.MessagePlaceholder"))}">
      </div>
      <p class="notes">${escapeHtml(format("PATPAT.Dialogs.FistBump.MessageHint", { max: MAX_MESSAGE_LENGTH }))}</p>
    </form>
  `;

  new Dialog({
    title: localize("PATPAT.Dialogs.FistBump.Title"),
    content,
    buttons: {
      fistBump: {
        icon: '<i class="fa-solid fa-hand-fist"></i>',
        label: localize("PATPAT.Dialogs.FistBump.Action"),
        callback: (html) => runFistBumpFromDialog(sourceToken, liveTarget, readFistBumpMessageFromDialog(html))
      },
      cancel: {
        icon: '<i class="fa-solid fa-xmark"></i>',
        label: localize("PATPAT.Dialogs.Common.Cancel")
      }
    },
    default: "fistBump"
  }).render(true);
}

function runFistBumpFromDialog(sourceToken, targetToken, message) {
  const liveSource = resolveLiveToken(sourceToken) ?? sourceToken;
  const liveTarget = resolveLiveToken(targetToken) ?? targetToken;
  return handleFistBumpToken(liveSource, liveTarget, message).catch((error) => {
    warn("Failed to handle token fist bump.", error);
    ui.notifications?.warn(localize("PATPAT.Warnings.Generic"));
  });
}

function runTeaFromDialog(token, message) {
  const liveToken = resolveLiveToken(token) ?? token;
  return handleTeaToken(liveToken, message).catch((error) => {
    warn("Failed to handle token tea.", error);
    ui.notifications?.warn(localize("PATPAT.Warnings.Generic"));
  });
}

function runFlowerFromDialog(token, message) {
  const liveToken = resolveLiveToken(token) ?? token;
  return handleFlowerToken(liveToken, message).catch((error) => {
    warn("Failed to handle token flower.", error);
    ui.notifications?.warn(localize("PATPAT.Warnings.Generic"));
  });
}

function runHugFromDialog(sourceToken, targetToken, message) {
  const liveSource = resolveLiveToken(sourceToken) ?? sourceToken;
  const liveTarget = resolveLiveToken(targetToken) ?? targetToken;
  return handleHugToken(liveSource, liveTarget, message).catch((error) => {
    warn("Failed to handle token hug.", error);
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

async function handleHugToken(sourceToken, targetToken, message = getDefaultHugMessage()) {
  const liveSource = resolveLiveToken(sourceToken) ?? sourceToken;
  const liveTarget = resolveLiveToken(targetToken) ?? targetToken;
  if (!liveSource || !liveTarget) {
    ui.notifications?.warn(localize("PATPAT.Warnings.NoToken"));
    return;
  }

  const permission = canHugToken(liveSource, liveTarget);
  if (!permission.allowed) {
    ui.notifications?.warn(localize(permission.messageKey));
    return;
  }

  const cooldown = checkCooldown(liveTarget, "hug");
  if (!cooldown.allowed) {
    ui.notifications?.warn(format("PATPAT.Warnings.Cooldown", { seconds: cooldown.remaining }));
    return;
  }

  const safeMessage = normalizeHugMessage(message);
  const payload = createHugPayload(liveSource, liveTarget, safeMessage);

  playHugAnimation(liveSource, liveTarget, safeMessage);

  if (getSetting("showChatMessage")) {
    await sendHugChatMessage(liveSource, liveTarget, payload);
  }

  broadcastHug(payload);
}

async function handleFlowerToken(token, message = getDefaultFlowerMessage()) {
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

  const cooldown = checkCooldown(liveToken, "flower");
  if (!cooldown.allowed) {
    ui.notifications?.warn(format("PATPAT.Warnings.Cooldown", { seconds: cooldown.remaining }));
    return;
  }

  const safeMessage = normalizeFlowerMessage(message);
  const payload = createFlowerPayload(liveToken, safeMessage);

  playFlowerAnimation(liveToken, safeMessage, payload.offset);

  if (getSetting("showChatMessage")) {
    await sendFlowerChatMessage(liveToken, payload);
  }

  broadcastFlower(payload);
}

async function handleTeaToken(token, message = getDefaultTeaMessage()) {
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

  const cooldown = checkCooldown(liveToken, "tea");
  if (!cooldown.allowed) {
    ui.notifications?.warn(format("PATPAT.Warnings.Cooldown", { seconds: cooldown.remaining }));
    return;
  }

  const safeMessage = normalizeTeaMessage(message);
  const payload = createTeaPayload(liveToken, safeMessage);

  playTeaAnimation(liveToken, safeMessage, payload.offset);

  if (getSetting("showChatMessage")) {
    await sendTeaChatMessage(liveToken, payload);
  }

  broadcastTea(payload);
}

async function handleFistBumpToken(sourceToken, targetToken, message = getDefaultFistBumpMessage()) {
  const liveSource = resolveLiveToken(sourceToken) ?? sourceToken;
  const liveTarget = resolveLiveToken(targetToken) ?? targetToken;
  if (!liveSource || !liveTarget) {
    ui.notifications?.warn(localize("PATPAT.Warnings.NoToken"));
    return;
  }

  const permission = canHugToken(liveSource, liveTarget);
  if (!permission.allowed) {
    ui.notifications?.warn(localize(permission.messageKey));
    return;
  }

  const cooldown = checkCooldown(liveTarget, "fistBump");
  if (!cooldown.allowed) {
    ui.notifications?.warn(format("PATPAT.Warnings.Cooldown", { seconds: cooldown.remaining }));
    return;
  }

  const safeMessage = normalizeFistBumpMessage(message);
  const payload = createFistBumpPayload(liveSource, liveTarget, safeMessage);

  playFistBumpAnimation(liveSource, liveTarget, safeMessage);

  if (getSetting("showChatMessage")) {
    await sendFistBumpChatMessage(liveSource, liveTarget, payload);
  }

  broadcastFistBump(payload);
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

function canHugToken(sourceToken, targetToken) {
  if (!sourceToken || !targetToken) {
    return { allowed: false, messageKey: "PATPAT.Warnings.NoToken" };
  }

  if ((sourceToken.id ?? sourceToken.document?.id) === (targetToken.id ?? targetToken.document?.id)) {
    return { allowed: false, messageKey: "PATPAT.Warnings.NoHugSource" };
  }

  const targetPermission = canPatToken(targetToken);
  if (!targetPermission.allowed) return targetPermission;

  if (game.user?.isGM || userOwnsToken(sourceToken)) {
    return { allowed: true };
  }

  return { allowed: false, messageKey: "PATPAT.Warnings.NoHugSourcePermission" };
}

function checkCooldown(token, action = "pat") {
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

  const key = action === "pat" ? `${game.user.id}:${tokenId}` : `${game.user.id}:${action}:${tokenId}`;
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

function playHugAnimation(sourceToken, targetToken, message = getDefaultHugMessage()) {
  if (!sourceToken || !targetToken || !canvas?.ready) return;

  const safeMessage = normalizeHugMessage(message);
  if (playPixiHugAnimation(sourceToken, targetToken, safeMessage)) {
    return;
  }

  playDomHugAnimation(sourceToken, targetToken, safeMessage);
}

function playPixiHugAnimation(sourceToken, targetToken, message) {
  const PIXIConstructor = globalThis.PIXI;
  const parent = getPixiEffectParent();
  const ticker = canvas?.app?.ticker;

  if (!PIXIConstructor || !parent?.addChild || !ticker) return false;

  const endpoints = getHugWorldEndpoints(sourceToken, targetToken);
  if (!endpoints) {
    warn("Unable to determine token world positions for PIXI hug animation.", { sourceToken, targetToken });
    return false;
  }

  let cleanupEffect = null;

  try {
    const effect = createPixiHugEffect(PIXIConstructor, message);
    const sourceFeedback = createTokenFeedbackAnimator(sourceToken, "gentle");
    const targetFeedback = createTokenFeedbackAnimator(targetToken, "gentle");
    const startedAt = performance.now();
    let cleaned = false;

    positionHugEffect(effect, endpoints);
    parent.addChild(effect);

    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      ticker.remove(tick, effect);
      sourceFeedback?.cleanup();
      targetFeedback?.cleanup();
      if (effect.parent) effect.parent.removeChild(effect);
      if (!effect.destroyed) effect.destroy({ children: true });
    };
    cleanupEffect = cleanup;

    const tick = () => {
      const elapsed = performance.now() - startedAt;
      const progress = Math.min(1, elapsed / HUG_EFFECT_DURATION);
      const nextEndpoints = getHugWorldEndpoints(sourceToken, targetToken);
      if (nextEndpoints) positionHugEffect(effect, nextEndpoints);

      updatePixiHugEffect(effect, elapsed, progress);
      sourceFeedback?.update(progress);
      targetFeedback?.update(progress);

      if (progress >= 1) cleanup();
    };

    ticker.add(tick, effect, PIXIConstructor.UPDATE_PRIORITY?.LOW ?? 0);
    tick();
    window.setTimeout(cleanup, HUG_EFFECT_DURATION + 900);
    return true;
  } catch (error) {
    cleanupEffect?.();
    warn("PIXI hug animation failed; using DOM fallback.", error);
    return false;
  }
}

function playDomHugAnimation(sourceToken, targetToken, message) {
  const endpoints = getHugScreenEndpoints(sourceToken, targetToken);
  if (!endpoints) {
    warn("Unable to determine token screen positions for hug animation.", { sourceToken, targetToken });
    return;
  }

  const overlay = ensureOverlay();
  if (!overlay) return;

  const midpoint = getMidpoint(endpoints.source, endpoints.target);
  const effect = document.createElement("div");
  effect.className = "pat-pat-party-hug-effect";
  effect.style.left = `${Math.round(midpoint.x)}px`;
  effect.style.top = `${Math.round(midpoint.y)}px`;
  effect.style.setProperty("--ppp-duration", `${HUG_EFFECT_DURATION}ms`);
  effect.innerHTML = `
    <div class="pat-pat-party-hug-ribbon" aria-hidden="true"></div>
    <div class="pat-pat-party-hug-symbol" aria-hidden="true">&#x1F917;</div>
    <div class="pat-pat-party-hug-heart" aria-hidden="true">&#x1F49E;</div>
    <div class="pat-pat-party-hug-particles" aria-hidden="true">${createHugParticleMarkup()}</div>
    <div class="pat-pat-party-floating-text">${escapeHtml(normalizeHugMessage(message))}</div>
  `;

  overlay.appendChild(effect);
  playTokenSpriteFeedback(sourceToken, "gentle", HUG_EFFECT_DURATION);
  playTokenSpriteFeedback(targetToken, "gentle", HUG_EFFECT_DURATION);
  window.setTimeout(() => effect.remove(), HUG_EFFECT_DURATION + 650);
}

function playFlowerAnimation(token, message = getDefaultFlowerMessage(), offsetOverride = null) {
  if (!token || !canvas?.ready) return;

  const safeMessage = normalizeFlowerMessage(message);
  if (playPixiFlowerAnimation(token, safeMessage, offsetOverride)) {
    return;
  }

  playDomFlowerAnimation(token, safeMessage, offsetOverride);
}

function playPixiFlowerAnimation(token, message, offsetOverride = null) {
  const PIXIConstructor = globalThis.PIXI;
  const parent = getPixiEffectParent();
  const ticker = canvas?.app?.ticker;

  if (!PIXIConstructor || !parent?.addChild || !ticker) return false;

  const position = getTokenTopCenterWorldPosition(token, offsetOverride);
  if (!position) {
    warn("Unable to determine token world position for PIXI flower animation.", token);
    return false;
  }

  let cleanupEffect = null;

  try {
    const effect = createPixiFlowerEffect(PIXIConstructor, message);
    const tokenFeedback = createTokenFeedbackAnimator(token, "gentle");
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
      const progress = Math.min(1, elapsed / FLOWER_EFFECT_DURATION);
      const nextPosition = getTokenTopCenterWorldPosition(token, offsetOverride);
      if (nextPosition) effect.position.set(nextPosition.x, nextPosition.y);
      effect.scale.set(getInverseCanvasScale());

      updatePixiFlowerEffect(effect, elapsed, progress);
      tokenFeedback?.update(progress);

      if (progress >= 1) cleanup();
    };

    ticker.add(tick, effect, PIXIConstructor.UPDATE_PRIORITY?.LOW ?? 0);
    tick();
    window.setTimeout(cleanup, FLOWER_EFFECT_DURATION + 900);
    return true;
  } catch (error) {
    cleanupEffect?.();
    warn("PIXI flower animation failed; using DOM fallback.", error);
    return false;
  }
}

function playDomFlowerAnimation(token, message, offsetOverride = null) {
  const position = getTokenScreenPosition(token, offsetOverride);
  if (!position) {
    warn("Unable to determine token screen position for flower animation.", token);
    return;
  }

  const overlay = ensureOverlay();
  if (!overlay) return;

  const effect = document.createElement("div");
  effect.className = "pat-pat-party-flower-effect";
  effect.style.left = `${Math.round(position.x)}px`;
  effect.style.top = `${Math.round(position.y)}px`;
  effect.style.setProperty("--ppp-duration", `${FLOWER_EFFECT_DURATION}ms`);
  effect.innerHTML = `
    <div class="pat-pat-party-flower-glow" aria-hidden="true"></div>
    <div class="pat-pat-party-flower-symbol" aria-hidden="true">&#x1F490;</div>
    <div class="pat-pat-party-flower-particles" aria-hidden="true">${createFlowerParticleMarkup()}</div>
    <div class="pat-pat-party-floating-text">${escapeHtml(normalizeFlowerMessage(message))}</div>
  `;

  overlay.appendChild(effect);
  playTokenSpriteFeedback(token, "gentle", FLOWER_EFFECT_DURATION);
  window.setTimeout(() => effect.remove(), FLOWER_EFFECT_DURATION + 650);
}

function playTeaAnimation(token, message = getDefaultTeaMessage(), offsetOverride = null) {
  if (!token || !canvas?.ready) return;

  const safeMessage = normalizeTeaMessage(message);
  if (playPixiTeaAnimation(token, safeMessage, offsetOverride)) {
    return;
  }

  playDomTeaAnimation(token, safeMessage, offsetOverride);
}

function playPixiTeaAnimation(token, message, offsetOverride = null) {
  const PIXIConstructor = globalThis.PIXI;
  const parent = getPixiEffectParent();
  const ticker = canvas?.app?.ticker;

  if (!PIXIConstructor || !parent?.addChild || !ticker) return false;

  const position = getTokenTopCenterWorldPosition(token, offsetOverride);
  if (!position) {
    warn("Unable to determine token world position for PIXI tea animation.", token);
    return false;
  }

  let cleanupEffect = null;

  try {
    const effect = createPixiTeaEffect(PIXIConstructor, message);
    const tokenFeedback = createTokenFeedbackAnimator(token, "gentle");
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
      const progress = Math.min(1, elapsed / TEA_EFFECT_DURATION);
      const nextPosition = getTokenTopCenterWorldPosition(token, offsetOverride);
      if (nextPosition) effect.position.set(nextPosition.x, nextPosition.y);
      effect.scale.set(getInverseCanvasScale());

      updatePixiTeaEffect(effect, elapsed, progress);
      tokenFeedback?.update(progress);

      if (progress >= 1) cleanup();
    };

    ticker.add(tick, effect, PIXIConstructor.UPDATE_PRIORITY?.LOW ?? 0);
    tick();
    window.setTimeout(cleanup, TEA_EFFECT_DURATION + 900);
    return true;
  } catch (error) {
    cleanupEffect?.();
    warn("PIXI tea animation failed; using DOM fallback.", error);
    return false;
  }
}

function playDomTeaAnimation(token, message, offsetOverride = null) {
  const position = getTokenScreenPosition(token, offsetOverride);
  if (!position) {
    warn("Unable to determine token screen position for tea animation.", token);
    return;
  }

  const overlay = ensureOverlay();
  if (!overlay) return;

  const effect = document.createElement("div");
  effect.className = "pat-pat-party-tea-effect";
  effect.style.left = `${Math.round(position.x)}px`;
  effect.style.top = `${Math.round(position.y)}px`;
  effect.style.setProperty("--ppp-duration", `${TEA_EFFECT_DURATION}ms`);
  effect.innerHTML = `
    <div class="pat-pat-party-tea-glow" aria-hidden="true"></div>
    <div class="pat-pat-party-tea-symbol" aria-hidden="true">&#x1F375;</div>
    <div class="pat-pat-party-tea-particles" aria-hidden="true">${createTeaParticleMarkup()}</div>
    <div class="pat-pat-party-floating-text">${escapeHtml(normalizeTeaMessage(message))}</div>
  `;

  overlay.appendChild(effect);
  playTokenSpriteFeedback(token, "gentle", TEA_EFFECT_DURATION);
  window.setTimeout(() => effect.remove(), TEA_EFFECT_DURATION + 650);
}

function playFistBumpAnimation(sourceToken, targetToken, message = getDefaultFistBumpMessage()) {
  if (!sourceToken || !targetToken || !canvas?.ready) return;

  const safeMessage = normalizeFistBumpMessage(message);
  if (playPixiFistBumpAnimation(sourceToken, targetToken, safeMessage)) {
    return;
  }

  playDomFistBumpAnimation(sourceToken, targetToken, safeMessage);
}

function playPixiFistBumpAnimation(sourceToken, targetToken, message) {
  const PIXIConstructor = globalThis.PIXI;
  const parent = getPixiEffectParent();
  const ticker = canvas?.app?.ticker;

  if (!PIXIConstructor || !parent?.addChild || !ticker) return false;

  const endpoints = getHugWorldEndpoints(sourceToken, targetToken);
  if (!endpoints) {
    warn("Unable to determine token world positions for PIXI fist bump animation.", { sourceToken, targetToken });
    return false;
  }

  let cleanupEffect = null;

  try {
    const effect = createPixiFistBumpEffect(PIXIConstructor, message);
    const sourceFeedback = createTokenFeedbackAnimator(sourceToken, "normal");
    const targetFeedback = createTokenFeedbackAnimator(targetToken, "normal");
    const startedAt = performance.now();
    let cleaned = false;

    positionDuoEffect(effect, endpoints);
    parent.addChild(effect);

    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      ticker.remove(tick, effect);
      sourceFeedback?.cleanup();
      targetFeedback?.cleanup();
      if (effect.parent) effect.parent.removeChild(effect);
      if (!effect.destroyed) effect.destroy({ children: true });
    };
    cleanupEffect = cleanup;

    const tick = () => {
      const elapsed = performance.now() - startedAt;
      const progress = Math.min(1, elapsed / FIST_BUMP_EFFECT_DURATION);
      const nextEndpoints = getHugWorldEndpoints(sourceToken, targetToken);
      if (nextEndpoints) positionDuoEffect(effect, nextEndpoints);

      updatePixiFistBumpEffect(effect, elapsed, progress);
      sourceFeedback?.update(progress);
      targetFeedback?.update(progress);

      if (progress >= 1) cleanup();
    };

    ticker.add(tick, effect, PIXIConstructor.UPDATE_PRIORITY?.LOW ?? 0);
    tick();
    window.setTimeout(cleanup, FIST_BUMP_EFFECT_DURATION + 900);
    return true;
  } catch (error) {
    cleanupEffect?.();
    warn("PIXI fist bump animation failed; using DOM fallback.", error);
    return false;
  }
}

function playDomFistBumpAnimation(sourceToken, targetToken, message) {
  const endpoints = getHugScreenEndpoints(sourceToken, targetToken);
  if (!endpoints) {
    warn("Unable to determine token screen positions for fist bump animation.", { sourceToken, targetToken });
    return;
  }

  const overlay = ensureOverlay();
  if (!overlay) return;

  const midpoint = getMidpoint(endpoints.source, endpoints.target);
  const effect = document.createElement("div");
  effect.className = "pat-pat-party-fist-bump-effect";
  effect.style.left = `${Math.round(midpoint.x)}px`;
  effect.style.top = `${Math.round(midpoint.y)}px`;
  effect.style.setProperty("--ppp-duration", `${FIST_BUMP_EFFECT_DURATION}ms`);
  effect.innerHTML = `
    <div class="pat-pat-party-fist-bump-burst" aria-hidden="true"></div>
    <div class="pat-pat-party-fist-bump-left" aria-hidden="true">&#x1F44A;</div>
    <div class="pat-pat-party-fist-bump-right" aria-hidden="true">&#x1F44A;</div>
    <div class="pat-pat-party-fist-bump-particles" aria-hidden="true">${createFistBumpParticleMarkup()}</div>
    <div class="pat-pat-party-floating-text">${escapeHtml(normalizeFistBumpMessage(message))}</div>
  `;

  overlay.appendChild(effect);
  playTokenSpriteFeedback(sourceToken, "normal", FIST_BUMP_EFFECT_DURATION);
  playTokenSpriteFeedback(targetToken, "normal", FIST_BUMP_EFFECT_DURATION);
  window.setTimeout(() => effect.remove(), FIST_BUMP_EFFECT_DURATION + 650);
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

async function sendHugChatMessage(sourceToken, targetToken, payload) {
  if (!sourceToken || !targetToken) return;

  const message = normalizeHugMessage(payload.message ?? localize(payload.messageKey ?? "PATPAT.Hug.Chat.Message"));
  const speaker = getChatSpeaker(sourceToken);
  const content = `
    <div class="pat-pat-party-chat-card pat-pat-party-hug-chat-card">
      <header class="pat-pat-party-chat-header">
        <i class="fa-solid fa-heart" aria-hidden="true"></i>
        <span>${escapeHtml(localize("PATPAT.Hug.Chat.Title"))}</span>
      </header>
      <p class="pat-pat-party-chat-line">${escapeHtml(format("PATPAT.Hug.Chat.Line", {
        actor: getTokenName(sourceToken),
        target: getTokenName(targetToken)
      }))}</p>
      <p>${escapeHtml(message)}</p>
    </div>
  `;

  await ChatMessage.create({
    user: game.user?.id,
    speaker,
    content,
    flavor: localize("PATPAT.Hug.Chat.Flavor")
  });
}

async function sendFlowerChatMessage(token, payload) {
  if (!token) return;

  const speakerToken = getSpeakerToken(token);
  const message = normalizeFlowerMessage(payload.message ?? localize(payload.messageKey ?? "PATPAT.Flower.Chat.Message"));
  const speaker = getChatSpeaker(speakerToken);
  const content = `
    <div class="pat-pat-party-chat-card pat-pat-party-flower-chat-card">
      <header class="pat-pat-party-chat-header">
        <i class="fa-solid fa-seedling" aria-hidden="true"></i>
        <span>${escapeHtml(localize("PATPAT.Flower.Chat.Title"))}</span>
      </header>
      <p>${escapeHtml(message)}</p>
    </div>
  `;

  await ChatMessage.create({
    user: game.user?.id,
    speaker,
    content,
    flavor: localize("PATPAT.Flower.Chat.Flavor")
  });
}

async function sendTeaChatMessage(token, payload) {
  if (!token) return;

  const speakerToken = getSpeakerToken(token);
  const message = normalizeTeaMessage(payload.message ?? localize(payload.messageKey ?? "PATPAT.Tea.Chat.Message"));
  const speaker = getChatSpeaker(speakerToken);
  const content = `
    <div class="pat-pat-party-chat-card pat-pat-party-tea-chat-card">
      <header class="pat-pat-party-chat-header">
        <i class="fa-solid fa-mug-hot" aria-hidden="true"></i>
        <span>${escapeHtml(localize("PATPAT.Tea.Chat.Title"))}</span>
      </header>
      <p>${escapeHtml(message)}</p>
    </div>
  `;

  await ChatMessage.create({
    user: game.user?.id,
    speaker,
    content,
    flavor: localize("PATPAT.Tea.Chat.Flavor")
  });
}

async function sendFistBumpChatMessage(sourceToken, targetToken, payload) {
  if (!sourceToken || !targetToken) return;

  const message = normalizeFistBumpMessage(payload.message ?? localize(payload.messageKey ?? "PATPAT.FistBump.Chat.Message"));
  const speaker = getChatSpeaker(sourceToken);
  const content = `
    <div class="pat-pat-party-chat-card pat-pat-party-fist-bump-chat-card">
      <header class="pat-pat-party-chat-header">
        <i class="fa-solid fa-hand-fist" aria-hidden="true"></i>
        <span>${escapeHtml(localize("PATPAT.FistBump.Chat.Title"))}</span>
      </header>
      <p class="pat-pat-party-chat-line">${escapeHtml(format("PATPAT.FistBump.Chat.Line", {
        actor: getTokenName(sourceToken),
        target: getTokenName(targetToken)
      }))}</p>
      <p>${escapeHtml(message)}</p>
    </div>
  `;

  await ChatMessage.create({
    user: game.user?.id,
    speaker,
    content,
    flavor: localize("PATPAT.FistBump.Chat.Flavor")
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

function broadcastHug(payload) {
  if (!game.socket) {
    warn("Socket is unavailable; hug animation will remain local.");
    return;
  }

  try {
    game.socket.emit(SOCKET_NAME, payload);
  } catch (error) {
    warn("Failed to broadcast hug animation.", error);
  }
}

function broadcastFlower(payload) {
  if (!game.socket) {
    warn("Socket is unavailable; flower animation will remain local.");
    return;
  }

  try {
    game.socket.emit(SOCKET_NAME, payload);
  } catch (error) {
    warn("Failed to broadcast flower animation.", error);
  }
}

function broadcastTea(payload) {
  if (!game.socket) {
    warn("Socket is unavailable; tea animation will remain local.");
    return;
  }

  try {
    game.socket.emit(SOCKET_NAME, payload);
  } catch (error) {
    warn("Failed to broadcast tea animation.", error);
  }
}

function broadcastFistBump(payload) {
  if (!game.socket) {
    warn("Socket is unavailable; fist bump animation will remain local.");
    return;
  }

  try {
    game.socket.emit(SOCKET_NAME, payload);
  } catch (error) {
    warn("Failed to broadcast fist bump animation.", error);
  }
}

function handleSocketMessage(payload) {
  if (payload?.action === "pat") {
    handleSocketPat(payload);
    return;
  }

  if (payload?.action === "hug") {
    handleSocketHug(payload);
    return;
  }

  if (payload?.action === "flower") {
    handleSocketFlower(payload);
    return;
  }

  if (payload?.action === "tea") {
    handleSocketTea(payload);
    return;
  }

  if (payload?.action === "fistBump") {
    handleSocketFistBump(payload);
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

function handleSocketHug(payload) {
  if (!canvas?.ready || !canvas.scene) return;
  if (payload.sceneId !== canvas.scene.id) return;
  if (payload.userId === game.user?.id) return;

  const sourceToken = getCanvasToken(payload.sourceTokenId);
  const targetToken = getCanvasToken(payload.targetTokenId);
  if (!sourceToken || !targetToken) {
    debug("Received hug socket payload for tokens that are not on this canvas.", payload);
    return;
  }

  playHugAnimation(sourceToken, targetToken, payload.message);
}

function handleSocketFlower(payload) {
  if (!canvas?.ready || !canvas.scene) return;
  if (payload.sceneId !== canvas.scene.id) return;
  if (payload.userId === game.user?.id) return;

  const token = getCanvasToken(payload.tokenId);
  if (!token) {
    debug("Received flower socket payload for a token that is not on this canvas.", payload);
    return;
  }

  playFlowerAnimation(token, payload.message, payload.offset);
}

function handleSocketTea(payload) {
  if (!canvas?.ready || !canvas.scene) return;
  if (payload.sceneId !== canvas.scene.id) return;
  if (payload.userId === game.user?.id) return;

  const token = getCanvasToken(payload.tokenId);
  if (!token) {
    debug("Received tea socket payload for a token that is not on this canvas.", payload);
    return;
  }

  playTeaAnimation(token, payload.message, payload.offset);
}

function handleSocketFistBump(payload) {
  if (!canvas?.ready || !canvas.scene) return;
  if (payload.sceneId !== canvas.scene.id) return;
  if (payload.userId === game.user?.id) return;

  const sourceToken = getCanvasToken(payload.sourceTokenId);
  const targetToken = getCanvasToken(payload.targetTokenId);
  if (!sourceToken || !targetToken) {
    debug("Received fist bump socket payload for tokens that are not on this canvas.", payload);
    return;
  }

  playFistBumpAnimation(sourceToken, targetToken, payload.message);
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

function createHugPayload(sourceToken, targetToken, message = getDefaultHugMessage()) {
  return {
    action: "hug",
    sceneId: canvas?.scene?.id,
    sourceTokenId: sourceToken?.id ?? sourceToken?.document?.id,
    targetTokenId: targetToken?.id ?? targetToken?.document?.id,
    userId: game.user?.id,
    userName: game.user?.name,
    sourceName: getTokenName(sourceToken),
    targetName: getTokenName(targetToken),
    messageKey: "PATPAT.Hug.Chat.Message",
    message: normalizeHugMessage(message)
  };
}

function createFlowerPayload(token, message = getDefaultFlowerMessage()) {
  return {
    action: "flower",
    sceneId: canvas?.scene?.id,
    tokenId: token?.id ?? token?.document?.id,
    userId: game.user?.id,
    userName: game.user?.name,
    targetName: getTokenName(token),
    messageKey: "PATPAT.Flower.Chat.Message",
    message: normalizeFlowerMessage(message),
    offset: getPatOffset(token)
  };
}

function createTeaPayload(token, message = getDefaultTeaMessage()) {
  return {
    action: "tea",
    sceneId: canvas?.scene?.id,
    tokenId: token?.id ?? token?.document?.id,
    userId: game.user?.id,
    userName: game.user?.name,
    targetName: getTokenName(token),
    messageKey: "PATPAT.Tea.Chat.Message",
    message: normalizeTeaMessage(message),
    offset: getPatOffset(token)
  };
}

function createFistBumpPayload(sourceToken, targetToken, message = getDefaultFistBumpMessage()) {
  return {
    action: "fistBump",
    sceneId: canvas?.scene?.id,
    sourceTokenId: sourceToken?.id ?? sourceToken?.document?.id,
    targetTokenId: targetToken?.id ?? targetToken?.document?.id,
    userId: game.user?.id,
    userName: game.user?.name,
    sourceName: getTokenName(sourceToken),
    targetName: getTokenName(targetToken),
    messageKey: "PATPAT.FistBump.Chat.Message",
    message: normalizeFistBumpMessage(message)
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

function readHugMessageFromDialog(html) {
  const form = getDialogForm(html);
  if (!form) return getDefaultHugMessage();

  const formData = new FormData(form);
  return normalizeHugMessage(formData.get("message"));
}

function readFlowerMessageFromDialog(html) {
  const form = getDialogForm(html);
  if (!form) return getDefaultFlowerMessage();

  const formData = new FormData(form);
  return normalizeFlowerMessage(formData.get("message"));
}

function readTeaMessageFromDialog(html) {
  const form = getDialogForm(html);
  if (!form) return getDefaultTeaMessage();

  const formData = new FormData(form);
  return normalizeTeaMessage(formData.get("message"));
}

function readFistBumpMessageFromDialog(html) {
  const form = getDialogForm(html);
  if (!form) return getDefaultFistBumpMessage();

  const formData = new FormData(form);
  return normalizeFistBumpMessage(formData.get("message"));
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

function getInteractionTargetToken(sourceToken) {
  const liveSource = resolveLiveToken(sourceToken) ?? sourceToken;
  const sourceId = liveSource?.id ?? liveSource?.document?.id;
  const targetedToken = getSingleTargetedToken(sourceId);
  return targetedToken ?? liveSource;
}

function getSingleTargetedToken(excludeTokenId = null) {
  const targets = Array.from(game.user?.targets ?? [])
    .map((token) => resolveLiveToken(token) ?? token)
    .filter((token) => {
      const tokenId = token?.id ?? token?.document?.id;
      return tokenId && tokenId !== excludeTokenId;
    });

  return targets.length === 1 ? targets[0] : null;
}

function getHugSourceToken(targetToken, preferredSource = null) {
  const targetId = targetToken?.id ?? targetToken?.document?.id;
  const livePreferredSource = resolveLiveToken(preferredSource) ?? preferredSource;
  const preferredSourceId = livePreferredSource?.id ?? livePreferredSource?.document?.id;
  if (
    preferredSourceId &&
    preferredSourceId !== targetId &&
    (game.user?.isGM || userOwnsToken(livePreferredSource))
  ) {
    return livePreferredSource;
  }

  const controlled = canvas?.tokens?.controlled ?? [];
  const selectedSource = controlled.find((token) => {
    const tokenId = token?.id ?? token?.document?.id;
    if (!tokenId || tokenId === targetId) return false;
    return game.user?.isGM || userOwnsToken(token);
  });
  if (selectedSource) return selectedSource;

  const characterToken = getUserCharacterToken(targetId);
  if (characterToken) return characterToken;

  return null;
}

function getUserCharacterToken(excludeTokenId = null) {
  const characterId = game.user?.character?.id;
  if (!characterId || !canvas?.tokens?.placeables) return null;

  return canvas.tokens.placeables.find((token) => {
    const tokenId = token?.id ?? token?.document?.id;
    if (!tokenId || tokenId === excludeTokenId) return false;
    const actorId = token?.actor?.id ?? token?.document?.actorId ?? token?.document?.actor?.id;
    return actorId === characterId && (game.user?.isGM || userOwnsToken(token));
  }) ?? null;
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

function getHugWorldEndpoints(sourceToken, targetToken) {
  const source = getTokenCenter(sourceToken);
  const target = getTokenCenter(targetToken);
  if (!source || !target) return null;
  return { source, target };
}

function getHugScreenEndpoints(sourceToken, targetToken) {
  const source = getTokenCenterScreenPosition(sourceToken);
  const target = getTokenCenterScreenPosition(targetToken);
  if (!source || !target) return null;
  return { source, target };
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

function getTokenCenterScreenPosition(token) {
  const center = getTokenCenter(token);
  if (!center) return null;

  try {
    const transformed = canvas?.stage?.worldTransform?.apply?.(center);
    const view = canvas?.app?.view ?? canvas?.app?.renderer?.view ?? document.querySelector("#board canvas");
    const rect = view?.getBoundingClientRect?.();

    if (transformed && rect) {
      return {
        x: rect.left + transformed.x,
        y: rect.top + transformed.y
      };
    }
  } catch (error) {
    debug("Stage center coordinate conversion failed; trying token bounds fallback.", error);
  }

  const bounds = token?.bounds ?? token?.getBounds?.();
  if (bounds) {
    return {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2
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

function createHugParticleMarkup() {
  const particleCount = randomInt(HUG_PARTICLE_CONFIG.count[0], HUG_PARTICLE_CONFIG.count[1]);

  return Array.from({ length: particleCount }, (_, index) => {
    const side = index % 2 === 0 ? -1 : 1;
    const driftX = side * randomBetween(HUG_PARTICLE_CONFIG.drift * 0.25, HUG_PARTICLE_CONFIG.drift);
    const startX = randomBetween(-42, 42);
    const rise = randomBetween(HUG_PARTICLE_CONFIG.rise[0], HUG_PARTICLE_CONFIG.rise[1]);
    const delay = randomInt(HUG_PARTICLE_CONFIG.delay[0], HUG_PARTICLE_CONFIG.delay[1]);
    const size = randomInt(HUG_PARTICLE_CONFIG.size[0], HUG_PARTICLE_CONFIG.size[1]);
    const scale = randomBetween(0.85, 1.28);
    const rotate = randomBetween(-24, 24);
    const symbol = pick(HUG_PARTICLE_CONFIG.symbols);
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

function createFlowerParticleMarkup() {
  const particleCount = randomInt(FLOWER_PARTICLE_CONFIG.count[0], FLOWER_PARTICLE_CONFIG.count[1]);

  return Array.from({ length: particleCount }, (_, index) => {
    const side = index % 2 === 0 ? -1 : 1;
    const driftX = side * randomBetween(FLOWER_PARTICLE_CONFIG.drift * 0.25, FLOWER_PARTICLE_CONFIG.drift);
    const startX = randomBetween(-28, 28);
    const rise = randomBetween(FLOWER_PARTICLE_CONFIG.rise[0], FLOWER_PARTICLE_CONFIG.rise[1]);
    const delay = randomInt(FLOWER_PARTICLE_CONFIG.delay[0], FLOWER_PARTICLE_CONFIG.delay[1]);
    const size = randomInt(FLOWER_PARTICLE_CONFIG.size[0], FLOWER_PARTICLE_CONFIG.size[1]);
    const scale = randomBetween(0.82, 1.26);
    const rotate = randomBetween(-26, 26);
    const symbol = pick(FLOWER_PARTICLE_CONFIG.symbols);
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

function createTeaParticleMarkup() {
  const particleCount = randomInt(TEA_PARTICLE_CONFIG.count[0], TEA_PARTICLE_CONFIG.count[1]);

  return Array.from({ length: particleCount }, (_, index) => {
    const side = index % 2 === 0 ? -1 : 1;
    const driftX = side * randomBetween(TEA_PARTICLE_CONFIG.drift * 0.25, TEA_PARTICLE_CONFIG.drift);
    const startX = randomBetween(-24, 24);
    const rise = randomBetween(TEA_PARTICLE_CONFIG.rise[0], TEA_PARTICLE_CONFIG.rise[1]);
    const delay = randomInt(TEA_PARTICLE_CONFIG.delay[0], TEA_PARTICLE_CONFIG.delay[1]);
    const size = randomInt(TEA_PARTICLE_CONFIG.size[0], TEA_PARTICLE_CONFIG.size[1]);
    const scale = randomBetween(0.82, 1.2);
    const rotate = randomBetween(-18, 18);
    const symbol = pick(TEA_PARTICLE_CONFIG.symbols);
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

function createFistBumpParticleMarkup() {
  const particleCount = randomInt(FIST_BUMP_PARTICLE_CONFIG.count[0], FIST_BUMP_PARTICLE_CONFIG.count[1]);

  return Array.from({ length: particleCount }, (_, index) => {
    const side = index % 2 === 0 ? -1 : 1;
    const driftX = side * randomBetween(FIST_BUMP_PARTICLE_CONFIG.drift * 0.25, FIST_BUMP_PARTICLE_CONFIG.drift);
    const startX = randomBetween(-18, 18);
    const rise = randomBetween(FIST_BUMP_PARTICLE_CONFIG.rise[0], FIST_BUMP_PARTICLE_CONFIG.rise[1]);
    const delay = randomInt(FIST_BUMP_PARTICLE_CONFIG.delay[0], FIST_BUMP_PARTICLE_CONFIG.delay[1]);
    const size = randomInt(FIST_BUMP_PARTICLE_CONFIG.size[0], FIST_BUMP_PARTICLE_CONFIG.size[1]);
    const scale = randomBetween(0.86, 1.34);
    const rotate = randomBetween(-28, 28);
    const symbol = pick(FIST_BUMP_PARTICLE_CONFIG.symbols);
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

function createPixiHugEffect(PIXIConstructor, message) {
  const effect = new PIXIConstructor.Container();
  effect.name = `${MODULE_ID}-pixi-hug-effect`;
  effect.eventMode = "none";
  effect.interactiveChildren = false;
  effect.sortableChildren = true;
  effect.zIndex = Number(CONFIG?.Canvas?.groups?.interface?.zIndexScrollingText ?? 700) + 22;

  const ribbon = new PIXIConstructor.Graphics();
  ribbon.name = `${MODULE_ID}-hug-ribbon`;
  const glow = new PIXIConstructor.Graphics();
  glow.name = `${MODULE_ID}-hug-glow`;
  const hugIcon = createPixiText(PIXIConstructor, HUG_SYMBOL, {
    fontFamily: "\"Segoe UI Emoji\", \"Apple Color Emoji\", \"Noto Color Emoji\", sans-serif",
    fontSize: 38,
    dropShadow: true,
    dropShadowAlpha: 0.24,
    dropShadowBlur: 4,
    dropShadowDistance: 2
  });
  setPixiAnchor(hugIcon, 0.5);
  hugIcon.alpha = 0;

  const heart = createPixiText(PIXIConstructor, HUG_HEART_SYMBOL, {
    fontFamily: "\"Segoe UI Emoji\", \"Apple Color Emoji\", \"Noto Color Emoji\", sans-serif",
    fontSize: 31,
    dropShadow: true,
    dropShadowAlpha: 0.24,
    dropShadowBlur: 4,
    dropShadowDistance: 1
  });
  setPixiAnchor(heart, 0.5);
  heart.alpha = 0;

  const particles = createPixiHugParticles(PIXIConstructor);
  const floatingText = createPixiFloatingText(PIXIConstructor, normalizeHugMessage(message));

  glow.zIndex = 1;
  ribbon.zIndex = 2;
  particles.forEach((particle) => particle.text.zIndex = 3);
  hugIcon.zIndex = 4;
  heart.zIndex = 5;
  floatingText.group.zIndex = 6;

  effect.addChild(glow);
  effect.addChild(ribbon);
  for (const particle of particles) effect.addChild(particle.text);
  effect.addChild(hugIcon);
  effect.addChild(heart);
  effect.addChild(floatingText.group);

  effect.patPatParty = {
    ribbon,
    glow,
    hugIcon,
    heart,
    particles,
    floatingText,
    endpoints: null
  };

  return effect;
}

function createPixiHugParticles(PIXIConstructor) {
  const particleCount = randomInt(HUG_PARTICLE_CONFIG.count[0], HUG_PARTICLE_CONFIG.count[1]);

  return Array.from({ length: particleCount }, (_, index) => {
    const side = index % 2 === 0 ? -1 : 1;
    const startX = randomBetween(-36, 36);
    const startY = randomBetween(-12, 18);
    const driftX = side * randomBetween(HUG_PARTICLE_CONFIG.drift * 0.25, HUG_PARTICLE_CONFIG.drift);
    const rise = randomBetween(HUG_PARTICLE_CONFIG.rise[0], HUG_PARTICLE_CONFIG.rise[1]);
    const delay = randomInt(HUG_PARTICLE_CONFIG.delay[0], HUG_PARTICLE_CONFIG.delay[1]);
    const size = randomInt(HUG_PARTICLE_CONFIG.size[0], HUG_PARTICLE_CONFIG.size[1]);
    const targetScale = randomBetween(0.88, 1.3);
    const rotation = randomBetween(-0.42, 0.42);
    const text = createPixiText(PIXIConstructor, pick(HUG_PARTICLE_CONFIG.symbols), {
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
      duration: 960,
      startX,
      startY,
      driftX,
      rise,
      targetScale,
      rotation
    };
  });
}

function createPixiFlowerEffect(PIXIConstructor, message) {
  const effect = new PIXIConstructor.Container();
  effect.name = `${MODULE_ID}-pixi-flower-effect`;
  effect.eventMode = "none";
  effect.interactiveChildren = false;
  effect.sortableChildren = true;
  effect.zIndex = Number(CONFIG?.Canvas?.groups?.interface?.zIndexScrollingText ?? 700) + 21;

  const glow = createPixiTokenGlow(PIXIConstructor);
  const bouquet = createPixiText(PIXIConstructor, FLOWER_SYMBOL, {
    fontFamily: "\"Segoe UI Emoji\", \"Apple Color Emoji\", \"Noto Color Emoji\", sans-serif",
    fontSize: 42,
    dropShadow: true,
    dropShadowAlpha: 0.24,
    dropShadowBlur: 4,
    dropShadowDistance: 2
  });
  setPixiAnchor(bouquet, 0.5);
  bouquet.alpha = 0;

  const particles = createPixiFlowerParticles(PIXIConstructor);
  const floatingText = createPixiFloatingText(PIXIConstructor, normalizeFlowerMessage(message));

  glow.zIndex = 1;
  particles.forEach((particle) => particle.text.zIndex = 2);
  bouquet.zIndex = 3;
  floatingText.group.zIndex = 4;

  effect.addChild(glow);
  for (const particle of particles) effect.addChild(particle.text);
  effect.addChild(bouquet);
  effect.addChild(floatingText.group);

  effect.patPatParty = {
    glow,
    bouquet,
    particles,
    floatingText
  };

  return effect;
}

function createPixiFlowerParticles(PIXIConstructor) {
  const particleCount = randomInt(FLOWER_PARTICLE_CONFIG.count[0], FLOWER_PARTICLE_CONFIG.count[1]);

  return Array.from({ length: particleCount }, (_, index) => {
    const side = index % 2 === 0 ? -1 : 1;
    const startX = randomBetween(-30, 30);
    const startY = randomBetween(-4, 22);
    const driftX = side * randomBetween(FLOWER_PARTICLE_CONFIG.drift * 0.25, FLOWER_PARTICLE_CONFIG.drift);
    const rise = randomBetween(FLOWER_PARTICLE_CONFIG.rise[0], FLOWER_PARTICLE_CONFIG.rise[1]);
    const delay = randomInt(FLOWER_PARTICLE_CONFIG.delay[0], FLOWER_PARTICLE_CONFIG.delay[1]);
    const size = randomInt(FLOWER_PARTICLE_CONFIG.size[0], FLOWER_PARTICLE_CONFIG.size[1]);
    const targetScale = randomBetween(0.82, 1.24);
    const rotation = randomBetween(-0.46, 0.46);
    const text = createPixiText(PIXIConstructor, pick(FLOWER_PARTICLE_CONFIG.symbols), {
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
      duration: 980,
      startX,
      startY,
      driftX,
      rise,
      targetScale,
      rotation
    };
  });
}

function createPixiTeaEffect(PIXIConstructor, message) {
  const effect = new PIXIConstructor.Container();
  effect.name = `${MODULE_ID}-pixi-tea-effect`;
  effect.eventMode = "none";
  effect.interactiveChildren = false;
  effect.sortableChildren = true;
  effect.zIndex = Number(CONFIG?.Canvas?.groups?.interface?.zIndexScrollingText ?? 700) + 21;

  const glow = createPixiTokenGlow(PIXIConstructor);
  const tea = createPixiText(PIXIConstructor, TEA_SYMBOL, {
    fontFamily: "\"Segoe UI Emoji\", \"Apple Color Emoji\", \"Noto Color Emoji\", sans-serif",
    fontSize: 42,
    dropShadow: true,
    dropShadowAlpha: 0.24,
    dropShadowBlur: 4,
    dropShadowDistance: 2
  });
  setPixiAnchor(tea, 0.5);
  tea.alpha = 0;

  const particles = createPixiTeaParticles(PIXIConstructor);
  const floatingText = createPixiFloatingText(PIXIConstructor, normalizeTeaMessage(message));

  glow.zIndex = 1;
  particles.forEach((particle) => particle.text.zIndex = 2);
  tea.zIndex = 3;
  floatingText.group.zIndex = 4;

  effect.addChild(glow);
  for (const particle of particles) effect.addChild(particle.text);
  effect.addChild(tea);
  effect.addChild(floatingText.group);

  effect.patPatParty = {
    glow,
    tea,
    particles,
    floatingText
  };

  return effect;
}

function createPixiTeaParticles(PIXIConstructor) {
  const particleCount = randomInt(TEA_PARTICLE_CONFIG.count[0], TEA_PARTICLE_CONFIG.count[1]);

  return Array.from({ length: particleCount }, (_, index) => {
    const side = index % 2 === 0 ? -1 : 1;
    const startX = randomBetween(-24, 24);
    const startY = randomBetween(-4, 18);
    const driftX = side * randomBetween(TEA_PARTICLE_CONFIG.drift * 0.25, TEA_PARTICLE_CONFIG.drift);
    const rise = randomBetween(TEA_PARTICLE_CONFIG.rise[0], TEA_PARTICLE_CONFIG.rise[1]);
    const delay = randomInt(TEA_PARTICLE_CONFIG.delay[0], TEA_PARTICLE_CONFIG.delay[1]);
    const size = randomInt(TEA_PARTICLE_CONFIG.size[0], TEA_PARTICLE_CONFIG.size[1]);
    const targetScale = randomBetween(0.82, 1.2);
    const rotation = randomBetween(-0.32, 0.32);
    const text = createPixiText(PIXIConstructor, pick(TEA_PARTICLE_CONFIG.symbols), {
      fontFamily: "\"Segoe UI Emoji\", \"Apple Color Emoji\", \"Noto Color Emoji\", sans-serif",
      fontSize: size,
      dropShadow: true,
      dropShadowAlpha: 0.22,
      dropShadowBlur: 3,
      dropShadowDistance: 1
    });
    setPixiAnchor(text, 0.5);
    text.alpha = 0;
    text.position.set(startX, startY);

    return {
      text,
      delay,
      duration: 960,
      startX,
      startY,
      driftX,
      rise,
      targetScale,
      rotation
    };
  });
}

function createPixiFistBumpEffect(PIXIConstructor, message) {
  const effect = new PIXIConstructor.Container();
  effect.name = `${MODULE_ID}-pixi-fist-bump-effect`;
  effect.eventMode = "none";
  effect.interactiveChildren = false;
  effect.sortableChildren = true;
  effect.zIndex = Number(CONFIG?.Canvas?.groups?.interface?.zIndexScrollingText ?? 700) + 24;

  const burst = new PIXIConstructor.Graphics();
  burst.name = `${MODULE_ID}-fist-bump-burst`;
  const leftFist = createPixiFist(PIXIConstructor, false);
  const rightFist = createPixiFist(PIXIConstructor, true);
  const particles = createPixiFistBumpParticles(PIXIConstructor);
  const floatingText = createPixiFloatingText(PIXIConstructor, normalizeFistBumpMessage(message));

  burst.zIndex = 1;
  particles.forEach((particle) => particle.text.zIndex = 2);
  leftFist.zIndex = 3;
  rightFist.zIndex = 3;
  floatingText.group.zIndex = 4;

  effect.addChild(burst);
  for (const particle of particles) effect.addChild(particle.text);
  effect.addChild(leftFist);
  effect.addChild(rightFist);
  effect.addChild(floatingText.group);

  effect.patPatParty = {
    burst,
    leftFist,
    rightFist,
    particles,
    floatingText,
    endpoints: null
  };

  return effect;
}

function createPixiFist(PIXIConstructor, mirrored) {
  const group = new PIXIConstructor.Container();
  const glow = new PIXIConstructor.Graphics();
  glow.beginFill(0xffd565, 0.22);
  glow.drawCircle(0, 2, 28);
  glow.endFill();
  glow.beginFill(0xff8ec3, 0.12);
  glow.drawCircle(0, 2, 36);
  glow.endFill();

  const fist = createPixiText(PIXIConstructor, FIST_SYMBOL, {
    fontFamily: "\"Segoe UI Emoji\", \"Apple Color Emoji\", \"Noto Color Emoji\", sans-serif",
    fontSize: 36,
    dropShadow: true,
    dropShadowAlpha: 0.28,
    dropShadowBlur: 4,
    dropShadowDistance: 2
  });
  setPixiAnchor(fist, 0.5);
  fist.scale.x = mirrored ? -1 : 1;

  group.addChild(glow);
  group.addChild(fist);
  group.alpha = 0;
  group.patPatParty = { glow, fist };
  return group;
}

function createPixiFistBumpParticles(PIXIConstructor) {
  const particleCount = randomInt(FIST_BUMP_PARTICLE_CONFIG.count[0], FIST_BUMP_PARTICLE_CONFIG.count[1]);

  return Array.from({ length: particleCount }, (_, index) => {
    const side = index % 2 === 0 ? -1 : 1;
    const startX = randomBetween(-16, 16);
    const startY = randomBetween(-10, 18);
    const driftX = side * randomBetween(FIST_BUMP_PARTICLE_CONFIG.drift * 0.25, FIST_BUMP_PARTICLE_CONFIG.drift);
    const rise = randomBetween(FIST_BUMP_PARTICLE_CONFIG.rise[0], FIST_BUMP_PARTICLE_CONFIG.rise[1]);
    const delay = randomInt(FIST_BUMP_PARTICLE_CONFIG.delay[0], FIST_BUMP_PARTICLE_CONFIG.delay[1]);
    const size = randomInt(FIST_BUMP_PARTICLE_CONFIG.size[0], FIST_BUMP_PARTICLE_CONFIG.size[1]);
    const targetScale = randomBetween(0.86, 1.34);
    const rotation = randomBetween(-0.48, 0.48);
    const text = createPixiText(PIXIConstructor, pick(FIST_BUMP_PARTICLE_CONFIG.symbols), {
      fontFamily: "\"Segoe UI Emoji\", \"Apple Color Emoji\", \"Noto Color Emoji\", sans-serif",
      fontSize: size,
      dropShadow: true,
      dropShadowAlpha: 0.26,
      dropShadowBlur: 3,
      dropShadowDistance: 1
    });
    setPixiAnchor(text, 0.5);
    text.alpha = 0;
    text.position.set(startX, startY);

    return {
      text,
      delay,
      duration: 840,
      startX,
      startY,
      driftX,
      rise,
      targetScale,
      rotation
    };
  });
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

function positionHugEffect(effect, endpoints) {
  positionDuoEffect(effect, endpoints);
}

function positionDuoEffect(effect, endpoints) {
  const midpoint = getMidpoint(endpoints.source, endpoints.target);
  const scale = getCanvasStageScale();

  effect.position.set(midpoint.x, midpoint.y);
  effect.scale.set(getInverseCanvasScale());

  if (effect.patPatParty) {
    effect.patPatParty.endpoints = {
      source: {
        x: (endpoints.source.x - midpoint.x) * scale,
        y: (endpoints.source.y - midpoint.y) * scale
      },
      target: {
        x: (endpoints.target.x - midpoint.x) * scale,
        y: (endpoints.target.y - midpoint.y) * scale
      }
    };
  }
}

function updatePixiHugEffect(effect, elapsed, progress) {
  const parts = effect.patPatParty;
  if (!parts?.endpoints) return;

  const { source, target } = parts.endpoints;
  const midpoint = { x: 0, y: 0 };
  const controlY = Math.min(source.y, target.y, -12) - 44;
  const envelope = Math.sin(progress * Math.PI);
  const lineAlpha = Math.max(0, Math.min(0.86, envelope * 0.86));

  drawPixiHugGlow(parts.glow, source, target, envelope);
  drawPixiHugRibbon(parts.ribbon, source, target, controlY, lineAlpha);

  const iconIn = easeOutBack(Math.min(1, progress / 0.22));
  const iconOut = 1 - easeInCubic(Math.max(0, (progress - 0.78) / 0.22));
  const iconAlpha = Math.max(0, Math.min(iconIn, iconOut));
  const nuzzle = Math.sin(progress * Math.PI * 6) * envelope;

  parts.hugIcon.alpha = iconAlpha;
  parts.hugIcon.x = midpoint.x + nuzzle * 4;
  parts.hugIcon.y = controlY + 18 - envelope * 8;
  parts.hugIcon.rotation = nuzzle * 0.08;
  parts.hugIcon.scale.set(lerp(0.78, 1.08, iconIn) * (1 + envelope * 0.04));

  parts.heart.alpha = Math.max(0, Math.min(easeOutCubic(progress / 0.28), iconOut));
  parts.heart.x = midpoint.x - nuzzle * 3;
  parts.heart.y = controlY + 50 - envelope * 18;
  parts.heart.rotation = -nuzzle * 0.05;
  parts.heart.scale.set(0.86 + envelope * 0.18);

  updatePixiParticles(parts.particles, elapsed);
  updatePixiFloatingText(parts.floatingText.group, { textRise: 58 }, elapsed, progress, HUG_EFFECT_DURATION);
}

function updatePixiFlowerEffect(effect, elapsed, progress) {
  const parts = effect.patPatParty;
  if (!parts) return;

  updatePixiTokenGlow(parts.glow, "gentle", progress);
  updatePixiFlowerBouquet(parts.bouquet, progress);
  updatePixiParticles(parts.particles, elapsed);
  updatePixiFloatingText(parts.floatingText.group, { textRise: 52 }, elapsed, progress, FLOWER_EFFECT_DURATION);
}

function updatePixiTeaEffect(effect, elapsed, progress) {
  const parts = effect.patPatParty;
  if (!parts) return;

  updatePixiTokenGlow(parts.glow, "gentle", progress);
  updatePixiTeaCup(parts.tea, progress);
  updatePixiParticles(parts.particles, elapsed);
  updatePixiFloatingText(parts.floatingText.group, { textRise: 48 }, elapsed, progress, TEA_EFFECT_DURATION);
}

function updatePixiFlowerBouquet(bouquet, progress) {
  const enterEnd = 0.28;
  const exitStart = 0.78;
  const sway = Math.sin(progress * Math.PI * 4);
  const envelope = Math.sin(progress * Math.PI);

  if (progress < enterEnd) {
    const t = easeOutBack(progress / enterEnd);
    bouquet.alpha = clamp01(t);
    bouquet.x = lerp(34, 0, t);
    bouquet.y = lerp(-64, -10, easeOutCubic(progress / enterEnd));
    bouquet.rotation = lerp(0.32, -0.06, t);
    bouquet.scale.set(lerp(0.72, 1.06, t));
  } else if (progress < exitStart) {
    bouquet.alpha = 1;
    bouquet.x = sway * 5;
    bouquet.y = -10 - envelope * 6;
    bouquet.rotation = -0.04 + sway * 0.08;
    bouquet.scale.set(1.02 + envelope * 0.05);
  } else {
    const t = easeInOutCubic((progress - exitStart) / (1 - exitStart));
    bouquet.alpha = 1 - t;
    bouquet.x = lerp(0, -8, t);
    bouquet.y = lerp(-10, -52, t);
    bouquet.rotation = lerp(0, -0.16, t);
    bouquet.scale.set(lerp(1, 0.76, t));
  }
}

function updatePixiTeaCup(tea, progress) {
  const enterEnd = 0.26;
  const exitStart = 0.78;
  const sway = Math.sin(progress * Math.PI * 3.5);
  const envelope = Math.sin(progress * Math.PI);

  if (progress < enterEnd) {
    const t = easeOutBack(progress / enterEnd);
    tea.alpha = clamp01(t);
    tea.x = lerp(30, 0, t);
    tea.y = lerp(-54, -8, easeOutCubic(progress / enterEnd));
    tea.rotation = lerp(0.22, -0.04, t);
    tea.scale.set(lerp(0.72, 1.04, t));
  } else if (progress < exitStart) {
    tea.alpha = 1;
    tea.x = sway * 3;
    tea.y = -8 - envelope * 5;
    tea.rotation = -0.02 + sway * 0.05;
    tea.scale.set(1.02 + envelope * 0.035);
  } else {
    const t = easeInOutCubic((progress - exitStart) / (1 - exitStart));
    tea.alpha = 1 - t;
    tea.x = lerp(0, -4, t);
    tea.y = lerp(-8, -46, t);
    tea.rotation = lerp(0, -0.1, t);
    tea.scale.set(lerp(1, 0.76, t));
  }
}

function updatePixiFistBumpEffect(effect, elapsed, progress) {
  const parts = effect.patPatParty;
  if (!parts?.endpoints) return;

  const { source, target } = parts.endpoints;
  const sourceStart = {
    x: lerp(source.x, 0, 0.36),
    y: lerp(source.y, target.y, 0.5) - 24
  };
  const targetStart = {
    x: lerp(target.x, 0, 0.36),
    y: lerp(target.y, source.y, 0.5) - 24
  };
  const collideAt = { x: 0, y: Math.min(sourceStart.y, targetStart.y) - 6 };
  const impact = Math.max(0, 1 - Math.abs(progress - 0.42) / 0.12);
  const rebound = Math.max(0, (progress - 0.48) / 0.52);

  updatePixiFist(parts.leftFist, sourceStart, collideAt, progress, impact, rebound, -1);
  updatePixiFist(parts.rightFist, targetStart, collideAt, progress, impact, rebound, 1);
  drawPixiFistBumpBurst(parts.burst, impact, progress);
  updatePixiParticles(parts.particles, elapsed);
  updatePixiFloatingText(parts.floatingText.group, { textRise: 54 }, elapsed, progress, FIST_BUMP_EFFECT_DURATION);
}

function updatePixiFist(fist, start, collideAt, progress, impact, rebound, direction) {
  const approachEnd = 0.42;
  const exitStart = 0.48;

  if (progress < approachEnd) {
    const t = easeInOutCubic(progress / approachEnd);
    fist.alpha = clamp01(t * 1.4);
    fist.x = lerp(start.x, collideAt.x - direction * 12, t);
    fist.y = lerp(start.y, collideAt.y, t);
    fist.rotation = lerp(direction * 0.34, direction * 0.04, t);
    fist.scale.set(lerp(0.78, 1.08, easeOutBack(t)));
  } else if (progress < exitStart) {
    const shake = Math.sin(progress * Math.PI * 52) * impact;
    fist.alpha = 1;
    fist.x = collideAt.x - direction * (10 + shake * 2);
    fist.y = collideAt.y + Math.abs(shake) * 2;
    fist.rotation = direction * (0.04 + shake * 0.06);
    fist.scale.set(1.12 + impact * 0.12);
  } else {
    const t = easeOutCubic(rebound);
    fist.alpha = 1 - easeInCubic(Math.max(0, (progress - 0.78) / 0.22));
    fist.x = lerp(collideAt.x - direction * 12, start.x * 0.72, t);
    fist.y = lerp(collideAt.y, start.y - 24, t);
    fist.rotation = lerp(direction * -0.08, direction * -0.28, t);
    fist.scale.set(lerp(1.04, 0.74, t));
  }

  const glow = fist.patPatParty?.glow;
  if (glow) {
    glow.alpha = fist.alpha * (0.34 + impact * 0.32);
    glow.scale.set(0.9 + impact * 0.28);
  }
}

function drawPixiFistBumpBurst(burst, impact, progress) {
  burst.clear();
  if (impact <= 0.01 && progress > 0.7) return;

  const alpha = Math.max(0, impact);
  const radius = 20 + impact * 42;
  burst.lineStyle({ width: 5, color: 0xffffff, alpha: alpha * 0.62, cap: globalThis.PIXI?.LINE_CAP?.ROUND });
  burst.drawCircle(0, -30, radius * 0.42);
  burst.lineStyle({ width: 3, color: 0xffd565, alpha: alpha * 0.88, cap: globalThis.PIXI?.LINE_CAP?.ROUND });
  burst.drawCircle(0, -30, radius * 0.56);

  const rayCount = 8;
  for (let index = 0; index < rayCount; index += 1) {
    const angle = (Math.PI * 2 * index) / rayCount;
    const inner = 16 + impact * 10;
    const outer = 30 + impact * 38;
    burst.lineStyle({ width: 2.4, color: index % 2 === 0 ? 0xff9cca : 0x8ff5df, alpha: alpha * 0.84, cap: globalThis.PIXI?.LINE_CAP?.ROUND });
    burst.moveTo(Math.cos(angle) * inner, -30 + Math.sin(angle) * inner);
    burst.lineTo(Math.cos(angle) * outer, -30 + Math.sin(angle) * outer);
  }
}

function drawPixiHugGlow(glow, source, target, envelope) {
  glow.clear();
  if (envelope <= 0) return;

  glow.beginFill(0xff9cca, 0.2 * envelope);
  glow.drawEllipse(source.x, source.y + 10, 42, 16);
  glow.drawEllipse(target.x, target.y + 10, 42, 16);
  glow.endFill();
  glow.beginFill(0x8ff5df, 0.12 * envelope);
  glow.drawEllipse(0, Math.min(source.y, target.y) - 10, Math.max(54, Math.abs(target.x - source.x) * 0.42), 24);
  glow.endFill();
}

function drawPixiHugRibbon(ribbon, source, target, controlY, alpha) {
  ribbon.clear();
  if (alpha <= 0) return;

  ribbon.lineStyle({ width: 6, color: 0xffffff, alpha: alpha * 0.35, cap: globalThis.PIXI?.LINE_CAP?.ROUND });
  ribbon.moveTo(source.x, source.y - 10);
  ribbon.quadraticCurveTo(0, controlY, target.x, target.y - 10);
  ribbon.lineStyle({ width: 3, color: 0xff8ec3, alpha, cap: globalThis.PIXI?.LINE_CAP?.ROUND });
  ribbon.moveTo(source.x, source.y - 10);
  ribbon.quadraticCurveTo(0, controlY, target.x, target.y - 10);
  ribbon.lineStyle({ width: 2, color: 0x7ee6d2, alpha: alpha * 0.78, cap: globalThis.PIXI?.LINE_CAP?.ROUND });
  ribbon.moveTo(source.x, source.y - 2);
  ribbon.quadraticCurveTo(0, controlY + 16, target.x, target.y - 2);
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

function getDefaultHugMessage() {
  return truncateText(localize("PATPAT.Hug.Chat.Message"), MAX_MESSAGE_LENGTH);
}

function getDefaultFlowerMessage() {
  return truncateText(localize("PATPAT.Flower.Chat.Message"), MAX_MESSAGE_LENGTH);
}

function getDefaultTeaMessage() {
  return truncateText(localize("PATPAT.Tea.Chat.Message"), MAX_MESSAGE_LENGTH);
}

function getDefaultFistBumpMessage() {
  return truncateText(localize("PATPAT.FistBump.Chat.Message"), MAX_MESSAGE_LENGTH);
}

function normalizePatMessage(value) {
  const normalized = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return getDefaultPatMessage();
  return truncateText(normalized, MAX_MESSAGE_LENGTH);
}

function normalizeHugMessage(value) {
  const normalized = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return getDefaultHugMessage();
  return truncateText(normalized, MAX_MESSAGE_LENGTH);
}

function normalizeFlowerMessage(value) {
  const normalized = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return getDefaultFlowerMessage();
  return truncateText(normalized, MAX_MESSAGE_LENGTH);
}

function normalizeTeaMessage(value) {
  const normalized = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return getDefaultTeaMessage();
  return truncateText(normalized, MAX_MESSAGE_LENGTH);
}

function normalizeFistBumpMessage(value) {
  const normalized = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return getDefaultFistBumpMessage();
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

function getMidpoint(a, b) {
  return {
    x: (Number(a?.x) + Number(b?.x)) / 2,
    y: (Number(a?.y) + Number(b?.y)) / 2
  };
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

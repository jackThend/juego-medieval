export class HUD {
  constructor() {
    this.startScreen = document.querySelector("#start-screen");
    this.startButton = document.querySelector("#start-button");
    this.objective = document.querySelector("#objective-text");
    this.playerFill = document.querySelector("#player-health-fill");
    this.enemyBar = document.querySelector("#enemy-health");
    this.enemyFill = document.querySelector("#enemy-health-fill");
    this.prompt = document.querySelector("#interaction-prompt");
    this.message = document.querySelector("#message-overlay");
    this.messageTitle = document.querySelector("#message-title");
    this.messageBody = document.querySelector("#message-body");
  }

  onStart(handler) {
    this.startButton?.addEventListener("click", handler);
  }

  hideStart() {
    this.startScreen?.classList.add("is-hidden");
    this.startScreen?.setAttribute("aria-hidden", "true");
  }

  setObjective(text) {
    if (this.objective) this.objective.textContent = text;
  }

  setPlayerHealth(ratio) {
    if (this.playerFill) this.playerFill.style.transform = `scaleX(${Math.max(0, Math.min(1, ratio))})`;
  }

  setEnemyHealth(ratio, visible = true) {
    this.enemyBar?.classList.toggle("is-hidden", !visible);
    if (this.enemyFill) this.enemyFill.style.transform = `scaleX(${Math.max(0, Math.min(1, ratio))})`;
  }

  showPrompt(text = "") {
    if (!this.prompt) return;
    this.prompt.textContent = text;
    this.prompt.classList.toggle("is-visible", Boolean(text));
  }

  showMessage(title, body) {
    if (this.messageTitle) this.messageTitle.textContent = title;
    if (this.messageBody) this.messageBody.textContent = body;
    this.message?.classList.add("is-visible");
  }

  hideMessage() {
    this.message?.classList.remove("is-visible");
  }
}

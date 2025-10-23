import { UI_CONFIG } from "../config/constants.js";

export class Notifications {
  private notificationContainer: HTMLElement;
  private notificationText: HTMLElement;
  private notificationBadge: HTMLElement;
  private hideTimeout: number | null = null;
  private notificationCount: number = 0;
  private hideDuration: number;

  constructor() {
    this.hideDuration = UI_CONFIG.NOTIFICATION_DURATION;

    this.notificationContainer = document.getElementById(
      "notifications-container"
    )!;
    this.notificationText = this.notificationContainer.querySelector(
      ".notification__text"
    )!;
    this.notificationBadge = this.notificationContainer.querySelector(
      ".notification__badge"
    )!;

    if (
      !this.notificationContainer ||
      !this.notificationText ||
      !this.notificationBadge
    ) {
      throw new Error("Notification elements not found");
    }

    this.setupHoverListeners();
    this.updateBadge();
  }

  private setupHoverListeners(): void {
    this.notificationContainer.addEventListener("mouseenter", () => {
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
        this.hideTimeout = null;
      }
    });

    this.notificationContainer.addEventListener("mouseleave", () => {
      if (this.notificationContainer.classList.contains("show")) {
        this.hideTimeout = window.setTimeout(() => {
          this.hideMessage();
        }, this.hideDuration);
      }
    });
  }

  public showMessage(message: string, duration: number = 3000): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }

    this.hideDuration = duration;
    this.notificationCount++;
    this.updateBadge();

    this.notificationText.textContent = message;

    this.notificationContainer.classList.remove("hide");
    this.notificationContainer.classList.add("show");

    this.hideTimeout = window.setTimeout(() => {
      this.hideMessage();
    }, duration);
  }

  public hide(): void {
    this.hideMessage();
  }

  public resetBadgeCount(): void {
    this.notificationCount = 0;
    this.updateBadge();
  }

  private hideMessage(): void {
    this.notificationContainer.classList.remove("show");
    this.notificationContainer.classList.add("hide");

    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  private updateBadge(): void {
    this.notificationBadge.textContent = this.notificationCount.toString();
  }
}

import { TableViewHandler } from "../components/TableViewHandler.js";
import { DocumentController } from "../controllers/DocumentController.js";
import { NotificationsService } from "./NotificationsService.js";
import { NotificationsController } from "../controllers/NotificationsController.js";
import { logger } from "../utils/logger.js";

export class AppInitializer {
  private documentController: DocumentController | null = null;
  private notificationsController: NotificationsController | null = null;

  private initializeViewHandler(): void {
    new TableViewHandler();
  }

  private async initializeDocumentController(): Promise<void> {
    this.documentController = new DocumentController();
    await this.documentController.initialize();
  }

  private async initializeNotificationsController(): Promise<void> {
    const notificationsService = new NotificationsService();
    this.notificationsController = new NotificationsController(
      notificationsService
    );

    try {
      await this.notificationsController.initialize();
    } catch (error) {
      logger.warn("AppInitializer", "Failed to initialize notifications");
    }
  }

  public async initialize(): Promise<void> {
    try {
      this.initializeViewHandler();
      await this.initializeDocumentController();
      await this.initializeNotificationsController();
    } catch (error) {
      logger.error("AppInitializer", error);
      throw error;
    }
  }
}

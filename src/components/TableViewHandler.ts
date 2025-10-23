export class TableViewHandler {
  private tableElement: HTMLElement;
  private listViewButton: HTMLElement;
  private gridViewButton: HTMLElement;

  constructor() {
    this.tableElement = document.getElementById("main-table") as HTMLElement;
    this.listViewButton = document.getElementById("list-view") as HTMLElement;
    this.gridViewButton = document.getElementById("grid-view") as HTMLElement;

    this.validateElements();
    this.initEventListeners();
  }

  private validateElements(): void {
    if (!this.tableElement) {
      throw new Error("Table element with id 'main-table' not found");
    }
    if (!this.listViewButton) {
      throw new Error("List view button with id 'list-view' not found");
    }
    if (!this.gridViewButton) {
      throw new Error("Grid view button with id 'grid-view' not found");
    }
  }

  private initEventListeners(): void {
    this.listViewButton.addEventListener("click", () =>
      this.switchToListView()
    );
    this.gridViewButton.addEventListener("click", () =>
      this.switchToGridView()
    );
  }

  private switchToListView(): void {
    this.tableElement.classList.remove("grid-view");
    this.tableElement.classList.add("list-view");

    this.listViewButton.classList.add("active");
    this.listViewButton.setAttribute("aria-pressed", "true");
    this.gridViewButton.classList.remove("active");
    this.gridViewButton.setAttribute("aria-pressed", "false");
  }

  private switchToGridView(): void {
    this.tableElement.classList.remove("list-view");
    this.tableElement.classList.add("grid-view");

    this.gridViewButton.classList.add("active");
    this.gridViewButton.setAttribute("aria-pressed", "true");
    this.listViewButton.classList.remove("active");
    this.listViewButton.setAttribute("aria-pressed", "false");
  }
  /**
   * Get the current view mode
   */
  public getCurrentView(): "list" | "grid" {
    return this.tableElement.classList.contains("grid-view") ? "grid" : "list";
  }

  /**
   * Programmatically set the view
   */
  public setView(view: "list" | "grid"): void {
    if (view === "list") {
      this.switchToListView();
    } else {
      this.switchToGridView();
    }
  }
}

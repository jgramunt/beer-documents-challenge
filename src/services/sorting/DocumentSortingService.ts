import { Document } from "../../models/Document.js";

export type SortField = "name" | "version" | "created" | "";

export class DocumentSortingService {
  public sortDocuments(documents: Document[], sortBy: SortField): Document[] {
    if (!sortBy) {
      return [...documents];
    }

    const documentsCopy = [...documents];

    switch (sortBy) {
      case "name":
        return this.sortByName(documentsCopy);

      case "version":
        return this.sortByVersion(documentsCopy);

      case "created":
        return this.sortByCreatedDate(documentsCopy);

      default:
        return documentsCopy;
    }
  }

  private sortByName(documents: Document[]): Document[] {
    return documents.sort((a, b) =>
      a.Title.localeCompare(b.Title, undefined, { sensitivity: "base" })
    );
  }

  private sortByVersion(documents: Document[]): Document[] {
    return documents.sort((a, b) => this.compareVersions(a.Version, b.Version));
  }

  private sortByCreatedDate(documents: Document[]): Document[] {
    return documents.sort(
      (a, b) =>
        new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime()
    );
  }

  public getAvailableSortOptions(): Array<{ value: SortField; label: string }> {
    return [
      { value: "", label: "Select one..." },
      { value: "name", label: "Name" },
      { value: "version", label: "Version" },
      { value: "created", label: "Created Date" },
    ];
  }

  private compareVersions(a: string, b: string): number {
    const versionA = this.parseVersion(a);
    const versionB = this.parseVersion(b);

    for (let i = 0; i < Math.max(versionA.length, versionB.length); i++) {
      const partA = versionA[i] || 0;
      const partB = versionB[i] || 0;

      if (partA !== partB) {
        return partA - partB;
      }
    }

    return 0;
  }

  private parseVersion(version: string): number[] {
    return version.split(".").map((num) => parseInt(num, 10) || 0);
  }
}

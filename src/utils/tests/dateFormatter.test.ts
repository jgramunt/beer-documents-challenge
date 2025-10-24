import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getRelativeDays } from "../dateFormatter.js";

describe("dateFormatter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Set a fixed date for consistent testing: January 15, 2024
    vi.setSystemTime(new Date("2024-01-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getRelativeDays", () => {
    it('should return "today" for same day', () => {
      const today = new Date("2024-01-15T08:30:00Z"); // Same day, different time
      expect(getRelativeDays(today)).toBe("today");
    });

    it('should return "today" for current date string', () => {
      expect(getRelativeDays("2024-01-15")).toBe("today");
    });

    it('should return "today" for current timestamp', () => {
      const todayTimestamp = new Date("2024-01-15T12:00:00Z").getTime();
      expect(getRelativeDays(todayTimestamp)).toBe("today");
    });

    it('should return "1 day ago" for yesterday', () => {
      const yesterday = new Date("2024-01-14T12:00:00Z");
      expect(getRelativeDays(yesterday)).toBe("1 day ago");
    });

    it("should return correct days ago for recent dates", () => {
      expect(getRelativeDays("2024-01-13")).toBe("2 days ago");
      expect(getRelativeDays("2024-01-10")).toBe("5 days ago");
      expect(getRelativeDays("2024-01-01")).toBe("14 days ago");
    });

    it("should handle dates up to 29 days ago", () => {
      const date29DaysAgo = new Date("2024-01-15");
      date29DaysAgo.setDate(date29DaysAgo.getDate() - 29);
      expect(getRelativeDays(date29DaysAgo)).toBe("29 days ago");
    });

    it("should return months for dates 30+ days ago", () => {
      // 2 months ago (approximately 60 days)
      const twoMonthsAgo = new Date("2023-11-15");
      expect(getRelativeDays(twoMonthsAgo)).toBe("2 months ago");
    });

    it('should return "1 month ago" for singular month', () => {
      // Exactly 30 days ago should now give us "1 month ago"
      const oneMonthAgo = new Date("2023-12-16"); // 30 days from Jan 15
      expect(getRelativeDays(oneMonthAgo)).toBe("1 month ago");
    });

    it("should handle multiple months correctly", () => {
      const sixMonthsAgo = new Date("2023-07-15");
      expect(getRelativeDays(sixMonthsAgo)).toBe("6 months ago");
    });

    it("should return years for very old dates", () => {
      const twoYearsAgo = new Date("2022-01-15");
      expect(getRelativeDays(twoYearsAgo)).toBe("2 years ago");
    });

    it('should return "1 year ago" for exactly 24+ months', () => {
      const longAgo = new Date("2021-12-15"); // More than 24 months ago
      expect(getRelativeDays(longAgo)).toBe("2 years ago");
    });

    it('should return "1 year ago" for singular year', () => {
      const oneYearAgo = new Date("2023-01-15");
      // January 15, 2023 to January 15, 2024 is exactly 365 days = 1 year
      expect(getRelativeDays(oneYearAgo)).toBe("1 year ago");
    });

    it("should handle edge case at month boundary", () => {
      // Test exactly 2 months (60 days)
      const exactlyTwoMonths = new Date("2023-11-16"); // 60 days ago
      expect(getRelativeDays(exactlyTwoMonths)).toBe("2 months ago");
    });

    it("should handle edge case at year boundary", () => {
      // Test at year boundary - anything >= 365 days becomes years
      const almostOneYear = new Date("2023-02-15"); // ~11 months ago (334 days)
      expect(getRelativeDays(almostOneYear)).toBe("11 months ago");

      const twoYears = new Date("2022-01-15"); // 730 days = 2 years ago
      expect(getRelativeDays(twoYears)).toBe("2 years ago");
    });

    it("should handle string date inputs", () => {
      expect(getRelativeDays("2024-01-14")).toBe("1 day ago");
      expect(getRelativeDays("2023-12-16")).toBe("1 month ago"); // 30 days
      expect(getRelativeDays("2023-01-15")).toBe("1 year ago"); // 365 days
    });

    it("should handle timestamp inputs", () => {
      const yesterday = new Date("2024-01-14").getTime();
      const lastMonth = new Date("2023-12-16").getTime(); // 30 days
      const lastYear = new Date("2023-01-15").getTime(); // 365 days

      expect(getRelativeDays(yesterday)).toBe("1 day ago");
      expect(getRelativeDays(lastMonth)).toBe("1 month ago");
      expect(getRelativeDays(lastYear)).toBe("1 year ago");
    });

    it("should handle future dates by returning empty string", () => {
      const tomorrow = new Date("2024-01-16");
      expect(getRelativeDays(tomorrow)).toBe("");

      const nextWeek = new Date("2024-01-22");
      expect(getRelativeDays(nextWeek)).toBe("");
    });

    it("should handle invalid dates gracefully", () => {
      // This might return unexpected results but shouldn't crash
      const result = getRelativeDays("invalid-date");
      expect(typeof result).toBe("string");
    });

    it("should handle different time zones consistently", () => {
      // Test with different times of day on same date
      const morning = new Date("2024-01-15T06:00:00Z");
      const evening = new Date("2024-01-15T22:00:00Z");

      expect(getRelativeDays(morning)).toBe("today");
      expect(getRelativeDays(evening)).toBe("today");
    });

    describe("boundary conditions", () => {
      it("should handle leap year correctly", () => {
        vi.setSystemTime(new Date("2024-03-01T12:00:00Z")); // 2024 is a leap year
        const feb29 = new Date("2024-02-29");
        expect(getRelativeDays(feb29)).toBe("1 day ago");
      });

      it("should handle year transitions", () => {
        vi.setSystemTime(new Date("2024-01-01T12:00:00Z"));
        const lastYear = new Date("2023-12-31");
        expect(getRelativeDays(lastYear)).toBe("1 day ago");
      });

      it("should handle month transitions", () => {
        vi.setSystemTime(new Date("2024-02-01T12:00:00Z"));
        const lastMonth = new Date("2024-01-31");
        expect(getRelativeDays(lastMonth)).toBe("1 day ago");
      });
    });
  });
});

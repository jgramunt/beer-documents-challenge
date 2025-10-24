import { describe, it, expect } from "vitest";
import { escapeHtml } from "../htmlEscaping.js";

describe("htmlEscaping", () => {
  describe("escapeHtml", () => {
    it("should escape basic HTML characters", () => {
      const input = '<script>alert("hello")</script>';
      const result = escapeHtml(input);
      expect(result).toBe('&lt;script&gt;alert("hello")&lt;/script&gt;');
    });

    it("should escape ampersands", () => {
      const input = "Company & Co";
      const result = escapeHtml(input);
      expect(result).toBe("Company &amp; Co");
    });

    it("should escape quotes", () => {
      const input = "Say \"hello\" to 'world'";
      const result = escapeHtml(input);
      expect(result).toBe("Say \"hello\" to 'world'");
    });

    it("should handle empty string", () => {
      const result = escapeHtml("");
      expect(result).toBe("");
    });

    it("should handle plain text without HTML", () => {
      const input = "Just plain text";
      const result = escapeHtml(input);
      expect(result).toBe("Just plain text");
    });

    it("should handle complex HTML with multiple elements", () => {
      const input = '<div class="test">Hello <span>world</span></div>';
      const result = escapeHtml(input);
      expect(result).toBe(
        '&lt;div class="test"&gt;Hello &lt;span&gt;world&lt;/span&gt;&lt;/div&gt;'
      );
    });

    it("should handle special characters", () => {
      const input = "Special: @#$%^*()_+-=[]{}|;:,.<>?";
      const result = escapeHtml(input);
      // < and > should be escaped, other special characters should remain unchanged
      expect(result).toBe("Special: @#$%^*()_+-=[]{}|;:,.&lt;&gt;?");
    });
  });
});

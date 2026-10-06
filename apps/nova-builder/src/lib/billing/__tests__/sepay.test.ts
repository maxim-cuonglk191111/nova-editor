import { describe, it, expect } from "vitest";
import { paymentCode, contentHasCode, orderCodeFromContent } from "../sepay";

describe("SePay payment code matching", () => {
  it("builds the transfer description from the order code", () => {
    expect(paymentCode(1791234567)).toBe("NOVA1791234567");
  });

  it("matches descriptions that banks reformat", () => {
    const code = paymentCode(1791234567);
    expect(contentHasCode("NOVA1791234567", code)).toBe(true);
    expect(contentHasCode("MBVCB.123.nova 1791234567.CT tu 0123", code)).toBe(true);
    expect(contentHasCode("NOVA179123456", code)).toBe(false);
  });

  it("extracts the order code from a webhook description", () => {
    expect(orderCodeFromContent("CT DEN:0123 nova1791234567 chuyen tien")).toBe("1791234567");
    expect(orderCodeFromContent("chuyen tien an trua")).toBeNull();
  });
});

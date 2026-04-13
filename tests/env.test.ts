import { describe, expect, it } from "vitest";
import { parseCcEmails } from "@/lib/env";

describe("cc parsing", () => {
  it("splits comma separated emails", () => {
    const emails = parseCcEmails("purepest.ut@gmail.com, purepest.id@mail.com");
    expect(emails).toEqual(["purepest.ut@gmail.com", "purepest.id@mail.com"]);
  });

  it("drops empty entries", () => {
    const emails = parseCcEmails("a@example.com, , b@example.com");
    expect(emails).toEqual(["a@example.com", "b@example.com"]);
  });
});

import { describe, expect, it } from "vitest";
import { getRequiredFormsByWorkerType } from "@/lib/forms";

describe("required forms by worker type", () => {
  it("returns W9 and Direct Deposit for 1099", () => {
    const forms = getRequiredFormsByWorkerType("1099").map((form) => form.id);
    expect(forms).toEqual(["w9", "direct_deposit"]);
  });

  it("returns W4, I9 and Direct Deposit for W2", () => {
    const forms = getRequiredFormsByWorkerType("w2").map((form) => form.id);
    expect(forms).toEqual(["w4", "i9", "direct_deposit"]);
  });
});

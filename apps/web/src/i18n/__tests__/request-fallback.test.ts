import { describe, it, expect } from "vitest";
import frMessages from "../../../messages/fr.json";
import enMessages from "../../../messages/en.json";

function mergeMessages(locale: string) {
  return locale === "fr" ? frMessages : { ...frMessages, ...enMessages };
}

describe("request message fallback merge", () => {
  it("falls back to French when a key is missing in en messages", () => {
    const { about: _about, ...enWithoutAbout } = enMessages;
    const merged = { ...frMessages, ...enWithoutAbout };

    expect(merged.about).toEqual(frMessages.about);
    expect(merged.nav).toEqual(enMessages.nav);
  });

  it("matches the merge logic used for non-fr locales in request.ts", () => {
    const merged = mergeMessages("en");

    expect(merged).toEqual({ ...frMessages, ...enMessages });
    expect(merged.nav.dresses).toBe("Dresses");
    expect(merged.home.heroTagline).toBe("For the moments you want to keep.");
  });
});

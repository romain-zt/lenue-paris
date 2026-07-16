import { describe, expect, it } from "vitest";
import type { UIMessage } from "ai";
import {
  classifyRequestIntent,
  classifyTriage,
  formatTriageBlock,
  parseTriageBlock,
  parseTriageHeader,
  serializeTriageHeader,
} from "../aiTriage";

function userMessage(text: string): UIMessage {
  return {
    id: "u1",
    role: "user",
    parts: [{ type: "text", text }],
  };
}

describe("classifyTriage", () => {
  it("returns null for factual read-only questions", () => {
    expect(
      classifyTriage([userMessage("Combien de produits sont en stock ?")]),
    ).toBeNull();
  });

  it("classifies content patch on home page", () => {
    const triage = classifyTriage([
      userMessage("Change le titre de la page d'accueil en TEST"),
    ]);
    expect(triage?.category).toBe("Contenu");
    expect(triage?.requires).toMatch(/site-settings|home|patch_field/i);
  });

  it("classifies dev location questions", () => {
    const triage = classifyTriage([
      userMessage("Où est définie la collection users dans le code ?"),
    ]);
    expect(triage?.category).toBe("Développement");
    expect(triage?.requires).toMatch(/search_code/i);
  });

  it("flags ambiguous when dev and content signals overlap", () => {
    const triage = classifyTriage([
      userMessage(
        "Modifie le composant React du hero et change le titre de la page d'accueil",
      ),
    ]);
    expect(triage?.category).toBe("Ambigu");
  });

  it("uses document context for content edits", () => {
    const triage = classifyTriage([userMessage("Modifie le prix")], {
      type: "collection",
      collection: "products",
      id: "42",
    });
    expect(triage?.category).toBe("Contenu");
    expect(triage?.requires).toMatch(/products/);
  });
});

describe("classifyRequestIntent", () => {
  it("routes dev triage to developpement model", () => {
    expect(
      classifyRequestIntent([
        userMessage("Crée un nouveau bloc Payload pour une galerie"),
      ]),
    ).toBe("developpement");
  });
});

describe("triage formatting", () => {
  it("round-trips format and parse", () => {
    const triage = {
      category: "Contenu" as const,
      todo: "Mettre à jour le titre",
      requires: "patch_field sur pages",
    };
    const block = formatTriageBlock(triage);
    expect(parseTriageBlock(block)).toEqual(triage);
  });

  it("parses triage header JSON (base64, Unicode-safe)", () => {
    const triage = {
      category: "Développement" as const,
      todo: "Plan code — avec tiret cadratin",
      requires: "search_code",
    };
    const encoded = serializeTriageHeader(triage);
    expect(encoded).not.toMatch(/[^\x20-\x7E]/);
    expect(parseTriageHeader(encoded)).toEqual(triage);
  });
});

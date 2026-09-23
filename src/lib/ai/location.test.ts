import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { describe, expect, it } from "vitest";
import { LocationSummarySchema, toLocationNote } from "./location";

const sample = {
  summary: "Pokojné mestečko.",
  infrastructure: "Obchody a lekáreň celý rok.",
  accessibility: "Letisko Janov 80 km.",
  climate_risks: "Horúce letá.",
  groundwater_risks: "Nízke riziko pri pobreží.",
  highlights: ["Piesočná pláž", "Historické centrum"],
};

describe("location summary", () => {
  it("builds a JSON-schema output format that parses the model's answer", () => {
    const format = zodOutputFormat(LocationSummarySchema);
    expect(format.type).toBe("json_schema");
    expect(JSON.stringify(format.schema)).toContain("ISPRA IdroGEO");
    expect(format.parse(JSON.stringify(sample))).toEqual(sample);
  });

  it("maps the answer onto location_notes columns", () => {
    const note = toLocationNote("Alassio", "Liguria", sample);
    expect(note).toEqual({
      city: "Alassio",
      region: "Liguria",
      ai_summary: "Pokojné mestečko.\n\n• Piesočná pláž\n• Historické centrum",
      infrastructure_notes: "Obchody a lekáreň celý rok.\n\nDostupnosť: Letisko Janov 80 km.",
      climate_risk_notes: "Horúce letá.",
      groundwater_risk_notes: "Nízke riziko pri pobreží.",
    });
  });
});

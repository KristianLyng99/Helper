import React, { useState } from "react";

// Types for parsed data
type ParsedDates = {
  sykdato?: string;
  maksdato?: string;
  aapStart?: string;
  aapTil?: string;
  uføretrygdFra?: string;
  uføretrygdTil?: string;
};

function parseRawData(raw: string): ParsedDates {
  function extractDateAfter(key: string, text: string): string | undefined {
    const regex = new RegExp(key + "[:]?\\s*(\\d{2}\\.\\d{2}\\.\\d{4})", "i");
    const match = text.match(regex);
    return match ? match[1] : undefined;
  }

  const sykdato = extractDateAfter("Første sykedag", raw);

  // AAP table parsing
  const aapSectionMatch = raw.match(/Vedtak ID([\s\S]*?)(?:Meldekort|Uføretrygd|$)/i);
  let aapRows: string[] = [];
  if (aapSectionMatch) {
    aapRows = aapSectionMatch[1]
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => /^\d{8}/.test(l));
  }

  const aapEntries = aapRows.map((row) => {
    const cols = row.split(/\s+/);
    return {
      id: cols[0],
      fra: cols[1],
      til: cols[2],
      vedtakVariant: cols[7]?.toLowerCase(),
      vedtak: cols.slice(8).join(" "),
    };
  });

  const aapStartRow = aapEntries.find(
    (e) => e.vedtakVariant && e.vedtakVariant.includes("innvilgelse")
  );
  const aapStart = aapStartRow?.fra;

  let maksdato: string | undefined = undefined;
  if (aapStart) {
    const [d, m, y] = aapStart.split(".");
    const dt = new Date(+y, +m - 1, +d);
    dt.setDate(dt.getDate() - 1);
    maksdato = dt
      .toLocaleDateString("nb-NO", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      .replace(/\//g, ".");
  }

  let aapTil: string | undefined = undefined;
  if (aapEntries.length) {
    aapTil = aapEntries.reduce((latest, curr) => {
      if (
        !latest ||
        new Date(curr.til.split(".").reverse().join("-")) >
          new Date(latest.split(".").reverse().join("-"))
      ) {
        return curr.til;
      }
      return latest;
    }, undefined as string | undefined);
  }

  // Uføretrygd: section with from/to dates (not present in your example, but supports future data)
  let uføretrygdFra: string | undefined;
  let uføretrygdTil: string | undefined;
  const uføreSection = raw.match(/Uføretrygd([\s\S]*)/i);
  if (uføreSection && !/Ingen uføretrygd data\./i.test(uføreSection[1])) {
    const from = extractDateAfter("Fra", uføreSection[1]);
    const to = extractDateAfter("Til", uføreSection[1]);
    if (from && to) {
      uføretrygdFra = from;
      uføretrygdTil = to;
    }
  }

  return { sykdato, maksdato, aapStart, aapTil, uføretrygdFra, uføretrygdTil };
}

const keyLabels: Record<keyof ParsedDates, string> = {
  sykdato: "Sykdato",
  maksdato: "Maks dato",
  aapStart: "AAP start",
  aapTil: "AAP til",
  uføretrygdFra: "Uføretrygd fra",
  uføretrygdTil: "Uføretrygd til",
};

export default function CaseworkerHelper() {
  const [raw, setRaw] = useState("");
  const [parsed, setParsed] = useState<ParsedDates | null>(null);

  const handleParse = () => {
    setParsed(parseRawData(raw));
  };

  return (
    <div style={{ maxWidth: 700, margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h1>Caseworker Helper</h1>
      <p>
        Lim inn rådata fra systemet. Trykk på <b>Trekk ut viktige datoer</b> for å få oversikt.
      </p>
      <textarea
        rows={14}
        style={{ width: "100%", fontFamily: "monospace", fontSize: 16 }}
        placeholder="Lim inn rådata her..."
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
      />
      <div style={{ marginTop: 12 }}>
        <button onClick={handleParse} style={{ fontSize: 16, padding: "6px 18px" }}>
          Trekk ut viktige datoer
        </button>
      </div>
      {parsed && (
        <div style={{ marginTop: 32 }}>
          <h2>Viktige datoer</h2>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <tbody>
              {Object.entries(parsed).map(
                ([key, value]) =>
                  value && (
                    <tr key={key}>
                      <td style={{ fontWeight: "bold", border: "1px solid #ccc", padding: 6 }}>
                        {keyLabels[key as keyof ParsedDates]}
                      </td>
                      <td style={{ border: "1px solid #ccc", padding: 6 }}>{value}</td>
                    </tr>
                  )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

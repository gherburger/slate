export type ParsedBulkRow = {
  rowNumber: number;
  rawDate: string;
  rawSpend: string;
  date: string | null;
  amountCents: number | null;
  error: string | null;
};

function parseDelimitedRow(line: string, delimiter: "," | "\t") {
  const out: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];

    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === delimiter && !inQuotes) {
      out.push(current.trim());
      current = "";
      continue;
    }

    current += ch;
  }

  out.push(current.trim());
  return out;
}

function normalizeDateValue(input: string) {
  const trimmed = input.trim();
  if (!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    return { ok: false as const, error: "Date must be MM/DD/YYYY" };
  }

  const [mmRaw, ddRaw, yyyyRaw] = trimmed.split("/");
  const mm = Number(mmRaw);
  const dd = Number(ddRaw);
  const yyyy = Number(yyyyRaw);

  if (!Number.isInteger(mm) || mm < 1 || mm > 12) {
    return { ok: false as const, error: "Month must be 01-12" };
  }

  const maxDay = new Date(yyyy, mm, 0).getDate();
  if (!Number.isInteger(dd) || dd < 1 || dd > maxDay) {
    return { ok: false as const, error: "Invalid day for month" };
  }

  const normalized = `${String(mm).padStart(2, "0")}/${String(dd).padStart(2, "0")}/${yyyy}`;
  return { ok: true as const, value: normalized };
}

function parseAmountCents(input: string) {
  const cleaned = input.replace(/[$,\s]/g, "").trim();
  if (!cleaned) {
    return { ok: false as const, error: "Spend is required" };
  }

  if (!/^-?\d*(\.\d+)?$/.test(cleaned)) {
    return { ok: false as const, error: "Spend must be numeric" };
  }

  const number = Number(cleaned);
  if (!Number.isFinite(number)) {
    return { ok: false as const, error: "Spend must be numeric" };
  }

  return { ok: true as const, value: Math.round(number * 100) };
}

function isHeaderRow(fields: string[]) {
  if (fields.length !== 2) return false;
  const first = fields[0].trim().toLowerCase();
  const second = fields[1].trim().toLowerCase();
  return first === "date" && second === "spend";
}

export function parseBulkRow(
  rowNumber: number,
  rawDateInput: string,
  rawSpendInput: string,
): ParsedBulkRow {
  const rawDate = rawDateInput.trim();
  const rawSpend = rawSpendInput.trim();

  const dateResult = normalizeDateValue(rawDate);
  if (!dateResult.ok) {
    return {
      rowNumber,
      rawDate,
      rawSpend,
      date: null,
      amountCents: null,
      error: dateResult.error,
    };
  }

  const amountResult = parseAmountCents(rawSpend);
  if (!amountResult.ok) {
    return {
      rowNumber,
      rawDate,
      rawSpend,
      date: dateResult.value,
      amountCents: null,
      error: amountResult.error,
    };
  }

  return {
    rowNumber,
    rawDate,
    rawSpend,
    date: dateResult.value,
    amountCents: amountResult.value,
    error: null,
  };
}

export function parseBulkPaste(raw: string) {
  const lines = raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return { rows: [] as ParsedBulkRow[] };
  }

  const first = lines[0];
  const delimiter: "," | "\t" = first.includes("\t") ? "\t" : ",";

  const firstFields = parseDelimitedRow(first, delimiter);
  const hasHeader = isHeaderRow(firstFields);
  const dataLines = hasHeader ? lines.slice(1) : lines;

  const rows: ParsedBulkRow[] = dataLines.map((line, index) => {
    const fields = parseDelimitedRow(line, delimiter);
    const rowNumber = hasHeader ? index + 2 : index + 1;

    if (fields.length !== 2) {
      return {
        rowNumber,
        rawDate: fields[0] ?? "",
        rawSpend: fields[1] ?? "",
        date: null,
        amountCents: null,
        error: "Expected exactly 2 columns: Date, Spend",
      };
    }

    const rawDate = fields[0] ?? "";
    const rawSpend = fields[1] ?? "";
    return parseBulkRow(rowNumber, rawDate, rawSpend);
  });

  return { rows };
}

export function formatAmountFromCents(amountCents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amountCents / 100);
}

import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

type TableKey = "paymentTypes" | "locations" | "vehicleTypes" | "documentTypes";
type CodeType = "string" | "number";
type TableFormat = "hash" | "csv";

interface TableConfig {
	key: TableKey;
	fileName: string;
	codeType: CodeType;
	format: TableFormat;
	codeHeaders?: string[];
	valueHeaders?: string[];
	activeUntilHeaders?: string[];
	activeRowsOnly?: boolean;
}

interface TableDownloadConfig {
	key: TableKey;
	id: number;
	portalName: string;
	fileName: string;
	url: string;
}

interface GeneratedTables {
	paymentTypes: Record<string, string>;
	locations: Record<string, number>;
	vehicleTypes: Record<string, string>;
	documentTypes: Record<string, string>;
}

interface TableSourceMetadata {
	fileName: string;
	lastModifiedAt: string;
	entries: number;
}

interface GeneratedMetadata {
	generatedAt: string;
	tablesLastUpdatedAt: string;
	sourceDirectory: string;
	sources: Record<TableKey, TableSourceMetadata>;
}

const TABLE_CONFIGS: TableConfig[] = [
	{
		key: "paymentTypes",
		fileName: "TIPO_PAGAMENTO.csv",
		codeType: "string",
		format: "csv",
		codeHeaders: ["id", "codice"],
		valueHeaders: ["descrizione"],
	},
	{
		key: "locations",
		fileName: "LUOGHI.csv",
		codeType: "number",
		format: "csv",
		codeHeaders: ["codice", "id"],
		valueHeaders: ["descrizione"],
		activeUntilHeaders: ["datafineval"],
		activeRowsOnly: true,
	},
	{
		key: "vehicleTypes",
		fileName: "TIPO_VEICOLO.csv",
		codeType: "string",
		format: "csv",
		codeHeaders: ["id", "codice"],
		valueHeaders: ["descrizione"],
	},
	{
		key: "documentTypes",
		fileName: "TIPO_DOCUMENTO.csv",
		codeType: "string",
		format: "csv",
		codeHeaders: ["codice", "id"],
		valueHeaders: ["descrizione"],
	},
];

const ISSUE_URL =
	"https://github.com/Loa212/cargos-sdk/issues/new?title=Update%20bundled%20CARGOS%20tables";
const CARGOS_DOWNLOAD_BASE_URL =
	"https://cargos.poliziadistato.it/Cargos_Portale/ashx/Download.ashx";

const TABLE_DOWNLOADS: TableDownloadConfig[] = [
	{
		key: "locations",
		id: 2,
		portalName: "LUOGHI",
		fileName: "LUOGHI.csv",
		url: `${CARGOS_DOWNLOAD_BASE_URL}?ID=2&N=LUOGHI`,
	},
	{
		key: "documentTypes",
		id: 10,
		portalName: "TIPO_DOCUMENTO",
		fileName: "TIPO_DOCUMENTO.csv",
		url: `${CARGOS_DOWNLOAD_BASE_URL}?ID=10&N=TIPO_DOCUMENTO`,
	},
	{
		key: "paymentTypes",
		id: 11,
		portalName: "TIPO_PAGAMENTO",
		fileName: "TIPO_PAGAMENTO.csv",
		url: `${CARGOS_DOWNLOAD_BASE_URL}?ID=11&N=TIPO_PAGAMENTO`,
	},
	{
		key: "vehicleTypes",
		id: 9,
		portalName: "TIPO_VEICOLO",
		fileName: "TIPO_VEICOLO.csv",
		url: `${CARGOS_DOWNLOAD_BASE_URL}?ID=9&N=TIPO_VEICOLO`,
	},
];

function normalizeLine(line: string): string {
	return line.replace(/^\uFEFF/, "").trim();
}

function parseTableCsv(
	rawCsv: string,
	codeType: CodeType,
): Record<string, string | number> {
	const rows = rawCsv.split(/\r?\n/);
	const output: Record<string, string | number> = {};

	for (const rawLine of rows) {
		const line = normalizeLine(rawLine);
		if (!line || !line.includes("#")) {
			continue;
		}

		const [rawCode, ...rawValueParts] = line.split("#");
		const code = rawCode?.trim() ?? "";
		const value = rawValueParts.join("#").trim();

		if (!code || !value) {
			continue;
		}

		if (codeType === "number") {
			const numericCode = Number(code);
			if (!Number.isInteger(numericCode)) {
				continue;
			}
			output[value] = numericCode;
			continue;
		}

		output[value] = code;
	}

	return Object.fromEntries(
		Object.entries(output).sort(([left], [right]) =>
			left.localeCompare(right, "it", { sensitivity: "base" }),
		),
	);
}

function parseCsvRow(row: string): string[] {
	const result: string[] = [];
	let current = "";
	let inQuotes = false;

	for (let i = 0; i < row.length; i++) {
		const char = row[i];
		if (char === '"') {
			const nextChar = row[i + 1];
			if (inQuotes && nextChar === '"') {
				current += '"';
				i++;
				continue;
			}
			inQuotes = !inQuotes;
			continue;
		}

		if (char === "," && !inQuotes) {
			result.push(current.trim());
			current = "";
			continue;
		}

		current += char;
	}

	result.push(current.trim());
	return result;
}

function normalizeHeader(header: string): string {
	return header.replace(/^\uFEFF/, "").trim().toLowerCase();
}

function findHeaderIndex(headers: string[], acceptedHeaders: string[]): number {
	const accepted = new Set(acceptedHeaders.map((header) => header.toLowerCase()));
	return headers.findIndex((header) => accepted.has(header));
}

function parseTableFromCsvWithHeaders(
	rawCsv: string,
	config: TableConfig,
): Record<string, string | number> {
	const rows = rawCsv
		.split(/\r?\n/)
		.map((row) => row.trim())
		.filter((row) => row.length > 0);
	if (rows.length === 0) {
		return {};
	}

	const headers = parseCsvRow(rows[0] ?? "").map(normalizeHeader);
	const codeIndex = findHeaderIndex(headers, config.codeHeaders ?? []);
	const valueIndex = findHeaderIndex(headers, config.valueHeaders ?? []);
	const activeUntilIndex =
		config.activeRowsOnly && config.activeUntilHeaders
			? findHeaderIndex(headers, config.activeUntilHeaders)
			: -1;

	if (codeIndex === -1 || valueIndex === -1) {
		const fileHeaders = headers.join(", ");
		throw new Error(
			`Unable to find required CSV headers for ${config.fileName}. Found: ${fileHeaders}`,
		);
	}

	const output: Record<string, string | number> = {};

	for (const row of rows.slice(1)) {
		const values = parseCsvRow(row);
		const code = values[codeIndex]?.trim() ?? "";
		const value = values[valueIndex]?.trim() ?? "";

		if (!code || !value) {
			continue;
		}

		if (activeUntilIndex !== -1) {
			const activeUntilValue = values[activeUntilIndex]?.trim() ?? "";
			if (activeUntilValue.length > 0) {
				continue;
			}
		}

		if (config.codeType === "number") {
			const numericCode = Number(code);
			if (!Number.isInteger(numericCode)) {
				continue;
			}
			output[value] = numericCode;
			continue;
		}

		output[value] = code;
	}

	return Object.fromEntries(
		Object.entries(output).sort(([left], [right]) =>
			left.localeCompare(right, "it", { sensitivity: "base" }),
		),
	);
}

function parseTable(rawCsv: string, config: TableConfig): Record<string, string | number> {
	if (config.format === "hash") {
		return parseTableCsv(rawCsv, config.codeType);
	}

	return parseTableFromCsvWithHeaders(rawCsv, config);
}

function getArgValue(flag: string): string | undefined {
	const index = process.argv.indexOf(flag);
	if (index === -1) {
		return undefined;
	}

	return process.argv[index + 1];
}

function hasFlag(flag: string): boolean {
	return process.argv.includes(flag);
}

function toRelative(projectRoot: string, targetPath: string): string {
	const relativePath = path.relative(projectRoot, targetPath);
	return relativePath === "" ? "." : relativePath;
}

function buildLastUpdatedMarkdown(metadata: GeneratedMetadata): string {
	const lines = [
		"# Bundled CARGOS Tables: Last Updated",
		"",
		"This file is auto-generated by `scripts/parse-tables.ts`.",
		"",
		`- Tables last updated at: \`${metadata.tablesLastUpdatedAt}\``,
		`- Snapshot generated at: \`${metadata.generatedAt}\``,
		`- Source directory: \`${metadata.sourceDirectory}\``,
		"",
		"## Source Files",
		"",
	];

	for (const config of TABLE_CONFIGS) {
		const source = metadata.sources[config.key];
		lines.push(
			`- \`${source.fileName}\`: ${source.entries} entries (last modified: \`${source.lastModifiedAt}\`)`,
		);
	}

	lines.push("");
	lines.push(
		`If this snapshot is outdated, please [open an issue](${ISSUE_URL}).`,
	);
	lines.push("");

	return lines.join("\n");
}

async function downloadTables(inputDir: string): Promise<void> {
	await mkdir(inputDir, { recursive: true });

	for (const table of TABLE_DOWNLOADS) {
		console.log(
			`Downloading ${table.portalName} (ID=${table.id}) -> ${table.fileName}`,
		);

		const response = await fetch(table.url, {
			headers: {
				"User-Agent": "cargos-sdk-table-downloader/1.0",
			},
		});

		if (!response.ok) {
			throw new Error(
				`Failed to download ${table.portalName}: ${response.status} ${response.statusText}`,
			);
		}

		const content = await response.text();
		const outputPath = path.join(inputDir, table.fileName);
		await writeFile(outputPath, content, "utf-8");
	}
}

async function main(): Promise<void> {
	const scriptDir = path.dirname(fileURLToPath(import.meta.url));
	const projectRoot = path.resolve(scriptDir, "..");
	const shouldDownload = hasFlag("--download") || hasFlag("--download-only");
	const shouldDownloadOnly = hasFlag("--download-only");
	const customInputDir = getArgValue("--input-dir");
	const inputDir = customInputDir
		? path.resolve(process.cwd(), customInputDir)
		: path.join(projectRoot, "scripts", "tables-csv");
	const outputDir = path.resolve(projectRoot, "src", "data");
	const tablesOutputPath = path.join(outputDir, "tables.json");
	const metadataOutputPath = path.join(outputDir, "tables-last-updated.json");
	const markdownOutputPath = path.join(projectRoot, "TABLES_LAST_UPDATED.md");

	if (shouldDownload) {
		await downloadTables(inputDir);
		console.log(`Downloaded tables to ${toRelative(projectRoot, inputDir)}`);
	}

	if (shouldDownloadOnly) {
		return;
	}

	const generatedAt = new Date().toISOString();

	const generatedTables: GeneratedTables = {
		paymentTypes: {},
		locations: {},
		vehicleTypes: {},
		documentTypes: {},
	};

	const sourceMetadata = {} as Record<TableKey, TableSourceMetadata>;
	const sourceDates: number[] = [];

	for (const config of TABLE_CONFIGS) {
		const filePath = path.join(inputDir, config.fileName);
		const [fileContent, fileStat] = await Promise.all([
			readFile(filePath, "utf-8"),
			stat(filePath),
		]);

		const parsed = parseTable(fileContent, config);
		const typedParsed =
			config.key === "locations"
				? (parsed as Record<string, number>)
				: (parsed as Record<string, string>);

		if (config.key === "locations") {
			generatedTables.locations = typedParsed as Record<string, number>;
		} else if (config.key === "paymentTypes") {
			generatedTables.paymentTypes = typedParsed as Record<string, string>;
		} else if (config.key === "vehicleTypes") {
			generatedTables.vehicleTypes = typedParsed as Record<string, string>;
		} else {
			generatedTables.documentTypes = typedParsed as Record<string, string>;
		}

		sourceMetadata[config.key] = {
			fileName: config.fileName,
			lastModifiedAt: fileStat.mtime.toISOString(),
			entries: Object.keys(parsed).length,
		};
		sourceDates.push(fileStat.mtimeMs);
	}

	const tablesLastUpdatedAt = new Date(Math.max(...sourceDates)).toISOString();
	const metadata: GeneratedMetadata = {
		generatedAt,
		tablesLastUpdatedAt,
		sourceDirectory: toRelative(projectRoot, inputDir),
		sources: sourceMetadata,
	};

	await mkdir(outputDir, { recursive: true });
	await Promise.all([
		writeFile(
			tablesOutputPath,
			`${JSON.stringify(generatedTables, null, "\t")}\n`,
		),
		writeFile(metadataOutputPath, `${JSON.stringify(metadata, null, "\t")}\n`),
		writeFile(markdownOutputPath, buildLastUpdatedMarkdown(metadata)),
	]);

	console.log(`Generated ${toRelative(projectRoot, tablesOutputPath)}`);
	console.log(`Generated ${toRelative(projectRoot, metadataOutputPath)}`);
	console.log(`Generated ${toRelative(projectRoot, markdownOutputPath)}`);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});

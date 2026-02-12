import tablesData from "./data/tables.json";
import tablesLastUpdatedData from "./data/tables-last-updated.json";

type TableCode = string | number;
type StaticTableMap<T extends TableCode> = Record<string, T>;

export interface BundledTables {
	paymentTypes: StaticTableMap<string>;
	locations: StaticTableMap<number>;
	vehicleTypes: StaticTableMap<string>;
	documentTypes: StaticTableMap<string>;
}

export interface BundledTablesSourceMetadata {
	fileName: string;
	lastModifiedAt: string;
	entries: number;
}

export interface BundledTablesMetadata {
	generatedAt: string;
	tablesLastUpdatedAt: string;
	sourceDirectory: string;
	sources: Record<keyof BundledTables, BundledTablesSourceMetadata>;
}

const bundledTables = tablesData as BundledTables;

export const PAYMENT_TYPES = bundledTables.paymentTypes;
export const LOCATIONS = bundledTables.locations;
export const VEHICLE_TYPES = bundledTables.vehicleTypes;
export const DOCUMENT_TYPES = bundledTables.documentTypes;

export const BUNDLED_TABLES_METADATA =
	tablesLastUpdatedData as BundledTablesMetadata;
export const TABLES_LAST_UPDATED_AT =
	BUNDLED_TABLES_METADATA.tablesLastUpdatedAt;
export const TABLES_GENERATED_AT = BUNDLED_TABLES_METADATA.generatedAt;

function normalizeTableLabel(label: string): string {
	return label.trim().toLowerCase();
}

function createNameToCodeIndex<T extends TableCode>(
	table: StaticTableMap<T>,
): Record<string, T> {
	const index: Record<string, T> = {};

	for (const [label, code] of Object.entries(table)) {
		index[normalizeTableLabel(label)] = code;
	}

	return index;
}

function createCodeToNameIndex<T extends TableCode>(
	table: StaticTableMap<T>,
): Map<string, string> {
	const index = new Map<string, string>();

	for (const [label, code] of Object.entries(table)) {
		index.set(String(code), label);
	}

	return index;
}

const locationCodeByLabel = createNameToCodeIndex(LOCATIONS);
const locationLabelByCode = createCodeToNameIndex(LOCATIONS);
const paymentTypeCodeByLabel = createNameToCodeIndex(PAYMENT_TYPES);
const paymentTypeLabelByCode = createCodeToNameIndex(PAYMENT_TYPES);
const vehicleTypeCodeByLabel = createNameToCodeIndex(VEHICLE_TYPES);
const vehicleTypeLabelByCode = createCodeToNameIndex(VEHICLE_TYPES);
const documentTypeCodeByLabel = createNameToCodeIndex(DOCUMENT_TYPES);
const documentTypeLabelByCode = createCodeToNameIndex(DOCUMENT_TYPES);

export function getLocationCode(locationName: string): number | undefined {
	return locationCodeByLabel[normalizeTableLabel(locationName)];
}

export function lookupLocation(code: number): string | undefined {
	return locationLabelByCode.get(String(code));
}

export function getPaymentTypeCode(name: string): string | undefined {
	return paymentTypeCodeByLabel[normalizeTableLabel(name)];
}

export function lookupPaymentType(code: string): string | undefined {
	return paymentTypeLabelByCode.get(code.trim());
}

export function getVehicleTypeCode(name: string): string | undefined {
	return vehicleTypeCodeByLabel[normalizeTableLabel(name)];
}

export function lookupVehicleType(code: string): string | undefined {
	return vehicleTypeLabelByCode.get(code.trim());
}

export function getDocumentTypeCode(name: string): string | undefined {
	return documentTypeCodeByLabel[normalizeTableLabel(name)];
}

export function lookupDocumentType(code: string): string | undefined {
	return documentTypeLabelByCode.get(code.trim());
}

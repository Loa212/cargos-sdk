import crypto from "node:crypto";

/**
 * CARGOS API TypeScript SDK
 * For Italian State Police (Polizia di Stato) car rental contract submission
 *
 * Requirements for Italian car rental companies to report rental contracts
 * in compliance with art. 17 of Law Decree 4 October 2018, n. 113
 */

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export enum PaymentType {
	CASH = "C",
	CARD = "T",
	BANK = "B",
	OTHER = "A",
}

export enum VehicleType {
	CAR = "A",
	MOTORCYCLE = "M",
	TRUCK = "C",
	OTHER = "A",
}

export enum DocumentType {
	PASSPORT = "P",
	ID_CARD = "C",
	DRIVERS_LICENSE = "P",
	VISA = "V",
	RESIDENCE_PERMIT = "S",
}

export interface Location {
	code: number;
	name?: string;
}

export interface Driver {
	surname: string;
	name: string;
	birthDate: Date; // DD/MM/YYYY
	birthPlace: Location;
	citizenship: Location;
	residencePlace?: Location;
	residenceAddress?: string;
	documentType: DocumentType;
	documentNumber: string;
	documentIssuePlace: Location;
	licenseNumber: string;
	licenseIssuePlace: Location;
	phone?: string;
}

export interface Vehicle {
	type: VehicleType;
	brand: string;
	model: string;
	plate: string;
	color?: string;
	hasGPS?: boolean;
	hasEngineBlock?: boolean;
}

export interface Agency {
	id: string; // 30 chars max, unique
	name: string; // 70 chars max
	location: Location;
	address: string; // 150 chars max
	phone: string; // 20 chars max
}

export interface RentalContract {
	id: string; // 50 chars max, unique
	createdDate: Date; // DD/MM/YYYY HH:MM
	paymentType: PaymentType;
	checkoutDate: Date; // DD/MM/YYYY HH:MM
	checkoutLocation: Location;
	checkoutAddress: string; // 150 chars max
	checkinDate: Date; // DD/MM/YYYY HH:MM
	checkinLocation: Location;
	checkinAddress: string; // 150 chars max
	operatorId: string; // 50 chars max
	agency: Agency;
	vehicle: Vehicle;
	mainDriver: Driver;
	secondaryDriver?: Driver;
}

export interface TokenResponse {
	token_type: string;
	expires_date: string;
	access_token: string;
}

export interface ErrorResponse {
	error: string;
	error_description: string;
	error_code: number;
	timestamp: string;
}

export interface TraceResponse {
	esito: boolean;
	transactionid?: string;
	errore?: ErrorResponse;
}

export interface CheckResponse {
	responses: TraceResponse[];
	error?: ErrorResponse;
}

export interface SendResponse {
	responses: TraceResponse[];
	error?: ErrorResponse;
}

export interface TableResponse {
	esito: boolean;
	filename?: string;
	file?: Buffer;
	error?: ErrorResponse;
}

export enum TableId {
	PAYMENT_TYPE = 0,
	LOCATIONS = 1,
	VEHICLE_TYPE = 2,
	DOCUMENT_TYPE = 3,
}

// ============================================================================
// ENCRYPTION
// ============================================================================

/**
 * Encrypt token using AES method (recommended)
 * ApiKey must be at least 48 characters:
 * - First 32 chars: AES key
 * - Last 16 chars: IV
 */
export function encryptAES(token: string, apiKey: string): string {
	if (!apiKey || apiKey.length < 48) {
		throw new Error(
			"API Key must be at least 48 characters for AES encryption",
		);
	}

	try {
		const key = Buffer.from(apiKey.substring(0, 32), "utf-8");
		const iv = Buffer.from(apiKey.substring(32, 48), "utf-8");

		const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
		let encrypted = cipher.update(token, "utf-8", "base64");
		encrypted += cipher.final("base64");

		return encrypted;
	} catch (error) {
		throw new Error(`AES encryption failed: ${error}`);
	}
}

// ============================================================================
// CONTRACT FORMATTER
// ============================================================================

export function padString(
	value: string,
	length: number,
	fillChar: string = " ",
): string {
	if (value.length > length) {
		return value.substring(0, length);
	}
	return value.padEnd(length, fillChar);
}

export function padNumber(value: number, length: number): string {
	return String(value).padStart(length, "0");
}

export function formatDate(date: Date, withTime: boolean = false): string {
	const day = String(date.getDate()).padStart(2, "0");
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const year = date.getFullYear();

	if (withTime) {
		const hours = String(date.getHours()).padStart(2, "0");
		const minutes = String(date.getMinutes()).padStart(2, "0");
		return `${day}/${month}/${year} ${hours}:${minutes}`;
	}

	return `${day}/${month}/${year}`;
}

export function formatDriver(driver: Driver): string {
	let record = "";

	// CONDUCENTE_COGNOME (50 chars)
	record += padString(driver.surname, 50);

	// CONDUCENTE_NOME (30 chars)
	record += padString(driver.name, 30);

	// CONDUCENTE_NASCITA_DATA (10 chars - DD/MM/YYYY)
	record += formatDate(driver.birthDate).padEnd(10);

	// CONDUCENTE_NASCITA_LUOGO_COD (9 chars)
	record += padNumber(driver.birthPlace.code, 9);

	// CONDUCENTE_CITTADINANZA_COD (9 chars)
	record += padNumber(driver.citizenship.code, 9);

	// CONDUCENTE_RESIDENZA_LUOGO_COD (9 chars, optional)
	record += driver.residencePlace
		? padNumber(driver.residencePlace.code, 9)
		: "         ";

	// CONDUCENTE_RESIDENZA_INDIRIZZO (150 chars, optional)
	record += padString(driver.residenceAddress || "", 150);

	// CONDUCENTE_DOCIDE_TIPO_COD (5 chars)
	record += padString(driver.documentType, 5);

	// CONDUCENTE_DOCIDE_NUMERO (20 chars)
	record += padString(driver.documentNumber, 20);

	// CONDUCENTE_DOCIDE_LUOGORIL_COD (9 chars)
	record += padNumber(driver.documentIssuePlace.code, 9);

	// CONDUCENTE_PATENTE_NUMERO (20 chars)
	record += padString(driver.licenseNumber, 20);

	// CONDUCENTE_PATENTE_LUOGORIL_COD (9 chars)
	record += padNumber(driver.licenseIssuePlace.code, 9);

	// CONDUCENTE_RECAPITO (20 chars, optional)
	record += padString(driver.phone || "", 20);

	return record;
}

/**
 * Format rental contract into fixed-width string (1505 characters)
 * Following the CARGOS tracciato record specification
 */
export function formatContract(contract: RentalContract): string {
	let record = "";

	// CONTRATTO_ID (50 chars)
	record += padString(contract.id, 50);

	// CONTRATTO_DATA (16 chars - DD/MM/YYYY HH:MM)
	record += formatDate(contract.createdDate, true).padEnd(16);

	// CONTRATTO_TIPOP (1 char)
	record += contract.paymentType;

	// CONTRATTO_CHECKOUT_DATA (16 chars)
	record += formatDate(contract.checkoutDate, true).padEnd(16);

	// CONTRATTO_CHECKOUT_LUOGO_COD (9 chars)
	record += padNumber(contract.checkoutLocation.code, 9);

	// CONTRATTO_CHECKOUT_INDIRIZZO (150 chars)
	record += padString(contract.checkoutAddress, 150);

	// CONTRATTO_CHECKIN_DATA (16 chars)
	record += formatDate(contract.checkinDate, true).padEnd(16);

	// CONTRATTO_CHECKIN_LUOGO_COD (9 chars)
	record += padNumber(contract.checkinLocation.code, 9);

	// CONTRATTO_CHECKIN_INDIRIZZO (150 chars)
	record += padString(contract.checkinAddress, 150);

	// OPERATORE_ID (50 chars)
	record += padString(contract.operatorId, 50);

	// AGENZIA_ID (30 chars)
	record += padString(contract.agency.id, 30);

	// AGENZIA_NOME (70 chars)
	record += padString(contract.agency.name, 70);

	// AGENZIA_LUOGO_COD (9 chars)
	record += padNumber(contract.agency.location.code, 9);

	// AGENZIA_INDIRIZZO (150 chars)
	record += padString(contract.agency.address, 150);

	// AGENZIA_RECAPITO_TEL (20 chars)
	record += padString(contract.agency.phone, 20);

	// VEICOLO_TIPO (1 char)
	record += contract.vehicle.type;

	// VEICOLO_MARCA (50 chars)
	record += padString(contract.vehicle.brand, 50);

	// VEICOLO_MODELLO (100 chars)
	record += padString(contract.vehicle.model, 100);

	// VEICOLO_TARGA (15 chars)
	record += padString(contract.vehicle.plate, 15);

	// VEICOLO_COLORE (50 chars, optional)
	record += padString(contract.vehicle.color || "", 50);

	// VEICOLO_GPS (1 char, optional)
	record += contract.vehicle.hasGPS ? "1" : "0";

	// VEICOLO_BLOCCOM (1 char, optional)
	record += contract.vehicle.hasEngineBlock ? "1" : "0";

	// Main driver fields
	record += formatDriver(contract.mainDriver);

	// Secondary driver fields (if present)
	if (contract.secondaryDriver) {
		record += formatDriver(contract.secondaryDriver);
	} else {
		record += " ".repeat(190); // Padding for absent secondary driver
	}

	return record;
}

// ============================================================================
// CARGOS API CLIENT
// ============================================================================

export class CargosClient {
	private baseUrl: string = "https://cargos.poliziadistato.it/CARGOS_API";
	private username: string;
	private password: string;
	private apiKey: string;
	private token?: string;
	private tokenExpiry?: Date;

	constructor(username: string, password: string, apiKey: string) {
		this.username = username;
		this.password = password;
		this.apiKey = apiKey;
	}

	/**
	 * Get or refresh authentication token
	 */
	async getToken(): Promise<string> {
		// Return cached token if valid
		if (this.token && this.tokenExpiry && new Date() < this.tokenExpiry) {
			return this.token;
		}

		try {
			const auth = Buffer.from(`${this.username}:${this.password}`).toString(
				"base64",
			);
			const response = await fetch(`${this.baseUrl}/api/Token`, {
				method: "GET",
				headers: {
					Authorization: `Basic ${auth}`,
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				throw new Error(`Token request failed: ${response.statusText}`);
			}

			const data = (await response.json()) as TokenResponse;
			this.token = data.access_token;

			// Set expiry to 5 minutes before actual expiry for safety
			if (data.expires_date) {
				const expiry = new Date(data.expires_date);
				expiry.setMinutes(expiry.getMinutes() - 5);
				this.tokenExpiry = expiry;
			}

			return this.token;
		} catch (error) {
			throw new Error(`Failed to obtain token: ${error}`);
		}
	}

	/**
	 * Get encrypted token for API requests
	 */
	private async getEncryptedToken(): Promise<string> {
		const token = await this.getToken();
		return encryptAES(token, this.apiKey);
	}

	/**
	 * Check contracts for errors before sending
	 * Useful for testing data validity
	 */
	async checkContracts(contracts: RentalContract[]): Promise<CheckResponse> {
		const encryptedToken = await this.getEncryptedToken();
		const formattedRecords = contracts.map((c) => formatContract(c));

		try {
			const response = await fetch(`${this.baseUrl}/api/Check`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${encryptedToken}`,
					Organization: this.username,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(formattedRecords),
			});

			if (!response.ok) {
				const error = (await response.json()) as ErrorResponse;
				return { responses: [], error };
			}

			const data = (await response.json()) as TraceResponse[];
			return { responses: data };
		} catch (error) {
			throw new Error(`Check failed: ${error}`);
		}
	}

	/**
	 * Send contracts to CARGOS system
	 * Maximum 100 contracts per request
	 */
	async sendContracts(contracts: RentalContract[]): Promise<SendResponse> {
		if (contracts.length > 100) {
			throw new Error("Maximum 100 contracts per request");
		}

		const encryptedToken = await this.getEncryptedToken();
		const formattedRecords = contracts.map((c) => formatContract(c));

		try {
			const response = await fetch(`${this.baseUrl}/api/Send`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${encryptedToken}`,
					Organization: this.username,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(formattedRecords),
			});

			if (!response.ok) {
				const error = (await response.json()) as ErrorResponse;
				return { responses: [], error };
			}

			const data = (await response.json()) as TraceResponse[];
			return { responses: data };
		} catch (error) {
			throw new Error(`Send failed: ${error}`);
		}
	}

	/**
	 * Download coding tables (payment types, locations, vehicle types, document types)
	 */
	async getTable(tableId: TableId): Promise<TableResponse> {
		const encryptedToken = await this.getEncryptedToken();

		try {
			const response = await fetch(
				`${this.baseUrl}/api/Tabella?TabellaIdentificativo=${tableId}`,
				{
					method: "GET",
					headers: {
						Authorization: `Bearer ${encryptedToken}`,
						Organization: this.username,
					},
				},
			);

			if (!response.ok) {
				const error = (await response.json()) as ErrorResponse;
				return { esito: false, error };
			}

			const buffer = await response.arrayBuffer();
			const filename = response.headers
				.get("content-disposition")
				?.split("filename=")[1];

			return {
				esito: true,
				filename: filename || `table_${tableId}.csv`,
				file: Buffer.from(buffer),
			};
		} catch (error) {
			throw new Error(`Table download failed: ${error}`);
		}
	}

	/**
	 * Download all coding tables at once
	 */
	async getAllTables(): Promise<Map<string, Buffer>> {
		const tables = new Map<string, Buffer>();
		const tableNames = [
			"payment_types",
			"locations",
			"vehicle_types",
			"document_types",
		];

		for (let i = 0; i < 4; i++) {
			try {
				const table = await this.getTable(i);
				const tableName = tableNames[i];
				if (table.file && tableName) {
					tables.set(tableName, table.file);
				}
			} catch (error) {
				console.error(`Failed to download table ${i}:`, error);
			}
		}

		return tables;
	}

	/**
	 * Batch send contracts with automatic chunking (max 100 per request)
	 */
	async batchSendContracts(
		contracts: RentalContract[],
	): Promise<SendResponse[]> {
		const results: SendResponse[] = [];
		const chunkSize = 100;

		for (let i = 0; i < contracts.length; i += chunkSize) {
			const chunk = contracts.slice(i, i + chunkSize);
			const result = await this.sendContracts(chunk);
			results.push(result);

			// Small delay between requests to avoid rate limiting
			if (i + chunkSize < contracts.length) {
				await new Promise((resolve) => setTimeout(resolve, 100));
			}
		}

		return results;
	}
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function parseTableCSV(data: Buffer): Map<string, string> {
	const content = data.toString("utf-8");
	const lines = content.split("\n");
	const map = new Map<string, string>();

	for (const line of lines) {
		if (!line.trim()) continue;
		const [code, value] = line.split("#");
		if (code && value) {
			map.set(code.trim(), value.trim());
		}
	}

	return map;
}

export function isValidContractData(contract: RentalContract): string[] {
	const errors: string[] = [];

	if (!contract.id || contract.id.length > 50) {
		errors.push("Contract ID must be between 1 and 50 characters");
	}

	if (!contract.agency.id || contract.agency.id.length > 30) {
		errors.push("Agency ID must be between 1 and 30 characters");
	}

	if (contract.checkoutAddress.length < 3) {
		errors.push("Checkout address must be at least 3 characters");
	}

	if (contract.checkinAddress.length < 3) {
		errors.push("Checkin address must be at least 3 characters");
	}

	if (contract.mainDriver.documentNumber.length < 5) {
		errors.push("Document number must be at least 5 characters");
	}

	if (contract.mainDriver.licenseNumber.length < 5) {
		errors.push("License number must be at least 5 characters");
	}

	if (contract.vehicle.plate.length < 3) {
		errors.push("Vehicle plate must be at least 3 characters");
	}

	if (
		contract.secondaryDriver &&
		(!contract.secondaryDriver.surname ||
			!contract.secondaryDriver.name ||
			!contract.secondaryDriver.documentNumber)
	) {
		errors.push("Secondary driver must have all required fields or be removed");
	}

	return errors;
}

export * from "./tables";

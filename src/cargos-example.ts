import {
	CargosClient,
	DocumentType,
	getLocationCode,
	isValidContractData,
	PaymentType,
	parseTableCSV,
	type RentalContract,
	VehicleType,
} from "./cargos-sdk";

/**
 * Example usage of CARGOS SDK for Italian car rental companies
 */

async function exampleBasicUsage() {
	// Initialize client with credentials from Polizia di Stato
	const client = new CargosClient(
		process.env.CARGOS_USERNAME || "your_username",
		process.env.CARGOS_PASSWORD || "your_password",
		process.env.CARGOS_API_KEY || "your_api_key_48_chars_min",
	);
	const romeCode = getLocationCode("ROMA") ?? 412058091;
	const italyCode = getLocationCode("ITALIA") ?? 100000100;

	// Create a rental contract
	const contract: RentalContract = {
		id: "RENT-2024-001234", // Unique contract ID
		createdDate: new Date("2024-02-01T10:30:00"),
		paymentType: PaymentType.CARD,
		checkoutDate: new Date("2024-02-01T14:00:00"),
		checkoutLocation: { code: romeCode }, // Rome (Questura di Roma)
		checkoutAddress: "Via del Castro Pretorio 10, Roma",
		checkinDate: new Date("2024-02-08T18:00:00"),
		checkinLocation: { code: romeCode },
		checkinAddress: "Via del Castro Pretorio 10, Roma",
		operatorId: "OP-001",
		agency: {
			id: "AG-ROME-001",
			name: "RentCar Roma Center",
			location: { code: romeCode },
			address: "Via del Castro Pretorio 10, Roma",
			phone: "+39-06-12345678",
		},
		vehicle: {
			type: VehicleType.CAR,
			brand: "Fiat",
			model: "500",
			plate: "AB123CD",
			color: "Nero",
			hasGPS: true,
			hasEngineBlock: true,
		},
		mainDriver: {
			surname: "Rossi",
			name: "Mario",
			birthDate: new Date("1980-05-15"),
			birthPlace: { code: romeCode }, // Rome
			citizenship: { code: italyCode }, // Italy
			residencePlace: { code: romeCode },
			residenceAddress: "Via Roma 5, Roma",
			documentType: DocumentType.ID_CARD,
			documentNumber: "AA123456789",
			documentIssuePlace: { code: romeCode },
			licenseNumber: "IT1234567890",
			licenseIssuePlace: { code: romeCode },
			phone: "+39-3-1234567890",
		},
	};

	// Validate contract data
	const validationErrors = isValidContractData(contract);
	if (validationErrors.length > 0) {
		console.error("Validation errors:", validationErrors);
		return;
	}

	// Option 1: Check contract before sending
	console.log("Checking contract...");
	const checkResult = await client.checkContracts([contract]);

	if (checkResult.error) {
		console.error("Check failed:", checkResult.error);
		return;
	}

	for (const response of checkResult.responses) {
		if (!response.esito) {
			console.error("Contract validation error:", response.errore);
			return;
		}
	}

	console.log("Contract validation passed!");

	// Option 2: Send contract
	console.log("Sending contract...");
	const sendResult = await client.sendContracts([contract]);

	if (sendResult.error) {
		console.error("Send failed:", sendResult.error);
		return;
	}

	for (const response of sendResult.responses) {
		if (response.esito) {
			console.log(
				"✓ Contract sent successfully with transaction ID:",
				response.transactionid,
			);
		} else {
			console.error("✗ Contract failed:", response.errore);
		}
	}
}

async function exampleBatchProcessing() {
	const client = new CargosClient(
		process.env.CARGOS_USERNAME || "your_username",
		process.env.CARGOS_PASSWORD || "your_password",
		process.env.CARGOS_API_KEY || "your_api_key_48_chars_min",
	);

	// Generate multiple contracts (simulating daily batch)
	const contracts: RentalContract[] = [];

	for (let i = 1; i <= 250; i++) {
		const contract: RentalContract = {
			id: `RENT-2024-${String(i).padStart(6, "0")}`,
			createdDate: new Date(),
			paymentType: i % 2 === 0 ? PaymentType.CARD : PaymentType.BANK,
			checkoutDate: new Date(),
			checkoutLocation: { code: 80 },
			checkoutAddress: `Via Roma ${i}, Roma`,
			checkinDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			checkinLocation: { code: 80 },
			checkinAddress: `Via Roma ${i}, Roma`,
			operatorId: `OP-${String(i).padStart(3, "0")}`,
			agency: {
				id: "AG-ROME-001",
				name: "RentCar Roma Center",
				location: { code: 80 },
				address: "Via del Castro Pretorio 10, Roma",
				phone: "+39-06-12345678",
			},
			vehicle: {
				type: VehicleType.CAR,
				brand: "Fiat",
				model: "500",
				plate: `AB${String(i).padStart(5, "0")}`,
				hasGPS: true,
				hasEngineBlock: true,
			},
			mainDriver: {
				surname: `Rossi${i}`,
				name: "Mario",
				birthDate: new Date("1980-05-15"),
				birthPlace: { code: 80 },
				citizenship: { code: 380 },
				documentType: DocumentType.ID_CARD,
				documentNumber: `AA${String(i).padStart(9, "0")}`,
				documentIssuePlace: { code: 80 },
				licenseNumber: `IT${String(i).padStart(13, "0")}`,
				licenseIssuePlace: { code: 80 },
				phone: "+39-3-1234567890",
			},
		};

		contracts.push(contract);
	}

	// Send in batches (automatically chunks into groups of 100)
	console.log(`Sending ${contracts.length} contracts in batches...`);
	const results = await client.batchSendContracts(contracts);

	let successCount = 0;
	let failureCount = 0;

	for (const [batchIndex, result] of results.entries()) {
		console.log(`\nBatch ${batchIndex + 1}:`);

		if (result.error) {
			console.error("Batch error:", result.error);
			failureCount += 100;
			continue;
		}

		for (const response of result.responses) {
			if (response.esito) {
				successCount++;
			} else {
				failureCount++;
				console.error(`Failed:`, response.errore?.error_description);
			}
		}
	}

	console.log(`\n✓ Successfully sent: ${successCount}`);
	console.log(`✗ Failed: ${failureCount}`);
}

async function exampleDownloadTables() {
	const client = new CargosClient(
		process.env.CARGOS_USERNAME || "your_username",
		process.env.CARGOS_PASSWORD || "your_password",
		process.env.CARGOS_API_KEY || "your_api_key_48_chars_min",
	);

	// Download all coding tables
	console.log("Downloading CARGOS coding tables...");
	const tables = await client.getAllTables();

	for (const [name, buffer] of tables) {
		console.log(`\n${name}:`);

		const map = parseTableCSV(buffer);
		let count = 0;

		for (const [code, value] of map) {
			console.log(`  ${code} => ${value}`);
			count++;
			if (count >= 5) {
				console.log("  ...");
				break;
			}
		}

		console.log(`  (Total: ${map.size} entries)`);
	}
}

async function exampleWithSecondaryDriver() {
	const client = new CargosClient(
		process.env.CARGOS_USERNAME || "your_username",
		process.env.CARGOS_PASSWORD || "your_password",
		process.env.CARGOS_API_KEY || "your_api_key_48_chars_min",
	);

	const contract: RentalContract = {
		id: "RENT-2024-WITH-SECONDARY",
		createdDate: new Date(),
		paymentType: PaymentType.CARD,
		checkoutDate: new Date(),
		checkoutLocation: { code: 80 },
		checkoutAddress: "Via del Castro Pretorio 10, Roma",
		checkinDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
		checkinLocation: { code: 80 },
		checkinAddress: "Via del Castro Pretorio 10, Roma",
		operatorId: "OP-001",
		agency: {
			id: "AG-ROME-001",
			name: "RentCar Roma Center",
			location: { code: 80 },
			address: "Via del Castro Pretorio 10, Roma",
			phone: "+39-06-12345678",
		},
		vehicle: {
			type: VehicleType.CAR,
			brand: "Fiat",
			model: "Panda",
			plate: "CD456EF",
			hasGPS: true,
		},
		mainDriver: {
			surname: "Rossi",
			name: "Mario",
			birthDate: new Date("1980-05-15"),
			birthPlace: { code: 80 },
			citizenship: { code: 380 },
			residencePlace: { code: 80 },
			residenceAddress: "Via Roma 5, Roma",
			documentType: DocumentType.ID_CARD,
			documentNumber: "AA123456789",
			documentIssuePlace: { code: 80 },
			licenseNumber: "IT1234567890",
			licenseIssuePlace: { code: 80 },
		},
		// Secondary driver MUST have all fields if included
		secondaryDriver: {
			surname: "Bianchi",
			name: "Anna",
			birthDate: new Date("1985-03-20"),
			birthPlace: { code: 80 },
			citizenship: { code: 380 },
			documentType: DocumentType.ID_CARD,
			documentNumber: "BB987654321",
			documentIssuePlace: { code: 80 },
			licenseNumber: "IT0987654321",
			licenseIssuePlace: { code: 80 },
		},
	};

	// Validate and send
	const validationErrors = isValidContractData(contract);
	if (validationErrors.length > 0) {
		console.error("Validation errors:", validationErrors);
		return;
	}

	const result = await client.sendContracts([contract]);

	const firstResponse = result.responses[0];
	if (!result.error && firstResponse?.esito) {
		console.log(
			"✓ Contract with secondary driver sent:",
			firstResponse.transactionid,
		);
	} else {
		console.error("✗ Failed:", result.error || firstResponse?.errore);
	}
}

// Run examples
async function main() {
	try {
		console.log("=== CARGOS SDK Example: Basic Usage ===\n");
		await exampleBasicUsage();

		console.log("\n=== CARGOS SDK Example: Download Tables ===\n");
		await exampleDownloadTables();

		console.log("\n=== CARGOS SDK Example: Secondary Driver ===\n");
		await exampleWithSecondaryDriver();

		console.log("\n=== CARGOS SDK Example: Batch Processing ===\n");
		await exampleBatchProcessing();
	} catch (error) {
		console.error("Example error:", error);
	}
}

if (require.main === module) {
	main();
}

export {
	exampleBasicUsage,
	exampleBatchProcessing,
	exampleDownloadTables,
	exampleWithSecondaryDriver,
};

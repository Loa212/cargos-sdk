# CARGOS API TypeScript SDK

TypeScript SDK for the **Cargos Polizia di Stato** service - a mandatory system for Italian car rental companies to report rental contracts to the Italian State Police for terrorism prevention and public safety purposes.

**Legal Basis**: Art. 17, Law Decree October 4, 2018, n. 113

## Overview

The Ca.R.G.O.S. (Centro Anagrafe Rifornimento Gestione Operativa Sicurezza) service requires all Italian car rental companies to report rental contract data including:

- Driver identification information
- Vehicle details
- Rental duration and locations
- Agency information

The system verifies driver eligibility and checks for security concerns in real-time.

## Features

- ✅ Full TypeScript support with strong typing
- ✅ AES-256-CBC encryption (3DES deprecated but supported)
- ✅ Token management with automatic refresh
- ✅ Contract validation before submission
- ✅ Batch processing (automatic chunking for 100+ contracts)
- ✅ Check contracts before sending
- ✅ Download and parse coding tables
- ✅ Comprehensive error handling

## Installation

```bash
npm install cargos-sdk
# or
yarn add cargos-sdk
```

Or import directly:

```typescript
import { CargosClient, RentalContract, PaymentType } from './cargos-sdk';
```

## Quick Start

```typescript
import { CargosClient, RentalContract, PaymentType, VehicleType, DocumentType } from './cargos-sdk';

const client = new CargosClient(
  'your_username',
  'your_password',
  'your_api_key_at_least_48_chars'
);

const contract: RentalContract = {
  id: 'RENT-2024-001234',
  createdDate: new Date('2024-02-01T10:30:00'),
  paymentType: PaymentType.CARD,
  checkoutDate: new Date('2024-02-01T14:00:00'),
  checkoutLocation: { code: 80 }, // Rome
  checkoutAddress: 'Via del Castro Pretorio 10, Roma',
  checkinDate: new Date('2024-02-08T18:00:00'),
  checkinLocation: { code: 80 },
  checkinAddress: 'Via del Castro Pretorio 10, Roma',
  operatorId: 'OP-001',
  agency: {
    id: 'AG-ROME-001',
    name: 'RentCar Roma Center',
    location: { code: 80 },
    address: 'Via del Castro Pretorio 10, Roma',
    phone: '+39-06-12345678'
  },
  vehicle: {
    type: VehicleType.CAR,
    brand: 'Fiat',
    model: '500',
    plate: 'AB123CD',
    color: 'Nero',
    hasGPS: true
  },
  mainDriver: {
    surname: 'Rossi',
    name: 'Mario',
    birthDate: new Date('1980-05-15'),
    birthPlace: { code: 80 },
    citizenship: { code: 380 }, // Italy
    documentType: DocumentType.ID_CARD,
    documentNumber: 'AA123456789',
    documentIssuePlace: { code: 80 },
    licenseNumber: 'IT1234567890',
    licenseIssuePlace: { code: 80 }
  }
};

// Send contract
const result = await client.sendContracts([contract]);

if (result.responses[0].esito) {
  console.log('✓ Sent:', result.responses[0].transactionid);
} else {
  console.error('✗ Error:', result.responses[0].errore);
}
```

## Authentication

Get credentials from **Questura** (Provincial Police Station):

1. Request **CARGOS portal activation** from your provincial police station
2. Receive: `username`, `password`, and `API_KEY` (48+ characters for AES)

**Important**: 
- API Key must be **at least 48 characters** for AES encryption (recommended)
- For AES: First 32 chars are the key, last 16 are the IV
- 3DES (deprecated) requires minimum 24 characters

```typescript
const client = new CargosClient(
  process.env.CARGOS_USERNAME,
  process.env.CARGOS_PASSWORD,
  process.env.CARGOS_API_KEY // min 48 chars
);
```

## Core Methods

### checkContracts()

Validate contracts before sending (recommended for testing):

```typescript
const checkResult = await client.checkContracts([contract]);

for (const response of checkResult.responses) {
  if (!response.esito) {
    console.error('Validation error:', response.errore?.error_description);
  }
}
```

Returns row-by-row validation errors (syntax and semantics).

### sendContracts()

Send up to 100 contracts in a single request:

```typescript
const sendResult = await client.sendContracts([contract1, contract2]);

for (const response of sendResult.responses) {
  if (response.esito) {
    console.log('Transaction ID:', response.transactionid);
  } else {
    console.error('Error:', response.errore);
  }
}
```

**Limits**:
- Maximum 100 contracts per request
- Use `batchSendContracts()` for 100+

### batchSendContracts()

Automatically batch large contract sets:

```typescript
const contracts: RentalContract[] = [...]; // 250 contracts

const batchResults = await client.batchSendContracts(contracts);
// Automatically split into 3 requests (100, 100, 50)
```

### getTable()

Download specific coding table:

```typescript
import { TableId } from './cargos-sdk';

const paymentTypes = await client.getTable(TableId.PAYMENT_TYPE);
const buffer = paymentTypes.file;

if (paymentTypes.esito && buffer) {
  const csv = buffer.toString('utf-8');
  console.log(csv);
}
```

Available tables:
- `TableId.PAYMENT_TYPE` (0)
- `TableId.LOCATIONS` (1)
- `TableId.VEHICLE_TYPE` (2)
- `TableId.DOCUMENT_TYPE` (3)

### getAllTables()

Download all coding tables at once:

```typescript
const tables = await client.getAllTables();

for (const [name, buffer] of tables) {
  console.log(`${name}: ${buffer.length} bytes`);
  
  // Parse as CSV with '#' separator
  const map = parseTableCSV(buffer);
  for (const [code, value] of map) {
    console.log(`  ${code} => ${value}`);
  }
}
```

## Data Types

### PaymentType

```typescript
enum PaymentType {
  CASH = 'C',
  CARD = 'T',
  BANK = 'B',
  OTHER = 'A'
}
```

### VehicleType

```typescript
enum VehicleType {
  CAR = 'A',
  MOTORCYCLE = 'M',
  TRUCK = 'C',
  OTHER = 'A'
}
```

### DocumentType

```typescript
enum DocumentType {
  PASSPORT = 'P',
  ID_CARD = 'C',
  DRIVERS_LICENSE = 'P',
  VISA = 'V',
  RESIDENCE_PERMIT = 'S'
}
```

### Location

Reference locations by police code (Questura/Comune):

```typescript
interface Location {
  code: number;  // Police location code (e.g., 80 for Rome)
  name?: string; // Human-readable name
}
```

Common location codes:
- Rome (Lazio): 80
- Milan (Lombardy): 108
- Naples (Campania): 63
- Turin (Piedmont): 1
- Florence (Tuscany): 48

Download the full `LOCATIONS` table to get all codes.

### Driver

```typescript
interface Driver {
  surname: string;                          // Max 50 chars
  name: string;                             // Max 30 chars
  birthDate: Date;                          // DD/MM/YYYY
  birthPlace: Location;                     // Comune or foreign country
  citizenship: Location;                    // Country code
  residencePlace?: Location;                // Optional location
  residenceAddress?: string;                // Optional, max 150 chars
  documentType: DocumentType;               // ID type
  documentNumber: string;                   // Max 20 chars
  documentIssuePlace: Location;             // Where ID was issued
  licenseNumber: string;                    // Driver's license, max 20 chars
  licenseIssuePlace: Location;              // Where license issued
  phone?: string;                           // Optional, max 20 chars
}
```

**Important**: Secondary driver must have ALL fields populated or omitted entirely.

### Vehicle

```typescript
interface Vehicle {
  type: VehicleType;                        // From enum
  brand: string;                            // Max 50 chars
  model: string;                            // Max 100 chars
  plate: string;                            // License plate, max 15 chars
  color?: string;                           // Optional, max 50 chars
  hasGPS?: boolean;                         // Optional, 0 or 1
  hasEngineBlock?: boolean;                 // Optional, 0 or 1
}
```

### Agency

```typescript
interface Agency {
  id: string;                               // Unique, max 30 chars
  name: string;                             // Max 70 chars
  location: Location;                       // Office location
  address: string;                          // Max 150 chars
  phone: string;                            // Max 20 chars, > 3 chars
}
```

### RentalContract

```typescript
interface RentalContract {
  id: string;                               // Unique, max 50 chars
  createdDate: Date;                        // Contract signature time
  paymentType: PaymentType;                 // From enum
  checkoutDate: Date;                       // Vehicle pickup time
  checkoutLocation: Location;               // Pickup location
  checkoutAddress: string;                  // Pickup address, max 150 chars
  checkinDate: Date;                        // Vehicle return time
  checkinLocation: Location;                // Return location
  checkinAddress: string;                   // Return address, max 150 chars
  operatorId: string;                       // Employee ID, max 50 chars
  agency: Agency;                           // Agency details
  vehicle: Vehicle;                         // Vehicle details
  mainDriver: Driver;                       // Primary driver
  secondaryDriver?: Driver;                 // Optional second driver
}
```

## Validation

Use `isValidContractData()` to validate before sending:

```typescript
import { isValidContractData } from './cargos-sdk';

const errors = isValidContractData(contract);

if (errors.length > 0) {
  console.error('Validation errors:');
  errors.forEach(err => console.error(`  - ${err}`));
}
```

Checks:
- Contract ID length (1-50)
- Agency ID length (1-30)
- Address minimum length (3)
- Document number minimum length (5)
- License number minimum length (5)
- Vehicle plate minimum length (3)
- Secondary driver completeness

## Workflow

### Recommended Process

1. **Prepare** contract data from your rental management system
2. **Validate** with `isValidContractData()`
3. **Check** with `checkContracts()` (optional but recommended)
4. **Download** tables if you need to reference codes with `getAllTables()`
5. **Send** with `sendContracts()` or `batchSendContracts()`
6. **Store** transaction IDs for audit trail

### Code Example

```typescript
const client = new CargosClient(username, password, apiKey);

// Prepare contracts
const contracts = readContractsFromDatabase();

// Validate
for (const contract of contracts) {
  const errors = isValidContractData(contract);
  if (errors.length > 0) {
    logger.error(`Contract ${contract.id} invalid:`, errors);
    continue; // Skip invalid contracts
  }
}

// Optional: Check before sending
const checkResult = await client.checkContracts(contracts);
for (const response of checkResult.responses) {
  if (!response.esito) {
    logger.warn(`Check failed: ${response.errore?.error_description}`);
  }
}

// Send in batches (auto-chunked to 100 max)
try {
  const results = await client.batchSendContracts(contracts);

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    for (let j = 0; j < result.responses.length; j++) {
      const response = result.responses[j];
      if (response.esito) {
        // Store transaction ID
        storeTransactionId(contracts[i * 100 + j].id, response.transactionid);
      } else {
        logger.error(`Failed: ${response.errore?.error_description}`);
      }
    }
  }
} catch (error) {
  logger.error('Batch send failed:', error);
}
```

## Error Handling

All responses include error information:

```typescript
interface ErrorResponse {
  error: string;
  error_description: string;
  error_code: number;
  timestamp: string;
}
```

Common error codes:
- **1**: Invalid token
- **2**: Invalid API key
- **3**: Syntax error in contract data
- **4**: Semantic error in contract data
- **5**: Contract already sent
- **6**: Invalid location code
- **7**: Invalid payment type

Example handling:

```typescript
try {
  const result = await client.sendContracts([contract]);
  
  if (result.error) {
    console.error(`API Error (${result.error.error_code}):`, result.error.error_description);
    return;
  }

  for (const response of result.responses) {
    if (!response.esito) {
      console.error(`Contract Error (${response.errore?.error_code}):`, 
                    response.errore?.error_description);
    }
  }
} catch (error) {
  console.error('Network or parsing error:', error);
}
```

## Security

### Token Management

Tokens are:
- Encrypted with your API Key using AES-256-CBC
- Cached in memory with 5-minute safety margin before expiry
- Automatically refreshed when expired

```typescript
// Token is automatically managed
const result = await client.sendContracts(contracts);
// Token obtained/refreshed internally as needed
```

### API Key Security

**Never**:
- Hardcode API keys in source
- Commit API keys to version control
- Log API keys or encrypted tokens
- Share credentials via email

**Always**:
- Use environment variables
- Rotate keys periodically
- Use secure key management (vaults, KMS)
- Log only transaction IDs, not tokens

```typescript
// ✅ Good
const apiKey = process.env.CARGOS_API_KEY;
const client = new CargosClient(username, password, apiKey);

// ❌ Bad
const client = new CargosClient('user', 'pass', 'HARDCODED_KEY_HERE');
```

### HTTPS

All communication with Cargos service is over HTTPS (TLS 1.2+).

## Data Retention

- Contract data is retained for **maximum 7 days**
- Transaction IDs should be stored locally for audit
- Implement your own retention policies per company requirements

## Troubleshooting

### "Invalid API Key" Error

- Check API Key length (must be 48+ for AES)
- Verify first 32 chars are the encryption key, last 16 are IV
- Confirm API Key hasn't expired (request new from police station)

### "Token not valid" Error

- Token is automatically refreshed; retry the operation
- Check username/password are correct
- Verify credentials haven't been reset

### "Invalid location code" Error

- Download `LOCATIONS` table to see valid codes
- Location codes reference specific police jurisdictions
- Use exact numeric code from the table

### "Semantic error" in contract data

- Use `checkContracts()` first to see detailed validation errors
- Check all required fields are populated
- Verify field lengths match specifications
- Confirm date formats are DD/MM/YYYY

### "Maximum 100 contracts per request"

- Use `batchSendContracts()` instead of `sendContracts()`
- Automatically handles batching

## Examples

See `cargos-example.ts` for:
- Basic single contract submission
- Batch processing (100+ contracts)
- Downloading and parsing tables
- Secondary driver handling
- Error handling patterns

## API Reference

### CargosClient

```typescript
class CargosClient {
  constructor(username: string, password: string, apiKey: string);
  
  // Methods
  async getToken(): Promise<string>;
  async checkContracts(contracts: RentalContract[]): Promise<CheckResponse>;
  async sendContracts(contracts: RentalContract[]): Promise<SendResponse>;
  async batchSendContracts(contracts: RentalContract[]): Promise<SendResponse[]>;
  async getTable(tableId: TableId): Promise<TableResponse>;
  async getAllTables(): Promise<Map<string, Buffer>>;
}
```

### Utilities

```typescript
// Validate contract data
function isValidContractData(contract: RentalContract): string[];

// Parse table CSV (# separated, UTF-8)
function parseTableCSV(data: Buffer): Map<string, string>;
```

## Technical Details

### Record Format

Contracts are formatted as fixed-width 1505-character records following CARGOS specifications:

- Fields: 46 data elements
- Total width: 1505 characters
- Multiple records per batch (max 100)
- Character set: UTF-8
- Date format: DD/MM/YYYY or DD/MM/YYYY HH:MM

### Encryption

**AES Method** (recommended, default):
- Algorithm: AES-256-CBC
- Mode: Cipher Block Chaining
- Padding: PKCS7
- Key size: 256 bits (32 bytes)
- IV size: 128 bits (16 bytes)
- Output: Base64

```
API Key (48+ chars):
├─ Chars 0-31: Encryption Key (32 bytes)
└─ Chars 32-47: Initialization Vector (16 bytes)
```

**3DES Method** (deprecated):
- Algorithm: Triple DES
- Mode: ECB
- Padding: PKCS7
- Key size: 192 bits (24 bytes)
- Output: Base64

### Authentication

Uses OAuth 2.0 with Bearer token:

```
Authorization: Bearer <encrypted_token>
Organization: <username>
```

## Legal Compliance

This SDK implements the technical specifications from:

- **Decreto Legge** 4 October 2018, n. 113 (Art. 17)
- **Decreto Ministeriale** 29 October 2021
- **CARGOS Architectural Documentation** (Rev. 01, 06/02/2024)

## Support

For issues or questions:

1. Check `checkContracts()` output for validation details
2. Download location/reference tables to verify codes
3. Review CARGOS documentation: https://cargos.poliziadistato.it
4. Contact your provincial Questura

## License

MIT

## Changelog

### 1.0.0
- Initial release
- Full CARGOS API implementation
- AES-256 encryption
- Batch processing
- Contract validation
- Table downloads

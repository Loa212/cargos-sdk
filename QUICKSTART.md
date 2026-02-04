# CARGOS SDK - Quick Start

## 5-Minute Setup

### 1. Get Credentials

Contact your provincial **Questura** (Police Station) and request "CARGOS portal activation". You'll receive:
- Username
- Password  
- API Key (48+ characters)

### 2. Install

```bash
npm install cargos-sdk
# or copy cargos-sdk.ts into your project
```

### 3. Setup Environment

```bash
# Create .env file
echo "CARGOS_USERNAME=your_username" > .env
echo "CARGOS_PASSWORD=your_password" >> .env
echo "CARGOS_API_KEY=your_48_char_api_key" >> .env
```

### 4. Use SDK

```typescript
import { 
  CargosClient, 
  RentalContract, 
  PaymentType, 
  VehicleType, 
  DocumentType 
} from './cargos-sdk';

const client = new CargosClient(
  process.env.CARGOS_USERNAME!,
  process.env.CARGOS_PASSWORD!,
  process.env.CARGOS_API_KEY!
);

// Create a rental contract
const contract: RentalContract = {
  id: 'RENT-2024-001',
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
    name: 'RentCar Roma',
    location: { code: 80 },
    address: 'Via del Castro Pretorio 10, Roma',
    phone: '+39-06-12345678'
  },
  vehicle: {
    type: VehicleType.CAR,
    brand: 'Fiat',
    model: '500',
    plate: 'AB123CD'
  },
  mainDriver: {
    surname: 'Rossi',
    name: 'Mario',
    birthDate: new Date('1980-05-15'),
    birthPlace: { code: 80 },
    citizenship: { code: 380 },
    documentType: DocumentType.ID_CARD,
    documentNumber: 'AA123456789',
    documentIssuePlace: { code: 80 },
    licenseNumber: 'IT1234567890',
    licenseIssuePlace: { code: 80 }
  }
};

// Send it
const result = await client.sendContracts([contract]);

if (result.responses[0].esito) {
  console.log('✓ Sent:', result.responses[0].transactionid);
} else {
  console.error('✗ Error:', result.responses[0].errore?.error_description);
}
```

## Common Tasks

### Check Contract Before Sending

```typescript
const checkResult = await client.checkContracts([contract]);
if (checkResult.responses[0].esito) {
  console.log('✓ Valid');
} else {
  console.error('✗ Error:', checkResult.responses[0].errore);
}
```

### Validate Data

```typescript
import { isValidContractData } from './cargos-sdk';

const errors = isValidContractData(contract);
if (errors.length > 0) {
  console.error('Invalid contract:', errors);
}
```

### Send Multiple Contracts

```typescript
// Automatic batching (100 max per request)
const results = await client.batchSendContracts(contracts); // 250+ contracts OK

for (const result of results) {
  for (const response of result.responses) {
    if (response.esito) {
      console.log('✓', response.transactionid);
    } else {
      console.error('✗', response.errore?.error_description);
    }
  }
}
```

### Download Reference Tables

```typescript
// Get all tables
const tables = await client.getAllTables();

// locations table contains police codes
const locationsBuffer = tables.get('locations');
console.log(locationsBuffer?.toString('utf-8'));

// Or specific table
import { TableId } from './cargos-sdk';
const paymentTypes = await client.getTable(TableId.PAYMENT_TYPE);
```

## Common Location Codes

| City | Code | Region |
|------|------|--------|
| Rome | 80 | Lazio |
| Milan | 108 | Lombardy |
| Naples | 63 | Campania |
| Turin | 1 | Piedmont |
| Florence | 48 | Tuscany |
| Venice | 27 | Veneto |
| Bologna | 37 | Emilia-Romagna |
| Genoa | 10 | Liguria |

**Get full list**: Download `LOCATIONS` table with `client.getTable(TableId.LOCATIONS)`

## Payment Types

| Type | Code |
|------|------|
| Cash | C |
| Credit Card | T |
| Bank Transfer | B |
| Other | A |

## Vehicle Types

| Type | Code |
|------|------|
| Car | A |
| Motorcycle | M |
| Truck | C |

## Document Types

| Type | Code |
|------|------|
| Passport | P |
| ID Card | C |
| Driver's License | P |
| Visa | V |
| Residence Permit | S |

## Troubleshooting

### "Invalid API Key"
- API Key must be **48+ characters** for AES (recommended)
- Check you're using the correct key from Questura

### "Token not valid"
- Token automatically refreshes; just retry
- Check username/password are correct

### "Invalid location code"
- Download locations table: `client.getTable(TableId.LOCATIONS)`
- Use exact numeric code (e.g., 80 for Rome)

### "Maximum 100 contracts per request"
- Use `batchSendContracts()` instead of `sendContracts()`
- Automatically handles 100+ contracts

### "Semantic error" in contract
- Use `checkContracts()` first for detailed validation
- Check all required fields are present
- Verify field lengths match specifications

## Next Steps

1. Read **README.md** for full documentation
2. See **INTEGRATION_GUIDE.md** for production setup
3. Review **cargos-example.ts** for more examples
4. Download location/reference tables from CARGOS API
5. Implement error handling and retry logic
6. Set up monitoring and logging

## Production Checklist

- [ ] Credentials in environment variables (not hardcoded)
- [ ] Error handling implemented
- [ ] Logging configured
- [ ] Transaction IDs stored in database
- [ ] Testing completed
- [ ] Monitoring set up
- [ ] Backup/retry strategy in place
- [ ] Documentation updated for your team

## Support

- **API Docs**: https://cargos.poliziadistato.it/CARGOS_API
- **Your Questura**: Contact provincial police station
- **This SDK**: See README.md and INTEGRATION_GUIDE.md

---

Ready? Start with copying `cargos-sdk.ts` and `cargos-example.ts` into your project!

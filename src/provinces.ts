// Italian provinces — sigla, ISTAT province code, capoluogo — derived from the
// bundled LOCATIONS table, plus the reader that turns a printed ISSUING
// AUTHORITY into a CARGOS place.
//
// A comune's LOCATIONS code is `4` + region(2) + the 6-digit ISTAT comune code,
// whose first three digits are the province: ROMA 412058091 → 058 → RM.
//
// ⚠️ GENERATED, not hand-typed: every capoluogo below resolves in LOCATIONS and
// its code carries the province code next to it (`provinces.test.ts` checks all
// of them). The table predates the 2016 Sardinian reorganisation: province 092
// still holds Cagliari AND Carbonia/Iglesias/Sanluri, so there is no SU entry.
// BT (Barletta-Andria-Trani) has three capoluoghi; its seat, ANDRIA, is listed.

import { getLocationCode, lookupLocation } from "./tables";

export interface Province {
	/** ISTAT province code, 3 digits ("058"). */
	code: string;
	/** The capoluogo, exactly as LOCATIONS spells it. */
	capital: string;
}

export const PROVINCES: Readonly<Record<string, Province>> = {
	AG: { code: "084", capital: "AGRIGENTO" },
	AL: { code: "006", capital: "ALESSANDRIA" },
	AN: { code: "042", capital: "ANCONA" },
	AO: { code: "007", capital: "AOSTA" },
	AP: { code: "044", capital: "ASCOLI PICENO" },
	AQ: { code: "066", capital: "L'AQUILA" },
	AR: { code: "051", capital: "AREZZO" },
	AT: { code: "005", capital: "ASTI" },
	AV: { code: "064", capital: "AVELLINO" },
	BA: { code: "072", capital: "BARI" },
	BG: { code: "016", capital: "BERGAMO" },
	BI: { code: "096", capital: "BIELLA" },
	BL: { code: "025", capital: "BELLUNO" },
	BN: { code: "062", capital: "BENEVENTO" },
	BO: { code: "037", capital: "BOLOGNA" },
	BR: { code: "074", capital: "BRINDISI" },
	BS: { code: "017", capital: "BRESCIA" },
	BT: { code: "110", capital: "ANDRIA" },
	BZ: { code: "021", capital: "BOLZANO" },
	CA: { code: "092", capital: "CAGLIARI" },
	CB: { code: "070", capital: "CAMPOBASSO" },
	CE: { code: "061", capital: "CASERTA" },
	CH: { code: "069", capital: "CHIETI" },
	CL: { code: "085", capital: "CALTANISSETTA" },
	CN: { code: "004", capital: "CUNEO" },
	CO: { code: "013", capital: "COMO" },
	CR: { code: "019", capital: "CREMONA" },
	CS: { code: "078", capital: "COSENZA" },
	CT: { code: "087", capital: "CATANIA" },
	CZ: { code: "079", capital: "CATANZARO" },
	EN: { code: "086", capital: "ENNA" },
	FC: { code: "040", capital: "FORLI'" },
	FE: { code: "038", capital: "FERRARA" },
	FG: { code: "071", capital: "FOGGIA" },
	FI: { code: "048", capital: "FIRENZE" },
	FM: { code: "109", capital: "FERMO" },
	FR: { code: "060", capital: "FROSINONE" },
	GE: { code: "010", capital: "GENOVA" },
	GO: { code: "031", capital: "GORIZIA" },
	GR: { code: "053", capital: "GROSSETO" },
	IM: { code: "008", capital: "IMPERIA" },
	IS: { code: "094", capital: "ISERNIA" },
	KR: { code: "101", capital: "CROTONE" },
	LC: { code: "097", capital: "LECCO" },
	LE: { code: "075", capital: "LECCE" },
	LI: { code: "049", capital: "LIVORNO" },
	LO: { code: "098", capital: "LODI" },
	LT: { code: "059", capital: "LATINA" },
	LU: { code: "046", capital: "LUCCA" },
	MB: { code: "108", capital: "MONZA" },
	MC: { code: "043", capital: "MACERATA" },
	ME: { code: "083", capital: "MESSINA" },
	MI: { code: "015", capital: "MILANO" },
	MN: { code: "020", capital: "MANTOVA" },
	MO: { code: "036", capital: "MODENA" },
	MS: { code: "045", capital: "MASSA" },
	MT: { code: "077", capital: "MATERA" },
	NA: { code: "063", capital: "NAPOLI" },
	NO: { code: "003", capital: "NOVARA" },
	NU: { code: "091", capital: "NUORO" },
	OR: { code: "095", capital: "ORISTANO" },
	PA: { code: "082", capital: "PALERMO" },
	PC: { code: "033", capital: "PIACENZA" },
	PD: { code: "028", capital: "PADOVA" },
	PE: { code: "068", capital: "PESCARA" },
	PG: { code: "054", capital: "PERUGIA" },
	PI: { code: "050", capital: "PISA" },
	PN: { code: "093", capital: "PORDENONE" },
	PO: { code: "100", capital: "PRATO" },
	PR: { code: "034", capital: "PARMA" },
	PT: { code: "047", capital: "PISTOIA" },
	PU: { code: "041", capital: "PESARO" },
	PV: { code: "018", capital: "PAVIA" },
	PZ: { code: "076", capital: "POTENZA" },
	RA: { code: "039", capital: "RAVENNA" },
	RC: { code: "080", capital: "REGGIO CALABRIA" },
	RE: { code: "035", capital: "REGGIO EMILIA" },
	RG: { code: "088", capital: "RAGUSA" },
	RI: { code: "057", capital: "RIETI" },
	RM: { code: "058", capital: "ROMA" },
	RN: { code: "099", capital: "RIMINI" },
	RO: { code: "029", capital: "ROVIGO" },
	SA: { code: "065", capital: "SALERNO" },
	SI: { code: "052", capital: "SIENA" },
	SO: { code: "014", capital: "SONDRIO" },
	SP: { code: "011", capital: "LA SPEZIA" },
	SR: { code: "089", capital: "SIRACUSA" },
	SS: { code: "090", capital: "SASSARI" },
	SV: { code: "009", capital: "SAVONA" },
	TA: { code: "073", capital: "TARANTO" },
	TE: { code: "067", capital: "TERAMO" },
	TN: { code: "022", capital: "TRENTO" },
	TO: { code: "001", capital: "TORINO" },
	TP: { code: "081", capital: "TRAPANI" },
	TR: { code: "055", capital: "TERNI" },
	TS: { code: "032", capital: "TRIESTE" },
	TV: { code: "026", capital: "TREVISO" },
	UD: { code: "030", capital: "UDINE" },
	VA: { code: "012", capital: "VARESE" },
	VB: { code: "103", capital: "VERBANIA" },
	VC: { code: "002", capital: "VERCELLI" },
	VE: { code: "027", capital: "VENEZIA" },
	VI: { code: "024", capital: "VICENZA" },
	VR: { code: "023", capital: "VERONA" },
	VT: { code: "056", capital: "VITERBO" },
	VV: { code: "102", capital: "VIBO VALENTIA" },
};

const siglaByProvinceCode = new Map(
	Object.entries(PROVINCES).map(([sigla, p]) => [p.code, sigla] as const),
);

/** The province sigla of a comune code (412058091 → "RM"); undefined for a country. */
export function getProvinceSigla(locationCode: number): string | undefined {
	const s = String(locationCode);
	if (!s.startsWith("4") || s.length !== 9) return undefined;
	return siglaByProvinceCode.get(s.slice(3, 6));
}

/** A province's capoluogo as a CARGOS place ("GE" → GENOVA). */
export function getProvinceCapital(
	sigla: string,
): { name: string; code: number } | undefined {
	const p = PROVINCES[sigla.trim().toUpperCase()];
	if (!p) return undefined;
	const code = getLocationCode(p.capital);
	return code === undefined ? undefined : { name: p.capital, code };
}

// «MIT-UCO»: the single national office (Ufficio Centrale Operativo, Roma) that
// prints every centrally-issued Italian licence.
const NATIONAL_OFFICE = /^mit\s*[-–/ ]?\s*uco$/i;
// «MC-GE», «MCTC-GE», «M.C.T.C. GE», «UMC GE»: a provincial Motorizzazione
// office, named by the sigla of the province whose capoluogo it sits in.
const PROVINCIAL_OFFICE =
	/^(?:m\.?\s*c\.?(?:\s*t\.?\s*c\.?)?|u\.?\s*m\.?\s*c\.?)\s*[-–/ ]?\s*([a-z]{2})$/i;
// «COMUNE DI BRESCIA»: a CIE's issuer IS a comune.
const COMUNE_PREFIX = /^comune\s+di\s+/i;
// Issuers that are not places (passport, permesso di soggiorno…).
const ISSUING_BODY =
	/^(ministero|minister|prefettura|questura|ambasciata|consolato|commissariato|motorizzazione)\b/i;

/**
 * The CARGOS place an issuing authority printed on a document stands for, or
 * undefined when it is not a place. Handles the licence's field 4c («4c MC-GE»).
 */
export function resolveIssuingAuthority(
	value: string | null | undefined,
): { name: string; code: number } | undefined {
	const text = value?.replace(/^\s*4c(?:\s*[.):-]\s*|\s+)/i, "").trim();
	if (!text) return undefined;
	if (NATIONAL_OFFICE.test(text)) return getProvinceCapital("RM");
	const office = PROVINCIAL_OFFICE.exec(text);
	if (office?.[1]) return getProvinceCapital(office[1]);
	if (ISSUING_BODY.test(text)) return undefined;
	const place = text.replace(COMUNE_PREFIX, "").trim();
	const code = getLocationCode(place);
	if (code === undefined) return undefined;
	return { name: lookupLocation(code) ?? place, code };
}

import { describe, expect, test } from "bun:test";
import {
	getProvinceCapital,
	getProvinceSigla,
	PROVINCES,
	resolveIssuingAuthority,
} from "./provinces";
import { getLocationCode } from "./tables";

describe("PROVINCES", () => {
	test("every capoluogo resolves and belongs to its own province", () => {
		for (const [sigla, p] of Object.entries(PROVINCES)) {
			const code = getLocationCode(p.capital);
			expect(code, sigla).toBeDefined();
			expect(String(code).slice(3, 6), sigla).toBe(p.code);
			expect(getProvinceSigla(code as number)).toBe(sigla);
		}
	});

	test("covers the 106 province codes in the table", () => {
		expect(Object.keys(PROVINCES)).toHaveLength(106);
	});

	test("a sigla gives its capoluogo, any case; an unknown one nothing", () => {
		expect(getProvinceCapital("ge")).toEqual({
			name: "GENOVA",
			code: getLocationCode("GENOVA") as number,
		});
		expect(getProvinceCapital("ZZ")).toBeUndefined();
	});

	test("a country has no province", () => {
		expect(
			getProvinceSigla(getLocationCode("ITALIA") as number),
		).toBeUndefined();
	});
});

describe("resolveIssuingAuthority", () => {
	const genova = getLocationCode("GENOVA");
	const roma = getLocationCode("ROMA");

	test("a provincial Motorizzazione office is its capoluogo", () => {
		for (const printed of [
			"MC-GE",
			"mc ge",
			"MCTC-GE",
			"M.C.T.C. GE",
			"UMC GE",
			"4c MC-GE",
		]) {
			expect(resolveIssuingAuthority(printed), printed).toEqual({
				name: "GENOVA",
				code: genova as number,
			});
		}
	});

	test("MIT-UCO is Roma", () => {
		expect(resolveIssuingAuthority("MIT-UCO")?.code).toBe(roma as number);
		expect(resolveIssuingAuthority("4c MIT-UCO")?.code).toBe(roma as number);
	});

	test("a comune, with or without «COMUNE DI»", () => {
		expect(resolveIssuingAuthority("COMUNE DI GENOVA")?.code).toBe(
			genova as number,
		);
		expect(resolveIssuingAuthority("Genova")?.code).toBe(genova as number);
	});

	test("bodies that are not places, unknown sigle and blanks resolve to nothing", () => {
		for (const printed of [
			"MINISTERO DELL'INTERNO",
			"QUESTURA DI ROMA",
			"MC-ZZ",
			"",
			null,
			undefined,
		]) {
			expect(resolveIssuingAuthority(printed), String(printed)).toBeUndefined();
		}
	});
});

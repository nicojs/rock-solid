# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.2.2](https://github.com/nicojs/rock-solid/compare/v1.2.1...v1.2.2) (2024-01-20)

**Note:** Version bump only for package @rock-solid/shared

## [1.2.1](https://github.com/nicojs/rock-solid/compare/v1.2.0...v1.2.1) (2024-01-20)

### Bug Fixes

- **import:** importeer de juiste deelgemeenten ([#189](https://github.com/nicojs/rock-solid/issues/189)) ([936d9ee](https://github.com/nicojs/rock-solid/commit/936d9ee60a937b3af475c9c8da8f2d0ba609abd3))

### Features

- **projectverantwoordelijke:** allow write actions on aanmeldingen ([#187](https://github.com/nicojs/rock-solid/issues/187)) ([190c11f](https://github.com/nicojs/rock-solid/commit/190c11fc3bd5d498d706a040f10aff5ea6c7363c))

# 1.2.0 (2024-01-17)

### Bug Fixes

- focus begeleiders based on selectie ([5245250](https://github.com/nicojs/rock-solid/commit/5245250c0d4ba5a3f19067fe7bc4440def7b0e0b)), closes [#40](https://github.com/nicojs/rock-solid/issues/40)
- **update:** support clearing of nullable fields ([#163](https://github.com/nicojs/rock-solid/issues/163)) ([39693d4](https://github.com/nicojs/rock-solid/commit/39693d44ed1f687542ee93c263e02677dc69a3ce))

### Features

- **aanmelding:** add "opmerking" field ([#177](https://github.com/nicojs/rock-solid/issues/177)) ([16e5a45](https://github.com/nicojs/rock-solid/commit/16e5a453d99d8ad926e1b1476b31603e3f57b3af))
- **aanmelding:** copy all reported fields ([#114](https://github.com/nicojs/rock-solid/issues/114)) ([58f555e](https://github.com/nicojs/rock-solid/commit/58f555ecaac106e32d44f6b814adfe7216d81b68))
- **aanmeldingen:** add export functionality ([#84](https://github.com/nicojs/rock-solid/issues/84)) ([f4e4696](https://github.com/nicojs/rock-solid/commit/f4e46966441deba3da4d0d7b3c5e59615e376840))
- **aanmeldingen:** Rename "inschrijving" -> "aanmelding" ([c1d3eac](https://github.com/nicojs/rock-solid/commit/c1d3eac178621bfafa6cec5924afa0d8e2882149)), closes [#64](https://github.com/nicojs/rock-solid/issues/64) [#60](https://github.com/nicojs/rock-solid/issues/60)
- **aanmelding:** override deelnemer fields ([#176](https://github.com/nicojs/rock-solid/issues/176)) ([abb0568](https://github.com/nicojs/rock-solid/commit/abb05683d8ea002a921be3ab5c0f3a29fa1eed7d))
- **auth:** add "financieelBeheerder" role ([#160](https://github.com/nicojs/rock-solid/issues/160)) ([09692f7](https://github.com/nicojs/rock-solid/commit/09692f7706fb4345e5ac22a152c4a0cca4568818))
- **backup:** add db backup functionality for admins ([#148](https://github.com/nicojs/rock-solid/issues/148)) ([9d70067](https://github.com/nicojs/rock-solid/commit/9d70067a5ae1a6f3b25231bd785190435b4a35b9))
- **brand:** add some branding ([#115](https://github.com/nicojs/rock-solid/issues/115)) ([078122a](https://github.com/nicojs/rock-solid/commit/078122aa2ddcef616bea6f21bbabc6219f51c26e))
- **brieven:** add brieven to project aanmeldingen ([#135](https://github.com/nicojs/rock-solid/issues/135)) ([31482f3](https://github.com/nicojs/rock-solid/commit/31482f315503c7effb23588c0c5142173d3084b5))
- **cursus-prijs:** implement cursus prijs ([#102](https://github.com/nicojs/rock-solid/issues/102)) ([b2230e4](https://github.com/nicojs/rock-solid/commit/b2230e45d0a0c1949bd87b90ec88edb82fa1b375))
- **cursus:** add locatie ([#174](https://github.com/nicojs/rock-solid/issues/174)) ([4c92bbd](https://github.com/nicojs/rock-solid/commit/4c92bbdb5e8ab98f308452f2022765cd32092cd3))
- **deelnemer:** add contactpersoon ([#133](https://github.com/nicojs/rock-solid/issues/133)) ([d0ac061](https://github.com/nicojs/rock-solid/commit/d0ac061a1e4e95cfb223bf00b18cbbec85c55771))
- **deelnemer:** add filter for "aanmelding x jaar geleden of langer" ([#150](https://github.com/nicojs/rock-solid/issues/150)) ([a7f65b7](https://github.com/nicojs/rock-solid/commit/a7f65b7361c3736863cb6f259b45fce09c92e9eb))
- **deelnemer:** allow empty adres ([#107](https://github.com/nicojs/rock-solid/issues/107)) ([c7be176](https://github.com/nicojs/rock-solid/commit/c7be1765cf298e070f88379d3c7fe076fb7bd581))
- **deelnemer:** navigate to deelnemer from aanmelding ([#105](https://github.com/nicojs/rock-solid/issues/105)) ([41ebc36](https://github.com/nicojs/rock-solid/commit/41ebc36c0a1975ee18de65a6196f4c0e2e91c038))
- **deelnemer:** sync order of fields with inschrijfformulier ([#166](https://github.com/nicojs/rock-solid/issues/166)) ([615a36a](https://github.com/nicojs/rock-solid/commit/615a36a8bf06636dbafee73f7c102c49ce4d96cf))
- **deelnemer:** toestemmingFotos to deelnemer ([#87](https://github.com/nicojs/rock-solid/issues/87)) ([dc0efe7](https://github.com/nicojs/rock-solid/commit/dc0efe71ef7a50c96b25883526ea3753fb9bb852))
- **deep linking:** support deep linking to pages and search parameters ([#137](https://github.com/nicojs/rock-solid/issues/137)) ([d355f5e](https://github.com/nicojs/rock-solid/commit/d355f5e022fc9ff1adbf17a99e7e056a85bd86d8))
- **filtering:** support 'metAdres' filter for organisatie and persoon ([#164](https://github.com/nicojs/rock-solid/issues/164)) ([87abc6a](https://github.com/nicojs/rock-solid/commit/87abc6aaa0798dc6d246ac752f2a718068b09fc8))
- **folder:** add infoboekje ([#106](https://github.com/nicojs/rock-solid/issues/106)) ([6c64a1b](https://github.com/nicojs/rock-solid/commit/6c64a1bd32e5b9e6faec54f63f48bb02a4ad34b7))
- **folders:** add foldervoorkeur to deelnemer ([#119](https://github.com/nicojs/rock-solid/issues/119)) ([ee8a876](https://github.com/nicojs/rock-solid/commit/ee8a876963662d2830a85b086868cc06c3381c3f)), closes [#117](https://github.com/nicojs/rock-solid/issues/117)
- **geslacht:** add geslacht X ([#93](https://github.com/nicojs/rock-solid/issues/93)) ([86841e3](https://github.com/nicojs/rock-solid/commit/86841e33b3c0275503daa72dc72e59acda7aaf26))
- **organisatie:** remove "doelgroep" ([#98](https://github.com/nicojs/rock-solid/issues/98)) ([435cba4](https://github.com/nicojs/rock-solid/commit/435cba4d9f50a0591fd00a94b3a77164d087c0cf))
- **personen:** Add delete persoon functionality. ([6a70747](https://github.com/nicojs/rock-solid/commit/6a70747f11378477f055c52c54eacdc0fa9daf28))
- **personen:** add search on leeftijd ([#136](https://github.com/nicojs/rock-solid/issues/136)) ([ca54d40](https://github.com/nicojs/rock-solid/commit/ca54d40506f75ed181f4a4efa86fa3506476fddf))
- **project:** add begeleidingsuren ([#99](https://github.com/nicojs/rock-solid/issues/99)) ([0af6f55](https://github.com/nicojs/rock-solid/commit/0af6f55027cc274e4a681485007f0f41ac661f39))
- **rekeninguittreksels:** implement screen to edit all rekeninguittreksels for a cursus ([#85](https://github.com/nicojs/rock-solid/issues/85)) ([790add7](https://github.com/nicojs/rock-solid/commit/790add75954ed04b992d9d7c79101598de1cb725))
- **report:** allow filter on aanmeldingsstatus ([#95](https://github.com/nicojs/rock-solid/issues/95)) ([23e878e](https://github.com/nicojs/rock-solid/commit/23e878e3bf6c411ca107ec431e8ccc156b2b85fa))
- **report:** support report on activiteit level ([#100](https://github.com/nicojs/rock-solid/issues/100)) ([36ceb1f](https://github.com/nicojs/rock-solid/commit/36ceb1f549e3f63ba04035c471a45ba34f5c4316))
- **roles:** implement role based authorization ([#83](https://github.com/nicojs/rock-solid/issues/83)) ([c604a1d](https://github.com/nicojs/rock-solid/commit/c604a1d952392f0583e161f0517dbb7f8a24886a))
- **search:** add advanced project search ([#139](https://github.com/nicojs/rock-solid/issues/139)) ([36e2899](https://github.com/nicojs/rock-solid/commit/36e2899f6543f26475ab308ee80b5203ed64f417))
- **soort opmerking:** add soort opmerking to organisatie. ([#142](https://github.com/nicojs/rock-solid/issues/142)) ([e94670d](https://github.com/nicojs/rock-solid/commit/e94670daf08801e44155366e3c0dc255a61e6b0c))
- **sqlite:** migrate from PostgreSQL to SQLite ([#141](https://github.com/nicojs/rock-solid/issues/141)) ([916078e](https://github.com/nicojs/rock-solid/commit/916078e7e6d730793f93c3616f972b816d3d0dca))
- **toestemming:** Allow toestemming for foto's for different doeleinden. ([#134](https://github.com/nicojs/rock-solid/issues/134)) ([b827d22](https://github.com/nicojs/rock-solid/commit/b827d2264142d460de09ac6be520b17d91e1ffec))
- **usability:** radio buttons and checkboxes instead of selects ([9becee0](https://github.com/nicojs/rock-solid/commit/9becee0dcfb6bb7f55f6518b9ced6e84b9b8af53))
- **vakanties:** add bestemming and land ([#103](https://github.com/nicojs/rock-solid/issues/103)) ([bc707cf](https://github.com/nicojs/rock-solid/commit/bc707cf614ce3a328135a49abdf75a939fc91c22))
- **vakantie:** use saldo + voorschot instead of prijs ([#101](https://github.com/nicojs/rock-solid/issues/101)) ([66f4cbd](https://github.com/nicojs/rock-solid/commit/66f4cbd261da601a0e285daf845b17398c95c73e))
- **voedingswens:** Add opmerking ([#109](https://github.com/nicojs/rock-solid/issues/109)) ([2728f0f](https://github.com/nicojs/rock-solid/commit/2728f0f72c2b2e9dbd9a901a80dc90f24b0d4273))
- **woonsituatie:** update woonsituaties ([#110](https://github.com/nicojs/rock-solid/issues/110)) ([5071fc6](https://github.com/nicojs/rock-solid/commit/5071fc64d0d9264ff110464c65f20c9b3fe01141))

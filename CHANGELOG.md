# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.2.3](https://github.com/nicojs/rock-solid/compare/v1.2.2...v1.2.3) (2024-01-21)

### Bug Fixes

- **routing:** kleine schoonheidsfoutjes opgelost ([#193](https://github.com/nicojs/rock-solid/issues/193)) ([c367c03](https://github.com/nicojs/rock-solid/commit/c367c0313796cc7ccc62f7fb9719a86e6b3d776d))

## [1.2.2](https://github.com/nicojs/rock-solid/compare/v1.2.1...v1.2.2) (2024-01-20)

### Features

- **bedragen:** bedragen niet afkappen naar de volgende regel ([#191](https://github.com/nicojs/rock-solid/issues/191)) ([c112fd0](https://github.com/nicojs/rock-solid/commit/c112fd04c20dc981a322d5c99c877318615b8e4b))
- **projectenlijst:** locaties tonen ([#192](https://github.com/nicojs/rock-solid/issues/192)) ([33cd163](https://github.com/nicojs/rock-solid/commit/33cd163ee204198026cf522304909d18e251afc9))

## [1.2.1](https://github.com/nicojs/rock-solid/compare/v1.2.0...v1.2.1) (2024-01-20)

### Bug Fixes

- **import:** importeer de juiste deelgemeenten ([#189](https://github.com/nicojs/rock-solid/issues/189)) ([936d9ee](https://github.com/nicojs/rock-solid/commit/936d9ee60a937b3af475c9c8da8f2d0ba609abd3))

### Features

- **home:** voer versie nummer toe op het hoofdscherm ([#190](https://github.com/nicojs/rock-solid/issues/190)) ([15e9bcc](https://github.com/nicojs/rock-solid/commit/15e9bcc04935b17937fc548f076a0239403f41bf))
- **projectverantwoordelijke:** allow write actions on aanmeldingen ([#187](https://github.com/nicojs/rock-solid/issues/187)) ([190c11f](https://github.com/nicojs/rock-solid/commit/190c11fc3bd5d498d706a040f10aff5ea6c7363c))

# 1.2.0 (2024-01-17)

### Bug Fixes

- **advanced search:** prevent rendering the component twice. ([#183](https://github.com/nicojs/rock-solid/issues/183)) ([9d79a18](https://github.com/nicojs/rock-solid/commit/9d79a180152fc2639ae84e9c1fdde97145cd1ebb))
- **create cursus:** support changing date/time ([d9111ba](https://github.com/nicojs/rock-solid/commit/d9111ba419ec146a2ab9c78551051cb342268109)), closes [#37](https://github.com/nicojs/rock-solid/issues/37)
- **dark mode:** correctly color close buttons ([#184](https://github.com/nicojs/rock-solid/issues/184)) ([85b07df](https://github.com/nicojs/rock-solid/commit/85b07dfcabcdcceda123a7c2dea5202bd8487704))
- focus begeleiders based on selectie ([5245250](https://github.com/nicojs/rock-solid/commit/5245250c0d4ba5a3f19067fe7bc4440def7b0e0b)), closes [#40](https://github.com/nicojs/rock-solid/issues/40)
- **inschrijven:** improve label ([85d6816](https://github.com/nicojs/rock-solid/commit/85d68169f401b69c7483561dc1c824196cd989b7)), closes [#42](https://github.com/nicojs/rock-solid/issues/42)
- **inschrijving:** fix eerste inschrijving bug ([05a93f9](https://github.com/nicojs/rock-solid/commit/05a93f916dae41a96148d178277cd8b90338487d)), closes [#45](https://github.com/nicojs/rock-solid/issues/45)
- **nav:** remove redundant navigation ([#169](https://github.com/nicojs/rock-solid/issues/169)) ([44bae03](https://github.com/nicojs/rock-solid/commit/44bae03fefdb54c79e0e0dff097ef6d639d6a642))
- **organisatie export:** remove second 'adres' column ([#165](https://github.com/nicojs/rock-solid/issues/165)) ([1a53a62](https://github.com/nicojs/rock-solid/commit/1a53a6231c0b56a890c7c551133cb6b61122cdcb))
- **organisatie:** allow duplicate TAV ([#94](https://github.com/nicojs/rock-solid/issues/94)) ([5b136d8](https://github.com/nicojs/rock-solid/commit/5b136d888fe259a0aa413c015c3d1fa77e5c4c38))
- **overig persoon:** allow delete of overig persoon with selectie ([#162](https://github.com/nicojs/rock-solid/issues/162)) ([0e3efac](https://github.com/nicojs/rock-solid/commit/0e3efac531d19c275d07abc8caaab41e9e06725f))
- **plaatsen:** allow plaatsen with duplicate postcode ([#186](https://github.com/nicojs/rock-solid/issues/186)) ([6882a22](https://github.com/nicojs/rock-solid/commit/6882a221ba72aa8edf17c3a9483f82f752a0ea9e))
- **projecten-list:** neatly allign activiteit datums ([#182](https://github.com/nicojs/rock-solid/issues/182)) ([46dcb2f](https://github.com/nicojs/rock-solid/commit/46dcb2fde0687f6610797b812c04db674fe002c3))
- **projecten:** remove side effect ([#171](https://github.com/nicojs/rock-solid/issues/171)) ([8560db5](https://github.com/nicojs/rock-solid/commit/8560db56720bc87b0c9ea7e8e96bb00e3c331772))
- **roles:** projectverantwoordelijke ([9177c5b](https://github.com/nicojs/rock-solid/commit/9177c5b74d2f2a0bab642e8ae6473fc1ab613a4e))
- **search:** make search component responsive ([#138](https://github.com/nicojs/rock-solid/issues/138)) ([34a2264](https://github.com/nicojs/rock-solid/commit/34a2264854f6e0670b24a5600fbaa405a0c79c0e))
- **seed:** don't allow invalid dates for geboortedatum ([6d5338f](https://github.com/nicojs/rock-solid/commit/6d5338f13f75e135bc520578c0eedf4f28d72baa))
- start script ([dc70e73](https://github.com/nicojs/rock-solid/commit/dc70e73146c5f8678342b020dcd1521bd1124d41))
- **tags component:** keep focus when selecting tags ([63408e0](https://github.com/nicojs/rock-solid/commit/63408e0c94a66b25010b0a4c3c6d520acd2dc455))
- **timezones:** correctly handle timezones ([a8c6f46](https://github.com/nicojs/rock-solid/commit/a8c6f46654ab37fa7b858fbdbe7c4480e13cacc1))
- **update:** support clearing of nullable fields ([#163](https://github.com/nicojs/rock-solid/issues/163)) ([39693d4](https://github.com/nicojs/rock-solid/commit/39693d44ed1f687542ee93c263e02677dc69a3ce))
- **voedingswens:** remove duplicate field ([d1e0a55](https://github.com/nicojs/rock-solid/commit/d1e0a55e31cd9d2bfadc89c462d36520d383959b))

### Features

- **aanmelding:** add "opmerking" field ([#177](https://github.com/nicojs/rock-solid/issues/177)) ([16e5a45](https://github.com/nicojs/rock-solid/commit/16e5a453d99d8ad926e1b1476b31603e3f57b3af))
- **aanmelding:** copy all reported fields ([#114](https://github.com/nicojs/rock-solid/issues/114)) ([58f555e](https://github.com/nicojs/rock-solid/commit/58f555ecaac106e32d44f6b814adfe7216d81b68))
- **aanmeldingen:** add export functionality ([#84](https://github.com/nicojs/rock-solid/issues/84)) ([f4e4696](https://github.com/nicojs/rock-solid/commit/f4e46966441deba3da4d0d7b3c5e59615e376840))
- **aanmeldingen:** delete aanmeldingen ([#92](https://github.com/nicojs/rock-solid/issues/92)) ([d536b24](https://github.com/nicojs/rock-solid/commit/d536b2403ae7a932c14a873637472dedc2299de2))
- **aanmeldingen:** Rename "inschrijving" -> "aanmelding" ([c1d3eac](https://github.com/nicojs/rock-solid/commit/c1d3eac178621bfafa6cec5924afa0d8e2882149)), closes [#64](https://github.com/nicojs/rock-solid/issues/64) [#60](https://github.com/nicojs/rock-solid/issues/60)
- **aanmeldingen:** small look and feel improvements on aanmeldingen screen ([#180](https://github.com/nicojs/rock-solid/issues/180)) ([c2f419c](https://github.com/nicojs/rock-solid/commit/c2f419cdf07ced804d1b8fbd6112413ed28d3393))
- **aanmelding:** override deelnemer fields ([#176](https://github.com/nicojs/rock-solid/issues/176)) ([abb0568](https://github.com/nicojs/rock-solid/commit/abb05683d8ea002a921be3ab5c0f3a29fa1eed7d))
- **activiteit:** set default start time to 18:30. ([#172](https://github.com/nicojs/rock-solid/issues/172)) ([d86fa62](https://github.com/nicojs/rock-solid/commit/d86fa6249b3b55f1c8d1914bca0a454c587edd69))
- **auth:** add "financieelBeheerder" role ([#160](https://github.com/nicojs/rock-solid/issues/160)) ([09692f7](https://github.com/nicojs/rock-solid/commit/09692f7706fb4345e5ac22a152c4a0cca4568818))
- **backup:** add db backup functionality for admins ([#148](https://github.com/nicojs/rock-solid/issues/148)) ([9d70067](https://github.com/nicojs/rock-solid/commit/9d70067a5ae1a6f3b25231bd785190435b4a35b9))
- **brand:** add some branding ([#115](https://github.com/nicojs/rock-solid/issues/115)) ([078122a](https://github.com/nicojs/rock-solid/commit/078122aa2ddcef616bea6f21bbabc6219f51c26e))
- **brieven:** add brieven to project aanmeldingen ([#135](https://github.com/nicojs/rock-solid/issues/135)) ([31482f3](https://github.com/nicojs/rock-solid/commit/31482f315503c7effb23588c0c5142173d3084b5))
- **cursus-prijs:** implement cursus prijs ([#102](https://github.com/nicojs/rock-solid/issues/102)) ([b2230e4](https://github.com/nicojs/rock-solid/commit/b2230e45d0a0c1949bd87b90ec88edb82fa1b375))
- **cursus:** add locatie ([#174](https://github.com/nicojs/rock-solid/issues/174)) ([4c92bbd](https://github.com/nicojs/rock-solid/commit/4c92bbdb5e8ab98f308452f2022765cd32092cd3))
- **dark-mode:** add dark mode ([#178](https://github.com/nicojs/rock-solid/issues/178)) ([6e62f20](https://github.com/nicojs/rock-solid/commit/6e62f2005fec474a65c3cd139ccb2b5cc0b04ac4))
- **deelnemer:** add contactpersoon ([#133](https://github.com/nicojs/rock-solid/issues/133)) ([d0ac061](https://github.com/nicojs/rock-solid/commit/d0ac061a1e4e95cfb223bf00b18cbbec85c55771))
- **deelnemer:** add filter for "aanmelding x jaar geleden of langer" ([#150](https://github.com/nicojs/rock-solid/issues/150)) ([a7f65b7](https://github.com/nicojs/rock-solid/commit/a7f65b7361c3736863cb6f259b45fce09c92e9eb))
- **deelnemer:** add geboorteplaats ([#175](https://github.com/nicojs/rock-solid/issues/175)) ([3755297](https://github.com/nicojs/rock-solid/commit/3755297c137785461b8629fd7c6f575c8f8c40c9))
- **deelnemer:** allow empty adres ([#107](https://github.com/nicojs/rock-solid/issues/107)) ([c7be176](https://github.com/nicojs/rock-solid/commit/c7be1765cf298e070f88379d3c7fe076fb7bd581))
- **deelnemer:** navigate to deelnemer from aanmelding ([#105](https://github.com/nicojs/rock-solid/issues/105)) ([41ebc36](https://github.com/nicojs/rock-solid/commit/41ebc36c0a1975ee18de65a6196f4c0e2e91c038))
- **deelnemerslijst:** add deelnemerslijst print functionality ([#140](https://github.com/nicojs/rock-solid/issues/140)) ([4dddaab](https://github.com/nicojs/rock-solid/commit/4dddaab89cf3e8f77b00a5b4417a411a2210ec0b))
- **deelnemer:** sync order of fields with inschrijfformulier ([#166](https://github.com/nicojs/rock-solid/issues/166)) ([615a36a](https://github.com/nicojs/rock-solid/commit/615a36a8bf06636dbafee73f7c102c49ce4d96cf))
- **deelnemer:** toestemmingFotos to deelnemer ([#87](https://github.com/nicojs/rock-solid/issues/87)) ([dc0efe7](https://github.com/nicojs/rock-solid/commit/dc0efe71ef7a50c96b25883526ea3753fb9bb852))
- **deep linking:** support deep linking to pages and search parameters ([#137](https://github.com/nicojs/rock-solid/issues/137)) ([d355f5e](https://github.com/nicojs/rock-solid/commit/d355f5e022fc9ff1adbf17a99e7e056a85bd86d8))
- **filtering:** support 'metAdres' filter for organisatie and persoon ([#164](https://github.com/nicojs/rock-solid/issues/164)) ([87abc6a](https://github.com/nicojs/rock-solid/commit/87abc6aaa0798dc6d246ac752f2a718068b09fc8))
- **folder:** add infoboekje ([#106](https://github.com/nicojs/rock-solid/issues/106)) ([6c64a1b](https://github.com/nicojs/rock-solid/commit/6c64a1bd32e5b9e6faec54f63f48bb02a4ad34b7))
- **folders:** add foldervoorkeur to deelnemer ([#119](https://github.com/nicojs/rock-solid/issues/119)) ([ee8a876](https://github.com/nicojs/rock-solid/commit/ee8a876963662d2830a85b086868cc06c3381c3f)), closes [#117](https://github.com/nicojs/rock-solid/issues/117)
- **geslacht:** add geslacht X ([#93](https://github.com/nicojs/rock-solid/issues/93)) ([86841e3](https://github.com/nicojs/rock-solid/commit/86841e33b3c0275503daa72dc72e59acda7aaf26))
- **home:** add deep links to cursussen page on home screen ([#181](https://github.com/nicojs/rock-solid/issues/181)) ([235913f](https://github.com/nicojs/rock-solid/commit/235913f9a98b58a3f5ca5343768f93dec2032fe4))
- **home:** add some counters to home screen ([#116](https://github.com/nicojs/rock-solid/issues/116)) ([2e561c9](https://github.com/nicojs/rock-solid/commit/2e561c9912da0c2519efab17b9b3a9b009f29bf5))
- **migrate:** enable prisma migrations ([#146](https://github.com/nicojs/rock-solid/issues/146)) ([07341f3](https://github.com/nicojs/rock-solid/commit/07341f3c9a056182a746a441144fe33ed49256b9))
- **organisatie:** empty contact for new organisatie ([#132](https://github.com/nicojs/rock-solid/issues/132)) ([2de4800](https://github.com/nicojs/rock-solid/commit/2de4800469314c236512375b42247227ffc5182c))
- **organisatie:** remove "doelgroep" ([#98](https://github.com/nicojs/rock-solid/issues/98)) ([435cba4](https://github.com/nicojs/rock-solid/commit/435cba4d9f50a0591fd00a94b3a77164d087c0cf))
- **personen:** Add delete persoon functionality. ([6a70747](https://github.com/nicojs/rock-solid/commit/6a70747f11378477f055c52c54eacdc0fa9daf28))
- **personen:** add search on leeftijd ([#136](https://github.com/nicojs/rock-solid/issues/136)) ([ca54d40](https://github.com/nicojs/rock-solid/commit/ca54d40506f75ed181f4a4efa86fa3506476fddf))
- **project:** add begeleidingsuren ([#99](https://github.com/nicojs/rock-solid/issues/99)) ([0af6f55](https://github.com/nicojs/rock-solid/commit/0af6f55027cc274e4a681485007f0f41ac661f39))
- **rekeninguittreksels:** implement screen to edit all rekeninguittreksels for a cursus ([#85](https://github.com/nicojs/rock-solid/issues/85)) ([790add7](https://github.com/nicojs/rock-solid/commit/790add75954ed04b992d9d7c79101598de1cb725))
- **report:** add export functionality ([#96](https://github.com/nicojs/rock-solid/issues/96)) ([9aa61a1](https://github.com/nicojs/rock-solid/commit/9aa61a1fcf754b26f41dd0bf69e6c5334e6796ef))
- **report:** allow filter on aanmeldingsstatus ([#95](https://github.com/nicojs/rock-solid/issues/95)) ([23e878e](https://github.com/nicojs/rock-solid/commit/23e878e3bf6c411ca107ec431e8ccc156b2b85fa))
- **report:** support report on activiteit level ([#100](https://github.com/nicojs/rock-solid/issues/100)) ([36ceb1f](https://github.com/nicojs/rock-solid/commit/36ceb1f549e3f63ba04035c471a45ba34f5c4316))
- **roles:** implement role based authorization ([#83](https://github.com/nicojs/rock-solid/issues/83)) ([c604a1d](https://github.com/nicojs/rock-solid/commit/c604a1d952392f0583e161f0517dbb7f8a24886a))
- **search:** add advanced project search ([#139](https://github.com/nicojs/rock-solid/issues/139)) ([36e2899](https://github.com/nicojs/rock-solid/commit/36e2899f6543f26475ab308ee80b5203ed64f417))
- **security:** install and configure helmet ([#112](https://github.com/nicojs/rock-solid/issues/112)) ([ea608d3](https://github.com/nicojs/rock-solid/commit/ea608d340fa12e367aeba7bca8865b3ccb499039))
- **seed:** delete unwanted deelnemers after seed ([#144](https://github.com/nicojs/rock-solid/issues/144)) ([c0463c3](https://github.com/nicojs/rock-solid/commit/c0463c3aaae890ed9f6bbd428f9fa9c04cba6768))
- **show-picker:** automatically show date picker on focus ([6e9f2da](https://github.com/nicojs/rock-solid/commit/6e9f2dab890d24a89bf0037b36b440d14b17539b))
- **soort opmerking:** add soort opmerking to organisatie. ([#142](https://github.com/nicojs/rock-solid/issues/142)) ([e94670d](https://github.com/nicojs/rock-solid/commit/e94670daf08801e44155366e3c0dc255a61e6b0c))
- **sqlite:** migrate from PostgreSQL to SQLite ([#141](https://github.com/nicojs/rock-solid/issues/141)) ([916078e](https://github.com/nicojs/rock-solid/commit/916078e7e6d730793f93c3616f972b816d3d0dca))
- **tags control:** support removing tags with backspace ([#168](https://github.com/nicojs/rock-solid/issues/168)) ([83079e8](https://github.com/nicojs/rock-solid/commit/83079e8147a0cb9cbc4fc091f05004932343afd4))
- **technical error:** add technical error modal dialog ([#143](https://github.com/nicojs/rock-solid/issues/143)) ([95dc476](https://github.com/nicojs/rock-solid/commit/95dc476a260eba4e6654cc30d19ade3553d3a33b))
- **toestemming:** Allow toestemming for foto's for different doeleinden. ([#134](https://github.com/nicojs/rock-solid/issues/134)) ([b827d22](https://github.com/nicojs/rock-solid/commit/b827d2264142d460de09ac6be520b17d91e1ffec))
- **usability:** radio buttons and checkboxes instead of selects ([9becee0](https://github.com/nicojs/rock-solid/commit/9becee0dcfb6bb7f55f6518b9ced6e84b9b8af53))
- **vakanties:** add bestemming and land ([#103](https://github.com/nicojs/rock-solid/issues/103)) ([bc707cf](https://github.com/nicojs/rock-solid/commit/bc707cf614ce3a328135a49abdf75a939fc91c22))
- **vakantie:** use saldo + voorschot instead of prijs ([#101](https://github.com/nicojs/rock-solid/issues/101)) ([66f4cbd](https://github.com/nicojs/rock-solid/commit/66f4cbd261da601a0e285daf845b17398c95c73e))
- verwijderen van projecten en organisaties ([#88](https://github.com/nicojs/rock-solid/issues/88)) ([dc35135](https://github.com/nicojs/rock-solid/commit/dc351356c27273924c063c52607973ba3f60bfbf))
- **voedingswens:** Add opmerking ([#109](https://github.com/nicojs/rock-solid/issues/109)) ([2728f0f](https://github.com/nicojs/rock-solid/commit/2728f0f72c2b2e9dbd9a901a80dc90f24b0d4273))
- **woonsituatie:** update woonsituaties ([#110](https://github.com/nicojs/rock-solid/issues/110)) ([5071fc6](https://github.com/nicojs/rock-solid/commit/5071fc64d0d9264ff110464c65f20c9b3fe01141))

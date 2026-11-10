import { createHash } from "node:crypto";

export const SKU_INITIALIZATION_MANIFEST_SHA256 = "78124c18d4b61bc8c5733a1f50a7cae0ae19b4cc3c45db4194a5a25f1f1649b6";
export const SKU_INITIALIZATION_CONFIRMATION = "ASSIGN_79_SKUS_WITHOUT_INVENTORY";

export type ApprovedSkuRow = {
  productSlug: string;
  variantPosition: number;
  productId: string;
  variantId: string;
  sku: string;
};

export const approvedSkuRows: ApprovedSkuRow[] = [
  { productSlug: "airtag-case", variantPosition: 0, productId: "1badb945-365a-5051-a1b5-abc11b078900", variantId: "cd3d5f89-b923-51b2-b26f-2069b556b09d", sku: "SGL-BAG-ATC-V01" },
  { productSlug: "reflective-gear-safety-reflector-baby-seagull", variantPosition: 0, productId: "ffc4f56b-7760-51b2-a660-f4c6fdea33c7", variantId: "3f4c36aa-2b4c-5af5-bb92-948fe182a568", sku: "SGL-ACC-BSR-V01" },
  { productSlug: "bike-cover-l", variantPosition: 0, productId: "c90e6cc3-2580-5045-a8d8-d0fe7b7415a4", variantId: "aeb56337-be1b-5930-8539-72c48c8efd99", sku: "SGL-BAG-BCL-V01" },
  { productSlug: "bike-cover", variantPosition: 0, productId: "0e880723-eea0-59aa-8914-d17e5bef8eb1", variantId: "b03c0cc6-5a4e-5668-8fa9-371b75a3d2c8", sku: "SGL-BAG-BCM-V01" },
  { productSlug: "bike-cover", variantPosition: 1, productId: "0e880723-eea0-59aa-8914-d17e5bef8eb1", variantId: "53e074b4-7a9d-5083-83b8-04341f91c524", sku: "SGL-BAG-BCM-V02" },
  { productSlug: "bike-cover", variantPosition: 2, productId: "0e880723-eea0-59aa-8914-d17e5bef8eb1", variantId: "d0d6f656-3dc7-50b5-868b-6f560c8538f7", sku: "SGL-BAG-BCM-V03" },
  { productSlug: "bike-cover", variantPosition: 4, productId: "0e880723-eea0-59aa-8914-d17e5bef8eb1", variantId: "c3a6bfd6-1e37-5718-921a-07d5cb5d4056", sku: "SGL-BAG-BCM-V05" },
  { productSlug: "bike-cover", variantPosition: 3, productId: "0e880723-eea0-59aa-8914-d17e5bef8eb1", variantId: "8ba28541-d11f-5614-8153-09ce1941f80a", sku: "SGL-BAG-BCM-V04" },
  { productSlug: "transporter-wheeled-duffel", variantPosition: 0, productId: "e07b09c0-c09b-5ae9-bd9d-812f7c3207d0", variantId: "84243b5c-4153-57d4-a942-a315c139dff6", sku: "SGL-BAG-BTC-V01" },
  { productSlug: "celtic-gull-tee-washed-black", variantPosition: 0, productId: "961d31f1-e817-5c9e-8fe8-ca64e47bc914", variantId: "f337c529-11e8-5da9-9751-1a864b808a85", sku: "SGL-WEA-CGT-V01" },
  { productSlug: "chrissy", variantPosition: 2, productId: "329a019c-0ced-599a-8d4b-2a808416e610", variantId: "7dbd0a2d-3152-5950-ac72-1d0c3823da4e", sku: "SGL-BIK-CHR-V03" },
  { productSlug: "chrissy", variantPosition: 1, productId: "329a019c-0ced-599a-8d4b-2a808416e610", variantId: "cb28adc8-feb0-5d7d-a19c-5b80d6c2834a", sku: "SGL-BIK-CHR-V02" },
  { productSlug: "chrissy", variantPosition: 7, productId: "329a019c-0ced-599a-8d4b-2a808416e610", variantId: "18625008-f98a-5928-9b8b-f0605513fa30", sku: "SGL-BIK-CHR-V08" },
  { productSlug: "chrissy", variantPosition: 3, productId: "329a019c-0ced-599a-8d4b-2a808416e610", variantId: "09fb0be4-88d4-552b-ac66-c815b4130962", sku: "SGL-BIK-CHR-V04" },
  { productSlug: "chrissy", variantPosition: 5, productId: "329a019c-0ced-599a-8d4b-2a808416e610", variantId: "ee7c68b8-1540-5f66-b831-28eec5bcf4f3", sku: "SGL-BIK-CHR-V06" },
  { productSlug: "chrissy", variantPosition: 4, productId: "329a019c-0ced-599a-8d4b-2a808416e610", variantId: "414bfb5d-dd11-52fc-a9c4-a825e85de6bb", sku: "SGL-BIK-CHR-V05" },
  { productSlug: "chrissy", variantPosition: 6, productId: "329a019c-0ced-599a-8d4b-2a808416e610", variantId: "5a51e5f5-22d9-595b-b06e-339e50191a9e", sku: "SGL-BIK-CHR-V07" },
  { productSlug: "chrissy", variantPosition: 0, productId: "329a019c-0ced-599a-8d4b-2a808416e610", variantId: "84e65cc8-7f9d-579b-9bc6-a031c16efc98", sku: "SGL-BIK-CHR-V01" },
  { productSlug: "chrissy-m", variantPosition: 1, productId: "aad277be-1b09-526a-9681-61959ee5cbdb", variantId: "eedefb8d-d8a8-5671-b1eb-6003af0cb13f", sku: "SGL-BIK-CHM-V02" },
  { productSlug: "chrissy-m", variantPosition: 0, productId: "aad277be-1b09-526a-9681-61959ee5cbdb", variantId: "4f6baf49-0ad3-580a-9d83-deec5045f11a", sku: "SGL-BIK-CHM-V01" },
  { productSlug: "chrissy-p", variantPosition: 1, productId: "0002d2d1-2a56-5ae6-a758-a2ea0d722042", variantId: "285a4302-3247-58e8-897c-2f0f2228f55c", sku: "SGL-BIK-CHP-V02" },
  { productSlug: "chrissy-p", variantPosition: 0, productId: "0002d2d1-2a56-5ae6-a758-a2ea0d722042", variantId: "2d4ddcae-42b9-55d4-a73e-8198290570a4", sku: "SGL-BIK-CHP-V01" },
  { productSlug: "chrissy-special", variantPosition: 1, productId: "957915f9-0ac3-5b38-8224-ff918c45c891", variantId: "0a09882c-c40f-54b9-8b59-97ab34a765dd", sku: "SGL-BIK-CHS-V02" },
  { productSlug: "chrissy-special", variantPosition: 0, productId: "957915f9-0ac3-5b38-8224-ff918c45c891", variantId: "17a421a8-3dfa-51b7-a643-851a324c201c", sku: "SGL-BIK-CHS-V01" },
  { productSlug: "chrissy-team", variantPosition: 3, productId: "3a72be38-bb00-5570-8925-614ccc5f84cf", variantId: "c42e9c7d-fd06-5963-9f2c-501d5bb2e83d", sku: "SGL-BIK-CHT-V04" },
  { productSlug: "chrissy-team", variantPosition: 2, productId: "3a72be38-bb00-5570-8925-614ccc5f84cf", variantId: "bb0a0622-9e5c-5c68-97bb-4c00a1ffb18a", sku: "SGL-BIK-CHT-V03" },
  { productSlug: "chrissy-team", variantPosition: 1, productId: "3a72be38-bb00-5570-8925-614ccc5f84cf", variantId: "fcc7a4aa-f012-5608-8fbf-3146ae7b5850", sku: "SGL-BIK-CHT-V02" },
  { productSlug: "chrissy-team", variantPosition: 7, productId: "3a72be38-bb00-5570-8925-614ccc5f84cf", variantId: "f23e6414-e4bd-50ce-9fcc-ee3915eec2bb", sku: "SGL-BIK-CHT-V08" },
  { productSlug: "chrissy-team", variantPosition: 6, productId: "3a72be38-bb00-5570-8925-614ccc5f84cf", variantId: "f4a00fe4-17ba-5441-97cc-4ada4a3537f1", sku: "SGL-BIK-CHT-V07" },
  { productSlug: "chrissy-team", variantPosition: 5, productId: "3a72be38-bb00-5570-8925-614ccc5f84cf", variantId: "757b3a77-a165-5607-86d6-16726dea0b6f", sku: "SGL-BIK-CHT-V06" },
  { productSlug: "chrissy-team", variantPosition: 4, productId: "3a72be38-bb00-5570-8925-614ccc5f84cf", variantId: "9654df3f-cd73-57da-8c23-485ff7067fab", sku: "SGL-BIK-CHT-V05" },
  { productSlug: "chrissy-team", variantPosition: 0, productId: "3a72be38-bb00-5570-8925-614ccc5f84cf", variantId: "e50550b4-bf2b-569a-8f88-769d244159f9", sku: "SGL-BIK-CHT-V01" },
  { productSlug: "chrissy1", variantPosition: 0, productId: "a03e6912-3638-5385-8d84-cc6750e250b6", variantId: "e4519da7-52a4-591a-ae51-75112929ada8", sku: "SGL-BIK-CTI-V01" },
  { productSlug: "chrissy1", variantPosition: 6, productId: "a03e6912-3638-5385-8d84-cc6750e250b6", variantId: "adcf50f3-24b9-517c-b378-c56f6e59800a", sku: "SGL-BIK-CTI-V07" },
  { productSlug: "chrissy1", variantPosition: 1, productId: "a03e6912-3638-5385-8d84-cc6750e250b6", variantId: "da24ecec-0be7-50f7-ba9a-df4b35b9e85a", sku: "SGL-BIK-CTI-V02" },
  { productSlug: "chrissy1", variantPosition: 2, productId: "a03e6912-3638-5385-8d84-cc6750e250b6", variantId: "c95ad9b4-5860-567b-a17c-21d3f9d8a138", sku: "SGL-BIK-CTI-V03" },
  { productSlug: "chrissy1", variantPosition: 3, productId: "a03e6912-3638-5385-8d84-cc6750e250b6", variantId: "11ece605-05bd-5c6b-b75d-1e9ae861456d", sku: "SGL-BIK-CTI-V04" },
  { productSlug: "chrissy1", variantPosition: 4, productId: "a03e6912-3638-5385-8d84-cc6750e250b6", variantId: "f2acb578-a1d0-5817-878e-68097bee71b8", sku: "SGL-BIK-CTI-V05" },
  { productSlug: "chrissy1", variantPosition: 5, productId: "a03e6912-3638-5385-8d84-cc6750e250b6", variantId: "05177b76-1078-5a66-8ad8-a51091845a64", sku: "SGL-BIK-CTI-V06" },
  { productSlug: "copy-of-overshoes-oversocks", variantPosition: 0, productId: "d854c2e1-7ffb-5ace-87e6-a57df52eaaee", variantId: "fc29ae6d-bc55-5c6e-b11a-d0ac3eaa82bb", sku: "SGL-WEA-OVS-V01" },
  { productSlug: "seagull-cap-black-grey", variantPosition: 0, productId: "bfa4f1c9-4982-5bf8-8d9c-73472eba9792", variantId: "854b77f8-25e8-54a4-8cc2-b1c7acf68c26", sku: "SGL-WEA-CBG-V01" },
  { productSlug: "seagull-cap-khaki-brown", variantPosition: 0, productId: "2cc59a19-daba-51d8-b6c9-495388600608", variantId: "51a169c1-9867-545a-ae2d-0a614a168371", sku: "SGL-WEA-CKB-V01" },
  { productSlug: "seagull-friends-family-cap-white-blue", variantPosition: 0, productId: "95ce3df7-1e38-59e7-ad38-954c598bac19", variantId: "8c307d75-86ae-563b-a46d-73f2af06427c", sku: "SGL-WEA-CWB-V01" },
  { productSlug: "seat-bag", variantPosition: 0, productId: "c771817d-6e7a-59b2-b497-9dbfffa711dc", variantId: "435a5e18-600b-574f-a9ea-b37c37dcaff6", sku: "SGL-BAG-SBG-V01" },
  { productSlug: "cover", variantPosition: 0, productId: "2162e679-9cca-5551-b170-02d9aa456900", variantId: "a32eceee-4f36-5f1b-a258-f0d236c05310", sku: "SGL-ACC-REF-V01" },
  { productSlug: "cycling-leg-strap-pant-strap", variantPosition: 0, productId: "99d450fc-51ff-5518-9141-2d3b632f3638", variantId: "403ce12d-0e33-54f2-923f-e53b4e04c9bf", sku: "SGL-WEA-STR-V01" },
  { productSlug: "cycling-leg-strap-pant-strap", variantPosition: 4, productId: "99d450fc-51ff-5518-9141-2d3b632f3638", variantId: "2fda7e52-938c-52d7-a6f0-ce1119b8f149", sku: "SGL-WEA-STR-V05" },
  { productSlug: "cycling-leg-strap-pant-strap", variantPosition: 2, productId: "99d450fc-51ff-5518-9141-2d3b632f3638", variantId: "ff5520d7-c7a1-52de-a93b-f27575e996d8", sku: "SGL-WEA-STR-V03" },
  { productSlug: "cycling-leg-strap-pant-strap", variantPosition: 1, productId: "99d450fc-51ff-5518-9141-2d3b632f3638", variantId: "7c1ad26f-ed46-5b25-93cc-5488b4ba7ee4", sku: "SGL-WEA-STR-V02" },
  { productSlug: "cycling-leg-strap-pant-strap", variantPosition: 3, productId: "99d450fc-51ff-5518-9141-2d3b632f3638", variantId: "39d96c3c-7e29-5184-b89f-4171db93773b", sku: "SGL-WEA-STR-V04" },
  { productSlug: "seagull-cap-lavender", variantPosition: 0, productId: "c3680b81-eaef-57d9-b4a3-8b1dacad24e5", variantId: "c31e7dff-f2aa-5758-825a-e6c7b2fe83b3", sku: "SGL-WEA-CNG-V01" },
  { productSlug: "handlebar-bags", variantPosition: 0, productId: "f1a10ade-5418-5e13-94d6-89e9194266b8", variantId: "7a60ee1b-a578-50b6-a900-429f53cb3e55", sku: "SGL-BAG-HBBK-V01" },
  { productSlug: "handlebar-bag-black-white", variantPosition: 0, productId: "f3671b1d-6564-59a6-b6b0-6cb94ac67492", variantId: "30aaa822-e93b-5d17-8751-74a095ccc389", sku: "SGL-BAG-HBBW-V01" },
  { productSlug: "handlebar-bag-brown-purple", variantPosition: 0, productId: "03ecc911-2a52-55c6-be6a-4c2aac28f1a4", variantId: "e7fe100f-9610-5eb6-94df-829f9616a68e", sku: "SGL-BAG-HBBP-V01" },
  { productSlug: "handleber-bags-grey", variantPosition: 0, productId: "9a9384a8-cc57-502a-be9e-4e7dc45acb0a", variantId: "b9a54639-e862-5d5a-afe7-e393afe1ffe2", sku: "SGL-BAG-HBGY-V01" },
  { productSlug: "handlebar-bags-reflect-grey", variantPosition: 0, productId: "741801bb-619f-584b-b0e5-0ca1454b0db1", variantId: "aabe5a33-299b-5fd6-bf2b-ad4021164372", sku: "SGL-BAG-HBGO-V01" },
  { productSlug: "handlebar-bags-purple", variantPosition: 0, productId: "417fb2f7-c49e-5fd8-b813-64bb9b7eba30", variantId: "30024a1a-91ca-5446-9e19-57e1e9bc5d57", sku: "SGL-BAG-HBPU-V01" },
  { productSlug: "handleber-bags-red", variantPosition: 0, productId: "26e36365-38c1-5111-a8c7-59ec70f01cb5", variantId: "3df2b946-7357-5eda-8b28-dfed35532009", sku: "SGL-BAG-HBRD-V01" },
  { productSlug: "handlebar-bag-red-grey", variantPosition: 0, productId: "b75d06a6-cbb9-5cd4-ac0e-537b43da3be8", variantId: "c437cbd2-07bf-53cd-bcb2-bf2732fc3fd5", sku: "SGL-BAG-HBRG-V01" },
  { productSlug: "handlebar-bag-white-grey", variantPosition: 0, productId: "93992749-e2f7-5f48-a1f7-1a84648220c0", variantId: "6c964be5-dd43-514a-b4cf-5690bf04bb2b", sku: "SGL-BAG-HBWG-V01" },
  { productSlug: "sgl-house-blend-01", variantPosition: 0, productId: "190dc0ef-631a-5fe1-834e-a5224dd16c2e", variantId: "b5f7a46b-35d7-5f2e-a9fb-54cd784e69d8", sku: "SGL-STN-HB01-V01" },
  { productSlug: "sgl-patch-tee-sky-blue", variantPosition: 0, productId: "0fad89fc-39bd-59e2-89fb-df5a6817e93d", variantId: "d91220cd-04c9-5ca6-b5d4-dc3f2c6a9e81", sku: "SGL-WEA-PTSB-V01" },
  { productSlug: "reveal-shoe-sack", variantPosition: 0, productId: "8ba69e49-21e6-5b44-bc3c-7a39f8d85d96", variantId: "3cbba310-5db0-548f-9d56-d030684ac118", sku: "SGL-BAG-SHB-V01" },
  { productSlug: "sports-bandana-outdoor-magic-scarf", variantPosition: 0, productId: "488bae92-801c-5d9c-a582-c18ea742464c", variantId: "5f91414a-3a9b-5c4e-9537-594c38436ea3", sku: "SGL-WEA-BAN-V01" },
  { productSlug: "sgl-three-pair-sock-set", variantPosition: 0, productId: "219ec3ef-3c14-54ed-8ecc-3566849b11af", variantId: "8548f7a1-7a22-5c27-9ed0-120676588c19", sku: "SGL-WEA-S3P-V01" },
  { productSlug: "socks", variantPosition: 0, productId: "3a2395d6-3e46-5a6b-b94d-ecd723e5d872", variantId: "ffb0a699-fd22-5946-b81d-f6d83d71cbe3", sku: "SGL-WEA-SOC-V01" },
  { productSlug: "sportglassea-case", variantPosition: 0, productId: "406b1d0c-0c3f-5656-b9c1-10ca2a624470", variantId: "484d1414-a8c3-5d6d-9328-893ac19f9992", sku: "SGL-BAG-SGC-V01" },
  { productSlug: "pin", variantPosition: 0, productId: "ab1dbb90-1ab9-567f-9a53-03ada0a5ad05", variantId: "54b10878-d26c-5552-96dd-9d8c9a1b4c41", sku: "SGL-ACC-TSP-V01" },
  { productSlug: "toiletry-bag", variantPosition: 0, productId: "39aa2754-f089-5407-87a8-9c03987f7842", variantId: "5addafd7-3bf7-5673-857f-69efef9120c9", sku: "SGL-BAG-TLB-V01" },
  { productSlug: "tote-bag", variantPosition: 0, productId: "eecd2fd2-1cea-5865-ba76-439cfa257b83", variantId: "98512808-d0fb-500b-8ad2-24724ffa0cab", sku: "SGL-BAG-TMB-V01" },
  { productSlug: "tote-bag-1", variantPosition: 0, productId: "8bf7ad51-03e2-5de4-bba2-f9834286c5b6", variantId: "727ecd84-b4e9-5554-84b9-b0430d6f8fdc", sku: "SGL-BAG-TB1-V01" },
  { productSlug: "shoe-sack-fot-travel", variantPosition: 0, productId: "977df533-c822-5b85-b330-ba8e7f079182", variantId: "8a47a6fe-fd05-5f22-9f27-17fa246f7103", sku: "SGL-BAG-TSB-V01" },
  { productSlug: "velvet-fleece-bicycle-handlebar-covers", variantPosition: 0, productId: "2820c0c9-16ab-5a4a-8cfe-145e53473a0a", variantId: "47e9bebd-6514-5693-a235-3886cbd490b5", sku: "SGL-BAG-VFG-V01" },
  { productSlug: "velvet-fleece-bicycle-handlebar-covers", variantPosition: 1, productId: "2820c0c9-16ab-5a4a-8cfe-145e53473a0a", variantId: "383e1f40-f3c2-521c-aec2-d5d56d1cfc5f", sku: "SGL-BAG-VFG-V02" },
  { productSlug: "velvet-fleece-bicycle-handlebar-covers", variantPosition: 4, productId: "2820c0c9-16ab-5a4a-8cfe-145e53473a0a", variantId: "312f376f-bf04-5274-8534-12f9193b6dcc", sku: "SGL-BAG-VFG-V05" },
  { productSlug: "velvet-fleece-bicycle-handlebar-covers", variantPosition: 2, productId: "2820c0c9-16ab-5a4a-8cfe-145e53473a0a", variantId: "6d62fa5c-958f-5cbd-b4fd-ba206afed598", sku: "SGL-BAG-VFG-V03" },
  { productSlug: "velvet-fleece-bicycle-handlebar-covers", variantPosition: 3, productId: "2820c0c9-16ab-5a4a-8cfe-145e53473a0a", variantId: "bca745f8-d6b6-5450-8ca9-929e5ebe97c7", sku: "SGL-BAG-VFG-V04" },
  { productSlug: "wheel-deal-gull-rider-tee", variantPosition: 0, productId: "77091250-302a-59a8-9780-bae0cbdb3aaf", variantId: "693b5a79-94c7-5702-b49f-a693d03f91c6", sku: "SGL-WEA-WGT-V01" },
  { productSlug: "wheel-deal-logo-study-tee", variantPosition: 0, productId: "c1ab41dc-84fa-5b8d-b2f8-9511cff95e0d", variantId: "25680c34-94f8-5068-a7eb-fcb7825097c1", sku: "SGL-WEA-WLT-V01" },
];

export function stableCatalogueUuid(value: string) {
  const hex = createHash("sha256").update(`sgl-catalog:${value}`).digest("hex").slice(0, 32).split("");
  hex[12] = "5";
  hex[16] = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  const joined = hex.join("");
  return `${joined.slice(0, 8)}-${joined.slice(8, 12)}-${joined.slice(12, 16)}-${joined.slice(16, 20)}-${joined.slice(20)}`;
}

const approvedByVariant = new Map(approvedSkuRows.map((row) => [`${row.productSlug}:${row.variantPosition}`, row]));

export function approvedSkuFor(productSlug: string, variantPosition: number) {
  return approvedByVariant.get(`${productSlug}:${variantPosition}`) || null;
}

export function assertApprovedSkuManifest() {
  if (approvedSkuRows.length !== 79) throw new Error(`Approved SKU manifest must contain 79 rows; found ${approvedSkuRows.length}`);
  if (new Set(approvedSkuRows.map((row) => row.sku)).size !== 79) throw new Error("Approved SKU manifest contains duplicate SKUs");
  if (new Set(approvedSkuRows.map((row) => row.variantId)).size !== 79) throw new Error("Approved SKU manifest contains duplicate variant IDs");
  for (const row of approvedSkuRows) {
    if (!/^SGL-[A-Z]{3}-[A-Z0-9]{2,4}-V\d{2}$/.test(row.sku)) throw new Error(`Invalid approved SKU: ${row.sku}`);
    if (row.productId !== stableCatalogueUuid(`product:${row.productSlug}`)) throw new Error(`Product ID drift for ${row.productSlug}`);
    if (row.variantId !== stableCatalogueUuid(`product:${row.productSlug}:variant:${row.variantPosition}`)) throw new Error(`Variant ID drift for ${row.sku}`);
  }
}

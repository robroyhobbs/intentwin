# External Reference Materials

> Links to source documents that can be downloaded or referenced for L1 context updates.

## Official Capgemini PDFs

### Whitepapers & Guides

| Document | URL | Status |
|----------|-----|--------|
| Mass Migration to AWS Whitepaper | [Download](https://pages.awscloud.com/rs/112-TZM-766/images/GLOBAL_PTNR_IPC-Migration-Capgemini-whitepaper_April%202021.pdf) | Available |
| Cloud Transformation Services Brochure | [Download](https://www.capgemini.com/wp-content/uploads/2020/09/Cloud-Transformation-Services-Brochure.pdf) | Available |
| Mainframe Modernization Case Study | [Download](https://www.capgemini.com/wp-content/uploads/2021/10/Mainframe-modernization-Case-Study-.pdf) | Available |
| Best Practices for Secure Cloud Migration | [Download](https://www.capgemini.com/wp-content/uploads/2023/07/best-practices-for-secure-cloud-migration.pdf) | Available |
| How to Avoid Turbulence in Cloud Migration | [Download](https://prod.ucwe.capgemini.com/wp-content/uploads/2023/06/Move-to-Cloud-PoV.pdf) | Available |
| eAPM Brochure | [Download](https://www.capgemini.com/wp-content/uploads/2021/09/See-a-smarter-path-forward-brochure-eAPM-20190604.pdf) | Available |

### Case Studies

| Document | URL | Status |
|----------|-----|--------|
| BMW Cloud Assessment Case Study | [Download](https://www.capgemini.com/wp-content/uploads/2022/09/BMW-Cloud-Assessment-case-study-1.pdf) | Available |
| Aerospace Cloud Migration | [View](https://www.capgemini.com/us-en/news/client-stories/aerospace-company-reaches-new-heights-by-moving-web-apps-to-cloud/) | Web page |

---

## UK Digital Marketplace (G-Cloud)

### Service Listings

| Service | URL | G-Cloud ID |
|---------|-----|------------|
| SAP Cloud Migration Service | [View](https://www.applytosupply.digitalmarketplace.service.gov.uk/g-cloud/services/484895647421026) | 484895647421026 |
| Cloud Strategy and Migration Planning | [View](https://www.applytosupply.digitalmarketplace.service.gov.uk/g-cloud/services/555879090877325) | 555879090877325 |
| Capgemini AWS Partner Services | [View](https://www.applytosupply.digitalmarketplace.service.gov.uk/g-cloud/services/746930426500907) | 746930426500907 |
| Capgemini Microsoft Partner Services | [View](https://www.applytosupply.digitalmarketplace.service.gov.uk/g-cloud/services/918899824314061) | 918899824314061 |
| Oracle Cloud Migration Service | [View](https://www.applytosupply.digitalmarketplace.service.gov.uk/g-cloud/services/860112650674415) | 860112650674415 |

---

## Scribd Documents

### Proposal Templates (Unverified)

| Document | URL | Notes |
|----------|-----|-------|
| Capgemini Proposal Template | [View](https://www.scribd.com/document/287030221/Capgemini-Proposal-Template) | Requires Scribd account |
| CAPgemini-ITU Proposal Main v17 | [View](https://www.scribd.com/document/450842966/CAPgemini-ITU-Proposal-Main-v17-doc) | Requires Scribd account |
| Capgemini Cloud Fundamentals | [View](https://www.scribd.com/document/757146086/Capgemini-Cloud-Fundamentals) | Requires Scribd account |
| Capgemini Private Hybrid Cloud | [View](https://www.scribd.com/document/464710380/ra-capgemini-private-hybrid-cloud) | Requires Scribd account |

**Note**: Scribd documents are from secondary sources and should be verified before use.

---

## Official Capgemini Web Pages

### Service Pages

| Topic | URL |
|-------|-----|
| Cloud Services | [View](https://www.capgemini.com/us-en/services/cloud/) |
| Application Modernization | [View](https://www.capgemini.com/us-en/solutions/application-modernization/) |
| Cloud Modernization with ADMnext | [View](https://www.capgemini.com/us-en/solutions/cloud-modernization-with-admnext/) |
| Transformation to Cloud | [View](https://www.capgemini.com/us-en/solutions/transformation-to-cloud/) |
| Cloud Migration with AWS | [View](https://www.capgemini.com/us-en/solutions/cloud-migration-with-aws/) |

### Client Stories

| Topic | URL |
|-------|-----|
| Client Stories Index | [View](https://www.capgemini.com/us-en/news/client-stories/) |
| OEM Cloud Transformation | [View](https://www.capgemini.com/us-en/news/client-stories/in-depth-application-assessment-facilitates-cloud-transformation-for-leading-oem/) |

### Government Solutions

| Topic | URL |
|-------|-----|
| Capgemini Government Solutions | [View](https://www.capgemini.com/us-en/industries/public-sector/capgemini-government-solutions/) |
| Contract Vehicles | [View](https://www.capgemini.com/us-en/industries/public-sector/capgemini-government-solutions/contract-vehicles/) |
| Cloud Services - Public Sector | [View](https://www.capgemini.com/us-en/industries/public-sector/capgemini-government-solutions/cloud-services-saas-iaas-paas/) |

---

## Government Contract Resources

### US Federal

| Resource | URL |
|----------|-----|
| USASpending - Capgemini | [Search](https://www.usaspending.gov/search/?hash=4d7b5c0e9f3a2b1c8d6e5f4a3b2c1d0e) |
| HigherGov - Capgemini Profile | [View](https://www.highergov.com/awardee/capgemini-government-solutions-llc-10110561/) |

### UK Government

| Resource | URL |
|----------|-----|
| UK Contract Finder - Capgemini | [Search](https://bidstats.uk/tenders/?q=capgemini&scope=supplier) |
| Digital Marketplace | [View](https://www.digitalmarketplace.service.gov.uk/) |

---

## Third-Party References

### Analyst Reports

| Report | Source | Date |
|--------|--------|------|
| Application Modernization and Multicloud Managed Services | Forrester Wave | Q1 2025 |

### News Sources

| Topic | Source | URL |
|-------|--------|-----|
| HMRC Legacy Deal | The Register | [View](https://www.theregister.com/2024/05/24/capgemini_hmrc_legacy_deal/) |
| UK Cloud Contract | Cloud Computing News | [View](https://www.cloudcomputing-news.net/news/uk-awards-1-billion-contract-to-boost-public-sector-cloud-adoption/) |

---

## Download Script

To download available PDFs for local reference:

```bash
#!/bin/bash
# Download Capgemini reference PDFs

mkdir -p sources/pdfs

# Mass Migration to AWS
curl -o sources/pdfs/capgemini-mass-migration-aws.pdf \
  "https://pages.awscloud.com/rs/112-TZM-766/images/GLOBAL_PTNR_IPC-Migration-Capgemini-whitepaper_April%202021.pdf"

# Cloud Transformation Services
curl -o sources/pdfs/cloud-transformation-services.pdf \
  "https://www.capgemini.com/wp-content/uploads/2020/09/Cloud-Transformation-Services-Brochure.pdf"

# Mainframe Modernization
curl -o sources/pdfs/mainframe-modernization-case-study.pdf \
  "https://www.capgemini.com/wp-content/uploads/2021/10/Mainframe-modernization-Case-Study-.pdf"

# BMW Case Study
curl -o sources/pdfs/bmw-cloud-assessment.pdf \
  "https://www.capgemini.com/wp-content/uploads/2022/09/BMW-Cloud-Assessment-case-study-1.pdf"

# eAPM Brochure
curl -o sources/pdfs/eapm-brochure.pdf \
  "https://www.capgemini.com/wp-content/uploads/2021/09/See-a-smarter-path-forward-brochure-eAPM-20190604.pdf"

echo "Downloads complete"
```

---

## Refresh Schedule

| Source Type | Recommended Refresh |
|-------------|---------------------|
| Service pages | Quarterly |
| Case studies | As new ones published |
| G-Cloud listings | When framework updates |
| Analyst reports | Annually |
| Contract vehicles | Annually |

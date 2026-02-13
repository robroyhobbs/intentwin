# Interview Decisions: Document Type Separation

> Anchor: Prevent RFP and template documents from polluting evidence retrieval during proposal generation by filtering at query time and auto-tagging uploads from the intake flow.

## Decisions

### 1. Separation strategy
- **Question**: Should RFP docs be excluded from the vector store entirely, or filtered at query time?
- **Decision**: Filter at query time — RFP chunks stay in the vector store but `retrieveContext()` excludes them via the existing `filter_document_type` RPC parameter.
- **Rationale**: Simplest path. The RPC functions already support document type filtering. No schema changes or migrations needed.

### 2. Auto-tagging from intake flow
- **Question**: How should RFP docs get tagged?
- **Decision**: Docs uploaded during the proposal intake flow are automatically tagged `document_type='rfp'`. Knowledge base uploads keep the current manual type picker.
- **Rationale**: Reduces friction. The intake flow context makes intent clear — if you're uploading during intake, it's an RFP/opportunity doc.

### 3. Existing document migration
- **Question**: Handle existing mis-tagged documents?
- **Decision**: Skip migration. Only new uploads get proper tagging. Users can re-tag manually if needed.
- **Rationale**: Keeps scope tight. Most users haven't uploaded many docs yet.

### 4. Knowledge Base visibility
- **Question**: Should RFP docs be visible in the Knowledge Base UI?
- **Decision**: Visible but labeled with an 'RFP' badge. Excluded from generation retrieval but manageable in KB.
- **Rationale**: Users need to see and manage all their documents in one place.

### 5. Template exclusion
- **Question**: Should templates also be excluded from evidence retrieval?
- **Decision**: Yes — exclude both `rfp` and `template` types from evidence retrieval. Only retrieve from: proposal, case_study, methodology, capability, team_bio.
- **Rationale**: Templates are structural guides, not evidence content. Cleaner retrieval pool.

## Open Items
- None

## Out of Scope
- Separate storage/tables for RFP documents
- AI auto-classification of document types
- One-time migration of existing documents
- Changes to the Knowledge Base UI layout

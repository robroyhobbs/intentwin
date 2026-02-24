-- Create FOIA requests tracking table
CREATE TABLE IF NOT EXISTS foia_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    state VARCHAR(50) NOT NULL,
    agency_name VARCHAR(255) NOT NULL,
    request_target TEXT NOT NULL,
    generated_letter TEXT,
    tracking_email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'processing', 'completed', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE foia_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org foia requests" 
    ON foia_requests FOR SELECT 
    USING (organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can create org foia requests" 
    ON foia_requests FOR INSERT 
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update org foia requests" 
    ON foia_requests FOR UPDATE 
    USING (organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can delete org foia requests" 
    ON foia_requests FOR DELETE 
    USING (organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    ));

-- Triggers for updated_at
CREATE TRIGGER foia_requests_updated_at
    BEFORE UPDATE ON foia_requests
    FOR EACH ROW
    EXECUTE FUNCTION extensions.moddatetime('updated_at');

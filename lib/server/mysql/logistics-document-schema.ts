export const logisticsDocumentSchemaStatements = [
  `CREATE TABLE IF NOT EXISTS logistics_document_template_contents (
    template_id VARCHAR(64) NOT NULL,
    content_html LONGTEXT NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (template_id),
    CONSTRAINT logistics_document_template_contents_template_fk FOREIGN KEY (template_id)
      REFERENCES logistics_document_templates (template_id) ON DELETE CASCADE
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS logistics_document_instance_contents (
    document_id VARCHAR(64) NOT NULL,
    content_html LONGTEXT NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (document_id),
    CONSTRAINT logistics_document_instance_contents_document_fk FOREIGN KEY (document_id)
      REFERENCES logistics_document_instances (document_id) ON DELETE CASCADE
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS logistics_document_package_rules (
    rule_id VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    event_code VARCHAR(64) NOT NULL,
    request_kind VARCHAR(32) NULL,
    requires_business_trip TINYINT(1) NULL,
    requires_waybill TINYINT(1) NULL,
    requires_consignment_note TINYINT(1) NULL,
    template_type VARCHAR(191) NOT NULL,
    sequence_no INT NOT NULL DEFAULT 1,
    required_flag TINYINT(1) NOT NULL DEFAULT 1,
    active TINYINT(1) NOT NULL DEFAULT 1,
    created_by_user_id VARCHAR(191) NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (rule_id),
    KEY logistics_document_package_rules_event_idx (event_code, active, sequence_no),
    KEY logistics_document_package_rules_template_idx (template_type)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
] as const;

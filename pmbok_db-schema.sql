-- =====================================================
-- PMBOK Project Management Database Schema for MariaDB
-- =====================================================

-- Drop existing database if needed (use with caution)
-- DROP DATABASE IF EXISTS pmbok_pm;

CREATE DATABASE IF NOT EXISTS pmbok_pm 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE pmbok_pm;

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Projects Table
CREATE TABLE projects (
    project_id INT AUTO_INCREMENT PRIMARY KEY,
    project_code VARCHAR(50) UNIQUE NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    status ENUM('Planning', 'Active', 'On Hold', 'Completed', 'Cancelled') DEFAULT 'Planning',
    project_manager VARCHAR(100),
    client_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    INDEX idx_project_code (project_code),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- People/Users Table
CREATE TABLE people (
    person_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    role VARCHAR(100),
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username (username)
) ENGINE=InnoDB;

-- =====================================================
-- DOCUMENT TABLES (Issue, Risk, Escalation, Change, Fault)
-- =====================================================

-- Issues Table
CREATE TABLE issues (
    issue_id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    issue_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
    status ENUM('Open', 'In Progress', 'Resolved', 'Closed', 'Cancelled') DEFAULT 'Open',
    category VARCHAR(100),
    raised_by INT,
    assigned_to INT,
    raised_date DATE NOT NULL,
    target_resolution_date DATE,
    actual_resolution_date DATE,
    impact TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
    FOREIGN KEY (raised_by) REFERENCES people(person_id),
    FOREIGN KEY (assigned_to) REFERENCES people(person_id),
    INDEX idx_project (project_id),
    INDEX idx_status (status),
    INDEX idx_priority (priority)
) ENGINE=InnoDB;

-- Risks Table
CREATE TABLE risks (
    risk_id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    risk_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    probability ENUM('Very Low', 'Low', 'Medium', 'High', 'Very High') DEFAULT 'Medium',
    impact ENUM('Very Low', 'Low', 'Medium', 'High', 'Very High') DEFAULT 'Medium',
    risk_score DECIMAL(5,2), -- Calculated field
    status ENUM('Identified', 'Assessed', 'Mitigated', 'Closed', 'Occurred') DEFAULT 'Identified',
    category VARCHAR(100),
    identified_by INT,
    owner INT,
    identified_date DATE NOT NULL,
    review_date DATE,
    mitigation_strategy TEXT,
    contingency_plan TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
    FOREIGN KEY (identified_by) REFERENCES people(person_id),
    FOREIGN KEY (owner) REFERENCES people(person_id),
    INDEX idx_project (project_id),
    INDEX idx_status (status),
    INDEX idx_risk_score (risk_score)
) ENGINE=InnoDB;

-- Escalations Table
CREATE TABLE escalations (
    escalation_id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    escalation_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
    status ENUM('Raised', 'Under Review', 'Resolved', 'Closed') DEFAULT 'Raised',
    escalation_type VARCHAR(100),
    raised_by INT,
    escalated_to INT,
    raised_date DATE NOT NULL,
    target_response_date DATE,
    actual_response_date DATE,
    resolution_summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
    FOREIGN KEY (raised_by) REFERENCES people(person_id),
    FOREIGN KEY (escalated_to) REFERENCES people(person_id),
    INDEX idx_project (project_id),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- Changes Table
CREATE TABLE changes (
    change_id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    change_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    change_type ENUM('Scope', 'Schedule', 'Cost', 'Quality', 'Resource', 'Other') DEFAULT 'Other',
    priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
    status ENUM('Requested', 'Under Review', 'Approved', 'Rejected', 'Implemented', 'Closed') DEFAULT 'Requested',
    requested_by INT,
    approved_by INT,
    request_date DATE NOT NULL,
    approval_date DATE,
    implementation_date DATE,
    cost_impact DECIMAL(15,2),
    schedule_impact_days INT,
    justification TEXT,
    impact_assessment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
    FOREIGN KEY (requested_by) REFERENCES people(person_id),
    FOREIGN KEY (approved_by) REFERENCES people(person_id),
    INDEX idx_project (project_id),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- Faults Table
CREATE TABLE faults (
    fault_id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    fault_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity ENUM('Minor', 'Major', 'Critical', 'Blocking') DEFAULT 'Major',
    status ENUM('Reported', 'Investigating', 'In Progress', 'Resolved', 'Closed', 'Deferred') DEFAULT 'Reported',
    fault_type VARCHAR(100),
    reported_by INT,
    assigned_to INT,
    reported_date DATE NOT NULL,
    target_fix_date DATE,
    actual_fix_date DATE,
    root_cause TEXT,
    resolution TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
    FOREIGN KEY (reported_by) REFERENCES people(person_id),
    FOREIGN KEY (assigned_to) REFERENCES people(person_id),
    INDEX idx_project (project_id),
    INDEX idx_status (status),
    INDEX idx_severity (severity)
) ENGINE=InnoDB;

-- =====================================================
-- LOG TABLES (One for each document type)
-- =====================================================

-- Issue Log
CREATE TABLE issue_log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    issue_id INT NOT NULL,
    log_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    logged_by INT,
    log_type ENUM('Created', 'Updated', 'Status Change', 'Comment', 'Assigned', 'Resolved', 'Closed') DEFAULT 'Comment',
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    comments TEXT,
    FOREIGN KEY (issue_id) REFERENCES issues(issue_id) ON DELETE CASCADE,
    FOREIGN KEY (logged_by) REFERENCES people(person_id),
    INDEX idx_issue (issue_id),
    INDEX idx_log_date (log_date)
) ENGINE=InnoDB;

-- Risk Log
CREATE TABLE risk_log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    risk_id INT NOT NULL,
    log_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    logged_by INT,
    log_type ENUM('Created', 'Updated', 'Status Change', 'Comment', 'Assessment', 'Mitigation', 'Closed', 'Closure Request', 'Closure Approved', 'Closure Rejected') DEFAULT 'Comment',
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    comments TEXT,
    FOREIGN KEY (risk_id) REFERENCES risks(risk_id) ON DELETE CASCADE,
    FOREIGN KEY (logged_by) REFERENCES people(person_id),
    INDEX idx_risk (risk_id),
    INDEX idx_log_date (log_date)
) ENGINE=InnoDB;

-- Escalation Log
CREATE TABLE escalation_log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    escalation_id INT NOT NULL,
    log_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    logged_by INT,
    log_type ENUM('Created', 'Updated', 'Status Change', 'Comment', 'Response', 'Resolution', 'Closed') DEFAULT 'Comment',
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    comments TEXT,
    FOREIGN KEY (escalation_id) REFERENCES escalations(escalation_id) ON DELETE CASCADE,
    FOREIGN KEY (logged_by) REFERENCES people(person_id),
    INDEX idx_escalation (escalation_id),
    INDEX idx_log_date (log_date)
) ENGINE=InnoDB;

-- Change Log
CREATE TABLE change_log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    change_id INT NOT NULL,
    log_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    logged_by INT,
    log_type ENUM('Created', 'Updated', 'Status Change', 'Comment', 'Review', 'Approval', 'Implementation', 'Closed', 'Closure Request', 'Closure Approved', 'Closure Rejected') DEFAULT 'Comment',
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    comments TEXT,
    FOREIGN KEY (change_id) REFERENCES changes(change_id) ON DELETE CASCADE,
    FOREIGN KEY (logged_by) REFERENCES people(person_id),
    INDEX idx_change (change_id),
    INDEX idx_log_date (log_date)
) ENGINE=InnoDB;

-- Fault Log
CREATE TABLE fault_log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    fault_id INT NOT NULL,
    log_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    logged_by INT,
    log_type ENUM('Created', 'Updated', 'Status Change', 'Comment', 'Investigation', 'Fix', 'Testing', 'Closed') DEFAULT 'Comment',
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    comments TEXT,
    FOREIGN KEY (fault_id) REFERENCES faults(fault_id) ON DELETE CASCADE,
    FOREIGN KEY (logged_by) REFERENCES people(person_id),
    INDEX idx_fault (fault_id),
    INDEX idx_log_date (log_date)
) ENGINE=InnoDB;

-- =====================================================
-- ACTION TABLES
-- =====================================================

-- Actions for Issues
CREATE TABLE issue_actions (
    action_id INT AUTO_INCREMENT PRIMARY KEY,
    issue_id INT NOT NULL,
    action_description TEXT NOT NULL,
    action_type VARCHAR(100),
    assigned_to INT,
    created_by INT,
    created_date DATE NOT NULL,
    due_date DATE,
    completed_date DATE,
    status ENUM('Pending', 'In Progress', 'Completed', 'Cancelled') DEFAULT 'Pending',
    priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
    notes TEXT,
    FOREIGN KEY (issue_id) REFERENCES issues(issue_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES people(person_id),
    FOREIGN KEY (created_by) REFERENCES people(person_id),
    INDEX idx_issue (issue_id),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- Actions for Risks
CREATE TABLE risk_actions (
    action_id INT AUTO_INCREMENT PRIMARY KEY,
    risk_id INT NOT NULL,
    action_description TEXT NOT NULL,
    action_type VARCHAR(100),
    assigned_to INT,
    created_by INT,
    created_date DATE NOT NULL,
    due_date DATE,
    completed_date DATE,
    status ENUM('Pending', 'In Progress', 'Completed', 'Cancelled') DEFAULT 'Pending',
    priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
    notes TEXT,
    FOREIGN KEY (risk_id) REFERENCES risks(risk_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES people(person_id),
    FOREIGN KEY (created_by) REFERENCES people(person_id),
    INDEX idx_risk (risk_id),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- Actions for Escalations
CREATE TABLE escalation_actions (
    action_id INT AUTO_INCREMENT PRIMARY KEY,
    escalation_id INT NOT NULL,
    action_description TEXT NOT NULL,
    action_type VARCHAR(100),
    assigned_to INT,
    created_by INT,
    created_date DATE NOT NULL,
    due_date DATE,
    completed_date DATE,
    status ENUM('Pending', 'In Progress', 'Completed', 'Cancelled') DEFAULT 'Pending',
    priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
    notes TEXT,
    FOREIGN KEY (escalation_id) REFERENCES escalations(escalation_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES people(person_id),
    FOREIGN KEY (created_by) REFERENCES people(person_id),
    INDEX idx_escalation (escalation_id),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- Actions for Changes
CREATE TABLE change_actions (
    action_id INT AUTO_INCREMENT PRIMARY KEY,
    change_id INT NOT NULL,
    action_description TEXT NOT NULL,
    action_type VARCHAR(100),
    assigned_to INT,
    created_by INT,
    created_date DATE NOT NULL,
    due_date DATE,
    completed_date DATE,
    status ENUM('Pending', 'In Progress', 'Completed', 'Cancelled') DEFAULT 'Pending',
    priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
    notes TEXT,
    FOREIGN KEY (change_id) REFERENCES changes(change_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES people(person_id),
    FOREIGN KEY (created_by) REFERENCES people(person_id),
    INDEX idx_change (change_id),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- Actions for Faults
CREATE TABLE fault_actions (
    action_id INT AUTO_INCREMENT PRIMARY KEY,
    fault_id INT NOT NULL,
    action_description TEXT NOT NULL,
    action_type VARCHAR(100),
    assigned_to INT,
    created_by INT,
    created_date DATE NOT NULL,
    due_date DATE,
    completed_date DATE,
    status ENUM('Pending', 'In Progress', 'Completed', 'Cancelled') DEFAULT 'Pending',
    priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
    notes TEXT,
    FOREIGN KEY (fault_id) REFERENCES faults(fault_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES people(person_id),
    FOREIGN KEY (created_by) REFERENCES people(person_id),
    INDEX idx_fault (fault_id),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- =====================================================
-- STANDALONE ACTION LOG TABLES
-- =====================================================

-- Standalone Action Log Headers
CREATE TABLE action_log_headers (
    action_log_id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    log_number VARCHAR(50) UNIQUE NOT NULL,
    log_name VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('Active', 'Completed', 'Archived') DEFAULT 'Active',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES people(person_id),
    INDEX idx_project (project_id),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- Standalone Action Log Items
CREATE TABLE action_log_items (
    action_item_id INT AUTO_INCREMENT PRIMARY KEY,
    action_log_id INT NOT NULL,
    action_number VARCHAR(50),
    action_description TEXT NOT NULL,
    action_type VARCHAR(100),
    assigned_to INT,
    created_by INT,
    created_date DATE NOT NULL,
    due_date DATE,
    completed_date DATE,
    status ENUM('Pending', 'In Progress', 'Completed', 'Cancelled', 'On Hold') DEFAULT 'Pending',
    priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
    notes TEXT,
    completion_notes TEXT,
    FOREIGN KEY (action_log_id) REFERENCES action_log_headers(action_log_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES people(person_id),
    FOREIGN KEY (created_by) REFERENCES people(person_id),
    INDEX idx_action_log (action_log_id),
    INDEX idx_status (status),
    INDEX idx_assigned (assigned_to)
) ENGINE=InnoDB;

-- Action Requirements (sub-actions or checklist items for action log items)
CREATE TABLE action_requirements (
    requirement_id INT AUTO_INCREMENT PRIMARY KEY,
    action_item_id INT NOT NULL,
    requirement_description TEXT NOT NULL,
    sequence_order INT,
    status ENUM('Pending', 'Completed') DEFAULT 'Pending',
    completed_by INT,
    completed_date DATE,
    notes TEXT,
    FOREIGN KEY (action_item_id) REFERENCES action_log_items(action_item_id) ON DELETE CASCADE,
    FOREIGN KEY (completed_by) REFERENCES people(person_id),
    INDEX idx_action_item (action_item_id)
) ENGINE=InnoDB;

-- =====================================================
-- SAMPLE DATA INSERTION
-- =====================================================

-- Insert sample people
INSERT INTO people (username, full_name, email, role, department) VALUES
('jsmith', 'John Smith', 'john.smith@company.com', 'Project Manager', 'PMO'),
('mjones', 'Mary Jones', 'mary.jones@company.com', 'Business Analyst', 'Business'),
('bwilson', 'Bob Wilson', 'bob.wilson@company.com', 'Technical Lead', 'IT'),
('sjohnson', 'Sarah Johnson', 'sarah.johnson@company.com', 'Quality Manager', 'QA');

-- Insert sample project
INSERT INTO projects (project_code, project_name, description, start_date, status, project_manager) VALUES
('PRJ001', 'Infrastructure Upgrade Project', 'Upgrade network infrastructure across all sites', '2025-01-15', 'Active', 'John Smith');

-- =====================================================
-- USEFUL VIEWS
-- =====================================================

-- View: All open issues with assigned person details
CREATE VIEW v_open_issues AS
SELECT 
    i.issue_id, i.issue_number, i.title, i.priority, i.status,
    p.project_name,
    assignee.full_name AS assigned_to_name,
    raiser.full_name AS raised_by_name,
    i.raised_date, i.target_resolution_date
FROM issues i
JOIN projects p ON i.project_id = p.project_id
LEFT JOIN people assignee ON i.assigned_to = assignee.person_id
LEFT JOIN people raiser ON i.raised_by = raiser.person_id
WHERE i.status NOT IN ('Closed', 'Cancelled');

-- View: Project dashboard summary
CREATE VIEW v_project_dashboard AS
SELECT 
    p.project_id,
    p.project_code,
    p.project_name,
    p.status AS project_status,
    COUNT(DISTINCT i.issue_id) AS open_issues,
    COUNT(DISTINCT r.risk_id) AS active_risks,
    COUNT(DISTINCT c.change_id) AS pending_changes,
    COUNT(DISTINCT f.fault_id) AS open_faults,
    COUNT(DISTINCT e.escalation_id) AS active_escalations
FROM projects p
LEFT JOIN issues i ON p.project_id = i.project_id AND i.status NOT IN ('Closed', 'Cancelled')
LEFT JOIN risks r ON p.project_id = r.project_id AND r.status NOT IN ('Closed')
LEFT JOIN changes c ON p.project_id = c.project_id AND c.status NOT IN ('Implemented', 'Closed', 'Rejected')
LEFT JOIN faults f ON p.project_id = f.project_id AND f.status NOT IN ('Closed')
LEFT JOIN escalations e ON p.project_id = e.project_id AND e.status NOT IN ('Closed')
GROUP BY p.project_id, p.project_code, p.project_name, p.status;

-- =====================================================
-- END OF SCHEMA
-- =====================================================